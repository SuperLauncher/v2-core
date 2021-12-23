// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "./interfaces/IBnbOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract BnbOracle is IBnbOracle {
    
    // Maps a currency address (eg BUSD) to the chainlink price feed address (eg BUSD/BNB)
    mapping(address => address) public priceFeeds;

    constructor(address[] memory currencies, address[] memory feeds) {
        uint len = currencies.length;
        require(len > 0 && feeds.length == len, "Errors.VALIDATION_ERROR");

        address currency;
        address feed;
        for (uint n=0; n<len; n++) {
            currency = currencies[n];
            feed = feeds[n];
            require(currency != address(0) && feed != address(0));
            priceFeeds[currency] = feed;
        }
    }

    function getRate(address currency) external view override returns (int rate, uint8 decimals) {

        address feed = priceFeeds[currency];
        require(feed != address(0), "Errors.UNSUPPORTED_FEED");

        ( , rate, , , ) = AggregatorV3Interface(feed).latestRoundData();
        decimals = AggregatorV3Interface(feed).decimals();
    }
}
