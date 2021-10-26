import { deployLibraries } from './../test/helpers/contracts-helpers';
import { ethers } from "hardhat";
import { ContractTransaction } from 'ethers';
import { BigNumber }  from "bignumber.js";

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

async function main() {
	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	var factoryAddress = "0x3bc01205100961d1D66673d5696C6EC35baD93f3"
	const managerAddress = "0xC2573be8218650A5d13dE9acC6e7b7628a39Cc2E";

	var token = "0x3e41a20C67d34A25F0b093E0FEF3dcdca1c8917e"
	const campaignOwner = "0xD507283f873837057Bc551aD9f46cbe60C8C79AA";

	const Manager = await ethers.getContractFactory("Manager");
	const manager = await Manager.attach(managerAddress);

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
	const factory = await Factory.attach(factoryAddress);

	const totalCampaign = await manager.getTotalCampaigns();
	// create campaign
	let ctx = await factory.createCampaign(totalCampaign, campaignOwner);
	await ctx.wait();

	const campaignInfo = await manager.getCampaignInfo(await manager.getTotalCampaigns());

	console.log("campaign deployed to:", campaignInfo[0]);
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

	const amstart = "1634738400";
	const amaEnd = "1634742000";
	const startDateSub = "1634824800";//new BigNumber("1631504733");
	const endDateSub = "1634907600"; //10 min

	const startDateBuy = "1634911200";//10 min
	const endDateBuy = "1634918400";

	const liquidityTime =  "1634920200";//5 min

	const designUnLockTime = "1634922000";//5 min
	const snapShotId = "1"

	console.log("done");
	console.debug("ama start: ", amstart.toString());
	console.debug("ama end: ", amaEnd.toString());
	console.debug("sub start: ", startDateSub.toString());
	console.debug("sub end: ", endDateSub.toString());
	console.debug("ido start: ", startDateBuy.toString());
	console.debug("ido end: ", endDateBuy.toString());
	console.debug("liquidityTime:  ", liquidityTime.toString());
	console.debug("designUnLockTime:  ", designUnLockTime.toString());
	
	await waitForTx(await myCampaign.initialize(
		token, //token
		[startDateSub.toString(), endDateSub.toString(), startDateBuy.toString(), endDateBuy.toString()], //dates
		[ethers.utils.parseEther('100000').toString(), ethers.utils.parseEther('200000').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000000').toString(), //buyQuantity
		[snapShotId, ethers.utils.parseEther('100').toString(), ethers.utils.parseEther('500'), ethers.utils.parseEther('3').toString()],
		//snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('10').toString(), ethers.utils.parseEther('1500').toString()], //_buyLimits
		"0x7861439745F137a4Ad01045A3482110573688692",//bnb
		50000
	));

	//setup setupWhitelistFcfs
	// console.debug("setup setupWhitelistFcfs");
	await waitForTx(await myCampaign.setupWhitelistFcfs("3600", 
	[
	ethers.utils.parseEther('500'), 
	ethers.utils.parseEther('3000')],
	
	[ethers.utils.parseEther('1000'),
	 ethers.utils.parseEther('5000')]));

	//setup setupVestingPeriods
	console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		1,//interval
		1,//interval
		designUnLockTime.toString(),//designUnLockTime
		[1000000], //investorLockPcnts
		[86400], //investorLockDurations
		[1000000], //teamLockPcnts
		[86400] //teamLockDurations
	));

	console.log("setup LP");
	await waitForTx(await myCampaign.setupLp(
		"1", //size
		"0", //sizeParam
		 "5000000000000000000", //rate
		 ["0"], //providers
		 ["1000000"],//splits
		 ["1000000"],//lockPcnts
		 ["86400"],//lockDurations
		 true
		 ));

	console.debug("approveConfig");
	await waitForTx (await myCampaign.approveConfig());

	console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();		

	await waitForTx(await tokenIns.mint( fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress,fundInAmt ));

	console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
  }
  
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});