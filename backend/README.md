# HolyMon Backend

HolyMon backend service built with Bun, providing ERC-8004 centric agent management and HolyMon services.

## Tech Stack

### **🎯 Runtime & Language**
- **Bun** - Fast JavaScript runtime (drop-in replacement for Node.js)
- **TypeScript** - Type-safe JavaScript with full type checking

### **🌐 HTTP Server & Routing**
- **Bun.serve()** - Native Bun HTTP server with WebSocket support
- **Custom routing** - Hand-rolled routing system (no Express/Fastify)
- **CORS enabled** - Cross-origin resource sharing configured

### **🔗 Blockchain Integration**
- **viem** - TypeScript interface for Ethereum (replaces ethers.js)
- **Hardhat** - Contract deployment and testing framework
- **Local Hardhat network** - For development and testing

### **📊 Data & State**
- **In-memory** - No database (contracts store persistent state)
- **Contract storage** - On-chain data via deployed smart contracts
- **Agent metadata** - Stored in ERC-8004 agent cards (IPFS/HTTP)

### **🔧 Development Tools**
- **TypeScript** - Full type safety across the stack
- **ESLint/Prettier** - Code quality and formatting
- **Hot reloading** - `bun --hot` for development

### **📦 Key Dependencies**
```json
{
  "viem": "^2.45.2",        // Ethereum interactions
  "zod": "^3.25.76",        // Runtime type validation
  "@types/bun": "latest"    // Bun type definitions
}
```

### **🏗️ Architecture Pattern**
- **Service-oriented** - Modular services (ContractService, ERC8004Service)
- **Route handlers** - Clean separation of HTTP routing and business logic
- **Environment-based config** - Flexible configuration system

## Setup

### Prerequisites
- Bun runtime installed
- Node.js (for some tooling compatibility)

### Installation

```bash
# Install dependencies
bun install
```

### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Monad Network Configuration
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=31337  # Local: 31337, Testnet: 10143
PRIVATE_KEY=your_private_key_here

# Contract Addresses (after deployment)
TOKEN_LAUNCHPAD_ADDRESS=0x...
MON_STAKING_ADDRESS=0x...

# Walrus Storage
WALRUS_PUBLISHER=https://publisher.testnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator.testnet.walrus.space

# ElizaOS (optional)
OPENAI_API_KEY=your_openai_key
ELIZAOS_MODEL_PROVIDER=openai

# Server
PORT=3001
NODE_ENV=development
API_KEY=your_api_key
```

### Development

```bash
# Start development server with hot reloading
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### ERC-8004 Integration
- `GET /api/erc8004/agent/:tokenId` - Get ERC-8004 agent identity
- `GET /api/erc8004/agent/:tokenId/reputation` - Get agent reputation
- `POST /api/erc8004/feedback/:tokenId` - Submit feedback for agent
- `GET /api/erc8004/discover` - Discover agents (with filters)

### HolyMon Services (for ERC-8004 agents)
- `POST /api/holymon/:tokenId/launch-token` - Enable token launchpad
- `POST /api/holymon/:tokenId/stake-mon` - Enable MON staking
- `GET /api/holymon/:tokenId/status` - Get HolyMon service status

### Legacy Endpoints (Deprecated)
- `POST /api/agents` - Create HolyMon agent (use ERC-8004)
- `GET /api/agents/:id` - Get HolyMon agent (use ERC-8004)
- `POST /api/tokens/deploy` - Deploy token (use HolyMon services)
- `POST /api/staking/stake` - Stake MON (use HolyMon services)

## Agent Tracking

Users track their agents through **ERC-8004 Identity Registry ownership**:

1. **ERC-8004 Token Ownership**
   - Agents are ERC-721 tokens in the ERC-8004 Identity Registry
   - Ownership is tracked on-chain: `ownerOf(tokenId)`
   - Users query agents they own by their wallet address

2. **Agent Discovery**
   - `GET /api/erc8004/discover?owner=0x...` - Find all agents owned by an address
   - Returns array of ERC-8004 token IDs owned by the user

3. **Service Status Tracking**
   - `GET /api/holymon/:tokenId/status` - Check HolyMon services for each agent
   - Agent cards store HolyMon service metadata (tokens, staking, etc.)

### Frontend Implementation Example

```typescript
// Get all agents owned by user
const userAgents = await fetch(`/api/erc8004/discover?owner=${userAddress}`);

// For each agent, get HolyMon service status
const agentStatuses = await Promise.all(
  userAgents.map(agent =>
    fetch(`/api/holymon/${agent.tokenId}/status`)
  )
);
```

## Architecture

### Core Services

- **ContractService** - Blockchain contract interactions (TokenLaunchpad, MONStaking)
- **ERC8004Service** - ERC-8004 registry integration and agent card management
- **Route Handlers** - HTTP request handling and response formatting

### Data Flow

1. **Client Request** → Route Handler
2. **Route Handler** → Service Layer (validation, business logic)
3. **Service Layer** → Contract Interactions (viem)
4. **Response** ← Formatted data with proper HTTP status

### Security

- **Type safety** - TypeScript prevents runtime errors
- **Input validation** - Zod schemas for request validation
- **Private key management** - Secure key handling (when available)
- **CORS configuration** - Controlled cross-origin access

## Deployment

### Local Development
```bash
bun run dev  # Starts on http://localhost:3001
```

### Production
```bash
bun run build
bun run start
```

### Docker (future)
```dockerfile
FROM oven/bun:latest
COPY . .
RUN bun install
EXPOSE 3001
CMD ["bun", "run", "start"]
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing patterns for service organization
- Add proper error handling and logging
- Use Zod for input validation

### Testing
```bash
bun test  # Run test suite
```

### API Documentation
- All endpoints return JSON responses
- Error responses include `error`, `message`, and optional `details`
- Success responses include `success: true` and `data` field

This project uses Bun as a fast all-in-one JavaScript runtime. [Learn more about Bun](https://bun.com).
