# HolyMon Smart Contracts

Smart contracts for the HolyMon platform, built with APE Framework.

## Contracts

### AgentRegistry.sol
Manages agent creation, storage, and ownership.
- Create agents with unique symbols
- Transfer agent ownership
- Update agent metadata
- Max 50 agents per user

### TokenLaunchpad.sol
Deploys ERC-20 tokens for each agent.
- Deploys standard ERC-20 tokens
- Links tokens to agents
- Tracks all deployed tokens
- Queries tokens by agent or creator

### MONStaking.sol
Native MON staking with tiered multipliers.
- 5 staking tiers (100-25,000+ MON)
- Multipliers from 1x to 2.5x
- Reward distribution based on stake and multiplier
- Lock-free unstaking with pending reward claiming

## Staking Tiers

| Tier | Min Stake | Multiplier | Name |
|------|-----------|------------|------|
| 1 | 100 MON | 1x | Basic Staker |
| 2 | 500 MON | 1.25x | Devoted Follower |
| 3 | 2,500 MON | 1.5x | Holy Disciple |
| 4 | 10,000 MON | 2x | Apostle |
| 5 | 25,000+ MON | 2.5x | High Priest |

## Setup

### Prerequisites
- Python 3.10+
- Conda or venv
- APE Framework

### Installation

```bash
# Create conda environment
conda create -n ape python=3.12 -y
conda activate ape

# Install APE with recommended plugins
pip install eth-ape"[recommended-plugins]"
```

### Environment

Create a `.env` file in the contracts directory:

```env
# For Monad testnet deployment
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
MONAD_TESTNET_PRIVATE_KEY=your_private_key_here
```

## Usage

### Compile Contracts

```bash
source /Users/wy/miniconda3/etc/profile.d/conda.sh
conda activate ape
ape compile
```

### Run Tests

```bash
ape test
```

### Deploy to Monad Testnet

```bash
ape run deploy --network monad-testnet
```

### Interactive Console

```bash
ape console --network monad-testnet
```

## Development

### Project Structure

```
contracts/
├── contracts/           # Solidity contracts
│   ├── AgentRegistry.sol
│   ├── TokenLaunchpad.sol
│   ├── MONStaking.sol
│   └── IERC20.sol
├── scripts/            # Deployment scripts
│   └── deploy.py
├── tests/              # Test files
│   └── test_contracts.py
├── ape-config.yaml     # APE configuration
└── README.md           # This file
```

### Network Configuration

Default network: Monad Testnet
- Chain ID: 14314
- RPC: https://testnet-rpc.monad.xyz
- Explorers: monadvision.com, monadscan.com

## License

MIT