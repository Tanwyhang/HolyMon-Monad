const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HolyMon Smart Contracts", function () {
  let agentRegistry;
  let tokenLaunchpad;
  let monStaking;
  let deployer;
  let user1;
  let user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();

    // Deploy MONStaking
    const MONStaking = await ethers.getContractFactory("MONStaking");
    monStaking = await MONStaking.deploy();

    // Deploy TokenLaunchpad with AgentRegistry address
    const TokenLaunchpad = await ethers.getContractFactory("TokenLaunchpad");
    tokenLaunchpad = await TokenLaunchpad.deploy();
  });

  describe("AgentRegistry", function () {
    it("Should create a new agent", async function () {
      const tx = await agentRegistry.connect(user1).createAgent(
        "Test Agent",
        "TST",
        "Test prompt",
        "ipfs://metadata"
      );
      await tx.wait();

      const agentId = await agentRegistry.totalAgents();
      expect(agentId).to.equal(1n);

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.name).to.equal("Test Agent");
      expect(agent.symbol).to.equal("TST");
      expect(agent.owner).to.equal(await user1.getAddress());
    });

    it("Should prevent duplicate symbols", async function () {
      await agentRegistry.connect(user1).createAgent(
        "Agent 1",
        "TST",
        "Prompt 1",
        "metadata1"
      );

      await expect(
        agentRegistry.connect(user1).createAgent(
          "Agent 2",
          "TST",
          "Prompt 2",
          "metadata2"
        )
      ).to.be.revertedWith("Symbol already exists");
    });

    it("Should get user agents", async function () {
      await agentRegistry.connect(user1).createAgent(
        "Agent 1",
        "AG1",
        "Prompt 1",
        "metadata1"
      );
      await agentRegistry.connect(user1).createAgent(
        "Agent 2",
        "AG2",
        "Prompt 2",
        "metadata2"
      );

      const userAgents = await agentRegistry.getUserAgents(await user1.getAddress());
      expect(userAgents.length).to.equal(2);
    });

    it("Should update agent metadata", async function () {
      const tx = await agentRegistry.connect(user1).createAgent(
        "Test Agent",
        "TST",
        "Test prompt",
        "metadata1"
      );
      await tx.wait();

      const agentId = await agentRegistry.totalAgents();
      await agentRegistry.connect(user1).updateAgent(agentId, "new_metadata");

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.metadataURI).to.equal("new_metadata");
    });

    it("Should transfer agent ownership", async function () {
      const tx = await agentRegistry.connect(user1).createAgent(
        "Test Agent",
        "TST",
        "Test prompt",
        "metadata1"
      );
      await tx.wait();

      const agentId = await agentRegistry.totalAgents();
      await agentRegistry.connect(user1).transferAgent(agentId, await user2.getAddress());

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.owner).to.equal(await user2.getAddress());
    });

    it("Should prevent non-owners from updating", async function () {
      const tx = await agentRegistry.connect(user1).createAgent(
        "Test Agent",
        "TST",
        "Test prompt",
        "metadata1"
      );
      await tx.wait();

      const agentId = await agentRegistry.totalAgents();
      await expect(
        agentRegistry.connect(user2).updateAgent(agentId, "new_metadata")
      ).to.be.revertedWith("Not the owner");
    });
  });

  describe("MONStaking", function () {
    it("Should stake MON tokens", async function () {
      const amount = ethers.parseEther("100");
      await monStaking.connect(user1).stake(amount, { value: amount });

      const stake = await monStaking.stakes(await user1.getAddress());
      expect(stake).to.equal(amount);

      const totalStaked = await monStaking.totalStaked();
      expect(totalStaked).to.equal(amount);
    });

    it("Should assign correct multiplier for Tier 2 (500 MON)", async function () {
      const amount = ethers.parseEther("500");
      await monStaking.connect(user1).stake(amount, { value: amount });

      const multiplier = await monStaking.userMultiplier(await user1.getAddress());
      expect(multiplier).to.equal(125); // 1.25x

      const tier = await monStaking.getUserTier(await user1.getAddress());
      expect(tier.name).to.equal("Devoted Follower");
    });

    it("Should prevent zero stake amount", async function () {
      await expect(
        monStaking.connect(user1).stake(0, { value: 0 })
      ).to.be.revertedWithCustomError(monStaking, "ZeroStakeAmount");
    });

    it("Should unstake MON tokens", async function () {
      const amount = ethers.parseEther("1000");
      await monStaking.connect(user1).stake(amount, { value: amount });

      const unstakeAmount = ethers.parseEther("500");
      await monStaking.connect(user1).unstake(unstakeAmount);

      const remainingStake = await monStaking.stakes(await user1.getAddress());
      expect(remainingStake).to.equal(unstakeAmount);
    });

    it("Should calculate rewards", async function () {
      const amount = ethers.parseEther("500");
      await monStaking.connect(user1).stake(amount, { value: amount });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      const rewards = await monStaking.calculateRewards(await user1.getAddress());
      expect(rewards).to.be.gt(0);
    });

    it("Should claim rewards", async function () {
      const amount = ethers.parseEther("500");
      await monStaking.connect(user1).stake(amount, { value: amount });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      const initialBalance = await ethers.provider.getBalance(await user1.getAddress());
      await monStaking.connect(user1).claimRewards();
      const finalBalance = await ethers.provider.getBalance(await user1.getAddress());

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should return all tiers correctly", async function () {
      const allTiers = await monStaking.getAllTiers();
      expect(allTiers.length).to.equal(5);

      expect(allTiers[0].name).to.equal("Basic Staker");
      expect(allTiers[1].name).to.equal("Devoted Follower");
      expect(allTiers[2].name).to.equal("Holy Disciple");
      expect(allTiers[3].name).to.equal("Apostle");
      expect(allTiers[4].name).to.equal("High Priest");
    });

    it("Should get global stats", async function () {
      await monStaking.connect(user1).stake(ethers.parseEther("500"), { value: ethers.parseEther("500") });
      await monStaking.connect(user2).stake(ethers.parseEther("1000"), { value: ethers.parseEther("1000") });

      const stats = await monStaking.getGlobalStats();
      expect(stats[0]).to.equal(ethers.parseEther("1500"));
      expect(stats[1]).to.equal(2n);
    });
  });

  describe("TokenLaunchpad", function () {
    it("Should deploy a new token", async function () {
      const agentId = 1;
      const tokenName = "Test Token";
      const tokenSymbol = "TTK";
      const initialSupply = ethers.parseEther("1000000");

      const tokenAddress = await tokenLaunchpad.connect(user1).deployToken(
        agentId,
        tokenName,
        tokenSymbol,
        initialSupply
      );

      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);

      const deployedAddress = await tokenLaunchpad.getTokenByAgent(agentId);
      expect(deployedAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should prevent deploying token for same agent twice", async function () {
      const agentId = 1;

      await tokenLaunchpad.connect(user1).deployToken(
        agentId,
        "Token 1",
        "TKN1",
        ethers.parseEther("1000000")
      );

      await expect(
        tokenLaunchpad.connect(user1).deployToken(
          agentId,
          "Token 2",
          "TKN2",
          ethers.parseEther("2000000")
        )
      ).to.be.revertedWithCustomError(tokenLaunchpad, "TokenAlreadyDeployed");
    });

    it("Should prevent deploying token with zero supply", async function () {
      await expect(
        tokenLaunchpad.connect(user1).deployToken(
          1,
          "Test Token",
          "TTK",
          0
        )
      ).to.be.revertedWithCustomError(tokenLaunchpad, "InvalidSupply");
    });

    it("Should get token info", async function () {
      const agentId = 1;
      await tokenLaunchpad.connect(user1).deployToken(
        agentId,
        "Test Token",
        "TTK",
        ethers.parseEther("1000000")
      );

      const tokenAddress = await tokenLaunchpad.getTokenByAgent(agentId);
      const tokenInfo = await tokenLaunchpad.getTokenInfo(tokenAddress);

      expect(tokenInfo.agentId).to.equal(agentId);
      expect(tokenInfo.name).to.equal("Test Token");
      expect(tokenInfo.symbol).to.equal("TTK");
      expect(tokenInfo.creator).to.equal(await user1.getAddress());
    });

    it("Should get all tokens by creator", async function () {
      await tokenLaunchpad.connect(user1).deployToken(1, "Token 1", "TKN1", ethers.parseEther("1000000"));
      await tokenLaunchpad.connect(user1).deployToken(2, "Token 2", "TKN2", ethers.parseEther("2000000"));
      await tokenLaunchpad.connect(user2).deployToken(3, "Token 3", "TKN3", ethers.parseEther("3000000"));

      const user1Tokens = await tokenLaunchpad.getAllTokensByCreator(await user1.getAddress());
      expect(user1Tokens.length).to.equal(2);
    });

    it("Should track total tokens deployed", async function () {
      await tokenLaunchpad.connect(user1).deployToken(1, "Token 1", "TKN1", ethers.parseEther("1000000"));
      await tokenLaunchpad.connect(user2).deployToken(2, "Token 2", "TKN2", ethers.parseEther("2000000"));

      const totalDeployed = await tokenLaunchpad.totalTokensDeployed();
      expect(totalDeployed).to.equal(2n);
    });
  });

  describe("Integration: Agent Registry + Token Launchpad", function () {
    it("Should create agent and deploy token", async function () {
      // Create agent in AgentRegistry
      const tx = await agentRegistry.connect(user1).createAgent(
        "Test Agent",
        "TST",
        "Test prompt",
        "metadata"
      );
      await tx.wait();

      const agentId = await agentRegistry.totalAgents();

      // Deploy token in TokenLaunchpad
      await tokenLaunchpad.connect(user1).deployToken(
        agentId,
        "Agent Token",
        "AGT",
        ethers.parseEther("1000000")
      );

      const tokenAddress = await tokenLaunchpad.getTokenByAgent(agentId);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should handle multiple agents with tokens", async function () {
      // Create first agent
      await agentRegistry.connect(user1).createAgent("Agent 1", "AG1", "Prompt 1", "meta1");
      const agentId1 = await agentRegistry.totalAgents();

      // Create second agent
      await agentRegistry.connect(user1).createAgent("Agent 2", "AG2", "Prompt 2", "meta2");
      const agentId2 = await agentRegistry.totalAgents();

      // Deploy tokens
      await tokenLaunchpad.connect(user1).deployToken(agentId1, "Token 1", "TK1", ethers.parseEther("1000000"));
      await tokenLaunchpad.connect(user1).deployToken(agentId2, "Token 2", "TK2", ethers.parseEther("2000000"));

      // Verify both tokens exist
      const token1 = await tokenLaunchpad.getTokenByAgent(agentId1);
      const token2 = await tokenLaunchpad.getTokenByAgent(agentId2);

      expect(token1).to.not.equal(ethers.ZeroAddress);
      expect(token2).to.not.equal(ethers.ZeroAddress);
      expect(token1).to.not.equal(token2);
    });
  });

  describe("Integration: Staking + Agent System", function () {
    it("Should allow agent creator to stake MON", async function () {
      // Create agent
      await agentRegistry.connect(user1).createAgent("Test Agent", "TST", "Test prompt", "metadata");

      // Stake MON
      await monStaking.connect(user1).stake(ethers.parseEther("1000"), { value: ethers.parseEther("1000") });

      // Verify stake
      const stake = await monStaking.stakes(await user1.getAddress());
      expect(stake).to.equal(ethers.parseEther("1000"));

      // Verify tier (1000 MON falls into Tier 2: 500-2499 MON = 1.25x)
      const tier = await monStaking.getUserTier(await user1.getAddress());
      expect(tier.multiplier).to.equal(125); // 1.25x for 1000 MON
    });

    it("Should handle unstaking and claim rewards", async function () {
      // Stake MON
      await monStaking.connect(user1).stake(ethers.parseEther("500"), { value: ethers.parseEther("500") });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      // Claim rewards
      await monStaking.connect(user1).claimRewards();

      // Unstake
      await monStaking.connect(user1).unstake(ethers.parseEther("250"));

      // Verify remaining stake
      const remainingStake = await monStaking.stakes(await user1.getAddress());
      expect(remainingStake).to.equal(ethers.parseEther("250"));
    });
  });
});
