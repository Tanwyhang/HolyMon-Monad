# HolyMon Smart Contracts

Smart contracts for the HolyMon platform, built with Hardhat.

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
- Node.js 18+
- Bun (for package management)
- Hardhat (installed via bun)

### Installation

```bash
# Install dependencies
bun install
```

### Environment

Create a `.env` file in contracts directory:

```env
# For Monad testnet deployment
MONAD_TESTNET_PRIVATE_KEY=your_private_key_here
```

## Usage

### Compile Contracts

```bash
bun run compile
# or
hardhat compile
```

### Run Tests

```bash
bun run test
# or
hardhat test
```

### Deploy to Local Network

```bash
# Start local node in another terminal
hardhat node

# Deploy contracts
bun run deploy
# or
hardhat run scripts/deploy.js --network localhost
```

### Deploy to Monad Testnet

```bash
bun run deploy --network monad-testnet
# or
hardhat run scripts/deploy.js --network monad-testnet
```

### Interactive Console

```bash
hardhat console --network monad-testnet
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
│   └── deploy.js
├── test/               # Test files
│   └── HolyMon.test.js
├── hardhat.config.js   # Hardhat configuration
└── README.md           # This file
```

### Network Configuration

Default network: Hardhat (local)
- Chain ID: 1337
- RPC: http://127.0.0.1:8545

Monad Testnet:
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- Explorer: https://testnet.monadscan.com

### Writing Tests

Tests are written using Hardhat's Mocha/Chai framework:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyContract", function () {
  it("Should do something", async function () {
    const [owner] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    const contract = await Contract.deploy();

    expect(await contract.someFunction()).to.equal(expectedValue);
  });
});
```

## License

MIT
