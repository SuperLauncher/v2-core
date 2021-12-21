import { task } from "hardhat/config";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-contract-sizer';
import { HardhatUserConfig } from 'hardhat/config';

const fs = require('fs');
// const privateKey = fs.readFileSync(".secret").toString().trim();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
	localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
    },
	testnet: {
		url: `https://data-seed-prebsc-2-s1.binance.org:8545/`,
	  	// accounts: [privateKey],
	},
 	mainnet: {
		url: `https://bsc-dataseed.binance.org/`,
	},
  },
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  typechain: {
    outDir: 'types',
  },
	contractSizer: {
	alphaSort: true,
	runOnCompile: true,
	disambiguatePaths: false,
	}
};
export default config;