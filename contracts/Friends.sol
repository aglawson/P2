// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./BT.sol";

contract Friends is BT {
     // Experimental ->
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
    }
    uint256 public nextReqId;
    Request[] public reqs;
    mapping(address => mapping(uint256 => uint256[])) public reqMapping; // address -> ReqType -> reqId

    // <-

    // Experimental ->
    function addFriend(string calldata username) external isInitialized(username) {
        friends[_msgSender()][usernameToAddress[username]] = true;
    }

    function requestMoney(string calldata username, string calldata ticker, uint256 amount, string calldata memo) external tokenExists(ticker) {
        require(friends[usernameToAddress[username]][_msgSender()], "Can only request from friends");

        reqMapping[_msgSender()][uint(ReqType.SENT)].push(nextReqId);
        reqMapping[usernameToAddress[username]][uint(ReqType.RECEIVED)].push(nextReqId);

        reqs.push(Request(nextReqId, _msgSender(), usernameToAddress[username], ticker, amount, memo, false));

        nextReqId++;
    }

    function fulfillRequest(uint256 reqId) external {
        require(!reqs[reqId].fulfilled, "Already fulfilled");
        require(tokenBalances[_msgSender()][reqs[reqId].ticker] >= reqs[reqId].amount, "Insufficient balance");
        require(reqs[reqId].requestRecipient == _msgSender(), "Sender is not request recipient");
        
        reqs[reqId].fulfilled = true;

        tokenBalances[reqs[reqId].requestSender][reqs[reqId].ticker] += reqs[reqId].amount;
        tokenBalances[_msgSender()][reqs[reqId].ticker] -= reqs[reqId].amount;
    }

    function getRequests(ReqType _type) external view returns(uint256[] memory) {
        return reqMapping[_msgSender()][uint256(_type)];
    }
    /*    
        uint256 id;
        address requestSender;
        address requestRecipient;
        string ticker;
        uint256 amount;
        string memo;
        bool fulfilled;
    */
    // <-
}