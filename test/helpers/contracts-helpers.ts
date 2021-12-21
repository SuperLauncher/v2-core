import { Factory } from './../../types/Factory.d';
import { waitForTx, parseTokenWithDP } from './misc-utils';
import { MintableToken } from './../../types/MintableToken.d';
import { BigNumber } from 'bignumber.js';
import { RolesRegistry } from './../../types/RolesRegistry.d';
import { Manager } from './../../types/Manager.d';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { V2SvL } from '../../types/V2SvL';
import { EggV2 } from '../../types/EggV2';
import { eContractid, tEthereumAddress, ILpProvision } from './types';
import { MockRandomProvider } from '../../types/MockRandomProvider';

export const deployContract = async <ContractType extends Contract>(
	contractName: string,
	args: any[],
	slug: string = '',
	signer?: Signer
): Promise<ContractType> => {
	const contract = (await (await ethers.getContractFactory(contractName, signer)).deploy(
		...args
	)) as ContractType;

	return contract;
};

export const deployMintableToken = async (name: string, symbol: string, dp: string) => {
	const args: string[] = [
		name,
		symbol,
		dp,
	];
	const instance = await deployContract<MintableToken>("MintableToken", args);
	return instance;
}


export const deploySVLaunch = async () => {
	const instance = await deployContract<V2SvL>(eContractid.SvLaunch, []);
	return instance;
}

export const deployEgg = async () => {
	const instance = await deployContract<EggV2>(eContractid.V2Egg, []);
	return instance;
}

export const deployRole = async () => {
	const instance = await deployContract<RolesRegistry>(eContractid.Role, []);
	return instance;
}

export const deployMockRandomProvider = async (manager: tEthereumAddress) => {
	const args: string[] = [
		manager,
	];
	const instance = await deployContract<MockRandomProvider>("MockRandomProvider", args);
	return instance;
}

export const deployManager = async (
	svLaunchAddress: tEthereumAddress,
	eggAddress: tEthereumAddress,
	feeVault: tEthereumAddress,
	rolesRegistry: tEthereumAddress
) => {
	const args: string[] = [
		svLaunchAddress,
		eggAddress,
		feeVault,
		rolesRegistry,
	];
	const instance = await deployContract<Manager>(eContractid.Manager, args);
	return instance;
}

export const deployLibraries= async () => {
	const Guaranteed = await ethers.getContractFactory("Guaranteed", {
		libraries: {
			// Utils: utils.address,
		},
	});
	const guaranteed = await Guaranteed.deploy();
	await guaranteed.deployed();

	const Live = await ethers.getContractFactory("Live", {
		libraries: {
			// Utils: utils.address,
		},
	});
	const live = await Live.deploy();
	await live.deployed();

	const Lottery = await ethers.getContractFactory("Lottery", {
		libraries: {
			// Utils: utils.address,
		},
	});
	const lottery = await Lottery.deploy();
	await lottery.deployed();

	const OverSubscribe = await ethers.getContractFactory("OverSubscribe");
	const overSubscribe = await OverSubscribe.deploy();
	await overSubscribe.deployed();

	const Generic = await ethers.getContractFactory("Generic", {
		libraries: {
			//  // Guaranteed: guaranteed.address,
			 Lottery: lottery.address,
			 OverSubscribe: overSubscribe.address,
		},
	});

	const generic = await Generic.deploy();
	await generic.deployed();

	const LpProvision = await ethers.getContractFactory("LpProvision");
	const lpProvision = await LpProvision.deploy();
	await lpProvision.deployed();

	const Vesting = await ethers.getContractFactory("Vesting", {
		libraries: {
			// Utils: utils.address,
		},
	});
	const vesting = await Vesting.deploy();
	await vesting.deployed();

	return [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
}


export const deployFactory = async (
	manager: tEthereumAddress, role: tEthereumAddress) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	const Factory = await ethers.getContractFactory("Factory", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	const factory = await Factory.deploy(manager);
	const instance = await factory.deployed();
	await waitForTx(instance.deployTransaction);

	return instance;
}

export const deployCampaignInterval = async (
	manager: Manager,deployer: Signer,
	 factory: Factory, index: number, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string, currencyAddress: tEthereumAddress) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
		= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();
	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	//console.log("campaign deployed to:", campaignInfo[0]);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	//const block = await ethers.provider.getBlock("latest");
	////console.log(block);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//new BigNumber("1631504733");
	const endDateSub = startDateSub.plus(60*1); //1 min

	const startDateBuy = endDateSub.plus(60*1);//1 min
	const endDateBuy = startDateBuy.plus(60*2);//1 min
	const designUnLockTime = endDateBuy.plus(60*1);//1 min

	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('10').toString()], //softCap, hardCap
		 "1000000000000000000000", //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.05'),ethers.utils.parseEther('0.05'), ethers.utils.parseEther('100')], 
		//snapShotId, minGuaranteedFloorAmt, stdOverSub, eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('1').toString()], //_buyLimits
		currencyAddress,//currency
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "300"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}

