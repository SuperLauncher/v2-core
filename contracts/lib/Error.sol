// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

library Error {
    
    enum Code {
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
        Aborted,
        SwapExceededMaxSlippage
    }

    
    function str(Code err) internal pure returns (string memory) {
        uint value = uint(err);
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
    