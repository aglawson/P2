const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer;
const contractAddress = '0xce6b410e8988AB85672e88E7e7cA4EC622980075';
const contract = new ethers.Contract(contractAddress, abi, provider);
hide('ca');
// hide('accountInfo');
hide('deposit');
hide('send');

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
        //unhide('accountInfo');
        document.getElementById('connect').innerHTML = username.username;
        document.getElementById('un').innerHTML = username.username;
        document.getElementById('balance').innerHTML = 'ETH Balance: ' + balance / 10**18;
        unhide('deposit');
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
        alert('only ETH supported currently');
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