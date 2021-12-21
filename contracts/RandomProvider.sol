// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IRandomProvider.sol";
import "./interfaces/ICampaign.sol";
import "./interfaces/IManager.sol";
import "./lib/Constant.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";


contract RandomProvider is IRandomProvider, VRFConsumerBase, Ownable {
    
    using SafeERC20 for ERC20;

    IManager public manager;
    bytes32 public vrfKeyhash;

    struct Request {
        address requester;
        uint requestTime;
    }
    mapping(bytes32 => Request) private _randomRequesterMap;
    mapping(address => bool) private _allowedAccessMap;

    modifier onlyManager() {
        require(msg.sender == address(manager), "Errors.NORIGHTS");
        _;
    }

    constructor(address mgr, address coordinator, bytes32 keyhash, address linkToken)   
        VRFConsumerBase(coordinator, linkToken)
    {
        require(mgr != address(0) && coordinator != address(0) && linkToken != address(0), "Errors.INVALID_ADDRESS");
        require(keyhash.length > 0,"Errors.VALIDATION_ERROR");
        manager = IManager(mgr);
        vrfKeyhash = keyhash;
    }

    function requestRandom() external override {
        // Only allowed Campaigns can request a random number
        require(_allowedAccessMap[msg.sender],"Errors.INVALID_REQUESTER");
        require(LINK.balanceOf(address(this)) >= Constant.VRF_FEE,  "Errors.INSUFFICIENT_LINK");
        bytes32 requestId = requestRandomness(vrfKeyhash, Constant.VRF_FEE);

        Request storage item = _randomRequesterMap[requestId];
        item.requester = msg.sender;
        item.requestTime = block.timestamp;
    }

    function grantAccess(address campaign) external override onlyManager {
        _allowedAccessMap[campaign] = true;
    }

    // Provide a way to withdraw Link or other BEP20 tokens
    function withdraw(address to, address tokenAddress, uint amount) external  onlyOwner {
       
        if (amount > 0 && to != address(0)) {
            ERC20(tokenAddress).safeTransfer(to, amount); 
        }
    }


    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        
        Request memory item = _randomRequesterMap[requestId];
        address camp = item.requester;
        require(camp != address(0), "Errors.INVALID_REQUESTER");

        ICampaign(camp).sendRandomValueForLottery(randomness);
    }
}