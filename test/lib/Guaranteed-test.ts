import { Code } from './../helpers/types';
import { deployMintableToken, deployTestGuarantee } from './../helpers/contracts-helpers';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { MintableToken } from '../../types/MintableToken';
import {TestGuaranteed} from '../../types/TestGuaranteed';
import {ethers} from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from '../helpers/misc-utils';

makeSuite('Guaranteed-test', (testEnv: TestEnv) => {
	var main: TestGuaranteed;
	var token: MintableToken;
	var id = 0;
	beforeEach(async () => {
		const { manager, users, factory,  } = testEnv;

		id++
		token = await deployMintableToken("DAI", "DAI", "18");
		main = (await deployTestGuarantee(manager.address ,factory, id, manager.address, token.address, "1")) as TestGuaranteed;
	});

	it('Check users guarantee is correct', async () => {
		const { users  } = testEnv;

		const result = await main.getGuaranteedAmt(users[0].address);
		expect(result[1]).to.be.equal(true);
		expect(result[0]).to.be.equal(ethers.utils.parseEther('3'));
		await main.connect(users[0].signer).subscribe(ethers.utils.parseEther('1'),ethers.utils.parseEther('3') );


		const result1 = await main.getGuaranteedAmt(users[1].address);
		expect(result1[1]).to.be.equal(true);
		expect(result1[0]).to.be.equal(ethers.utils.parseEther('1.5'));

		const result2 = await main.getGuaranteedAmt(users[2].address);
		expect(result2[1]).to.be.equal(true);
		expect(result2[0]).to.be.equal(ethers.utils.parseEther('0.6'));

		const result3 = await main.getGuaranteedAmt(users[3].address);
		expect(result3[1]).to.be.equal(false);
		expect(result3[0]).to.be.equal(ethers.utils.parseEther('0.1'));

		const result4 = await main.getGuaranteedAmt(users[4].address);
		expect(result4[1]).to.be.equal(false);
		expect(result4[0]).to.be.equal(ethers.utils.parseEther('0.1'));

		const result5 = await main.getGuaranteedAmt(users[5].address);
		expect(result5[1]).to.be.equal(false);
		expect(result5[0]).to.be.equal(ethers.utils.parseEther('0.1'));

	});

	it('Check guarantee users can subscribe', async () => {
		const { users  } = testEnv;
		const result = await main.getGuaranteedAmt(users[0].address);
		expect(result[1]).to.be.equal(true);
		expect(result[0]).to.be.equal(ethers.utils.parseEther('3'));
		await waitForTx (
			await main.subscribe(ethers.utils.parseEther('1'),ethers.utils.parseEther('3') )
			);

	});


	it('Check guarantee users can not subcribe bigger then max allowcation', async () => {
		const { users  } = testEnv;
		//can't sub 2 time
		await expect(
			main.connect(users[0].signer).subscribe(
				ethers.utils.parseEther('5'),ethers.utils.parseEther('3') )
			).to.be.revertedWith(Code.ValueExceeded.toString())

	});

});
