const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer;
const contractAddress = '0xce6b410e8988AB85672e88E7e7cA4EC622980075';
const contract = new ethers.Contract(contractAddress, abi, provider);
hide('ca');
hide('accountInfo');

init = async function () {
    hide('accountInfo');

    // hide('buy');
    // hide('sell');
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner()
    if(await signer.provider._network.name != 'goerli') {
        alert('Must be on goerli testnet');
        throw('Must be on goerli testnet');
    }

    let username = await contract.accounts(await signer.getAddress());
    let balance = await contract.tokenBalance('ETH', username.username);

    if(username.hasAccount){
        document.getElementById('connect').innerHTML = username.username;
        document.getElementById('accountInfo').innerHTML = 'ETH Balance: ' + balance / 10**18;
    } else {
        document.getElementById('connect').innerHTML = 'Connected!';
        unhide('ca');
    }

}

init();

createAccount = async function () {
    const contractSigner = contract.connect(signer);

    const username = document.getElementById('username').value;

    const log = await contractSigner.createAccount(username.toLowerCase());
}

deposit = async function () {
    const contractSigner = contract.connect(signer);

    const amount = document.getElementById('amount').value * 10**18;
    const ticker = document.getElementById('ticker').value.toUpperCase();

    if(ticker == 'ETH') {
        const log = await contractSigner.depositETH({value: amount.toString()});
    } else {
        alert('only ETH supported currently');
    }
}

withdraw = async function () {
    const contractSigner = contract.connect(signer);

    const amount = document.getElementById('amount').value * 10**18;
    const ticker = document.getElementById('ticker').value.toUpperCase();

    if(ticker == 'ETH') {
        const log = await contractSigner.withdrawFunds({value: amount.toString()});
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
            const log = await contractSigner.sendFunds(toUsername, 'ETH', amount, memo);
        } catch(err) {
            alert(err);
        }
    } else {
        alert('only ETH supported currently');
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