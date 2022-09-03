# P2

P2 is a web3 version of a peer to peer payment platform (think venmo, zelle, etc).
P2 is more user friendly than just using the base layer of ETH to move value, because it relies on usernames rather than unreadable wallet addresses. 

## In the works
1. Add ERC20 tokens **done**
2. Add ability to add users as 'friends' who can request payments (similar to venmo) **done**
3. Remove USD conversions (to make #1 more smooth) **done**
4. Test profusely *In Progress*
5. Simple frontend to visualize functionality

## Latest Test Results
```
    Deployment
      ✔ initializes ETH token at deployment (44ms)
    Account Functionality
      ✔ can create new accounts (68ms)
      ✔ users can add friends (60ms)
      ✔ can deposit funds (50ms)
      ✔ can request funds from friends (44ms)
      ✔ can fulfill requests (63ms)
      ✔ can send funds (67ms)
      ✔ user can withdraw funds (70ms)
      ✔ user can remove friends
    ERC20 Functionality
      ✔ owner can add ERC20 token
      ✔ user can deposit ERC20 token (80ms)
      ✔ user can withdraw ERC20 (56ms)
    Security
      ✔ only owner can add tokens (44ms)
      ✔ only friends can request money


  14 passing (2s)

```