// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "../node_modules/openzeppelin-contracts/access/Ownable.sol";
import "../node_modules/openzeppelin-contracts/utils/ReentrancyGuard.sol";
import "./Percentages.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../node_modules/openzeppelin-contracts/token/ERC20/IERC20.sol";

// 0x0A77230d17318075983913bC2145DB16C7366156 -- AVAX

/*
*   TO-DO: Add support for ERC20
*/

contract P2 is Ownable, ReentrancyGuard, Percentages{
    constructor() {
        addToken("ETH", 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    }

    event sent(string toUsername, string fromUsername, string ticker, uint256 amount, string memo);
    event funded(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance);
    event withdrawal(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance, uint256 fee);

    struct Token {
        string ticker;
        address tokenAddress;
    }
    mapping(string => Token) public tokenMapping;

    struct Account {
        string username;
        bool hasAccount;
        mapping(string => uint256) tokenBalances;
    }
    mapping(address => Account) public accounts;

    mapping(string => address) public usernameToAddress;

    modifier tokenExists(string memory ticker) {
        require(tokenMapping[ticker].tokenAddress != address(0), "Token does not exist");
        _;
    }

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

    function depositETH() external payable nonReentrant {
        require(accounts[_msgSender()].hasAccount, "Sender has not created an account");

        uint256 oldBalance = accounts[_msgSender()].tokenBalances["ETH"];

        accounts[_msgSender()].tokenBalances["ETH"] += msg.value;

        emit funded(accounts[_msgSender()].username, _msgSender(), msg.value, oldBalance, accounts[_msgSender()].tokenBalances["ETH"]);
    }

    function depositERC20(string memory ticker, uint256 amount) external tokenExists(ticker){
        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(msg.sender, address(this), amount);

        accounts[_msgSender()].tokenBalances[ticker] += amount;
    }

    function sendERC20(string calldata _toUsername, string calldata ticker, uint256 amount, string calldata memo) external tokenExists(ticker) {
        require(accounts[_msgSender()].tokenBalances[ticker] >= amount, "Insufficient balance");
        accounts[_msgSender()].tokenBalances[ticker] -= amount;

        accounts[usernameToAddress[_toUsername]].tokenBalances[ticker] += amount;

        emit sent(_toUsername, accounts[_msgSender()].username, ticker, amount, memo);
    }

    function sendETH(string calldata _toUsername, uint256 amount, string calldata memo) external isInitialized(_toUsername) nonReentrant {
        require(accounts[_msgSender()].tokenBalances["ETH"] >= amount, "Insufficient balance");
        accounts[_msgSender()].tokenBalances["ETH"] -= amount;
        accounts[usernameToAddress[_toUsername]].tokenBalances["ETH"] += amount;

        emit sent(_toUsername, accounts[_msgSender()].username, "ETH", amount, memo);
    }

    function withdrawETH(uint256 _amount, bool withdrawAll) external nonReentrant {
        uint256 amount = _amount;
        if(withdrawAll) {
            amount = accounts[_msgSender()].tokenBalances["ETH"];
        }

        require(accounts[_msgSender()].tokenBalances["ETH"] >= amount, "Insufficient balance");

        uint256 oldBalance = accounts[_msgSender()].tokenBalances["ETH"];
        accounts[_msgSender()].tokenBalances["ETH"] -= amount;

        uint256 fee = percentageOf(amount, 1) / 4; // 0.25% 
    
        (bool success,) = payable(_msgSender()).call{value: amount - fee}("");
        require(success, 'Transfer fail');

        (bool success2,) = payable(owner()).call{value: fee}("");
        require(success2, 'Transfer fail');

        emit withdrawal(accounts[_msgSender()].username, _msgSender(), amount, oldBalance, accounts[_msgSender()].tokenBalances["ETH"], fee);
    }

    function withdrawERC20(uint256 amount, string memory ticker) external nonReentrant tokenExists(ticker) {
        require(accounts[_msgSender()].tokenBalances[ticker] >= amount, "Insufficient balance");

        uint256 oldBalance = accounts[_msgSender()].tokenBalances[ticker];
        accounts[_msgSender()].tokenBalances[ticker] -= amount;

        uint256 fee = percentageOf(amount, 1) / 4; // 0.25% 
    
        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(address(this), _msgSender(), amount - fee);
        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(address(this), owner(), fee);
        //accounts[owner()].tokenBalances[ticker] += fee;

        emit withdrawal(accounts[_msgSender()].username, _msgSender(), amount, oldBalance, accounts[_msgSender()].tokenBalances[ticker], fee);
    }

    function tokenBalance(string memory ticker, string memory _username) public view returns(uint256) {
        return accounts[usernameToAddress[_username]].tokenBalances[ticker];
    }

    function addToken(string memory ticker, address tokenAddress) public onlyOwner {
        tokenMapping[ticker] = Token(ticker, tokenAddress);
    }

    function ownerWithdraw(string memory ticker) external onlyOwner {

    }
}