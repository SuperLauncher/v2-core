import { deployLibraries } from './../test/helpers/contracts-helpers';
import { ethers } from "hardhat";
import { ContractTransaction } from 'ethers';
import { BigNumber }  from "bignumber.js";

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

async function main() {
	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	var factoryAddress = "0xDd16d9901bdD57949ADF00781979bD2632bc5beD"
	const managerAddress = "0x0bBE4a04df17117e593eC34a04179Df435602A84";

	var token = "0xeC3773e6c5DA57A354e1886492172140d2B8205a"
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

	//const block = await ethers.provider.getBlock("latest");
	//console.log(block);

	const now =  new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60*4);
	const amstart = now;
	const amaEnd = now.plus(60*1);
	const startDateSub = amaEnd.plus(60 * 1);//new BigNumber("1631504733");
	const endDateSub = startDateSub.plus(60*10); //10 min

	const startDateBuy = endDateSub.plus(60*10);//10 min
	const privateIDO = 60 * 5;
	const publicIDO = 60 * 5;
	const endDateBuy = startDateBuy.plus(privateIDO + publicIDO);//10 min

	const liquidityTime = endDateBuy.plus(60 * 5);//5 min

	const designUnLockTime = endDateBuy.plus(60*8);//5 min
	const snapShotId = "6"

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
		[ethers.utils.parseEther('0.5').toString(), ethers.utils.parseEther('2').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000').toString(), //buyQuantity
		[snapShotId, ethers.utils.parseEther('0.1').toString(), ethers.utils.parseEther('0.15'), ethers.utils.parseEther('1').toString()],
		//snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('0.0001').toString(), ethers.utils.parseEther('0.5').toString()], //_buyLimits
		"0xbaC85Ff271b63737AFb763cE5a61b9c3d642c8F1",//bnb
		0
	));

	//setup setupWhitelistFcfs
	console.debug("setup setupWhitelistFcfs");
	await waitForTx(await myCampaign.setupWhitelistFcfs(privateIDO, 
	[
	ethers.utils.parseEther('0.01'), 
	ethers.utils.parseEther('0.02'),
	ethers.utils.parseEther('0.02')],
	
	[ethers.utils.parseEther('0.1'),
	 ethers.utils.parseEther('0.2'),
	 ethers.utils.parseEther('0.3')]));

	//setup setupVestingPeriods
	console.debug("setup setupVestingPeriods");
	await waitForTx (await myCampaign.setupVestingPeriods(
		1,//interval
		1,//interval
		designUnLockTime.toString(),//designUnLockTime
		[1000000], //investorLockPcnts
		[60 * 5], //investorLockDurations
		[1000000], //teamLockPcnts
		[60 * 5] //teamLockDurations
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