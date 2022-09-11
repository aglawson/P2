const { expect } = require("chai");
const { ethers } = require("hardhat");
let BASE = "AVAX";

describe("Threezend", function () {
  this.beforeAll(async function() {
    const [owner, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    this.owner = owner;
    this.addr2 = addr2;
    this.addr3 = addr3;
    this.addr4 = addr4;
    this.addr5 = addr5;



    this.P2 = await ethers.getContractFactory("Threezend");
    this.p2 = await this.P2.deploy(BASE);

    this.TestToken = await ethers.getContractFactory("TestToken");
    this.tt = await this.TestToken.deploy();
  });

  describe("Deployment", function () {
    it('initializes BASE token at deployment', async function () {
      this.ethObject = await this.p2.tokenMapping(BASE);
      expect(await this.ethObject.tokenAddress).to.equal('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    });
  });

  describe("Account Functionality", function () {
    it('can create new accounts', async function () {
      expect(await this.p2.connect(this.addr2)['createAccount(string)']('first')).to.emit('accountCreated');
    });

    it('users can add friends', async function () {
      // await this.p2.connect(this.addr2)['createAccount(string)']('first');
      await this.p2.connect(this.addr3)['createAccount(string)']('second');
      expect(await this.p2.connect(this.addr2)['addFriend(string)']('second')).to.emit('addedFriend');
    });

    it('can deposit funds', async function () {
      expect(await this.p2.connect(this.addr2)['depositBASE()']({value: '1000000000000000000'})).to.emit('funded');
      expect(await this.p2.tokenBalance(BASE, "first")).to.equal('1000000000000000000');
    });

    it('can request funds from friends', async function () {
      expect(await this.p2.connect(this.addr3)['requestFunds(string,string,uint256,string)']('first', BASE, '1000000000000000000', 'freelance work')).to.emit('requestSent');
    });

    it('can fulfill requests', async function () {
      //await this.p2.connect(this.addr2)['depositETH()']({value: '1000000000000000000'});
      expect(await this.p2.connect(this.addr2)['fulfillRequest(uint256)'](0)).to.emit('requestFulfilled');
      expect(await this.p2.tokenBalance(BASE, "first")).to.equal('0');
      expect(await this.p2.tokenBalance(BASE, "second")).to.equal('1000000000000000000');
    });

    it('user can reject request', async function () {
      await this.p2.connect(this.addr3).requestFunds('first', BASE, '1000000000000000000', 'freelance work');
      expect(await this.p2.connect(this.addr2)['rejectRequest(uint256)'](1)).to.emit("requestRejected");
    });

    it('can send funds', async function () {
      await this.p2.connect(this.addr4)['createAccount(string)']('HeadlessDev');
      expect(await this.p2.connect(this.addr3)['sendFunds(string,string,uint256,string)']('HeadlessDev', BASE, '50000000000000000', 'For gas money')).to.emit('sent');
      expect(await this.p2.tokenBalance(BASE, "second")).to.equal('950000000000000000');
      expect(await this.p2.tokenBalance(BASE, "HeadlessDev")).to.equal('50000000000000000');
    });

    it('user can withdraw funds', async function () {
      expect(await this.p2.connect(this.addr4)['withdrawFunds(string,uint256)'](BASE, '50000000000000000')).to.emit('withdrawal');
      expect(await this.p2.tokenBalance(BASE, "HeadlessDev")).to.equal('0');
    });

    it('user can remove friends', async function () {
      expect(await this.p2.connect(this.addr2)['removeFriend(string)']('second')).to.emit('friendRemoved');
    });
  });

  describe("ERC20 Functionality", async function () {
    it('owner can add ERC20 token', async function () {
      expect(await this.p2.connect(this.owner)['addToken(string,address)']('TEST', this.tt.address)).to.emit('tokenAdded');
    });

    it('user can deposit ERC20 token', async function () {
      await this.p2.connect(this.owner).createAccount('OWNER');
      await this.tt.connect(this.owner).approve(this.p2.address, '1000000000000000000000000000');
      expect(await this.p2.connect(this.owner)['depositERC20(string,uint256)']('TEST', '10000000000000000000')).to.emit('funded');
      expect(await this.p2.tokenBalance('TEST', 'OWNER')).to.equal('10000000000000000000');
    });

    it('user can withdraw ERC20', async function () {
      expect(await this.p2.connect(this.owner)['withdrawFunds(string,uint256)']('TEST', '10000000000000000000')).to.emit('withdrawal');
      expect(await this.p2.tokenBalance('TEST', 'OWNER')).to.equal('0');
    });
  });

  describe("Security", async function () {
    it('only owner can add tokens', async function () {
      await expect(this.p2.connect(this.addr2)['addToken(string,address)']('FAIL', '0x0000000000000000000000000000000000001010')).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('only friends can request money', async function () {
      await expect(this.p2.connect(this.addr5)['requestFunds(string,string,uint256,string)']('OWNER', BASE, '1000000000', 'PLZ')).to.be.revertedWith('Can only request from friends');
    });

    it('does not allow duplicate usernames', async function () {
      await expect(this.p2.connect(this.addr4)['createAccount(string)']('OWNER')).to.be.revertedWith('Username already claimed');
    });

    it('does not allow same wallet to make multiple accounts', async function () {
      await expect(this.p2.connect(this.owner)['createAccount(string)']('OtherAccount')).to.be.revertedWith('Account already exists for this wallet');
    });

    it('does not allow funds to be sent to non existent user', async function () {
      await this.p2.connect(this.owner).depositBASE({value:'1000000000000000000'});
      await expect(this.p2.connect(this.owner)['sendFunds(string,string,uint256,string)']('bobby', BASE, '10000000000', 'hello')).to.be.revertedWith('Username has no associated address');
    });

    it('does not allow users to fulfill requests not sent to them', async function () {
      await this.p2.connect(this.addr4).addFriend('OWNER');
      await this.p2.connect(this.owner).requestFunds('HeadlessDev', BASE, '10000000000000000', 'just do it');
      await this.p2.connect(this.addr2).depositBASE({value:'1000000000000000000'});
      await expect(this.p2.connect(this.addr2)['fulfillRequest(uint256)']('2')).to.be.revertedWith('Sender is not request recipient');
    });

    it('does not allow a rejected request to be fulfilled', async function () {
      await this.p2.connect(this.addr4).rejectRequest(2);
      await this.p2.connect(this.addr4).depositBASE({value: '1000000000000000000'});
      await expect(this.p2.connect(this.addr4)['fulfillRequest(uint256)'](2)).to.be.revertedWith('Request has been rejected and cannot be fulfilled');
    });

    it('does not allow a user to reject a request not sent to them', async function () {
      await this.p2.connect(this.addr4).addFriend('OWNER');
      await this.p2.connect(this.owner).requestFunds('HeadlessDev', BASE, '10000000000000000', 'again again');
      await expect(this.p2.connect(this.addr2)['rejectRequest(uint256)'](2)).to.be.revertedWith('Sender is not request recipient');
    });

    it('does not allow non-owner to transfer ownership', async function () {
      await expect(this.p2.connect(this.addr2)['transferOwnership(address)'](this.addr2.address)).to.be.revertedWith('Ownable: caller is not the owner');
    })
  });
 
});
