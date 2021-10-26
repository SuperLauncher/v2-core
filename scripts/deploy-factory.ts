import { deployLibraries } from './../test/helpers/contracts-helpers';
import { ethers } from "hardhat";

async function main() {
	
	const managerAddress = "0x31F3E72971e73a022c4609807c88927C96b00E6a";

	const Manager = await ethers.getContractFactory("Manager");
	const manager = await Manager.attach(managerAddress);

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	const Factory = await ethers.getContractFactory("Factory", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			LpProvision: lpProvision.address,
			OverSubscribe: overSubscribe.address,
			Vesting: vesting.address,
		},
	});

	const factory = await Factory.deploy(managerAddress);
	await factory.deployed();

	//set factory to manager
	let tx  = await manager.registerFactory(factory.address);
	await tx.wait();

	console.log("factory deployed to:", factory.address);
  }
  
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});