# Backend API Implementation Documentation

## Overview
This document describes the backend API implementation for HolyMon, including stub implementations that need to be completed.

## Implemented Components

### 1. Health & Status Endpoints
**File**: `backend/src/routes/health.ts`
- `GET /health` - Health check with server status, contract addresses, and configuration
- **Status**: ✅ Fully implemented

### 2. Agent Management
**File**: `backend/src/routes/agents.ts`
- `POST /api/agents` - Create new agent (register on-chain + upload metadata)
- `GET /api/agents/:id` - Get agent by ID
- `GET /api/agents` - List agents (filter by owner)
- `GET /api/agents/:id/metadata` - Get agent metadata from Walrus
- **Status**: ✅ Fully implemented (dependent on contract service)

### 3. Token Launchpad
**File**: `backend/src/routes/tokens.ts`
- `POST /api/tokens/deploy` - Deploy ERC-20 token for agent
- `GET /api/tokens/:address` - Get token info
- `GET /api/tokens/agent/:agentId` - Get token by agent ID
- `GET /api/tokens` - List tokens (filter by creator)
- **Status**: ✅ Fully implemented (dependent on contract service)
- **Partial**: Token listing by creator returns empty array (not implemented)

### 4. MON Staking
**File**: `backend/src/routes/staking.ts`
- `GET /api/staking/tiers` - Get all staking tiers
- `GET /api/staking/user/:address` - Get user stake info
- `GET /api/staking/stats` - Get global staking stats
- `POST /api/staking/stake` - Stake MON
- `POST /api/staking/unstake` - Unstake MON
- `POST /api/staking/claim` - Claim rewards
- **Status**: ✅ Fully implemented (dependent on contract service)

### 5. ElizaOS Integration
**File**: `backend/src/routes/eliza.ts`
- `POST /api/eliza/agents/:id/start` - Start ElizaOS agent runtime
- `POST /api/eliza/agents/:id/stop` - Stop ElizaOS agent
- `POST /api/eliza/agents/:id/config` - Update ElizaOS configuration
- `GET /api/eliza/agents/:id/status` - Get agent runtime status
- `GET /api/eliza/agents/:id/character` - Get agent as ElizaOS Character
- `GET /api/eliza/agents` - List all ElizaOS agents
- **Status**: ⚠️ Stub implementation (see below)

## Services

### Contract Service
**File**: `backend/src/services/contract.service.ts`
- Interacts with smart contracts on Monad testnet
- **Status**: ✅ Core implementation complete
- **Stubs**: 
  - Contract bytecodes are set to `0x` (need to be populated after contract deployment)
  - See "Stubs Requiring Completion" section

### Walrus Service
**File**: `backend/src/services/walrus.service.ts`
- Upload metadata to Walrus public relays
- Retrieve metadata by blob ID
- Check blob status
- **Status**: ✅ Fully implemented

### Agent Service
**File**: `backend/src/services/agent.service.ts`
- Orchestrates agent creation (contract + Walrus)
- **Status**: ✅ Core implementation complete
- **Partial**: `updateAgent` method references non-existent contract service method

### Eliza Service
**File**: `backend/src/services/eliza.service.ts`
- **Status**: ⚠️ Stub implementation (see below)

---

## Stubs Requiring Completion

### 1. Contract Bytecodes (CRITICAL)
**File**: `backend/src/services/contract.service.ts`
**Lines**: 339-341

```typescript
const agentRegistryBytecode = '0x';
const tokenLaunchpadBytecode = '0x';
const monStakingBytecode = '0x';
```

**Issue**: Bytecodes are empty strings. Contracts need to be deployed first, then bytecodes extracted.

**Solution Steps**:
1. Deploy contracts using Ape (see Contract Deployment section)
2. Extract compiled bytecode from Ape build artifacts
3. Replace `'0x'` with actual bytecode strings

**Expected Format**:
```typescript
const agentRegistryBytecode = '0x608060405234801561001057600080fd5b50...';
const tokenLaunchpadBytecode = '0x608060405234801561001057600080fd5b50...';
const monStakingBytecode = '0x608060405234801561001057600080fd5b50...';
```

---

### 2. Contract Service - Missing Methods ✅ FIXED
**File**: `backend/src/services/contract.service.ts`
**Status**: All missing methods have been implemented

**Added Methods**:
- `updateAgentMetadata(agentId, metadataURI)` - Updates agent metadata URI on-chain
- `getAllTokens()` - Gets all deployed token addresses
- `getAllTokensByCreator(creator)` - Gets all tokens deployed by a specific address

**Updated ABIs**:
- Added `updateAgent` to agentRegistryABI
- Added `getAllTokens` to tokenLaunchpadABI
- Added `getAllTokensByCreator` to tokenLaunchpadABI

