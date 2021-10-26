import { ethers } from "hardhat";

async function main() {
	// We get the contract to deploy
	const RolesRegistry = await ethers.getContractFactory(
		"RolesRegistry"
	);
	const rolesRegistry = await RolesRegistry.deploy();
	await rolesRegistry.deployed();
  
	console.log("rolesRegistry deployed to:", rolesRegistry.address);

	const deployer = '0xD507283f873837057Bc551aD9f46cbe60C8C79AA';
	const approver = '0xD507283f873837057Bc551aD9f46cbe60C8C79AA';
	const configurator = '0xD507283f873837057Bc551aD9f46cbe60C8C79AA';
	const feeVault = "0xD507283f873837057Bc551aD9f46cbe60C8C79AA";
	const egg = "0xbA385450b39FB78bC12a710003FDbc0ff0aD18Ea"
	const svLuanchv2 = "0x75234c92e2d00391eb31fd5d396ac23475828aa2"

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
  }
  
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});