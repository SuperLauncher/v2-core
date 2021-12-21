import { deployCampaignGeneric } from './helpers/contracts-helpers';
import { advanceBlock } from './helpers/misc-utils';
import { Period } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';

makeSuite('Campaign-generic-1-test', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX } = testEnv;
		token = XYX;
		main = (await deployCampaignGeneric(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address, "1")) as Campaign;
	});

	it('Should able to subscribe', async () => {
		const { users } = testEnv;
		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		const sub1 = await main.getSubscribable(users[0].address);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("3"));
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther("3"), "0", 0, 0,
			{ value: ethers.utils.parseEther("3") });

		const sub2 = await main.getSubscribable(users[1].address);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("1.5"));
		await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("1.5"), "0", 0, 0,
			{ value: ethers.utils.parseEther("1.5") });

		const sub3 = await main.getSubscribable(users[2].address);
		expect(sub3[0]).to.be.equals(ethers.utils.parseEther("0.6"));
		await main.connect(users[2].signer).subscribe(ethers.utils.parseEther("0.6"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.6") });

		const sub4 = await main.getSubscribable(users[3].address);
		expect(sub4[0]).to.be.equals(ethers.utils.parseEther("0.1"));
		await main.connect(users[3].signer).subscribe(ethers.utils.parseEther("0.1"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.1") });
	});

	it('Should able to tally', async () => {
		const { admin, RandomProvider } = testEnv;
		const info = await main.getCampaignInfo();
		//tally
		await advanceBlock(info[0].subEnd.toNumber());
		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);
		await RandomProvider.setRequestId(ethers.utils.formatBytes32String("ok"), main.address);
		await main.connect(admin).tallyPrepare();
		await RandomProvider.fulfillRandomness(ethers.utils.formatBytes32String("ok"), "36182639440450741575202689230877903979908723051233706145827570538348168242976");
		await main.connect(admin).tallySubscriptionAuto();
	});
});
