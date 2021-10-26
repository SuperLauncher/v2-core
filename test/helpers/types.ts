import BigNumber from 'bignumber.js';


export enum eContractid {
	Utils = 'Utils',
	SvLaunch = 'V2SvL',
	V2Egg = 'EggV2',
	RolesRegistry = 'RolesRegistry',
	Manager = 'Manager',
	Role = 'RolesRegistry'
}

export const BNB = "0x0000000000000000000000000000000000000000";

export type tEthereumAddress = string;
export type tStringTokenBigUnits = string; // 1 ETH, or 10e6 USDC or 10e18 DAI
export type tBigNumberTokenBigUnits = BigNumber;
// 1 wei, or 1 basic unit of USDC, or 1 basic unit of DAI
export type tStringTokenSmallUnits = string;
export type tBigNumberTokenSmallUnits = BigNumber;

export enum Code {
	ValidationError,
	NoBasicSetup,
	UnApprovedConfig,
	InvalidCurrency,
	AlreadySubscribed,
	AlreadyCalledFinishUp,
	AlreadyCreated,
	AlreadyClaimed,
	AlreadyExist,
	InvalidIndex,
	InvalidAmount,
	InvalidAddress,
	InvalidArray,
	InvalidFee,
	InvalidRange,
	CannotInitialize,
	CannotConfigure,
	CannotCreateLp,
	CannotBuyToken,
	CannotRefundExcess,
	CannotReturnFund,
	NoRights,
	IdoNotEndedYet,
	SoftCapNotMet,
	SingleItemRequired,
	ClaimFailed,
	WrongValue,
	NotReady,
	NotEnabled,
	NotWhitelisted,
	ValueExceeded,
	LpNotCreated,
	Aborted
}

export enum Period {
	None,
	Setup,
	Subscription,
	IdoWhitelisted,
	IdoPublic,
	IdoEnded
}
export enum StateOk {
	BasicSetup,
	Config,
	Finalized,
	FundedIn,
	Tally,
	FinishedUp,
	LpCreated
}

export interface ILpProvision{
	size: string;
	sizeParam: string;
	rate: string;
	providers: string[];
	splits: string[];
	lockPcnts: string[];
	lockDurations: string[];
	swapToBNBLP: boolean;
}