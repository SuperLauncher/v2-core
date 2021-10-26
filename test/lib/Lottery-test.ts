import { Code } from './../helpers/types';
import { deployMintableToken, deployTestLoterry } from '../helpers/contracts-helpers';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { MintableToken } from '../../types/MintableToken';
import {TestLottery} from '../../types/TestLottery';
import {ethers} from 'hardhat';
import { expect } from 'chai';
import { waitForTx } from '../helpers/misc-utils';

makeSuite('Lottery-test', (testEnv: TestEnv) => {
	var main: TestLottery;
	var token: MintableToken;
	var id = 0;
	beforeEach(async () => {
		const { manager, users, factory,  } = testEnv;
		token = await deployMintableToken("DAI", "DAI", "18");
		main = (await deployTestLoterry(manager.address ,factory, id++, manager.address, token.address, "1")) as TestLottery;
	});

	it('Check getSubscription', async () => {
		const { users  } = testEnv;
		const result = await main.getSubscription(users[5].address);

	});

	// it('Check lottery users can subcribe', async () => {
	// 	const { users  } = testEnv;
	// 	await waitForTx (await main.connect(users[3].signer).subscribe());

	// 	//can't sub 2 time
	// await expect(
	// 		  main.connect(users[3].signer).subscribe()
	// 	).to.be.revertedWith(Code.AlreadyExist.toString());

	// });

});