export const deployCampaignIntervalLinear = async (
	manager: Manager,deployer: Signer,
	 factory: Factory, index: number, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();
	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	//console.log("campaign deployed to:", campaignInfo[0]);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//1
	const endDateSub = startDateSub.plus(60*2); //3 min

	const startDateBuy = endDateSub.plus(60*2);//5 min
	const endDateBuy = startDateBuy.plus(60*2);//6 min
	const designUnLockTime = endDateBuy.plus(60*5);//1 min
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('10').toString()], //softCap, hardCap
		 "1000000000000000000000", //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.05'), ethers.utils.parseEther('0.05'), ethers.utils.parseEther('100')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('2').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		1,//interval
		1,//interval
		designUnLockTime.toString(),//designUnLockTime
		[1000000], //investorLockPcnts
		[900], //investorLockDurations
		[1000000], //teamLockPcnts
		[900] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}


export const deployTestGuarantee = async (
	managerAdd: tEthereumAddress,
	 factory: Factory, index: number, owner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

	await factory.createCampaign(index, owner);

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	const TestGuaranteed = await ethers.getContractFactory("TestGuaranteed", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
		},
	});


	const Manager = await ethers.getContractFactory("Manager");
	const manager = await Manager.attach(managerAdd);

	const myCampaign = await TestGuaranteed.deploy(manager.address );

	const block = await ethers.provider.getBlock("latest");

	const now = new BigNumber(block.timestamp).plus(120);
	const startDateSub = now;
	const endDateSub = startDateSub.plus(60); //1 min

	const startDateBuy = endDateSub.plus(60);//1 min
	const endDateBuy = startDateBuy.plus(60);//1 min

	await waitForTx( await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(),
		startDateBuy.toString(), endDateBuy.toString()],//dates
		[ethers.utils.parseEther('1').toString(), ethers.utils.parseEther('300').toString()], //softCap, hardCap
		ethers.utils.parseEther('100000').toString(), //buyQuantity
		[snapshotId,ethers.utils.parseEther('0.1'), ethers.utils.parseEther('1.5'), ethers.utils.parseEther('180')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(),ethers.utils.parseEther('1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	));

	return myCampaign;
}

export const deployTestOverSub = async (
	managerAdd: tEthereumAddress,
	 factory: Factory, index: number, owner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

	await factory.createCampaign(index, owner);

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	const TestOverSubscribe = await ethers.getContractFactory("TestOverSubscribe", {
		libraries: {
			Generic: generic.address,
			OverSubscribe: overSubscribe.address,
		},
	});


	const Manager = await ethers.getContractFactory("Manager");
	const manager = await Manager.attach(managerAdd);

	const myCampaign = await TestOverSubscribe.deploy(manager.address );

	const block = await ethers.provider.getBlock("latest");

	const now = new BigNumber(block.timestamp).plus(120);
	const startDateSub = now;
	const endDateSub = startDateSub.plus(60); //1 min

	const startDateBuy = endDateSub.plus(60);//1 min
	const endDateBuy = startDateBuy.plus(60);//1 min

	const ctx = await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(),
		startDateBuy.toString(), endDateBuy.toString()],//dates
		[ethers.utils.parseEther('1').toString(), ethers.utils.parseEther('300').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapshotId,ethers.utils.parseEther('0.1'),ethers.utils.parseEther('1.5'), ethers.utils.parseEther('180').toString()],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(),ethers.utils.parseEther('1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	);
	await ctx.wait();

	return myCampaign;
}

export const deployTestLoterry = async (
	managerAdd: tEthereumAddress,
	 factory: Factory, index: number, owner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

	await factory.createCampaign(index, owner);

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	const TestLottery = await ethers.getContractFactory("TestLottery", {
		libraries: {
			Generic: generic.address,
			Lottery: lottery.address,
			// Guaranteed: guaranteed.address,
			OverSubscribe: overSubscribe.address,
		},
	});


	const Manager = await ethers.getContractFactory("Manager");
	const manager = await Manager.attach(managerAdd);

	const myCampaign = await TestLottery.deploy(manager.address );

	const block = await ethers.provider.getBlock("latest");

	const now = new BigNumber(block.timestamp).plus(120);
	const startDateSub = now;
	const endDateSub = startDateSub.plus(60); //1 min

	const startDateBuy = endDateSub.plus(60);//1 min
	const endDateBuy = startDateBuy.plus(60);//1 min

	const ctx = await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(),
		startDateBuy.toString(), endDateBuy.toString()],//dates
		[ethers.utils.parseEther('1').toString(), ethers.utils.parseEther('300').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapshotId,ethers.utils.parseEther('0.1'),ethers.utils.parseEther('1.5'), ethers.utils.parseEther('180')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(),ethers.utils.parseEther('1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	);
	await ctx.wait();

	return myCampaign;
}

export const deployCampaignGeneric= async (
	manager: Manager,deployer: Signer,
	 factory: Factory, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();

	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	//console.log("campaign deployed to:", campaignInfo[0]);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	//const block = await ethers.provider.getBlock("latest");
	////console.log(block);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1); //60
	const endDateSub = startDateSub.plus(60*1); //120

	const startDateBuy = endDateSub.plus(60*1);//180
	const endDateBuy = startDateBuy.plus(60*2);//180 + 60*2
	const designUnLockTime = endDateBuy.plus(60*1);//180 + 60*2 + 60
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('300').toString()], //softCap, hardCap
		 "1000000000000000000000", //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.1'),ethers.utils.parseEther('1.5'), ethers.utils.parseEther('100')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "300"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}

export const deployCampaignRefund= async (
	manager: Manager,deployer: Signer,
	 factory: Factory, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string, currencyAddress: tEthereumAddress) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();

	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	//console.log("campaign deployed to:", campaignInfo[0]);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);
	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//new BigNumber("1631504733");
	const endDateSub = startDateSub.plus(60*1); //1 min

	const startDateBuy = endDateSub.plus(60*1);//1 min
	const endDateBuy = startDateBuy.plus(60*2);//1 min
	const designUnLockTime = endDateBuy.plus(60*1);//1 min
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('6').toString(),ethers.utils.parseEther('300').toString()], //softCap, hardCap
		 "1000000000000000000000", //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.1'),ethers.utils.parseEther('1.5'), ethers.utils.parseEther('100')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('1').toString()], //_buyLimits
		currencyAddress,//currency
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "300"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}

