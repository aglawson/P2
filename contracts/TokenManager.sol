// SPDX-License-Identifier: No License
pragma solidity ^0.8.9;
import "../node_modules/openzeppelin-contracts/access/Ownable.sol";


contract TokenManager is Ownable {

    struct Token {
        string ticker;
        address tokenAddress;
    }
    mapping(string => Token) public tokenMapping;

    modifier tokenExists(string memory ticker) {
        require(tokenMapping[ticker].tokenAddress != address(0), "Token does not exist");
        _;
    }

    function addToken(string memory ticker, address tokenAddress) public onlyOwner {
        tokenMapping[ticker] = Token(ticker, tokenAddress);
    }
}