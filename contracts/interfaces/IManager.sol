// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "./IRoleAccess.sol";
import "./IRandomProvider.sol";
import "./IBnbOracle.sol";


interface IManager {
    function addCampaign(address newContract, address projectOwner) external;
    function getFeeVault() external view returns (address);
    function getSvLaunchAddress() external view returns (address);
    function getEggAddress() external view returns (address);
    function getRoles() external view returns (IRoleAccess);
    function getRandomProvider() external view returns (IRandomProvider);
    function getBnbOracle() external view returns (IBnbOracle);
}

