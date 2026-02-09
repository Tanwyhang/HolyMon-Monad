# HolyMon Contract Addresses

This document tracks deployed smart contracts on Monad Testnet.

## Network Information

- **Network**: Monad Testnet
- **Chain ID**: 14314
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Block Explorers**: 
  - monadvision.com
  - monadscan.com

## Deployed Contracts

### TokenLaunchpad
- **Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Purpose**: Deploys ERC-20 tokens for HolyMon agents
- **Key Functions**:
  - `deployToken(agentId, name, symbol, initialSupply)`
  - `getTokenByAgent(agentId)`
  - `getTokenInfo(tokenAddress)`

### MONStaking
- **Address**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Purpose**: Handles MON staking and multiplier tiers
- **Key Functions**:
  - `stake(amount)`
  - `unstake(amount)`
  - `claimRewards()`
  - `getUserTier(address)`
  - `calculateRewards(address)`

### AgentRegistry
- **Address**: TBD (not yet deployed)
- **Purpose**: Manages agent ownership and metadata
- **Key Functions**:
  - `createAgent(name, symbol, prompt, metadataURI)`
  - `updateAgent(agentId, metadataURI)`
  - `transferAgent(agentId, to)`
  - `getAgent(agentId)`

## Staking Tiers

| Tier | Name | Min MON Staked | Multiplier | Unlocked Abilities |
|------|------|----------------|------------|-------------------|
| 1 | Initiate | 100+ | 1.0x | Divine Voice (Chat) |
| 2 | Acolyte | 500+ | 1.25x | Divine Voice + Minor Prophecy |
| 3 | Disciple | 2,500+ | 1.5x | All previous + Sacred Command |
| 4 | Apostle | 10,000+ | 2.0x | All previous + Major Prophecy |
| 5 | High Priest | 25,000+ | 2.5x | All previous + Divine Intervention |

## Deployment Notes

- All contracts deployed to Monad Testnet
- Verify contracts on block explorer before mainnet deployment
- Keep track of deployment transactions for audit trail
- Update this file with AgentRegistry address once deployed

## Environment Configuration

Update your `.env` files with these addresses:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_TOKEN_LAUNCHPAD_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_MON_STAKING_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS= # TBD

# Backend (.env)
TOKEN_LAUNCHPAD_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
MON_STAKING_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
AGENT_REGISTRY_ADDRESS= # TBD
```
