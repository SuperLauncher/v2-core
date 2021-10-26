import { increaseTimeAndMine, advanceBlock } from './helpers/misc-utils';
import { Period } from './helpers/types';
import { Code } from './helpers/types';
import { deployCampaignInterval } from './helpers/contracts-helpers';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Campaign-flow-interval-test', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	var id = 100;
	before(async () => {
		const { admin, manager, factory, XYX } = testEnv;
		token = XYX;
		main = (await deployCampaignInterval(
			manager,
			admin,
			factory,
			id++,
			await admin.getAddress(),
			token.address,
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
		await waitForTx(
			await main.connect(admin).tallySubscriptionAuto()
		);
		//start IDO
		await advanceBlock(info[0].idoStart.toNumber());

		// expect(await main.isLivePeriod()).to.be.equal(true);
		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoWhitelisted);
		//start public round
		await increaseTimeAndMine(62 * 1);
		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoPublic);
		//user 1 buy 1 bnb
		await waitForTx(
			await main.connect(users[0].signer).buyTokens(ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") })
		);

		const purchase = await main.getPurchaseDetail(users[0].address, true);

		expect(purchase.total).to.be.equals(ethers.utils.parseEther("1"));

		await increaseTimeAndMine(62 * 2);

		await main.finishUp();

		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoEnded);


		let claimDt = await main.getClaimableByIntervals(users[0].address, true);
		expect(claimDt.claimable.toString()).to.be.equals(ethers.utils.parseEther("0.34").toString());
		expect(claimDt.claimedSoFar.toString()).to.be.equals("0");
		expect(claimDt.numClaimableSlots.toString()).to.be.equals("1");
		expect(claimDt.claimStartIndex.toString()).to.be.equals("0");

		//user1 - claim 1
		await main.connect(users[0].signer).claimTokens();

		let balance = await token.balanceOf(users[0].address)
		expect(balance.toString()).to.be.equals(ethers.utils.parseEther("34").toString());

		await increaseTimeAndMine(60 * 15);

		const claimDt2 = await main.getClaimableByIntervals(users[0].address, true);
		expect(claimDt2.claimedSoFar.toString()).to.be.equals(ethers.utils.parseEther("0.34").toString());
		expect(claimDt2.claimable.toString()).to.be.equals(ethers.utils.parseEther("0.66").toString());
		expect(claimDt2.numClaimableSlots.toString()).to.be.equals("2");
		expect(claimDt2.claimStartIndex.toString()).to.be.equals("1");
		// claim the left 1 & 2
		await main.connect(users[0].signer).claimTokens();
		balance = await token.balanceOf(users[0].address)
		expect(balance.toString()).to.be.equals(ethers.utils.parseEther("100").toString());

		//can't claim again
		await expect(main.connect(users[0].signer).claimTokens()
		).to.be.revertedWith(Code.ClaimFailed.toString());

	});

	it('Should able to return 0 for un-bought users', async () => {
		const { users } = testEnv;
		const r = await main.getClaimableByIntervals(users[1].address, true);
		console.log(r.claimable.toString());
		console.log(r.numClaimableSlots.toString());

		await expect(main.connect(users[1].signer).claimTokens()
		).to.be.revertedWith(Code.InvalidAmount.toString());
	});
});
