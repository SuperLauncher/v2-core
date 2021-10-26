import { deployCampaignRefund } from './helpers/contracts-helpers';
import { BigNumber } from 'bignumber.js';
import { advanceBlock, getEggBurnQty } from './helpers/misc-utils';
import { Period, BNB } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';

makeSuite('Campaign-refund-erc20', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX, BUSD } = testEnv;
		token = XYX;
		main = (await deployCampaignRefund(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address,
			"1",
			BUSD.address)) as Campaign;
	});

	it('Should able to refund bnb & egg when campaign cancelled', async () => {
		const { admin, manager, users, eggV2, BUSD } = testEnv;
		const user1 = users[0];
		const user2 = users[1];

		//approval
		await BUSD.connect(user1.signer).mint(ethers.utils.parseEther("2"));
		await BUSD.connect(user1.signer).approve(main.address, ethers.utils.parseEther("2"));

		await BUSD.connect(user2.signer).mint(ethers.utils.parseEther("2"));
		await BUSD.connect(user2.signer).approve(main.address, ethers.utils.parseEther("2"));

		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());
		// //console.log(await main.getCurrentPeriod());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		//user 1 sub 0.4 bnb & oversub 1.5 bnb & egg
		const sub1 = await main.getSubscribable(users[0].address);
		expect(sub1[1]).to.be.equals(true);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("3"));

		// //console.log("over-sub: ", sub1[2].toString());
		const stdEggBurnQty = ethers.utils.parseEther("100");
		const stdOverSubQty = ethers.utils.parseEther("1.5"); //= 300*0.5%
		const amount = ethers.utils.parseEther("1.5");
		const p = 1
		const eggBurn = getEggBurnQty(new BigNumber(stdEggBurnQty.toString()),
			new BigNumber(stdOverSubQty.toString()),
			new BigNumber(amount.toString()), p)

		// //console.log(eggBurn.toString());
		await eggV2.connect(admin).transfer(user1.address, ethers.utils.parseEther('1000'));
		await eggV2.connect(user1.signer).approve(main.address, eggBurn.toString());
		await main.connect(user1.signer)
			.subscribe(ethers.utils.parseEther("0.4"), amount, p, eggBurn.toString());

		//user 2 sub 0.4 bnb
		const sub2 = await main.getSubscribable(user2.address);
		expect(sub2[1]).to.be.equals(true);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("1.5"));
		await main.connect(user2.signer).subscribe(ethers.utils.parseEther("0.4"), "0", 0, 0);

		//cancel campaign in sub period
		await manager.cancelCampaign(main.address);

		//user1 get back sub 0.4 bnb & oversub 1.5 bnb & egg
		const balance1EggBF = await eggV2.balanceOf(users[0].address);
		await main.connect(users[0].signer).returnFund()

		const user1DetailAT = await main.getPurchaseDetail(users[0].address, true);
		expect(user1DetailAT.hasReturnedFund).to.be.equals(true);

		const balance1BUSDAT = await BUSD.balanceOf(users[0].address);
		expect(balance1BUSDAT).to.be.equals(ethers.utils.parseEther("2"));

		const balance1EggAT = await eggV2.balanceOf(users[0].address);
		expect(balance1EggAT.sub(balance1EggBF).toString()).to.be.equals(eggBurn.toString())

		//user 2 get back sub 0.4 bnb
		const balance2EggBF = await eggV2.balanceOf(users[1].address);
		await main.connect(users[1].signer).returnFund()

		const user2DetailAT = await main.getPurchaseDetail(users[1].address, true);
		expect(user2DetailAT.hasReturnedFund).to.be.equals(true);

		const balance2BUSDAT = await BUSD.balanceOf(users[1].address);
		expect(balance2BUSDAT).to.be.equals(ethers.utils.parseEther("2"));

		const balance2EggAT = await eggV2.balanceOf(users[1].address);
		expect(balance2EggAT.sub(balance2EggBF).toString()).to.be.equals("0")

	});

	it('Should able to fund out by campaign owner', async () => {
		const { admin } = testEnv;

		//campaign owner can claim back token
		const fundOutAmtBF = await token.balanceOf(await admin.getAddress());
		const fundInAmt = await main.getFundInTokenRequired();

		await main.fundOut(fundInAmt);

		const fundOutAmtAT = await token.balanceOf(await admin.getAddress());

		expect(fundOutAmtAT.sub(fundOutAmtBF).toString()).to.be.equals(fundInAmt.toString())

	});
});
