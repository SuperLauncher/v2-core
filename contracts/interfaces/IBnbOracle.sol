// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;


interface IBnbOracle {
    function getRate(address currency) external view returns (int, uint8);
}


   
