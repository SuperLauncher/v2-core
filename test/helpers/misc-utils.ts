import { BigNumber } from 'bignumber.js';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet, ContractTransaction } from 'ethers';
import {ethers} from 'hardhat';

export let DRE: HardhatRuntimeEnvironment = {} as HardhatRuntimeEnvironment;

export const setDRE = (_DRE: HardhatRuntimeEnvironment) => {
	DRE = _DRE;
  };
  

export const evmSnapshot = async () => await ethers.provider.send('evm_snapshot', []);

export const evmRevert = async (id: string) => ethers.provider.send('evm_revert', [id]);

export const increaseTime = async (secondsToIncrease: number) =>
  await ethers.provider.send('evm_increaseTime', [secondsToIncrease]);

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const getCurrentBlock = async () => {
	return ethers.provider.getBlockNumber();
  };

  
export const timeLatest = async () => {
	const block = await ethers.provider.getBlock('latest');
	return new BigNumber(block.timestamp);
  };
  
export const advanceBlock = async (timestamp?: number) => {
	const priorBlock = await getCurrentBlock();
	await ethers.provider.send('evm_mine', timestamp ? [timestamp] : []);
	const nextBlock = await getCurrentBlock();
	if (!timestamp && nextBlock == priorBlock) {
	  await advanceBlock();
	  return;
	}
  };

export const increaseTimeAndMine = async (secondsToIncrease: number) => {
	await ethers.provider.send('evm_increaseTime', [secondsToIncrease]);
	await ethers.provider.send('evm_mine', []);
  };
  
export const PCNT_100 = new BigNumber("1").shiftedBy(6);
export const PCNT_10 = new BigNumber("1").shiftedBy(5);

export const getEggBurnQty =
 (stdEggBurnQty: BigNumber, stdOverSubQty: BigNumber, amount: BigNumber, priority: number) => {
	 //console.log("value: ", PCNT_100.toString());
	return stdEggBurnQty.multipliedBy(amount)
	.multipliedBy(PCNT_100.plus(PCNT_10.multipliedBy(priority)))
	.dividedToIntegerBy(stdOverSubQty.multipliedBy(PCNT_100));
}

export const parseTokenWithDP =
 (value: string,  dp: number) => {
	 return new BigNumber(value).shiftedBy(dp);
}