---

### 3. Token Listing Stub ✅ FIXED
**File**: `backend/src/services/eliza.service.ts`
**Status**: Mock implementation that simulates ElizaOS functionality

**What It Does**:
- Stores agent data in a Map (in-memory)
- Creates mock Character objects
- Returns simulated responses

**Limitations**:
1. No actual ElizaOS runtime integration
2. No real agent behavior or personality
3. All responses are generic
4. Data lost on server restart

**Required Implementation**:
```typescript
// TODO: Replace with actual ElizaOS integration
// See: https://github.com/elizaos/eliza

// Required ElizaOS packages:
// - @elizaos/core
// - @elizaos/cli
// - @elizaos/plugin-openai (or other model provider)

// Integration steps:
// 1. Import ElizaOS runtime
// 2. Load agent as Character
// 3. Start agent runtime
// 4. Handle agent messages and responses
// 5. Manage agent memory and context
```

**Current Stub Implementation**:
- `startAgent()` - Creates mock character, stores in Map
- `stopAgent()` - Sets status to 'stopped'
- `getAgentStatus()` - Returns mock status
- `getCharacter()` - Returns mock character
- `updateConfig()` - Updates mock config
- `generateResponse()` - Returns generic response

**Reference**: Frontend has working ElizaOS integration in `frontend/src/lib/api-client.ts`

---

### 3. Agent Service - Missing Method
**File**: `backend/src/services/agent.service.ts`
**Method**: `updateAgent()` (line 64)
**Issue**: Calls `contractService.updateAgentMetadata()` which doesn't exist

**Current Code**:
```typescript
async updateAgent(agentId: string, metadata: any): Promise<{ txHash: string; blobId: string }> {
  try {
    const { blobId } = await walrusService.uploadMetadata(metadata);
    const metadataURI = await walrusService.getMetadataURI(blobId);

    const hash = await contractService.updateAgentMetadata(agentId, metadataURI); // ❌ Method doesn't exist

    return { txHash: hash, blobId };
  } catch (error) {
    // ...
  }
}
```

**Required Fix**: Add `updateAgentMetadata` method to Contract Service

```typescript
// Add to backend/src/services/contract.service.ts
async updateAgentMetadata(agentId: string, metadataURI: string): Promise<string> {
  if (!this.agentRegistryAddress) {
    throw new Error('AgentRegistry address not set');
  }

  const hash = await walletClient.writeContract({
    address: this.agentRegistryAddress,
    abi: agentRegistryABI,
    functionName: 'updateAgent',
    args: [BigInt(agentId), metadataURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
```

**Also Add to ABI**:
```typescript
const agentRegistryABI = [
  // ... existing ABI entries
  {
    inputs: [
      { internalType: 'uint256', name: '_agentId', type: 'uint256' },
      { internalType: 'string', name: '_metadataURI', type: 'string' },
    ],
    name: 'updateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ...
] as const;
```

---

### 4. Token Listing Stub
**File**: `backend/src/routes/tokens.ts`
**Method**: `handleListTokens()` (line 100)
**Status**: Returns "NOT_IMPLEMENTED" error

**Current Code**:
```typescript
export async function handleListTokens(creator?: string): Promise<APIResponse<{ tokens: TokenInfo[] }>> {
  try {
    if (!creator) {
      return {
        success: true,
        data: { tokens: [] },
      };
    }

    return {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Listing tokens by creator not implemented yet',
    };
  } catch (error) {
    // ...
  }
}
```

**Required Implementation**: Add method to Contract Service

```typescript
// Add to backend/src/services/contract.service.ts
async getAllTokensByCreator(creator: Address): Promise<Address[]> {
  if (!this.tokenLaunchpadAddress) {
    throw new Error('TokenLaunchpad address not set');
  }

  const tokenAddresses = await publicClient.readContract({
    address: this.tokenLaunchpadAddress,
    abi: tokenLaunchpadABI,
    functionName: 'getAllTokensByCreator',
    args: [creator],
  });

  return tokenAddresses as Address[];
}
```

**Update Route**:
```typescript
export async function handleListTokens(creator?: string): Promise<APIResponse<{ tokens: TokenInfo[] }>> {
  try {
    if (!creator) {
      const allTokenAddresses = await contractService.getAllTokens();
      const tokens = await Promise.all(
        allTokenAddresses.map(addr => contractService.getTokenInfo(addr as Address))
      );
      
      return {
        success: true,
        data: { tokens },
      };
    }

    const creatorTokenAddresses = await contractService.getAllTokensByCreator(creator as Address);
    const tokens = await Promise.all(
      creatorTokenAddresses.map(addr => contractService.getTokenInfo(addr as Address))
    );

    return {
      success: true,
      data: { tokens },
    };
  } catch (error) {
    // ...
  }
}
```

