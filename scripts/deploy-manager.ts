import { ethers } from "hardhat";

async function main() {
	// We get the contract to deploy
	const RolesRegistry = await ethers.getContractFactory(
		"RolesRegistry"
	);
	const rolesRegistry = await RolesRegistry.deploy();
	await rolesRegistry.deployed();
  
	console.log("rolesRegistry deployed to:", rolesRegistry.address);

	const deployer = '0x3c16B4237EC2E06b2370Cf4C7a72F0e22d9cdBA3';
	const approver = '0x3c16B4237EC2E06b2370Cf4C7a72F0e22d9cdBA3';
	const configurator = '0x3c16B4237EC2E06b2370Cf4C7a72F0e22d9cdBA3';
	const feeVault = "0x3c16B4237EC2E06b2370Cf4C7a72F0e22d9cdBA3";
	const egg = "0x222eE62792b60b8dbb1dD321DF75A310053a98ef"
	const svLuanchv2 = "0xA01db017f58C6A8d949D7A020da357E6B0a5aEC6"

	await rolesRegistry.setDeployer(deployer, true);
	await rolesRegistry.setApprover(approver, true);
	await rolesRegistry.setConfigurator(configurator, true);

	const Manager = await ethers.getContractFactory(
		"Manager"
	);
	const manager = await Manager.deploy(svLuanchv2, egg, feeVault, rolesRegistry.address);
	await manager.deployed();
  
	console.log("manager deployed to:", manager.address);

	let currency = ["0x0000000000000000000000000000000000000000",
	 "0xbaC85Ff271b63737AFb763cE5a61b9c3d642c8F1", // BUSD
	"0x611Eb5F5AC21BC5F9dc85117351bc1332cdC1ba8", // USDT
	];

	await manager.addCurrency(currency);

	const RandomProvider = await ethers.getContractFactory(
		"RandomProvider"
	);
	const randomProvider = await RandomProvider.deploy(
		manager.address,
		"0xa555fC018435bef5A13C6c6870a9d4C11DEC329C",
		"0xcaf3c3727e033261d383b315559476f48034c13b18f8cafed4d871abe5049186",
		"0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06"
		);
	await randomProvider.deployed();


	await manager.setRandomProvider(randomProvider.address);
  }
  
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});