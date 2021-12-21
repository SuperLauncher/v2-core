// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "../lib/DataTypes.sol";
import "../lib/Error.sol";
import "../lib/Constant.sol";

library Lottery {

    function subscribe(DataTypes.Lottery storage param, uint amtForCheck) external {
        DataTypes.LotteryItem memory item = param.items[msg.sender];
        _require(!item.exist, Error.Code.AlreadyExist);
        _require(amtForCheck == param.data.eachAllocationAmount, Error.Code.InvalidAmount);
        
        param.items[msg.sender] = DataTypes.LotteryItem(param.count, true);
        param.count++;
    }
    
    function getTotal(DataTypes.Lottery storage param) external view returns (uint) {
        return param.data.eachAllocationAmount * param.count;
    }

    function initRandomValue(DataTypes.Lottery storage param) external {
        param.random.requestTime = block.timestamp;
        param.random.initialized = true;
    }

    function readyForTally(DataTypes.Lottery storage param) public view returns (bool) {
        bool elapsed = param.random.initialized && (block.timestamp - param.random.requestTime) > Constant.VRF_TIME_WINDOW;
        return ( param.random.valid || elapsed);
    }

    function setRandomValue(DataTypes.Lottery storage param, uint value) external {
        // If the random value came after the time-window, the this value will not be used
        bool onTime = (block.timestamp - param.random.requestTime) < Constant.VRF_TIME_WINDOW;

        // If random value is > 0
        param.random.value = onTime ? value : 0;
        param.random.valid = onTime;
    }

    function tally(DataTypes.Lottery storage param, uint allocAmt) external {

        // Has chainlink provided the random number ? Or has time window elapsed ?
        _require(readyForTally(param), Error.Code.NotReady);

        _require(!param.data.tallyCompleted, Error.Code.NotReady);
        param.data.tallyCompleted = true;

        param.result.leftOverAmount = allocAmt; // default value in case no one in lottery //
        param.data.totalAllocatedAmount = allocAmt;
        
        uint numWinners = allocAmt / param.data.eachAllocationAmount;
        if (numWinners==0 || param.count==0) {
            return;
        }
        
        if (numWinners > param.count) {
            numWinners = param.count;
        }

        param.result.numWinners = numWinners;
        param.result.leftOverAmount = allocAmt - (numWinners * param.data.eachAllocationAmount);
        
        // pick random index if needed //
        if (numWinners < param.count) {
            param.result.winnerStartIndex = param.random.value % param.count; 
        }
    }
    
    function getFinalLeftOver(DataTypes.Lottery storage param) external view returns (uint) {
        return param.result.leftOverAmount;
    } 
  
    
    // bool : Participated?
    // bool : Won?
    // uint : Amount (ie the value of eachAllocationAmt, regardless of whether user win or lose)
    function isWinner(DataTypes.Lottery storage param, address user) public view returns (bool, bool, uint) {
        DataTypes.LotteryItem memory item = param.items[user];
        bool participated = item.exist;
        if (!participated || !param.data.tallyCompleted || param.count==0 || param.result.numWinners==0) {
            return (participated, false, 0);
        }
        
        uint winAmt = param.data.eachAllocationAmount;
        
        // Everyone wins ?
        if (param.result.numWinners==param.count) {
            return (true, true, winAmt);
        }
    
        // Not everyone wins
        uint start = param.result.winnerStartIndex;
        uint end = start + param.result.numWinners - 1;
        
        bool won = item.index >= start && item.index <= end;
        if (!won && end >= param.count) {
            end -= param.count; // wrap around
            won = item.index <= end;
        }
        return (true, won,  winAmt);
    } 
    
    function getRefundable(DataTypes.Lottery storage param, address user) external view returns(uint) {
        (bool participated, bool won, uint amt) = isWinner(param, user);
        return ( (participated && !won) ? amt : 0 );
    }


    function _require(bool condition, Error.Code err) pure private {
        require(condition, Error.str(err));
    }
}