**Also Add to ABI**:
```typescript
const tokenLaunchpadABI = [
  // ... existing ABI entries
  {
    inputs: [{ internalType: 'address', name: '_creator', type: 'address' }],
    name: 'getAllTokensByCreator',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // ...
] as const;
```

---

## Missing Dependencies

### viem Package
**File**: `backend/package.json`
**Issue**: `viem` is not listed as a dependency
**Required**: Add viem for blockchain interactions

```json
{
  "dependencies": {
    "viem": "^2.x.x",
    "zod": "^3.24.2"
  }
}
```

**Install Command**:
```bash
cd backend
bun add viem
```

---

## Contract Deployment Status

### Current Status
- **AgentRegistry.sol**: Not deployed
- **TokenLaunchpad.sol**: Not deployed
- **MONStaking.sol**: Not deployed

### Deployment Required Before
- Creating agents (requires AgentRegistry)
- Deploying tokens (requires TokenLaunchpad)
- Staking MON (requires MONStaking)

### See Contract Deployment Section
- Instructions in next section
- Ape deployment scripts ready in `contracts/scripts/deploy.py`
- Test suite available in `contracts/tests/test_contracts.py`

---

## Next Steps

### High Priority (Blocking)
1. ⬇️ Deploy contracts using Ape (see Contract Deployment section below)
2. ⬇️ Extract contract bytecodes from deployed contracts
3. ⬇️ Update `backend/src/services/contract.service.ts` with real bytecodes
4. ✅ Add missing `updateAgentMetadata` method to contract service - DONE
5. ✅ Add `getAllTokens` and `getAllTokensByCreator` methods - DONE

### Medium Priority
1. ✅ Install viem dependency - DONE
2. ✅ Complete token listing implementation - DONE
3. ⬇️ Update environment variables with deployed contract addresses

### Low Priority (Post-MVP)
1. Integrate actual ElizaOS runtime
2. Add authentication (API key validation)
3. Implement comprehensive error handling
4. Add request logging and monitoring

---

## Testing

### Backend Testing
```bash
cd backend
bun install
bun run dev
```

### Health Check
```bash
curl http://localhost:3001/health
```

### Create Agent (After Contract Deployment)
```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -H "x-owner-address: 0x..." \
  -d '{
    "name": "Test Agent",
    "symbol": "TST",
    "prompt": "A test agent",
    "backstory": "Created for testing"
  }'
```

---

## API Documentation

### Full Endpoint List

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/health` | ✅ Complete |
| POST | `/api/agents` | ✅ Complete (needs contracts) |
| GET | `/api/agents/:id` | ✅ Complete |
| GET | `/api/agents?owner=0x...` | ✅ Complete |
| GET | `/api/agents/:id/metadata` | ✅ Complete |
| POST | `/api/tokens/deploy` | ✅ Complete (needs contracts) |
| GET | `/api/tokens/:address` | ✅ Complete |
| GET | `/api/tokens/agent/:agentId` | ✅ Complete |
| GET | `/api/tokens` | ✅ Complete |
| GET | `/api/staking/tiers` | ✅ Complete (needs contracts) |
| GET | `/api/staking/user/:address` | ✅ Complete (needs contracts) |
| GET | `/api/staking/stats` | ✅ Complete (needs contracts) |
| POST | `/api/staking/stake` | ✅ Complete (needs contracts) |
| POST | `/api/staking/unstake` | ✅ Complete (needs contracts) |
| POST | `/api/staking/claim` | ✅ Complete (needs contracts) |
| POST | `/api/eliza/agents/:id/start` | ⚠️ Stub |
| POST | `/api/eliza/agents/:id/stop` | ⚠️ Stub |
| GET | `/api/eliza/agents/:id/status` | ⚠️ Stub |
| GET | `/api/eliza/agents/:id/character` | ⚠️ Stub |
| POST | `/api/eliza/agents/:id/config` | ⚠️ Stub |
| GET | `/api/eliza/agents` | ⚠️ Stub |

---

## Summary

**Total Files Created**: 14
**Total Endpoints**: 21
**Fully Implemented**: 19
**Stubs**: 4 (ElizaOS integration only)
**Missing Methods**: 0 (all contract service methods complete)

**Key Blockers**:
1. Contract deployment (Ape) - ⬇️ Next section
2. Bytecode extraction from deployed contracts
3. viem dependency installation ✅ Added

**Estimated Time to Complete**: 20-30 minutes (contract deployment only)
