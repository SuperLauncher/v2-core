import { expect } from 'chai';
import { deployContract } from './../helpers/contracts-helpers';
import { Code } from './../helpers/types';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { TestErrorCode } from '../../types/TestErrorCode';

makeSuite('Error-test', (testEnv: TestEnv) => {

	it('Check error message', async () => {
		const test = await deployContract<TestErrorCode>("TestErrorCode", []);
		expect((await test.test(Code.NoBasicSetup)).toString()).to.be.equals(Code.NoBasicSetup.toString());
		expect((await test.test(Code.Aborted)).toString()).to.be.equals(Code.Aborted.toString());
		expect((await test.test(Code.ValidationError)).toString()).to.be.equals(Code.ValidationError.toString());
	});
});
