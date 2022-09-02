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
    it('should initialize ETH token at deployment', async function () {
      this.ethObject = await this.p2.tokenMapping("ETH");
      expect(await this.ethObject.tokenAddress).to.equal('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    });
  });

  describe("Account Creation", function () {
    it('can create new accounts', async function () {
      expect(await this.p2.connect(this.addr2)['createAccount(string)']('first')).to.emit('accountCreated');
    });
  });
 
});
