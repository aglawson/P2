// SPDX-License-Identifier: No License
pragma solidity 0.8.9;

import "../node_modules/openzeppelin-contracts/token/ERC20/ERC20.sol";
contract TestToken is ERC20 {

    constructor() ERC20("TestToken", "TEST") {
        _mint(_msgSender(), 1000000000000000000000000000);
    }

}