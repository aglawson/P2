// SPDX-License-Identifier: No License
pragma solidity ^0.8.9;

import "./Friends.sol";

contract Cetera is Friends {
    constructor() {
        addToken("ETH", 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    }
}