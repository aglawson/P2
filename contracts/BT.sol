// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "../node_modules/openzeppelin-contracts/utils/ReentrancyGuard.sol";
import "./Percentages.sol";
import "./TokenManager.sol";

// import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../node_modules/openzeppelin-contracts/token/ERC20/IERC20.sol";
/*
*   TO-DO: Vigorous testing
*/
contract BT is ReentrancyGuard, Percentages, TokenManager{

    event sent(string toUsername, string fromUsername, string ticker, uint256 amount, string memo);
    event funded(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance);
    event withdrawal(string username, address wallet, uint256 amount, uint256 oldBalance, uint256 newBalance, uint256 fee);

    struct Account {
        string username;
        bool hasAccount;
    }
    mapping(address => Account) public accounts;
    mapping(address => mapping(string => uint256)) tokenBalances;

   
    mapping(address => mapping(address => bool)) friends;
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

    function depositETH() external payable nonReentrant {
        require(accounts[_msgSender()].hasAccount, "Sender has not created an account");

        uint256 oldBalance = tokenBalances[_msgSender()]["ETH"];

        tokenBalances[_msgSender()]["ETH"] += msg.value;

        emit funded(accounts[_msgSender()].username, _msgSender(), msg.value, oldBalance, tokenBalances[_msgSender()]["ETH"]);
    }

    function depositERC20(string memory ticker, uint256 amount) external tokenExists(ticker){
        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(msg.sender, address(this), amount);

        tokenBalances[_msgSender()][ticker] += amount;
    }

    function sendFunds(string calldata _toUsername, string calldata ticker, uint256 amount, string calldata memo) external tokenExists(ticker) {
        require(tokenBalances[_msgSender()][ticker] >= amount, "Insufficient balance");
        tokenBalances[_msgSender()][ticker] -= amount;

        tokenBalances[usernameToAddress[_toUsername]][ticker] += amount;

        emit sent(_toUsername, accounts[_msgSender()].username, ticker, amount, memo);
    }

    function withdrawFunds(string memory ticker, uint256 _amount) external nonReentrant {
        uint256 amount = _amount;
        require(tokenBalances[_msgSender()][ticker] >= amount, "Insufficient balance");

        uint256 oldBalance = tokenBalances[_msgSender()][ticker];
        tokenBalances[_msgSender()][ticker] -= amount;

        uint256 fee = percentageOf(amount, 1) / 4; // 0.25% 

        if(tokenMapping[ticker].tokenAddress == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            (bool success,) = payable(_msgSender()).call{value: amount - fee}("");
            require(success, 'Transfer fail');

            (bool success2,) = payable(owner()).call{value: fee}("");
            require(success2, 'Transfer fail');
        } else {
            IERC20(tokenMapping[ticker].tokenAddress).transferFrom(address(this), _msgSender(), amount - fee);
            IERC20(tokenMapping[ticker].tokenAddress).transferFrom(address(this), owner(), fee);
        }
        
        emit withdrawal(accounts[_msgSender()].username, _msgSender(), amount, oldBalance, tokenBalances[_msgSender()][ticker], fee);
    }

    function tokenBalance(string memory ticker, string memory _username) public view returns(uint256) {
        return tokenBalances[usernameToAddress[_username]][ticker];
    }
}