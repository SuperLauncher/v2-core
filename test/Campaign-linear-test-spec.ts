import { increaseTimeAndMine, advanceBlock } from './helpers/misc-utils';
import { Period } from './helpers/types';
import { deployCampaignIntervalLinear } from './helpers/contracts-helpers';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Vesting-flow-linear-test', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	var id = 10;
	before(async () => {
		const { admin, manager, XYX, factory, } = testEnv;
		token = XYX;
		main = (await deployCampaignIntervalLinear(manager, admin, factory, id++, await admin.getAddress(), token.address, "1")) as Campaign;
	});

	it('Should able to claim', async () => {
		const { admin, users } = testEnv;
		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);
		//tally
		await increaseTimeAndMine(60 * 2);
		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);
		await waitForTx(
			await main.connect(admin).tallySubscriptionAuto()
		);
		//start IDO
		await advanceBlock(info[0].idoStart.toNumber());

		//start public round
		await advanceBlock(info[0].idoStart.add(60).toNumber());

		//user 1 buy 1 bnb
		let balanceBefore = await token.balanceOf(users[0].address)
		expect(balanceBefore.toString()).to.be.equals("0");

		await waitForTx(
			await main.connect(users[0].signer).buyTokens(ethers.utils.parseEther("1"),
				{ value: ethers.utils.parseEther("1") })
		);
		const purchase = await main.getPurchaseDetail(users[0].address, true);
		expect(purchase.total).to.be.equals(ethers.utils.parseEther("1"));

		//user 2 buy 1 bnb
		let balanceBefore2 = await token.balanceOf(users[1].address)
		expect(balanceBefore2.toString()).to.be.equals("0");

		await waitForTx(
			await main.connect(users[1].signer).buyTokens(ethers.utils.parseEther("1"),
				{ value: ethers.utils.parseEther("1") })
		);
		const purchase2 = await main.getPurchaseDetail(users[1].address, true);
		expect(purchase2.total).to.be.equals(ethers.utils.parseEther("1"));


		await increaseTimeAndMine(62 * 2);
		await main.finishUp();

		await increaseTimeAndMine(62 * 5);
		//user 2 partially claim

		await waitForTx(
			await main.connect(users[1].signer).claimTokens()
		);

		//user2 claim tokens #1
		var tokenU2Claim1 = await main.getClaimableByLinear(users[1].address, true)
		expect((await token.balanceOf(users[1].address)).toString())
			.to.be.equals((await main.getTokensForCapital(tokenU2Claim1.claimedSoFar)).toString());

		await increaseTimeAndMine(62 * 5);

		//user 2 partially claim #2
		await waitForTx(
			await main.connect(users[1].signer).claimTokens()
		);

		//user2 claim tokens #2
		var tokenU2Claim2 = await main.getClaimableByLinear(users[1].address, true)
		expect((await token.balanceOf(users[1].address)).toString())
			.to.be.equals((await main.getTokensForCapital(tokenU2Claim2.claimedSoFar)).toString());

		await increaseTimeAndMine(62 * 60);

		let claimDt = await main.getClaimableByLinear(users[0].address, true);
		expect(claimDt.claimedSoFar.toString()).to.be.equals("0");


		//user1 - claim 100 token
		await waitForTx(
			await main.connect(users[0].signer).claimTokens()
		);


		let claimDt2 = await main.getClaimableByLinear(users[0].address, true);
		expect(claimDt2.claimedSoFar.toString()).to.be.equals(ethers.utils.parseEther("1").toString());
		expect(claimDt2.claimable.toString()).to.be.equals("0");


		//user get 100 tokens
		let balance1 = await token.balanceOf(users[0].address)
		expect(balance1.toString()).to.be.equals(ethers.utils.parseEther("100").toString());

		//user 2 partially claim #3
		await waitForTx(
			await main.connect(users[1].signer).claimTokens()
		);

		//user2 claim tokens #2
		var tokenU2Claim3 = await main.getClaimableByLinear(users[1].address, true)
		expect((await token.balanceOf(users[1].address)).toString())
			.to.be.equals((await main.getTokensForCapital(tokenU2Claim3.claimedSoFar)).toString());

	});
});
