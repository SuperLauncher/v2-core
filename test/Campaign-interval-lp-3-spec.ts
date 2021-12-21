import { BigNumber } from 'bignumber.js';
import { increaseTimeAndMine, advanceBlock } from './helpers/misc-utils';
import { Period, ILpProvision } from './helpers/types';
import { Code } from './helpers/types';
import { deployCampaignLP } from './helpers/contracts-helpers';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Campaign-lp-3', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX, BUSD } = testEnv;
		token = XYX;
		//no lp
		const lp: ILpProvision = {
			size: "2",
			rate: "200000000000000000000",
			sizeParam: "0",
			providers: ["0"],
			splits: ["1000000"],
			lockPcnts: ["1000000"],
			lockDurations: ["0"],
			swapToBNBLP: false,
		}
		const fee = "0"; //0%
		main = (await deployCampaignLP(
			manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address,
			"1",
			BUSD.address,
			lp,
			fee,
		)) as Campaign;
	});


	// 2) .MAX (use soft cap as LP provision)
	//  No Fee%, campaign just hit soft cap.
	// - after finishUp, campaign owner get back 0 bnb as the full soft cap is used for LP
	it('After finishUp, campaign owner get back 0 busd as the full soft cap is used for LP', async () => {
		const { admin, users, BUSD, RandomProvider } = testEnv;
		const user1 = users[0]
		const user2 = users[1]
		//approval
		await BUSD.connect(user1.signer).mint(ethers.utils.parseEther("2"));
		await BUSD.connect(user1.signer).approve(main.address, ethers.utils.parseEther("2"));

		await BUSD.connect(user2.signer).mint(ethers.utils.parseEther("2"));
		await BUSD.connect(user2.signer).approve(main.address, ethers.utils.parseEther("2"));

		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);
		//tally
		await advanceBlock(info[0].subEnd.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);
		//mock random value
		await RandomProvider.setRequestId(ethers.utils.formatBytes32String("ok"), main.address);
		await main.connect(admin).tallyPrepare();
		await RandomProvider.fulfillRandomness(ethers.utils.formatBytes32String("ok"), "36182639440450741575202689230877903979908723051233706145827570538348168242976");

		await waitForTx(
			await main.connect(admin).tallySubscriptionAuto()
		);
		//start IDO
		await advanceBlock(info[0].idoStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoWhitelisted);
		//start public round
		await advanceBlock(info[0].idoStart.add(62).toNumber());
		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoPublic);
		//user 1 buy 1 busd
		await waitForTx(
			await main.connect(users[0].signer).buyTokens(ethers.utils.parseEther("1"))
		);

		//user 2 buy 1 busd
		await waitForTx(
			await main.connect(user2.signer).buyTokens(ethers.utils.parseEther("1"))
		);

		const purchase = await main.getPurchaseDetail(users[0].address, true);

		expect(purchase.total).to.be.equals(ethers.utils.parseEther("1"));

		await advanceBlock(info[0].idoEnd.add(60).toNumber());
		await waitForTx(
			await main.finishUp());

		const soldToken = await main.getTotalAllocSold();
		const fundOutAmtBF = await BUSD.balanceOf(await admin.getAddress());

		await main.claimFunds();

		const fundOutAmtAT = await BUSD.balanceOf(await admin.getAddress());
		// campaign owner get back 0 bnb 
		expect("0").to.be.equals(fundOutAmtAT.sub(fundOutAmtBF));

	});
});
