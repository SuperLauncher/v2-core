import { deployCampaignLottery } from './helpers/contracts-helpers';
import { increaseTimeAndMine, advanceBlock, parseTokenWithDP } from './helpers/misc-utils';
import { Period, Code } from './helpers/types';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { MintableToken } from '../types/MintableToken';
import { Campaign } from '../types/Campaign';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from './helpers/misc-utils';

makeSuite('Campaign-lottery-1', (testEnv: TestEnv) => {
	var main: Campaign;
	var token: MintableToken;
	before(async () => {
		const { admin, manager, factory, XYX } = testEnv;
		token = XYX;
		main = (await deployCampaignLottery(manager,
			admin,
			factory,
			await admin.getAddress(),
			token.address, "1")) as Campaign;
	});

	it('Should able to subscribe', async () => {
		const { admin, users, eggV2 } = testEnv;

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


		expect(await main.getCurrentPeriod()).to.be.equals(Period.Subscription);

		const sub1 = await main.getSubscribable(user1.address);
		expect(sub1[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user1.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.35"), 0, ethers.utils.parseEther("1"),
			{ value: ethers.utils.parseEther("0.65") });

		const sub2 = await main.getSubscribable(user2.address);
		expect(sub2[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user2.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.35"), 0, ethers.utils.parseEther("1"),
			{ value: ethers.utils.parseEther("0.65") });

		const sub3 = await main.getSubscribable(user3.address);
		expect(sub3[0]).to.be.equals(ethers.utils.parseEther("0.3"));
		await main.connect(user3.signer).subscribe(ethers.utils.parseEther("0.3"), ethers.utils.parseEther("0.35"), 2, ethers.utils.parseEther("1.2"),
			{ value: ethers.utils.parseEther("0.65") });

		//tally
		await advanceBlock(info[0].subEnd.toNumber());
		expect(await main.getCurrentPeriod()).to.be.equals(Period.Setup);

		await main.connect(admin).tallySubscriptionAuto()

		await main.peekTally();
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
		expect(numbWonLottery).to.be.equals(1)

		let numbWonOverSub = 0
		if (resultUser1.wonOverSub) {
			numbWonOverSub++
			expect(resultUser1.overSubAmount).to.be.equals(ethers.utils.parseEther("0.35"));
			expect(resultUser1.eggBurnAmount).to.be.equals(ethers.utils.parseEther("1"));
		} else {
			const refund = await main.getRefundable(user1.address);
			//console.log(refund);
			expect(refund[0]).to.be.equals(false);
			expect(refund[2].toString()).to.be.equals(ethers.utils.parseEther("1"));
		}
		if (resultUser2.wonOverSub) {
			numbWonOverSub++
			expect(resultUser2.overSubAmount).to.be.equals(ethers.utils.parseEther("0.35"));
			expect(resultUser2.eggBurnAmount).to.be.equals(ethers.utils.parseEther("1"));
		}
		if (resultUser3.wonOverSub) {
			numbWonOverSub++
			expect(resultUser3.overSubAmount).to.be.equals(ethers.utils.parseEther("0.35"));
			expect(resultUser3.eggBurnAmount).to.be.equals(ethers.utils.parseEther("1.2"));
		}
		expect(numbWonOverSub).to.be.equals(1)

		const refund = await main.getRefundable(user1.address);

		if (!resultUser1.wonLottery && !resultUser1.wonOverSub) {
			expect(refund[1].toString()).to.be.equals(ethers.utils.parseEther("0.65"));
			expect(refund[2].toString()).to.be.equals(ethers.utils.parseEther("1"));
		}

		if (!resultUser1.wonLottery && resultUser1.wonOverSub) {
			expect(refund[1].toString()).to.be.equals(ethers.utils.parseEther("0.3"));
			expect(refund[2].toString()).to.be.equals(ethers.utils.parseEther("0"));
		}

		if (resultUser1.wonLottery && !resultUser1.wonOverSub) {
			expect(refund[1].toString()).to.be.equals(ethers.utils.parseEther("0.35"));
			expect(refund[2].toString()).to.be.equals(ethers.utils.parseEther("1"));
		}

		const refund2 = await main.getRefundable(user2.address);

		if (!resultUser2.wonLottery && !resultUser2.wonOverSub) {
			expect(refund2[1].toString()).to.be.equals(ethers.utils.parseEther("0.65"));
			expect(refund2[2].toString()).to.be.equals(ethers.utils.parseEther("1"));
		}

		if (!resultUser2.wonLottery && resultUser2.wonOverSub) {
			expect(refund2[1].toString()).to.be.equals(ethers.utils.parseEther("0.3"));
			expect(refund2[2].toString()).to.be.equals(ethers.utils.parseEther("0"));
		}

		if (resultUser2.wonLottery && !resultUser2.wonOverSub) {
			expect(refund2[1].toString()).to.be.equals(ethers.utils.parseEther("0.35"));
			expect(refund2[2].toString()).to.be.equals(ethers.utils.parseEther("1"));
		}

		const refund3 = await main.getRefundable(user3.address);

		if (!resultUser3.wonLottery && !resultUser3.wonOverSub) {
			expect(refund3[1].toString()).to.be.equals(ethers.utils.parseEther("0.65"));
			expect(refund3[2].toString()).to.be.equals(ethers.utils.parseEther("1.2"));
		}

		if (!resultUser3.wonLottery && resultUser3.wonOverSub) {
			expect(refund3[1].toString()).to.be.equals(ethers.utils.parseEther("0.3"));
		}

		if (resultUser3.wonLottery && !resultUser3.wonOverSub) {
			expect(refund3[1].toString()).to.be.equals(ethers.utils.parseEther("0.35"));
		}

	});

	it('Should able to claim back the refund', async () => {
		const { admin, users, eggV2 } = testEnv;

		const user1 = users[3]
		const user2 = users[4]
		const user3 = users[5]

		//user1
		const resultUser1 = await main.getSubscriptionResult(user1.address);
		const eggBalanceBF = await eggV2.balanceOf(user1.address);
		const bnbBalanceBF = await ethers.provider.getBalance(user1.address);
		await main.connect(user1.signer).refundExcess();
		const refund = await main.getRefundable(user1.address);

		const eggBalanceAT = await eggV2.balanceOf(user1.address);
		const bnbBalanceAT = await ethers.provider.getBalance(user1.address); 
		expect(refund[0]).to.be.equals(true);

		if (!resultUser1.wonLottery && !resultUser1.wonOverSub) {
			const delta = bnbBalanceAT.sub(bnbBalanceBF) > ethers.utils.parseEther("0.64");
			expect(delta).to.be.equals(true);

			expect(eggBalanceAT.sub(eggBalanceBF)).to.be.equals(ethers.utils.parseEther("1"));
		}

		if (!resultUser1.wonLottery && resultUser1.wonOverSub) {

			const delta = bnbBalanceAT.sub(bnbBalanceBF) > ethers.utils.parseEther("0.29");
			expect(delta).to.be.equals(true);

			expect(eggBalanceAT.sub(eggBalanceBF)).to.be.equals(ethers.utils.parseEther("0"));
		}

		if (resultUser1.wonLottery && !resultUser1.wonOverSub) {

			const delta = bnbBalanceAT.sub(bnbBalanceBF) > ethers.utils.parseEther("0.34");
			expect(delta).to.be.equals(true);
			expect(eggBalanceAT.sub(eggBalanceBF)).to.be.equals(ethers.utils.parseEther("1"));
		}
		
		await main.connect(user2.signer).refundExcess();

		// await expect(await main.connect(user2.signer).refundExcess()).to.be.revertedWith(Code.AlreadyRefunded.toString());
	});
});
