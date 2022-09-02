const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("P2", function () {
  this.beforeAll(async function() {
    const [owner, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    this.owner = owner;
    this.addr2 = addr2;
    this.addr3 = addr3;
    this.addr4 = addr4;
    this.addr5 = addr5;

    this.P2 = await ethers.getContractFactory("P2");
    this.p2 = await this.P2.deploy();

  });

  describe("Deployment", function () {
    it('initializes ETH token at deployment', async function () {
      this.ethObject = await this.p2.tokenMapping("ETH");
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
      expect(await this.p2.connect(this.addr2)['depositETH()']({value: '1000000000000000000'})).to.emit('funded');
      expect(await this.p2.tokenBalance("ETH", "first")).to.equal('1000000000000000000');
    });

    it('can request funds from friends', async function () {
      expect(await this.p2.connect(this.addr3)['requestFunds(string,string,uint256,string)']('first', 'ETH', '1000000000000000000', 'freelance work')).to.emit('requestSent');
    });

    it('can fulfill requests', async function () {
      //await this.p2.connect(this.addr2)['depositETH()']({value: '1000000000000000000'});
      expect(await this.p2.connect(this.addr2)['fulfillRequest(uint256)'](0)).to.emit('requestFulfilled');
      expect(await this.p2.tokenBalance("ETH", "first")).to.equal('0');
      expect(await this.p2.tokenBalance("ETH", "second")).to.equal('1000000000000000000');
    });

    it('can send funds', async function () {
      await this.p2.connect(this.addr4)['createAccount(string)']('HeadlessDev');
      expect(await this.p2.connect(this.addr3)['sendFunds(string,string,uint256,string)']('HeadlessDev', 'ETH', '50000000000000000', 'For gas money')).to.emit('sent');
      expect(await this.p2.tokenBalance("ETH", "second")).to.equal('950000000000000000');
      expect(await this.p2.tokenBalance("ETH", "HeadlessDev")).to.equal('50000000000000000');
    });

    it('user can withdraw funds', async function () {
      expect(await this.p2.connect(this.addr4)['withdrawFunds(string,uint256)']('ETH', '50000000000000000')).to.emit('withdrawal');
      expect(await this.p2.tokenBalance("ETH", "HeadlessDev")).to.equal('0');
    });

    it('user can remove friends', async function () {
      expect(await this.p2.connect(this.addr2)['removeFriend(string)']('second')).to.emit('friendRemoved');
    });
  });
 
});
