import { increaseTimeAndMine, advanceBlock } from './helpers/misc-utils';
import { Code, Period } from './helpers/types';
import { deployCampaignSingleClaim } from './helpers/contracts-helpers';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';

makeSuite('Campaign-flow-single-claim-test', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	var id = 100;
	before(async () => {
		const { admin, manager, factory, XYX } = testEnv;
		token = XYX;
		main = (await deployCampaignSingleClaim(
			manager,
			admin,
			factory,
			id++,
			await admin.getAddress()
			, token.address, 
			"1",
			"0x0000000000000000000000000000000000000000",
			)) as Campaign;
	});

	it('Should able to claim interval', async () => {
		const { admin, users } = testEnv;
		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);
		//tally
		await advanceBlock(info[0].subEnd.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);

		await main.connect(admin).tallySubscriptionAuto()

		//start IDO
		await advanceBlock(info[0].idoStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoWhitelisted);
		//start public round
		await increaseTimeAndMine(62 * 1);
		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoPublic);
		//user 1 buy 1 bnb

		await main.connect(users[0].signer).buyTokens(ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") })


		const purchase = await main.getPurchaseDetail(users[0].address, true);

		expect(purchase.total).to.be.equals(ethers.utils.parseEther("1"));

		await increaseTimeAndMine(62 * 2);

		await main.finishUp();

		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoEnded);


		let claimDt = await main.getClaimableByIntervals(users[0].address, true);
		expect(claimDt.claimable.toString()).to.be.equals(ethers.utils.parseEther("1").toString());
		expect(claimDt.claimedSoFar.toString()).to.be.equals("0");
		expect(claimDt.numClaimableSlots.toString()).to.be.equals("1");
		expect(claimDt.claimStartIndex.toString()).to.be.equals("0");

		//user1 - claim 1
		await main.connect(users[0].signer).claimTokens();

		let balance = await token.balanceOf(users[0].address)
		expect(balance.toString()).to.be.equals(ethers.utils.parseEther("100").toString());

		await increaseTimeAndMine(60 * 15);

		//can't claim again
		await expect(main.connect(users[0].signer).claimTokens()
		).to.be.revertedWith(Code.ClaimFailed.toString());

	});
});
