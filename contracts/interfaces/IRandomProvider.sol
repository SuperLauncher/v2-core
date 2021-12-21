// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;


interface IRandomProvider {
    function requestRandom() external;
    function grantAccess(address campaign) external;
}

