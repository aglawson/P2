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
      ✔ initializes ETH token at deployment (38ms)
    Account Functionality
      ✔ can create new accounts (60ms)
      ✔ users can add friends (83ms)
      ✔ can deposit funds (67ms)
      ✔ can request funds from friends (57ms)
      ✔ can fulfill requests (68ms)
      ✔ can send funds (54ms)
      ✔ user can withdraw funds (82ms)
      ✔ user can remove friends


  9 passing (2s)

```