// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./Accounts.sol";

contract Friends is Accounts {
    event friendAdded(string username, string newFriend);
    event friendRemoved(string username, string exFriend);
    event requestSent(uint256 reqId, string requester, string requestRecipient, string ticker, uint256 amount, string reason);
    event requestFulfilled(uint256 reqId, string requester, string requestRecipient, string ticker, uint256 amount);
    event requestRejected(uint256 reqId);

    enum ReqType {
        SENT,
        RECEIVED
    }
    struct Request {
        uint256 id;
        address requestSender;
        address requestRecipient;
        string ticker;
        uint256 amount;
        string memo;
        bool fulfilled;
        bool rejected;
    }
    uint256 public nextReqId;
    Request[] public reqs;
    mapping(address => mapping(uint256 => uint256[])) public reqMapping; // address -> ReqType -> reqId

    function addFriend(string calldata username) external isInitialized(username) {
        friends[_msgSender()][usernameToAddress[username]] = true;
        emit friendAdded(accounts[_msgSender()].username, username);
    }

    function removeFriend(string calldata username) external {
        require(friends[_msgSender()][usernameToAddress[username]], "Already not friends");
        friends[_msgSender()][usernameToAddress[username]] = false;
        emit friendRemoved(accounts[_msgSender()].username, username);
    }

    function requestFunds(string calldata username, string calldata ticker, uint256 amount, string calldata memo) external tokenExists(ticker) {
        require(friends[usernameToAddress[username]][_msgSender()], "Can only request from friends");

        reqMapping[_msgSender()][uint(ReqType.SENT)].push(nextReqId);
        reqMapping[usernameToAddress[username]][uint(ReqType.RECEIVED)].push(nextReqId);

        reqs.push(Request(nextReqId, _msgSender(), usernameToAddress[username], ticker, amount, memo, false, false));

        emit requestSent(nextReqId, accounts[_msgSender()].username, username, ticker, amount, memo);
        nextReqId++;
    }

    function fulfillRequest(uint256 reqId) external {
        require(!reqs[reqId].fulfilled, "Already fulfilled");
        require(tokenBalances[_msgSender()][reqs[reqId].ticker] >= reqs[reqId].amount, "Insufficient balance");
        require(reqs[reqId].requestRecipient == _msgSender(), "Sender is not request recipient");

        reqs[reqId].fulfilled = true;

        tokenBalances[reqs[reqId].requestSender][reqs[reqId].ticker] += reqs[reqId].amount;
        tokenBalances[_msgSender()][reqs[reqId].ticker] -= reqs[reqId].amount;

        emit requestFulfilled
        (
            reqId,
            accounts[reqs[reqId].requestSender].username,
            accounts[_msgSender()].username,
            reqs[reqId].ticker,
            reqs[reqId].amount
        );
    }

    function rejectRequest(uint256 reqId) external {
        require(!reqs[reqId].fulfilled, "Already fulfilled");
        require(reqs[reqId].requestRecipient == _msgSender(), "Sender is not request recipient");

        reqs[reqId].rejected = true;
        emit requestRejected(reqId);
    }

    function getRequests(ReqType _type) external view returns(uint256[] memory) {
        return reqMapping[_msgSender()][uint256(_type)];
    }
}