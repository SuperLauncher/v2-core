import { deployCampaignLottery2 } from './helpers/contracts-helpers';
import { increaseTimeAndMine, advanceBlock, parseTokenWithDP } from './helpers/misc-utils';
import { Period, Code } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';

makeSuite('Campaign-lottery-3', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX, BUSD } = testEnv;
		token = XYX;
		main = (await deployCampaignLottery2(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address, "1", BUSD.address)) as Campaign;
	});

	it('Should able to have correct lottery', async () => {
		const { admin, users, eggV2, BUSD } = testEnv;

		const info = await main.getCampaignInfo();
		//start Sub
		await advanceBlock(info[0].subStart.toNumber());


		const user1 = users[3]
		const user2 = users[4]
		const user3 = users[5]

		await eggV2.connect(admin).transfer(user1.address, ethers.utils.parseEther('1000'));
		await eggV2.connect(user1.signer).approve(main.address, ethers.utils.parseEther('1000'));

		await eggV2.connect(admin).transfer(user2.address, ethers.utils.parseEther('1000'));
		await eggV2.connect(user2.signer).approve(main.address, ethers.utils.parseEther('1000'));

		await eggV2.connect(admin).transfer(user3.address, ethers.utils.parseEther('1000'));
		await eggV2.connect(user3.signer).approve(main.address, ethers.utils.parseEther('1000'));


				//approval
				await BUSD.connect(user1.signer).mint(ethers.utils.parseEther("2"));
				await BUSD.connect(user1.signer).approve(main.address, ethers.utils.parseEther("2"));
		
				await BUSD.connect(user2.signer).mint(ethers.utils.parseEther("2"));
				await BUSD.connect(user2.signer).approve(main.address, ethers.utils.parseEther("2"));

				await BUSD.connect(user3.signer).mint(ethers.utils.parseEther("2"));
				await BUSD.connect(user3.signer).approve(main.address, ethers.utils.parseEther("2"));

		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		const sub1 = await main.getSubscribable(user1.address);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user1.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.4"), 0, ethers.utils.parseEther("1"));

		const sub2 = await main.getSubscribable(user2.address);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user2.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.4"), 0, ethers.utils.parseEther("1"));

		const sub3 = await main.getSubscribable(user3.address);
		expect(sub3[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user3.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.3"), 0, ethers.utils.parseEther("0.75"));

		//tally
		await advanceBlock(info[0].subEnd.toNumber());
		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);

		await main.connect(admin).tallySubscriptionAuto()

		await main.peekTally();

		await advanceBlock(info[0].idoStart.add(60 * 1).toNumber());

		//console.log(tallResult[2].toString());

		const resultUser1 = await main.getSubscriptionResult(user1.address);
		//console.log(resultUser1.wonLottery)

		const resultUser2 = await main.getSubscriptionResult(user2.address);
		//console.log(resultUser2.wonLottery)

		const resultUser3 = await main.getSubscriptionResult(user3.address);
		//console.log(resultUser3.wonLottery)

		//console.log(resultUser3.wonOverSub)

		let numbWonLottery = 0
		if (resultUser1.wonLottery) {
			numbWonLottery++
		}
		if (resultUser2.wonLottery) {
			numbWonLottery++
		}
		if (resultUser3.wonLottery) {
			numbWonLottery++
			expect(resultUser3.lotteryAmount).to.be.equals(ethers.utils.parseEther("0.3"));
		}
		expect(numbWonLottery).to.be.equals(3)

		let numbWonOS = 0
		if (resultUser1.wonOverSub) {
			numbWonOS++
		}
		if (resultUser2.wonOverSub) {
			numbWonOS++
		}
		if (resultUser3.wonOverSub) {
			numbWonOS++
		}
		expect(numbWonOS).to.be.equals(3);

	});
});
