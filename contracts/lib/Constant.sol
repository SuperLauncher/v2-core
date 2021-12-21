// SPDX-License-Identifier: BUSL-1.1


pragma solidity 0.8.10;

library Constant {

    uint    public constant FACTORY_VERSION = 1;
    address public constant ZERO_ADDRESS    = address(0);
    
    string public constant  BNB_NAME        = "BNB";
    uint    public constant VALUE_E18       = 1e18;
    uint    public constant VALUE_10K       = 10_000e18;
    uint    public constant VALUE_100       = 100e18;
    uint    public constant PCNT_100        = 1e6;
    uint    public constant PCNT_10         = 1e5;
    uint    public constant PCNT_50         = 5e5;
    uint    public constant MAX_PCNT_FEE    = 3e5; // 30% fee is max we can set //
    uint    public constant PRIORITY_MAX    = 100;

    uint    public constant BNB_SWAP_MIN_PCNT = 980000; // Min out from swap is 98%. Allowing for a slippage of 2%.

    // Chainlink VRF Support
    uint    public constant VRF_FEE = 2e17; // 0.2 LINK
    uint    public constant VRF_TIME_WINDOW = 60; // The random value will only be acccepted within 60 sec

}


