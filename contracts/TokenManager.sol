// SPDX-License-Identifier: No License
pragma solidity ^0.8.9;
import "../node_modules/openzeppelin-contracts/access/Ownable.sol";


contract TokenManager is Ownable {

    string BASE;

    event tokenAdded(string ticker, address tokenAddress);
    struct Token {
        string ticker;
        address tokenAddress;
        bool exempt;
    }
    mapping(string => Token) public tokenMapping;

    modifier tokenExists(string memory ticker) {
        require(tokenMapping[ticker].tokenAddress != address(0), "Token does not exist");
        _;
    }

    modifier tokenDoesNotExist(string memory ticker) {
        require(tokenMapping[ticker].tokenAddress == address(0), "Token already exists");
        _;
    }

    function addToken(string memory ticker, address tokenAddress) public onlyOwner tokenDoesNotExist(ticker) {
        tokenMapping[ticker] = Token(ticker, tokenAddress, false);
        emit tokenAdded(ticker, tokenAddress);
    }

    function exemptToken(string memory ticker, bool _exempt) external onlyOwner tokenExists(ticker) {
        tokenMapping[ticker].exempt = _exempt;
    }
}