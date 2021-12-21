import { deployCampaignGeneric } from './helpers/contracts-helpers';
import { advanceBlock, increaseTimeAndMine } from './helpers/misc-utils';
import { Period } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Campaign-refund-1', (testEnv: TestEnv) => {
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

	it('Should able to refund', async () => {
		const { admin, users, RandomProvider } = testEnv;
		const info = await main.getCampaignInfo();

		//start Sub
		await advanceBlock(info[0].subStart.toNumber());

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		const sub1 = await main.getSubscribable(users[0].address);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("3"));
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther("0.4"), "0", 0, 0,
			{ value: ethers.utils.parseEther("0.4") });

		const sub2 = await main.getSubscribable(users[1].address);
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
		await main.peekTally();
		await increaseTimeAndMine(info[0].idoEnd.add(10).toNumber());
		await main.finishUp();
		expect(await main.getCurrentPeriod()).to.be.equals(Period.IdoEnded);

		// const balance1BF = await ethers.provider.getBalance(users[0].address);
		// //console.log(balance1BF.toString());
		const user1DetailBF = await main.getPurchaseDetail(users[0].address, true);
		expect(user1DetailBF.hasReturnedFund).to.be.equals(false);

		await main.connect(users[0].signer).returnFund();

		const user1DetailAT = await main.getPurchaseDetail(users[0].address, true);
		expect(user1DetailAT.hasReturnedFund).to.be.equals(true);
		// const balance1AT = await ethers.provider.getBalance(users[0].address);
		// //console.log(balance1AT.toString());
	});
});
