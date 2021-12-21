import { deployCampaignWith9DPToken } from './helpers/contracts-helpers';
import { parseTokenWithDP, advanceBlock } from './helpers/misc-utils';
import { Period } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';

makeSuite('Campaign-generic-9dp-test', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, Token9dp } = testEnv;
		token = Token9dp;
		main = (await deployCampaignWith9DPToken(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address, "1")) as Campaign;
	});

	it('Should able to subscribe', async () => {
		const { admin, users, RandomProvider } = testEnv;

		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		const user1 = users[0];

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		const sub1 = await main.getSubscribable(users[0].address);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("0.1"));
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther("0.1"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.1") });

		const tokenclaim = await main.getTokensForCapital(ethers.utils.parseEther("0.1"));

		expect(tokenclaim.toString()).to.be.equals(parseTokenWithDP("10000", 9).toString());

		const sub2 = await main.getSubscribable(users[1].address);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("0.1"));
		await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("0.1"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.1") });


		//tally
		await advanceBlock(info[0].subEnd.toNumber());

		//mock random value
		await RandomProvider.setRequestId(ethers.utils.formatBytes32String("ok"), main.address);
		await main.connect(admin).tallyPrepare();
		await RandomProvider.fulfillRandomness(ethers.utils.formatBytes32String("ok"), "36182639440450741575202689230877903979908723051233706145827570538348168242976");

		await main.connect(admin).tallySubscriptionAuto()

		//user1 buy 1 bnb
		await advanceBlock(info[0].idoStart.add(61).toNumber());

		await main.connect(user1.signer).buyTokens(ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") });

		await advanceBlock(info[0].idoEnd.toNumber());

		//finishedUp
		await main.finishUp();

	});

	it('Should able to claim token', async () => {
		const { users } = testEnv;
		const info = await main.getCampaignInfo();

		const user1 = users[0];

		await advanceBlock(info[0].idoEnd.add(60).toNumber());

		//user1 claim token

		const claim = await main.getClaimableByIntervals(user1.address, true);
		expect(claim.claimedSoFar.toString()).to.be.equal(parseTokenWithDP("0", 18).toString());
		expect(claim.claimable.toString()).to.be.equal(parseTokenWithDP("0.374", 18).toString());

		await main.connect(user1.signer).claimTokens();

		let balanceAT = await token.balanceOf(user1.address);

		expect(balanceAT.toString()).to.be.equals(parseTokenWithDP("37400", 9).toString());

		await advanceBlock(info[0].idoEnd.add(60 + 300).toNumber());

		const claim2 = await main.getClaimableByIntervals(user1.address, true);
		expect(claim2.claimedSoFar.toString()).to.be.equal(parseTokenWithDP("0.374", 18).toString());
		expect(claim2.claimable.toString()).to.be.equal(parseTokenWithDP("0.363", 18).toString());

		await main.connect(user1.signer).claimTokens();

		balanceAT = await token.balanceOf(user1.address);

		expect(balanceAT.toString()).to.be.equals(parseTokenWithDP("73700", 9).toString());

		await advanceBlock(info[0].idoEnd.add(60 + 600).toNumber());

		const claim3 = await main.getClaimableByIntervals(user1.address, true);
		expect(claim3.claimedSoFar.toString()).to.be.equal(parseTokenWithDP("0.737", 18).toString());
		expect(claim3.claimable.toString()).to.be.equal(parseTokenWithDP("0.363", 18).toString());

		await main.connect(user1.signer).claimTokens();

		balanceAT = await token.balanceOf(user1.address);

		expect(balanceAT.toString()).to.be.equals(parseTokenWithDP("110000", 9).toString());

	});
});
