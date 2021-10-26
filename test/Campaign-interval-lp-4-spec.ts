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

makeSuite('Campaign-lp-4', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX, BUSD } = testEnv;
		token = XYX;
		//no lp
		const lp: ILpProvision = {
			size: "2",
			rate: "0",
			sizeParam: "0",
			providers: ["0"],
			splits: ["1000000"],
			lockPcnts: ["1000000"],
			lockDurations: ["0"],
			swapToBNBLP: false,
		}
		const fee = "50000"; //5%
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
	//5% Fee, campaign just hit soft cap.
// - - after finishUp, 95% of the bnb is used to provide LP.
//  This means that there’s 5% of the XYZ tokens for LP that is not used.
//   This amount will be returned to campaign owner during finishUp()
	it('After finishUp, campaign owner get back 95% of his raised bnb', async () => {
		const { admin, users, BUSD, manager } = testEnv;
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
		// await waitForTx(
		// 	await main.connect(user2.signer).buyTokens(ethers.utils.parseEther("1"))
		// );


		const vaultAddress = await manager.getFeeVault();

		const feeVaultAmt1 = await BUSD.balanceOf(vaultAddress);
		console.log(feeVaultAmt1.toString());

		await advanceBlock(info[0].idoEnd.add(60).toNumber());
		await waitForTx(
			await main.finishUp());

		const fundOutAmtBF = await BUSD.balanceOf(await admin.getAddress());

		await main.claimFunds();

		const fundOutAmtAT = await BUSD.balanceOf(await admin.getAddress());

		expect("0").to.be.equals(fundOutAmtAT.sub(fundOutAmtBF));

		const feeVaultAmt = await BUSD.balanceOf(vaultAddress);

		expect(ethers.utils.parseEther("0.05")).to.be.equals(feeVaultAmt);

	});
});
