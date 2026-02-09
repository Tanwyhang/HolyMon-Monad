"""
Tests for HolyMon smart contracts
"""

import pytest
from ape import accounts, project


@pytest.fixture
def deployer():
    return accounts.test_accounts[0]


@pytest.fixture
def agent_registry(deployer):
    return project.AgentRegistry.deploy(sender=deployer)


@pytest.fixture
def token_launchpad(deployer, agent_registry):
    return project.TokenLaunchpad.deploy(
        agent_registry.address,
        sender=deployer
    )


@pytest.fixture
def mon_staking(deployer):
    return project.MONStaking.deploy(sender=deployer)


class TestAgentRegistry:
    def test_create_agent(self, agent_registry, deployer):
        receipt = agent_registry.createAgent(
            "Test Agent",
            "TST",
            "A test agent prompt",
            "ipfs://metadata",
            sender=deployer
        )
        # Get agentId from totalAgents count (it should be 1 after creation)
        agent_id = agent_registry.totalAgents()
        assert agent_id == 1

        agent = agent_registry.getAgent(agent_id)
        assert agent.name == "Test Agent"
        assert agent.symbol == "TST"
        assert agent.owner == deployer.address

    def test_symbol_uniqueness(self, agent_registry, deployer):
        agent_registry.createAgent(
            "Test Agent 1",
            "TST",
            "Prompt 1",
            "metadata1",
            sender=deployer
        )
        
        with pytest.raises(Exception) as exc_info:
            agent_registry.createAgent(
                "Test Agent 2",
                "TST",
                "Prompt 2",
                "metadata2",
                sender=deployer
            )
        assert "Symbol already exists" in str(exc_info.value)

    def test_get_user_agents(self, agent_registry, deployer):
        agent_registry.createAgent(
            "Agent 1",
            "AG1",
            "Prompt 1",
            "metadata1",
            sender=deployer
        )
        agent_registry.createAgent(
            "Agent 2",
            "AG2",
            "Prompt 2",
            "metadata2",
            sender=deployer
        )
        
        user_agents = agent_registry.getUserAgents(deployer.address)
        assert len(user_agents) == 2


class TestMONStaking:
    def test_stake(self, mon_staking, deployer):
        mon_staking.stake(100 * 10**18, value=100 * 10**18, sender=deployer)
        assert mon_staking.stakes(deployer.address) == 100 * 10**18
        assert mon_staking.totalStaked() == 100 * 10**18

    def test_calculate_rewards(self, mon_staking, deployer):
        mon_staking.stake(500 * 10**18, value=500 * 10**18, sender=deployer)
        
        # Tier 2 (500 MON) should have 1.25x multiplier
        assert mon_staking.userMultiplier(deployer.address) == 125

    def test_unstake(self, mon_staking, deployer):
        mon_staking.stake(1000 * 10**18, value=1000 * 10**18, sender=deployer)
        mon_staking.unstake(500 * 10**18, sender=deployer)
        
        assert mon_staking.stakes(deployer.address) == 500 * 10**18
        assert mon_staking.totalStaked() == 500 * 10**18


class TestTokenLaunchpad:
    def test_deploy_token(self, token_launchpad, agent_registry, deployer):
        # First create an agent
        agent_receipt = agent_registry.createAgent(
            "Test Agent",
            "TST",
            "Test prompt",
            "metadata",
            sender=deployer
        )
        agent_id = agent_registry.totalAgents()
        
        # Deploy token for the agent
        token_receipt = token_launchpad.deployToken(
            agent_id,
            "Test Token",
            "TTK",
            1_000_000 * 10**18,
            sender=deployer
        )
        # In Ape, for return values we might need to use call or check events
        # But for deployment via transaction, we look for the address
        # Let's try to find it via getter since we know the agentId
        token_address = token_launchpad.getTokenByAgent(agent_id)
        
        assert str(token_address) != "0x0000000000000000000000000000000000000000"
        
        token_info = token_launchpad.getTokenInfo(token_address)
        assert token_info.agentId == agent_id
        assert token_info.creator == deployer.address

    def test_get_token_by_agent(self, token_launchpad, agent_registry, deployer):
        agent_receipt = agent_registry.createAgent(
            "Test Agent",
            "TST",
            "Test prompt",
            "metadata",
            sender=deployer
        )
        agent_id = agent_registry.totalAgents()
        
        token_receipt = token_launchpad.deployToken(
            agent_id,
            "Test Token",
            "TTK",
            1_000_000 * 10**18,
            sender=deployer
        )
        # token_address = token_receipt.return_value # Return value might not be available in tx receipt directly
        
        found_address = token_launchpad.getTokenByAgent(agent_id)
        assert found_address != "0x0000000000000000000000000000000000000000"