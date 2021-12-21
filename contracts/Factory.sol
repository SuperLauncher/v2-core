// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "./Campaign.sol";

contract Factory {
    
    IManager private _manager;


    event CreateCampaign(uint index, address projectOwner, address newCampaign);

    constructor(IManager manager) {
        _manager = manager;
    }

    function createCampaign(uint index, address projectOwner) external {
        if (_manager.getRoles().isDeployer(msg.sender) && projectOwner != address(0)) {
            bytes32 salt = keccak256(abi.encodePacked(index, projectOwner, msg.sender));
            address newAddress = address(new Campaign{salt: salt}(_manager, projectOwner));
            _manager.addCampaign(newAddress, projectOwner);
            emit CreateCampaign(index, projectOwner, newAddress);
        }
    }

    function version() external pure returns (uint) {
        return Constant.FACTORY_VERSION;
    }
}

