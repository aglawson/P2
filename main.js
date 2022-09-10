// const { on } = require("events");
const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer;
const contractAddress = '0xce6b410e8988AB85672e88E7e7cA4EC622980075';
const contract = new ethers.Contract(contractAddress, abi, provider);
hide('ca');
// hide('accountInfo');
hide('deposit');
hide('send');
hide('friends');
hide('requests');

init = async function () {
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner()
    // if(await signer.provider._network.name != 'goerli') {
    //     alert('Must be on goerli testnet');
    //     throw('Must be on goerli testnet');
    // }

    let username = await contract.accounts(await signer.getAddress());
    let balance = await contract.tokenBalance('ETH', username.username);


    if(username.hasAccount){
        document.getElementById('connect').innerHTML = username.username;
        document.getElementById('un').innerHTML = username.username;
        //document.getElementById('balance').innerHTML = 'ETH Balance: ' + balance / 10**18;
        document.getElementById('requests').innerHTML = await getPendingRequests();
        unhide('deposit');
        unhide('friends');
        unhide('requests');
        if(balance != 0) {
            unhide('send');
        } else {
            hide('send');
            hide('withdraw');
        }
    } else {
        document.getElementById('connect').innerHTML = 'Connected!';
        unhide('ca');
    }

}

init();

createAccount = async function () {
    const contractSigner = contract.connect(signer);

    let username = document.getElementById('username').value;
    username = username.trim();
    console.log(username);

    try{
        const log = await contractSigner.createAccount(username.toLowerCase());
    } catch(err) {
        alert(err.error.message);
    }
}

deposit = async function () {
    const contractSigner = contract.connect(signer);

    const amount = document.getElementById('amount').value * 10**18;
    const ticker = document.getElementById('ticker').value.toUpperCase();

    if(ticker == 'ETH') {
        try{
            const log = await contractSigner.depositETH({value: amount.toString()});
        } catch(err) {
            alert(err.error.message);
        }
    } else {
        try {
            const approved = await approve();
            if(approved) {
                const log = await contractSigner.depositERC20(ticker, amount.toString());
            }
        } catch(err) {
            alert(err);
        }
    }
}

getBalance = async function () {
    const ticker = document.getElementById('balTicker').value.toUpperCase();
    const contractSigner = contract.connect(signer);

    let username = await contract.accounts(await signer.getAddress());
    let balance = await contract.tokenBalance(ticker, username.username);

    document.getElementById('balResult').innerHTML = ticker + ' Balance: ' + balance / 10**18;
    console.log(ticker);
    console.log(balance);
}

approve = async function () {
    const amount = document.getElementById('amount').value * 10**18;
    const ticker = document.getElementById('ticker').value.toUpperCase();

    try {
        let tokenAddress = await contract.tokenMapping(ticker);
        tokenAddress = tokenAddress.tokenAddress;
        const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const tokenSigner = tokenContract.connect(signer);
        const approved = await tokenSigner.approve(contractAddress, amount.toString());
        return true;
    } catch(err) {
        alert(err);
        return false;
    }
}

withdraw = async function () {
    const contractSigner = contract.connect(signer);

    const amount = document.getElementById('amount').value * 10**18;
    const ticker = document.getElementById('ticker').value.toUpperCase();

    if(ticker == 'ETH') {
        try{
            const log = await contractSigner.withdrawFunds(ticker, amount.toString());
        } catch(err) {
            alert(err.error.message);
        }
    } else {
        alert('only ETH supported currently');
    }
}

sendFunds = async function () {
    const contractSigner = contract.connect(signer);

    const amount = document.getElementById('amountt').value * 10**18;
    const ticker = document.getElementById('tickerr').value.toUpperCase();
    const memo = document.getElementById('memo').value;

    const toUsername = document.getElementById('toUsername').value;
    if(ticker == 'ETH') {
        try{
            const log = await contractSigner.sendFunds(toUsername, 'ETH', amount.toString(), memo);
        } catch(err) {
            alert(err.error.message);
        }
    } else {
        alert('only ETH supported currently');
    }
}

addFriend = async function () {
    const username = document.getElementById('reqUsername').value;
    const contractSigner = contract.connect(signer);
    try{
        const log = await contractSigner.addFriend(username);
    } catch(error) {
        alert(error.error.message);
    }
}

requestFunds = async function () {
    const contractSigner = contract.connect(signer);
    const username = document.getElementById('reqUsername').value;
    const ticker = document.getElementById('reqTicker').value.toUpperCase();
    const amount = document.getElementById('reqAmount').value * 10**18;
    const memo = document.getElementById('reqReason').value;
    try{
        const log = await contractSigner.requestFunds(username, ticker, amount.toString(), memo);
    } catch(error) {
        console.log(error);
        alert(error.error.message);
    }
}

fulfillRequest = async function () {
    const contractSigner = contract.connect(signer);
    const reqId = document.getElementById('reqId').value;
    try{
        const log = await contractSigner.fulfillRequest(reqId);
    } catch(error) {
        alert(error.error.message);
    }
}

rejectRequest = async function () {
    const contractSigner = contract.connect(signer);
    const reqId = document.getElementById('reqId').value;
    try{
        const log = await contractSigner.rejectRequest(reqId);
    } catch(error) {
        alert(error.error.message);
    }
}

getPendingRequests = async function () {
    let reqIds = [];
    let count = 0;
    while(true) {
        try{
            let req = await contract.reqMapping(await signer.getAddress(), 1, count);
            reqIds.push(parseInt(req._hex));
            count++;
        } catch {
            break;
        }
    }
    console.log(reqIds);

    let result = [];

    for(let i = 0; i < reqIds.length; i++) {
        let req = await contract.reqs(reqIds[i]);
        if(req.rejected || req.fulfilled) {

        } else {
            let requester = await contract.accounts(req.requestSender);
            requester = requester.username;
            let ticker = req.ticker;
            let amount = parseInt(req.amount._hex);
            let memo = req.memo;
            let obj = {
                Requester: requester,
                Ticker: ticker,
                Amount: amount / 10**18,
                Reason: memo,
                ID: reqIds[i]
            };
            result.push(obj);
        }
    }
    return JSON.stringify(result);


}

function hide(element)  {  
    document.getElementById(element).style.visibility="hidden";  
}

function unhide(element) {
    document.getElementById(element).style.visibility="visible";  
}

// Force page refreshes on network changes
{
    // The "any" network will allow spontaneous network changes
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    provider.on("network", (newNetwork, oldNetwork) => {
        // When a Provider makes its initial connection, it emits a "network"
        // event with a null oldNetwork along with the newNetwork. So, if the
        // oldNetwork exists, it represents a changing network
        if (oldNetwork) {
            window.location.reload();
        }
    });
}

const ERC20ABI = [{
    "inputs": [
      {
        "internalType": "string",
        "name": "name_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol_",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]