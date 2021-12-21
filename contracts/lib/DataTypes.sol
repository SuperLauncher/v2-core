// SPDX-License-Identifier: BUSL-1.1


pragma solidity 0.8.10;

library DataTypes {
    
    uint public constant LUT_SIZE = 9; // Lookup Table size
     
    struct Store {
        Data data;
        
        uint state; // Bitmask of bool //
        FinalState finalState; // only valid after FinishUp is called
        
        Subscriptions subscriptions;
        Guaranteed guaranteed;
        Lottery lottery;
        OverSubscriptions overSubscription;
        Live live;
        Vesting vesting;
        Lp lp;
        History history;
        
        ReturnFunds returnFunds; // When IDO did not meet softCap 
    }
    
     // Data //
    struct Data {
        address token; // The IDO token
        uint subStart; // Subscription Starts
        uint subEnd;   // Subscription Ends
        uint idoStart; // Ido Starts
        uint idoEnd;   // Ido Ends
        uint softCap;  // Unit in currency
        uint hardCap;  // Unit in currency
        uint tokenSalesQty; // Total tokens for sales
        uint minBuyLimitPublic; // min and max buy limit for Public open sales (after subscription). Unit in currency.
        uint maxBuyLimitPublic; // Unit in currency
        uint snapShotId;    // SnapshotId
        address currency; // The raised currency
        address svLaunchAddress;
        address eggAddress;
        
        uint feePcnt; // In 1e6
        
        // Cache
        uint tokensPerCapital;
    }
    
    // Subscription
    struct SubscriptionResultParams {
        bool resultAvailable;
        bool guaranteed;
        uint guaranteedAmount;
        bool wonLottery;
        uint lotteryAmount;
        bool wonOverSub;
        uint overSubAmount;
        uint priority;
        uint eggBurnAmount;
    }
    
    struct SubscriptionParams {
        bool guaranteed;
        uint guaranteedAmount;
        bool inLottery;
        uint lotteryAmount;
        uint overSubAmount;
        uint priority;
        uint eggBurnAmount;
    }
    
    struct SubItem {
        uint paidCapital; // Unit in currency
        bool refundedUnusedCapital; // Has user gets back his un-used capital ?
    }

    struct Subscriptions {
        mapping(address=> DataTypes.SubItem)  items;
        uint count;
    }
    
    struct Guaranteed {
        mapping(address=> uint) subscribedAmount;
        
        uint svLaunchSupplyAtSnapShot;
        uint totalSubscribed; // Unit in currency.
    }

    // Lottery Info
    struct LotteryItem {
        uint index;       
        bool exist;    
    }
  
    struct TallyLotteryResult {
        uint numWinners;
        uint leftOverAmount;
        uint winnerStartIndex;
    }

    struct TallyLotteryRandom {
        bool initialized;
        uint requestTime;
        uint value;
        bool valid;
    }
    
    struct LotteryData {
        uint totalAllocatedAmount; // Unit in currency.
        uint eachAllocationAmount; // Unit in currency.
        bool tallyCompleted;
    }
    struct Lottery {
        mapping(address=>LotteryItem) items;
        uint count;
        
        LotteryData data;
        TallyLotteryRandom random;
        TallyLotteryResult result;
    }

    // Over Subscription
    struct TallyOverSubResult {
        bool tallyCompleted;
        uint winningBucket;
        uint firstLoserIndex;
        uint leftOverAmount;
        uint burnableEggs;
    }

    struct OverSubItem {
        uint amount;        // Amount of over-subscribe tokens. Max is 0.5% of total sales qty.
        uint priority;      // 0 - 100
        uint index;
        uint cumulativeEggBurn; // Cummulative amount of egg burns in the bucket that this user belongs to. As each items is pushed into the array,
                                // this cummulative value increases.
    }

    struct Bucket {
        address[] users;    // This is users address, secondary priority is FCFS
        uint total;         // Precalculated total for optimization.
        uint totalEggs;     // Precalculated total Eggs for optimization.
        
        // Quick lookup-table for pre-calculated total at specific intervals 
        uint[][LUT_SIZE] fastLookUp; // Provide a fast look-up of the total amount at specific indices. 10s, 100s, 1000s, 10,000s, 100,000s, 1,000,000s
    }
    
    struct OverSubscriptions {
        mapping(address=> OverSubItem) items;
        mapping(uint => Bucket) buckets; // 0-100 buckets of address[]

        OverSubData data;

        uint allocatedAmount;
        uint totalOverSubAmount;  // Keep tracks of the total over-subscribed amount
        uint totalMaxBurnableEggs;  // Keep track of the total egg burns amount
        
        TallyOverSubResult result;
    }
    
    struct OverSubData {
        uint stdOverSubQty; // Unit in currency
        uint stdEggBurnQty; // Unit in Egg
    }
    
    struct Live {
        
        LiveData data;
        
        uint allocLeftAtOpen; // This is the amount of allocation (in Currency unit) remaining at Live opening (after subscription)
        uint allocSoldInLiveSoFar; // This is the amount of allocation (in Currency unit) sold in Live, so far.
        
        mapping(uint=>mapping(address=>bool)) whitelistMap;
         
         // Record of user's purchases 
        mapping(address=>uint)  whitelistPurchases; // record of sales in whitelist round 
        mapping(address=>uint)  publicPurchases;    // record of sales in publc round 
    }
    
    // Live: Tier system for Whitelist FCFS
    struct Tier {
        uint minBuyAmount;
        uint maxBuyAmount; 
    }
    
    struct LiveData {
        uint whitelistFcfsDuration; // 0 if whitelist is not turned on
        Tier[] tiers; // if has at least 1 tier, then the WhitelistFcfs is enabled 
    }
    
    struct LockInfo {
        uint[] pcnts;
        uint[] durations;
        DataTypes.VestingReleaseType releaseType;
    }
    
    struct ClaimInfo {
        bool[] claimed;
        uint amount;
    }
    
    struct ClaimRecords {
        mapping(address=>ClaimInfo) investors;
        mapping(address=>ClaimInfo) team;
    }
    
    struct Vesting {
       VestData data;
        ClaimRecords claims;
    }
    
    struct VestData {
        LockInfo    investorsLock;
        LockInfo    teamLock;
        uint        teamLockAmount; // Total vested amount
        uint desiredUnlockTime;
    }
    
    struct ClaimIntervalResult {
        uint claimedSoFar;
        uint claimable;
        uint nextLockedAmount;
        uint claimStartIndex;
        uint numClaimableSlots;
        uint nextUnlockIndex;
        uint nextUnlockTime;
    }
    
    struct ClaimLinearResult {
        uint claimedSoFar;
        uint claimable;
        uint lockedAmount;
        uint newStartTime;
        uint endTime;
    }
    
    struct ReturnFunds {
        mapping(address=>uint)  amount;
    }
    
    struct PurchaseDetail {
        uint guaranteedAmount;
        uint lotteryAmount;
        uint overSubscribeAmount;
        uint liveWlFcfsAmount;
        uint livePublicAmount;
        uint total;
        bool hasReturnedFund;
    }
    
    // LP 
    struct Lp {
        LpData data;
        LpLocks locks;
        LpResult result;
        bool enabled;

        LpSwap swap;
    }
    struct LpData {
        DataTypes.LpSize  size;
        uint sizeParam;
        uint rate;
        uint softCap;
        uint hardCap;
       
        // DEX routers and factory
        address[] routers;
        address[] factory;
        
        uint[] splits;
        address tokenA;
        address currency; // The raised currency 
    }
    
    struct LpLocks {
        uint[]  pcnts;
        uint[]  durations;
        uint    startTime;
    }
    
    struct LpResult {
        uint[] tokenAmountUsed;
        uint[] currencyAmountUsed;
        uint[] lpTokenAmount;
        bool[] claimed;
        bool created;
    }
    
    struct LpSwap {
       bool needSwap;
       bool swapped;
       uint newCurrencyAmount;
    }
    
    // History
    enum ActionType {
        FundIn,
        FundOut,
        Subscribe,
        RefundExcess,
        BuyTokens,
        ReturnFund,
        ClaimTokens,
        ClaimFund,
        ClaimLp
    }
    
    struct Action {
        uint128     actionType;
        uint128     time;
        uint256     data1;
        uint256     data2;
    }
   
    struct History {
        mapping(address=>Action[]) investor;
        mapping(address=>Action[]) campaignOwner;
    }
    
    // ENUMS
    enum Ok {
        BasicSetup,
        Config,
        Finalized,
        FundedIn,
        Tally,
        FinishedUp,
        LpCreated
    }
    
    enum FinalState {
        Invalid,
        Success, // met soft cap
        Failure, // did not meet soft cap
        Aborted  // when a campaign is cancelled
    }
    
    enum LpProvider {
        PancakeSwap,
        ApeSwap,
        WaultFinance
    }
    
    enum FundType {
        Currency,
        Token,
        WBnb,
        Egg
    }
    
    enum LpSize {
        Zero,       // No Lp provision
        Min,        // SoftCap
        Max,        // As much as we can raise above soft-cap. It can be from soft-cap all the way until hard-cap
        MaxCapped   // As much as we can raise above soft-cap, but capped at a % of hardcap. Eg 90% of hardcap.
    }
    
    enum VestingReleaseType {
        ByIntervals,
        ByLinearContinuous
    }
    
    // Period according to timeline
    enum Period {
        None,
        Setup,
        Subscription,
        IdoWhitelisted,
        IdoPublic,
        IdoEnded
    }
}


    