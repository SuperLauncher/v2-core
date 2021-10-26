import { deployMintableToken, deployTestGuarantee, deployTestOverSub } from './../helpers/contracts-helpers';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { MintableToken } from '../../types/MintableToken';
import {TestOverSubscribe} from '../../types/TestOverSubscribe';
import {ethers} from 'hardhat';
import { expect } from 'chai';

makeSuite('OverSubscribe-test', (testEnv: TestEnv) => {
	let main: TestOverSubscribe;
	let token: MintableToken;
		var id = 0; 
	beforeEach(async () => {
		const { manager, users, factory,  } = testEnv;

		token = await deployMintableToken("DAI", "DAI", "18");

		main = (await deployTestOverSub(manager.address ,factory, id++, manager.address, token.address, "1")) as TestOverSubscribe;

	});

	it('Check getEggBurnQty is correct', async () => {
		const { users  } = testEnv;
		const result = await main.getEggBurnQty(ethers.utils.parseEther("1"), 15)

		expect(result.toString()).to.be.equal(ethers.utils.parseEther("300").toString());
		const result2 = await main.getParam();

		expect(result2[0].toString()).to.be.equal(ethers.utils.parseEther("180"));

		expect(result2[1].toString()).to.be.equal(ethers.utils.parseEther("1.5"));

		// await main.getEggBurnQty(ethers.utils.parseEther("0.0025"), 100)
	});

	it('Should able to subcribe', async () => {
		const { users  } = testEnv;
		const result = await main.getEggBurnQty(ethers.utils.parseEther("1"), 15)
		
		//can not sub with 0 amount
	
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther("0"), "0","0")
		 .catch(error => { 
			expect(error).to.not.a('null');
		 });
	

		//can not sub with priority 101
		
		await	main.connect(users[0].signer).subscribe(ethers.utils.parseEther('1'), '101',result.toString())
		.catch(error => { 
					expect(error).to.not.a('null');
				});
			
		// //user0 sub 2 time
		await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("1"), 15,result.toString());
		
		await	main.connect(users[1].signer).subscribe(ethers.utils.parseEther("1"), 15,result.toString())
			.catch(error => { 
					expect(error).to.not.a('null');
				});
			
		// //put wrong egg amount
		await	main.connect(users[3].signer).subscribe(ethers.utils.parseEther("1"), 15,ethers.utils.parseEther("1"))
			.catch(error => { 
					expect(error).to.not.a('null');
				});
	});


	it('Should able to get subcription', async () => {
		const { users  } = testEnv;
		
		var egg1 = await main.getEggBurnQty(ethers.utils.parseEther("1"), 15)
		
		//user0 sub 1
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther("1"), 15, egg1.toString());

		expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("1"));

		//user1 sub 1
		await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("1"), 15, egg1.toString());

		expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("2"));

		//user3 sub 1.5
		var egg3 = await main.getEggBurnQty(ethers.utils.parseEther("1.5"), 15)
		await main.connect(users[2].signer).subscribe(ethers.utils.parseEther("1.5"), 15, egg3.toString());

		expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("3.5"));

		//user4 sub 1.5
		var egg4 = await main.getEggBurnQty(ethers.utils.parseEther("1.5"), 15)
		await main.connect(users[3].signer).subscribe(ethers.utils.parseEther("1.5"), 15, egg4.toString());

		expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("5"));

		//query getSubscription()
		var getSubscription = await main.getSubscription(users[0].address);
		expect(getSubscription[0]).to.be.equal(true);
		expect(getSubscription[1]).to.be.equal(ethers.utils.parseEther("1"));
		expect(getSubscription[2]).to.be.equal(15);
		expect(getSubscription[3]).to.be.equal(egg1);

		var getSubscription = await main.getSubscription(users[1].address);
		expect(getSubscription[0]).to.be.equal(true);
		expect(getSubscription[1]).to.be.equal(ethers.utils.parseEther("1"));
		expect(getSubscription[2]).to.be.equal(15);
		expect(getSubscription[3]).to.be.equal(egg1);

		var getSubscription = await main.getSubscription(users[2].address);
		expect(getSubscription[0]).to.be.equal(true);
		expect(getSubscription[1]).to.be.equal(ethers.utils.parseEther("1.5"));
		expect(getSubscription[2]).to.be.equal(15);
		expect(getSubscription[3]).to.be.equal(egg3);
		
		var getSubscription = await main.getSubscription(users[3].address);
		expect(getSubscription[0]).to.be.equal(true);
		expect(getSubscription[1]).to.be.equal(ethers.utils.parseEther("1.5"));
		expect(getSubscription[2]).to.be.equal(15);
		expect(getSubscription[3]).to.be.equal(egg4);
	});


	// it('Should able to get subcription', async () => {
	// 	const { users  } = testEnv;
	// 	const result = await main.getEggBurnQty(ethers.utils.parseEther("0.0025"), 15)
		
	// 	//user0 sub
	// 	await main.connect(users[1].signer).subscribe(ethers.utils.parseEther("0.0025"), 15,result.toString());
	// 	expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("0.0025"));
	// 	//user1 sub
	// 	await main.connect(users[2].signer).subscribe(ethers.utils.parseEther("0.0025"), 15,result.toString());
	// 	expect(await main.getTotal()).to.be.equal(ethers.utils.parseEther("0.005"));
	// });

});
