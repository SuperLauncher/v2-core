import { ethers } from 'hardhat';
import {Signer} from 'ethers';
import { initializeMakeSuite } from './helpers/make-suite';

const buildTestEnv = async (deployer: Signer) => {
  console.time('setup');

  console.timeEnd('setup');
};

before(async () => {
//   await rawBRE.run('set-dre');
   const [deployer] = await ethers.getSigners();
  //console.log('-> Deploying test environment...');
//   await buildTestEnv(deployer, rewardsVault, restWallets);
  await initializeMakeSuite();
  //console.log('\n***************');
  //console.log('Setup and snapshot finished');
  //console.log('***************\n');
});