export const deployCampaignLottery= async (
	manager: Manager,deployer: Signer,
	 factory: Factory, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();

	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//60
	const endDateSub = startDateSub.plus(60*2); //180

	const startDateBuy = endDateSub.plus(60*2);//300
	const endDateBuy = startDateBuy.plus(60*2);//420
	const designUnLockTime = endDateBuy.plus(60*1);//1 min
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('0.5').toString(), ethers.utils.parseEther('1').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.3').toString(), ethers.utils.parseEther('0.35'), ethers.utils.parseEther('1').toString()],
		//snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.05').toString(), ethers.utils.parseEther('0.1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "300"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}


export const deployCampaignWith9DPToken= async (
	manager: Manager,deployer: Signer,
	 factory: Factory, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string) => {

	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();

	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	//console.log("campaign deployed to:", campaignInfo[0]);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amastart = now;
	const amaEnd = amastart.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);
	const endDateSub = startDateSub.plus(60*1); //1 min

	const startDateBuy = endDateSub.plus(60*1);//1 min
	const endDateBuy = startDateBuy.plus(60*2);//1 min
	const designUnLockTime = endDateBuy.plus(60*1);//1 min
	
	//console.log("Token: ",parseTokenWithDP("1000000", 9).toString() );
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('10').toString()], //softCap, hardCap
		parseTokenWithDP("1000000", 9).toString(), //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.1'),ethers.utils.parseEther('0.05'), ethers.utils.parseEther('1')],
		 //snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('1').toString()], //_buyLimits
		"0x0000000000000000000000000000000000000000",//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "600"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "600"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}

