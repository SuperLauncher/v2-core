import { Factory } from './../../types/Factory.d';
import { MintableToken } from './../../types/MintableToken.d';
import { deploySVLaunch, deployEgg, deployRole, deployManager, deployMintableToken, deployFactory } from './contracts-helpers';
import { evmRevert, evmSnapshot, DRE, waitForTx } from './misc-utils';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { EggV2 } from '../../types/EggV2';
import { V2SvL } from '../../types/V2SvL';
import { Manager } from '../../types/Manager';
import { RolesRegistry } from '../../types/RolesRegistry';
import { tEthereumAddress } from './types';

export interface SignerWithAddress {
	signer: Signer;
	address: tEthereumAddress;
}
export interface TestEnv {
	admin: Signer,
	deployer: Signer,
	approver: Signer,
	configurator: Signer,
	users: SignerWithAddress[],
	feeVault: tEthereumAddress,
	svLaunch: V2SvL,
	eggV2: EggV2,
	manager: Manager,
	role: RolesRegistry,
	BUSD: MintableToken,
	USDT: MintableToken,
	BTC: MintableToken,
	factory: Factory,
	XYX: MintableToken,
	Token9dp: MintableToken,
}

const testEnv: TestEnv = {
	admin: {} as Signer,
	deployer: {} as Signer,
	approver: {} as Signer,
	configurator: {} as Signer,
	users: [] as SignerWithAddress[],
	feeVault: {} as tEthereumAddress,
	svLaunch: {} as V2SvL,
	eggV2: {} as EggV2,
	manager: {} as Manager,
	role: {} as RolesRegistry,
	BUSD: {} as MintableToken,
	USDT: {} as MintableToken,
	BTC: {} as MintableToken,
	factory: {} as Factory,
	XYX: {} as MintableToken,
	Token9dp: {} as MintableToken,
	busd: {} as MintableToken,
} as TestEnv;

let buidlerevmSnapshotId: string = '0x1';
const setBuidlerevmSnapshotId = (id: string) => {
	//if (DRE.network.name === 'hardhat') {
	buidlerevmSnapshotId = id;
	//}
};


export async function initializeMakeSuite() {
	const [admin, deployer, configurator, approver, feeVault, ...restSigners] = await ethers.getSigners();

	testEnv.admin = admin;
	testEnv.deployer = deployer;
	testEnv.approver = approver;
	testEnv.configurator = configurator;

	const svLaunch = await deploySVLaunch();
	testEnv.svLaunch = svLaunch;

	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[0].address, ethers.utils.parseEther('10000'))
	);
	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[1].address, ethers.utils.parseEther('5000'))
	);
	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[2].address, ethers.utils.parseEther('2000'))
	);
	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[3].address, ethers.utils.parseEther('100')));
	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[4].address, ethers.utils.parseEther('100')));
	await waitForTx(
		await svLaunch.connect(admin).transfer(restSigners[5].address, ethers.utils.parseEther('100')));
	// await svLaunch.connect(admin).transfer(restSigners[6].address, ethers.utils.parseEther('100'));
	// await svLaunch.connect(admin).transfer(restSigners[7].address, ethers.utils.parseEther('100'));
	// await svLaunch.connect(admin).transfer(restSigners[8].address, ethers.utils.parseEther('100'));
	await waitForTx(
		await svLaunch.snapshot());

	const eggV2 = await deployEgg();
	testEnv.eggV2 = eggV2;

	// await eggV2.connect(admin).transfer(restSigners[1].address,ethers.utils.parseEther('1000') );
	// await eggV2.connect(admin).transfer(restSigners[2].address,ethers.utils.parseEther('1000') );
	// await eggV2.connect(admin).transfer(restSigners[3].address,ethers.utils.parseEther('1000') );
	// await eggV2.connect(admin).transfer(restSigners[4].address,ethers.utils.parseEther('1000') );

	const role = await deployRole();

	await waitForTx(
		await role.setDeployer(deployer.address, true));
	await waitForTx(
		await role.setDeployer(admin.address, true));
	await waitForTx(
		await role.setConfigurator(configurator.address, true));
	await waitForTx(
		await role.setConfigurator(admin.address, true));
	await waitForTx(
		await role.setApprover(approver.address, true));
	await waitForTx(
		await role.setApprover(admin.address, true));
	testEnv.role = role;

	testEnv.feeVault = feeVault.address;

	for (const signer of restSigners) {
		testEnv.users.push({
			signer,
			address: await signer.getAddress(),
		});
	}

	const manager = await deployManager(
		svLaunch.address,
		eggV2.address,
		testEnv.feeVault,
		role.address
	);
	testEnv.manager = manager;
	//deploy currencies
	const busd = await deployMintableToken("BUSD", "BUSD", "18");
	const usdt = await deployMintableToken("USDT", "USDT", "18");
	const btc = await deployMintableToken("BTC", "BTC", "18");
	await manager.addCurrency(
		["0x0000000000000000000000000000000000000000", busd.address, usdt.address, btc.address]
	);

	await waitForTx(
		await manager.setLpProvider(0, "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc"));
	await waitForTx(
		await manager.setLpProvider(1, "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc"));
	await waitForTx(
		await manager.setLpProvider(2, "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3", "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc"));

	testEnv.BUSD = busd;

	const factory = await deployFactory(manager.address, role.address);
	testEnv.factory = factory as Factory;
	await waitForTx(
		await manager.registerFactory(factory.address));

	testEnv.XYX = await deployMintableToken("XYX", "XYX", "18");
	testEnv.Token9dp = await deployMintableToken("Token9dp", "Token9dp", "9");

	//console.log("initializeMakeSuite complete");
}


export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
	describe(name, () => {
		before(async () => {
			setBuidlerevmSnapshotId(await evmSnapshot());
		});
		tests(testEnv);
		after(async () => {
			await evmRevert(buidlerevmSnapshotId);
		});
	});
}
