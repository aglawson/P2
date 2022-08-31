// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "../node_modules/openzeppelin-contracts/access/Ownable.sol";
import "../node_modules/openzeppelin-contracts/utils/ReentrancyGuard.sol";
import "./Percentages.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// 0x0A77230d17318075983913bC2145DB16C7366156 -- AVAX

/*
*   TO-DO: Add support for ERC20
*/

contract P2 is Ownable, ReentrancyGuard, Percentages{
    AggregatorV3Interface internal priceFeed;
    constructor() {
        priceFeed = AggregatorV3Interface(0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf);  // 0x986b5E1e1755e3C2440e960477f25201B0a8bbD4 --main net
    }

    event sent(string toUsername, string fromUsername, uint256 amount, string memo);
    event funded(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance);
    event withdrawal(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance, uint256 fee);

    struct Account {
        string username;
        uint256 balance;
        bool hasAccount;
    }
    mapping(address => Account) public accounts;

    mapping(string => address) public usernameToAddress;

    modifier isAccountHolder(string memory _username) {
        require(_msgSender() == usernameToAddress[_username], "Sender is not account holder");
        _;
    }

    modifier isInitialized(string memory _username) {
        require(accounts[usernameToAddress[_username]].hasAccount, "Username has no associated address");
        _;
    }

    modifier isNotInitialized(string memory _username) {
        require(!accounts[usernameToAddress[_username]].hasAccount, "Username already claimed");
        _;
    }

    function createAccount(string memory _username) external isNotInitialized(_username) nonReentrant {
        require(!accounts[_msgSender()].hasAccount, "Account already exists for this wallet");
        accounts[_msgSender()].username = _username;
        accounts[_msgSender()].hasAccount = true;
        usernameToAddress[_username] = _msgSender();
    }

    function fundAccount() external payable nonReentrant {
        require(accounts[_msgSender()].hasAccount, "Sender has not created an account");

        uint256 oldBalance = accounts[_msgSender()].balance;

        accounts[_msgSender()].balance += msg.value;

        emit funded(accounts[_msgSender()].username, _msgSender(), msg.value, oldBalance, accounts[_msgSender()].balance);
    }

    function sendMoney(string calldata _toUsername, uint256 usd, string calldata memo) external isInitialized(_toUsername) nonReentrant {
        uint256 amount = getUSDtoETH(usd);
        require(accounts[_msgSender()].balance >= amount, "Insufficient balance");
        accounts[_msgSender()].balance -= amount;
        accounts[usernameToAddress[_toUsername]].balance += amount;

        emit sent(_toUsername, accounts[_msgSender()].username, amount, memo);
    }

    function withdraw(uint256 usd, bool withdrawAll) external nonReentrant {
        uint256 amount = getUSDtoETH(usd);
        if(withdrawAll) {
            amount = accounts[_msgSender()].balance;
        }

        require(accounts[_msgSender()].balance >= amount, "Insufficient balance");

        uint256 oldBalance = accounts[_msgSender()].balance;
        accounts[_msgSender()].balance -= amount;

        uint256 fee = percentageOf(amount, 1) / 4; // 0.25% 
    
        (bool success,) = payable(_msgSender()).call{value: amount - fee}("");
        require(success, 'Transfer fail');

        (bool success2,) = payable(owner()).call{value: fee}("");
        require(success2, 'Transfer fail');

        emit withdrawal(accounts[_msgSender()].username, _msgSender(), amount, oldBalance, accounts[_msgSender()].balance, fee);
    }

    function setPriceFeed(address _pf) external onlyOwner {
        priceFeed = AggregatorV3Interface(_pf);
    }

    function usdBalance(string memory _username) public view returns(uint256) {
        (
            , // uint80 roundId
            int256 answer,
            , // uint256 startedAt
            , // uint256 updatedAt
            // uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        // answer = 1 / answer; if avax
        return accounts[usernameToAddress[_username]].balance / uint256(answer);
    }

    function getUSDtoETH(uint256 usd) public view returns(uint256) {
        (
            , // uint80 roundId
            int256 answer,
            , // uint256 startedAt
            , // uint256 updatedAt
            // uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        // answer = answer / 1; if avax
        return uint256(answer) * usd;
    }
}