export const deployCampaignSingleClaim = async (
	manager: Manager,deployer: Signer,
	 factory: Factory, index: number, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string, currencyAddress: tEthereumAddress) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
		= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();
	const campaignInfo = await manager.getCampaignInfo(totalCampaign);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);
	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);
	const endDateSub = startDateSub.plus(60*1); //1 min

	const startDateBuy = endDateSub.plus(60*1);//1 min
	const endDateBuy = startDateBuy.plus(60*2);//1 min
	const designUnLockTime = endDateBuy.plus(60*1);//1 min

	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('10').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.05'),ethers.utils.parseEther('0.05'), ethers.utils.parseEther('100')], 
		//snapShotId, minGuaranteedFloorAmt, stdOverSub, eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('1').toString()], //_buyLimits
		currencyAddress,//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["1000000"], //investorLockPcnts
		["0"], //investorLockDurations
		["1000000"], //teamLockPcnts
		["0"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}

export const deployCampaignLP = async (
	manager: Manager,
	deployer: Signer,
	 factory: Factory, 
	 campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, 
	 snapshotId: string, 
	 currencyAddress: tEthereumAddress,
	 iLpProvision: ILpProvision,
	fee: string) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
		= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();
	const campaignInfo = await manager.getCampaignInfo(totalCampaign);
	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//new BigNumber("1631504733");
	const endDateSub = startDateSub.plus(60*1); //1 min

	const startDateBuy = endDateSub.plus(60*1);//1 min
	const endDateBuy = startDateBuy.plus(60*2);//1 min
	const designUnLockTime = endDateBuy.plus(60*1);//1 min

	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(),ethers.utils.parseEther('10').toString()], //softCap, hardCap
		 "1000000000000000000000", //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.05'),ethers.utils.parseEther('0.05'), ethers.utils.parseEther('100')], 
		//snapShotId, minGuaranteedFloorAmt, stdOverSub, eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('1').toString(), ethers.utils.parseEther('5').toString()], //_buyLimits
		currencyAddress,//currency
		fee
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["1000000" ], //teamLockPcnts
		["0"] //teamLockDurations
	));

	console.log("setup LP");
	await waitForTx(await myCampaign.setupLp(
		iLpProvision.size, //size
		iLpProvision.sizeParam, //sizeParam
		iLpProvision.rate, //rate
		iLpProvision.providers, //providers
		iLpProvision.splits,//splits
		iLpProvision.lockPcnts,//lockPcnts
		iLpProvision.lockDurations,//lockDurations
		iLpProvision.swapToBNBLP
		 ));


	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}


export const deployCampaignLottery2= async (
	manager: Manager,deployer: Signer,
	 factory: Factory, campaignOwner: tEthereumAddress, 
	 token: tEthereumAddress, snapshotId: string, currency: tEthereumAddress,) => {

		const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	let totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.connect(deployer).createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	totalCampaign = await manager.getTotalCampaigns();

	const campaignInfo = await manager.getCampaignInfo(totalCampaign);

	const campaignAddress =  campaignInfo[0];

	const Campaign = await ethers.getContractFactory("Campaign", {
		libraries: {
			Generic: generic.address,
			// Guaranteed: guaranteed.address,
			Live: live.address,
			Lottery: lottery.address,
			OverSubscribe: overSubscribe.address,
			LpProvision: lpProvision.address,
			Vesting: vesting.address,
			// History: history.address,
		},
	});
	
	const myCampaign = await Campaign.attach(campaignInfo[0]);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*0);
	const amstart = now;
	const amaEnd = now.plus(60*0);
	const startDateSub = amaEnd.plus(60 * 1);//60
	const endDateSub = startDateSub.plus(60*2); //180

	const startDateBuy = endDateSub.plus(60*2);//300
	const endDateBuy = startDateBuy.plus(60*2);//420
	const designUnLockTime = endDateBuy.plus(60*1);//1 min
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('1').toString(), ethers.utils.parseEther('2').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapshotId, ethers.utils.parseEther('0.3').toString(), ethers.utils.parseEther('0.4'), ethers.utils.parseEther('1').toString()],
		//snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.05').toString(), ethers.utils.parseEther('0.5').toString()], //_buyLimits
		currency,//bnb
		0
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx (await myCampaign.setupWhitelistFcfs(60*1, [ethers.utils.parseEther('0.1')], [ethers.utils.parseEther('1')]));

	//setup setupVestingPeriods
	// console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		["340000", "330000","330000" ], //investorLockPcnts
		["0", "300", "300"], //investorLockDurations
		["340000", "330000","330000" ], //teamLockPcnts
		["0", "300", "300"] //teamLockDurations
	));

	// console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	// console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	// console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	// console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
	return myCampaign;
}
