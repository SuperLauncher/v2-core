import { deployLibraries } from './../test/helpers/contracts-helpers';
import { ethers } from "hardhat";
import { ContractTransaction } from 'ethers';
import { BigNumber } from "bignumber.js";

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

async function main() {
	const [generic, guaranteed, live, lottery, overSubscribe, lpProvision, vesting]
	= await deployLibraries();

	var factoryAddress = "0x5278F23d20Ec38858b3961503dA94090A7245E3f"
	const managerAddress = "0x754815fc857AC3F309185352E85Cd1dCD346b87e";

	var token = "0x7f036189460D4C7fB03A5d032Dc5bEe714605528"
	const campaignOwner = "0x3c16B4237EC2E06b2370Cf4C7a72F0e22d9cdBA3";

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
	const campaignAddress = campaignInfo[0];

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

	const now = new BigNumber(Math.round(new Date().getTime() / 1000).toString()).plus(60 * 2);
	const amstart = now;
	const amaEnd = now.plus(60 * 5);
	const startDateSub = amaEnd.plus(60 * 2);//new BigNumber("1631504733");
	const endDateSub = startDateSub.plus(60 * 15); //10 min

	const startDateBuy = endDateSub.plus(60 * 5);//10 min
	const privateIDO = 60 * 5;
	const publicIDO = 60 * 5;
	const endDateBuy = startDateBuy.plus(privateIDO + publicIDO);//10 min

	const liquidityTime = endDateBuy.plus(60 * 5);//5 min

	const designUnLockTime = endDateBuy.plus(60 * 9);//5 min
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
		[ethers.utils.parseEther('10000').toString(), ethers.utils.parseEther('200000').toString()], //softCap, hardCap
		ethers.utils.parseEther('1000000').toString(), //buyQuantity
		[snapShotId, ethers.utils.parseEther('200').toString(), ethers.utils.parseEther('400'), ethers.utils.parseEther('1').toString()],
		//snapShotId, minGuaranteedFloorAmt (in bnb), eggBurnForOverSubscribe (in egg)
		[ethers.utils.parseEther('1500').toString(), ethers.utils.parseEther('5000').toString()], //_buyLimits
		"0x7861439745F137a4Ad01045A3482110573688692",//bnb
		0
	));

	//setup setupWhitelistFcfs
	console.debug("setup setupWhitelistFcfs");
	await waitForTx(await myCampaign.setupWhitelistFcfs(privateIDO, 
		[
		ethers.utils.parseEther('100'), 
		ethers.utils.parseEther('200'),
		ethers.utils.parseEther('500')],
		
		[ethers.utils.parseEther('3000'),
		 ethers.utils.parseEther('4000'),
		 ethers.utils.parseEther('5000')]));

	//setup setupVestingPeriods
	console.debug("setup setupVestingPeriods");
	await waitForTx(await myCampaign.setupVestingPeriods(
		0,//interval
		0,//interval
		designUnLockTime.toString(),//designUnLockTime
		[1000000],// 87500, 87500, 87500, 87500, 87500, 87500, 87500, 87500], //investorLockPcnts
		[0],// 300, 600, 900, 1200, 1500, 1800, 2100, 2400], //investorLockDurations
		[1000000],// 87500, 87500, 87500, 87500, 87500, 87500, 87500, 87500], //teamLockPcnts
		[0],// 300, 600, 900, 1200, 1500, 1800, 2100, 2400] //teamLockDurations
	));

	console.log("setup LP");
	await waitForTx(await myCampaign.setupLp(
		"1", //size
		"0", //sizeParam
		 "200000000000000000000", //rate
		 ["0"], //providers
		 ["1000000"],//splits
		 ["1000000"],//lockPcnts
		 ["600"],//lockDurations
		 false
		 ));


	console.debug("approveConfig");
	await waitForTx(await myCampaign.approveConfig());

	console.debug("finalize");
	await waitForTx(await myCampaign.finalize());

	console.debug("Mint token");
	// fund in
	const MintableToken = await ethers.getContractFactory("MintableToken");
	const tokenIns = await MintableToken.attach(token);
	//mint
	const fundInAmt = await myCampaign.getFundInTokenRequired();

	await waitForTx(await tokenIns.mint(fundInAmt));

	await waitForTx(await tokenIns.approve(campaignAddress, fundInAmt));

	console.debug("Fund in");
	await waitForTx(await myCampaign.fundIn(fundInAmt));
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});