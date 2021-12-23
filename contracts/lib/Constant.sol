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

    uint    public constant BNB_SWAP_MAX_SLIPPAGE_PCNT = 3e4; // Max slippage is set to 3%

    // Chainlink VRF Support
    uint    public constant VRF_FEE = 2e17; // 0.2 LINK
    uint    public constant VRF_TIME_WINDOW = 60; // The randome value will only be acccep within 60 sec

}


