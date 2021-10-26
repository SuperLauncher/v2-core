import { ethers } from "hardhat";
import { BigNumber }  from "bignumber.js";

async function main() {
	//token
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const token = await MintableToken.deploy("XYZ", "XYZ", 18);
	await token.deployed();
	console.log("token deployed to:", token.address);
  }
  
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});