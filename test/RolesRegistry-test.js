const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RolesRegistry", function () {
	let rolesRegistry;
	let owner, deployer, configurator, approver;

	beforeEach(async () => {
		[owner, deployer, configurator, approver] = await ethers.getSigners();

		const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
		rolesRegistry = await RolesRegistry.deploy();
		await rolesRegistry.deployed();
	});


	it("Should set Deployer role successfully", async function () {

		//set deployer
		await rolesRegistry.setDeployer(deployer.address, true);

		expect(await rolesRegistry.isDeployer(deployer.address)).to.equal(true);

		expect(await rolesRegistry.isDeployer(configurator.address)).to.equal(false);

		expect(await rolesRegistry.isDeployer(approver.address)).to.equal(false);

	});

	it("Should set Approver role successfully", async function () {

		//set approver
		await rolesRegistry.setApprover(approver.address, true);

		expect(await rolesRegistry.isApprover(approver.address)).to.equal(true);

		expect(await rolesRegistry.isApprover(deployer.address)).to.equal(false);

		expect(await rolesRegistry.isApprover(configurator.address)).to.equal(false);

	});

	it("Should setConfigurator role successfully", async function () {

		//set approver
		await rolesRegistry.setConfigurator(configurator.address, true);

		expect(await rolesRegistry.isConfigurator(configurator.address)).to.equal(true);

		expect(await rolesRegistry.isConfigurator(deployer.address)).to.equal(false);

		expect(await rolesRegistry.isConfigurator(approver.address)).to.equal(false);


	});
});
