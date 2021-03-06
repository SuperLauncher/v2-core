import { deployCampaignRefund } from './helpers/contracts-helpers';
import { BigNumber } from 'bignumber.js';
import { advanceBlock, getEggBurnQty } from './helpers/misc-utils';
import { increaseTimeAndMine } from './helpers/misc-utils';
import { Period, BNB } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Campaign-refund-2', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX } = testEnv;
		token = XYX;
		main = (await deployCampaignRefund(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address,
			"1",
			BNB)) as Campaign;
	});

	it('Should able to refund bnb & egg', async () => {
		const { admin, users, eggV2, RandomProvider } = testEnv;
		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		//user 1 sub 0.4 bnb & oversub 
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
		await eggV2.connect(admin).transfer(users[0].address, ethers.utils.parseEther('1000'));
		await eggV2.connect(users[0].signer).approve(main.address, eggBurn.toString());
		await main.connect(users[0].signer)
			.subscribe(ethers.utils.parseEther("0.4"), amount, p, eggBurn.toString(),
				{ value: ethers.utils.parseEther("0.4").add(amount) });

		//user 2 sub 0.4 bnb
		const sub2 = await main.getSubscribable(users[1].address);
		expect(sub2[1]).to.be.equals(true);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("1.5"));
		await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("0.4"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.4") });

		//tally
		await advanceBlock(info[0].subEnd.add(10).toNumber());
		//mock random value
		await RandomProvider.setRequestId(ethers.utils.formatBytes32String("ok"), main.address);
		await main.connect(admin).tallyPrepare();
		await RandomProvider.fulfillRandomness(ethers.utils.formatBytes32String("ok"), "36182639440450741575202689230877903979908723051233706145827570538348168242976");

		await waitForTx(
			await main.connect(admin).tallySubscriptionAuto()
		);

		//end IDO
		await advanceBlock(info[0].idoEnd.toNumber());
		await main.finishUp();

		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoEnded);

		const balance1EggBF = await eggV2.balanceOf(users[0].address);
		await main.connect(users[0].signer).returnFund()


		const user1DetailAT = await main.getPurchaseDetail(users[0].address, true);
		expect(user1DetailAT.hasReturnedFund).to.be.equals(true);

		const balance1EggAT = await eggV2.balanceOf(users[0].address);

		expect(balance1EggAT.sub(balance1EggBF).toString()).to.be.equals(eggBurn.toString())

	});
});
