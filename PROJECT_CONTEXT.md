# HolyMon Project Context

This file serves as the native context for all HolyMon development work. Reference this document for architectural decisions, technology stack, implementation phases, and project scope.

---

## Architecture Overview

Three-Tier System:
1. **Smart Contract Layer (Monad Testnet)**
   - AgentRegistry: Manages agent ownership and metadata
   - TokenLaunchpad: Deploys ERC-20 tokens for each agent
   - MONStaking: Handles MON staking and multiplier tiers

2. **Backend Service Layer (Node.js + Embedded ElizaOS)**
   - REST API for frontend communication
   - ElizaOS integration for agent personality/behavior
   - Walrus storage client for metadata persistence
   - Contract interaction layer

3. **Frontend Application Layer (Next.js)**
   - Wallet connection via wagmi
   - Vault dashboard for agent management
   - Agent creation wizard (4-step process)
   - Real-time updates via polling

---

## Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Blockchain | Monad Testnet | Chain ID: 14314, RPC: https://testnet-rpc.monad.xyz |
| Smart Contracts | Solidity + Foundry | Gas-optimized, fast testing |
| Token | MON (native) | Direct MON staking, no wrapping needed |
| Storage | Walrus + Public Relays | Testnet: https://upload-relay.testnet.walrus.space |
| Backend | Node.js + TypeScript + ElizaOS | Embedded ElizaOS packages |
| Frontend | Next.js 14 + React 18 + TypeScript | Modern React framework |
| Wallet | wagmi + viem | Web3 wallet integration |
| Database | PGLite (ElizaOS built-in) | SQLite-based, no setup needed |

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Network | Monad Testnet | Free testing, low gas, faster iterations |
| MON Handling | Native MON (no wrapping) | Simpler staking, lower gas costs |
| ElizaOS Integration | Embedded in backend | Tighter integration, shared database |
| Walrus Storage | Public relays | No infrastructure setup, free for small volumes |
| Expected Volume | 1-100 agents | MVP scope, can scale later |
| Contract Framework | Foundry + Solidity | Gas optimization, fast testing |

---

## Project Structure

```
holymon/
├── contracts/              # Foundry smart contracts
│   ├── src/
│   │   ├── AgentRegistry.sol
│   │   ├── TokenLaunchpad.sol
│   │   └── MONStaking.sol
│   ├── test/
│   └── foundry.toml
├── backend/                # Node.js + ElizaOS backend
│   ├── src/
│   │   ├── agents/         # ElizaOS agent management
│   │   ├── api/            # Express REST API
│   │   ├── services/       # Business logic
│   │   │   ├── walrus.client.ts
│   │   │   ├── agent.service.ts
│   │   │   └── token.service.ts
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Next.js frontend
│   ├── app/
│   │   ├── vault/
│   │   ├── agents/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── vault/
│   │   ├── agents/
│   │   └── common/
│   ├── lib/
│   │   ├── contracts/
│   │   └── api/
│   └── package.json
├── .env.example
└── README.md
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=14314
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
NEXT_PUBLIC_TOKEN_LAUNCHPAD_ADDRESS=
NEXT_PUBLIC_MON_STAKING_ADDRESS=
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.testnet.walrus.space
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=14314
PRIVATE_KEY=your_private_key_here
OPENAI_API_KEY=your_openai_key_here
WALRUS_PUBLISHER=https://publisher.testnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator.testnet.walrus.space
DATABASE_URL=pglite://./holymon.db
```

---

## Implementation Phases

### Phase 0: Environment Setup (Week 0.5)
- Install Node.js 23.3.0, Bun, Foundry, ElizaOS CLI
- Initialize project structure
- Configure environment variables

### Phase 1: Smart Contract Development (Week 1-2)

#### AgentRegistry Contract
- Data structures for storing agent metadata
- CRUD operations for agents
- Symbol uniqueness enforcement
- Maximum agents per user limit (50)
- Event emissions for frontend indexing

#### TokenLaunchpad Contract
- ERC-20 token deployment for each agent
- Capped supply mechanism
- Ownership transfer to agent creator
- Integration with AgentRegistry

#### MONStaking Contract
- Staking/unstaking MON to agents
- Multiplier tier calculation (5 tiers)
- Reward calculation logic
- Emergency withdrawal function

#### Deployment & Testing
- Deploy to Monad testnet
- Verify contracts on explorer
- Run Foundry test suite
- Security audit checklist

**Multiplier Tiers:**
- Tier 1: 100+ MON
- Tier 2: 1,000+ MON
- Tier 3: 5,000+ MON
- Tier 4: 10,000+ MON
- Tier 5: 25,000+ MON

### Phase 2: Backend Service Development (Week 2-3)

#### ElizaOS Integration
- Initialize ElizaOS server with custom configuration
- Create agent personality templates
- Implement agent prompt generation
- Set up agent memory/context storage

#### Walrus Storage Client
- Upload agent metadata to Walrus via public relays
- Retrieve metadata using blob IDs
- Handle versioning for metadata updates
- Error handling for network issues

#### REST API Endpoints
```
POST   /api/agents                    Create new agent
GET    /api/agents/:id                Get agent by ID
GET    /api/agents                    Get user's agents
PUT    /api/agents/:id                Update agent metadata
POST   /api/agents/:id/stake          Stake MON to agent
POST   /api/agents/:id/unstake        Unstake MON from agent
GET    /api/agents/:id/multiplier     Get current multiplier tier
POST   /api/tokens/deploy             Deploy new token
GET    /api/tokens/:address           Get token info
GET    /api/tokens/:address/holders   Get token holders
```

#### Contract Interaction Layer
- Wallet initialization for backend transactions
- Transaction signing and broadcasting
- Gas estimation and optimization
- Transaction status tracking

### Phase 3: Frontend Development (Week 3-4)

#### Core Pages

**Page 1: Holy Vault Dashboard**
- Grid view of all user's agents
- Agent cards with key metrics (name, symbol, staked MON, tier)
- Quick action buttons (View, Edit, Stake, Deploy Token)
- Empty state with CTA to create first agent
- Stats summary (total agents, total staked, average multiplier)

**Page 2: Agent Creation Wizard (4 Steps)**

*Step 1: Basic Info*
- Religion name input (3-50 characters)
- Token symbol input (3-10 characters, uppercase)
- Icon upload (512x512 max, optional)
- Real-time validation
- Symbol uniqueness check via API

*Step 2: Core Beliefs*
- Tenets editor (3-10 tenets, 20-100 chars each)
- Scripture input (optional, multi-line)
- Backstory input (optional, 50-500 chars)
- Character count display

*Step 3: Personality Configuration*
- Personality type dropdown (Logical, Charismatic, Aggressive, Mysterious, Compassionate)
- Persuasion style selection (Debate, Storytelling, Memes, Miracles, Community)
- Traits selector (3-6 from predefined list)
- Visual trait badges

*Step 4: Preview & Deploy*
- Complete agent profile preview
- Deploy token checkbox (optional)
- Create button triggers backend API
- Loading states and progress indicators
- Success modal with agent ID

**Page 3: Agent Detail View (5 Tabs)**

*Tab 1: Overview*
- Agent profile with icon and key stats
- Tenets displayed as cards
- Scripture quotes section
- Creation date and timestamps

*Tab 2: Token Management*
- Token deployment status
- Token address with explorer link
- Supply information (total, max, circulating)
- Holder count
- Token transfer form

*Tab 3: Staking*
- Current stake amount display
- Multiplier tier with visual progress bar
- Stake form (MON amount input)
- Unstake form
- Transaction history

*Tab 4: Edit*
- Edit all metadata fields
- Save button with confirmation
- Changes reflected immediately

*Tab 5: Simulator*
- Placeholder for v2
- "Test in Sandbox" button
- NPC debate preview

#### Key Components
- **Wallet Connector**: MetaMask, WalletConnect support, address/balance display, network switcher
- **Transaction Modal**: Progress display, step-by-step status, explorer links, error handling
- **Notification System**: Toast notifications, transaction alerts, multi-step progress

### Phase 4: Integration & Testing (Week 4-5)

#### End-to-End Testing Scenarios
1. **Create Complete Agent**: Connect wallet → Vault → Create Agent → Fill all steps → Deploy → Verify
2. **Stake MON to Agent**: View agent → Staking tab → Stake MON → Verify tier update → Unstake
3. **Deploy Token**: View agent → Token tab → Deploy token → Verify address → Check holders
4. **Edit Agent Metadata**: View agent → Edit tab → Modify tenets → Save → Verify changes
5. **Walrus Storage Persistence**: Create agent → Upload metadata → Retrieve metadata → Verify integrity

#### Integration Points
- Wallet + Contracts: Sign transactions, broadcast to Monad, wait for confirmations
- Frontend + Backend API: REST communication, error handling, loading states
- Backend + ElizaOS: Personality generation, prompt engineering, memory management
- Backend + Walrus: Metadata upload/download, blob ID management, version control

### Phase 5: Deployment & Documentation (Week 5-6)

#### Smart Contract Deployment
- Deploy to Monad testnet
- Verify on block explorer
- Save contract addresses
- Document ABIs

#### Backend Deployment
- Deploy to Vercel/Render
- Configure environment variables
- Set up monitoring
- Test API endpoints

#### Frontend Deployment
- Deploy to Vercel
- Configure environment variables
- Set up analytics (optional)
- Test all user flows

#### Documentation
- **Developer README**: Project overview, tech stack, setup instructions, environment variables
- **API Documentation**: Endpoint descriptions, request/response schemas, authentication, error codes
- **User Guide**: How to create agent, stake MON, deploy tokens, FAQ

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Walrus relay downtime | Implement fallback to IPFS; cache metadata locally |
| Monad testnet instability | Monitor testnet status; use alternative testnets if needed |
| ElizaOS compatibility | Use stable version; test integration early |
| Gas price volatility | Implement gas estimation; allow user to set gas limits |
| Metadata size limits | Validate before upload; implement compression if needed |

---

## Success Metrics (MVP)
- [ ] 3 complete agents created end-to-end
- [ ] 2 tokens deployed successfully
- [ ] Staking/unstaking working for all 5 tiers
- [ ] Walrus metadata upload/download reliable
- [ ] ElizaOS agent personalities generated correctly
- [ ] All transactions confirmed on testnet
- [ ] User can complete entire flow in under 5 minutes

---

## Open Questions

1. **ElizaOS Model Provider**: Which LLM provider (OpenAI, Anthropic, Grok, etc.)? Budget constraints?
2. **Agent Icon Storage**: Walrus or CDN? Size limits?
3. **Token Symbol Validation**: Naming conventions? Reserved symbols?
4. **Staking Rewards**: Yield mechanism or just multipliers?
5. **Agent Deletion**: Deletable or permanently immutable?
6. **Database Choice**: PGLite (default) or PostgreSQL for scaling?
7. **Analytics**: User analytics/telemetry from day one?

**Current Assumptions**:
- ElizaOS will use OpenAI API (configurable)
- Agent icons stored on Walrus with 512x512 max
- Token symbols: uppercase letters only, no reserved prefixes
- Staking provides multipliers only, no yield
- Agents are permanently immutable after creation
- Use PGLite for MVP, can migrate to PostgreSQL later
- No analytics in MVP, can add later

---

## Important Notes

- **Scope**: MVP focuses on vault + agent creation only. WMON and DeFi integrations deferred to v2.
- **Gas Optimization**: Use MON directly without wrapping to minimize transaction costs.
- **Walrus**: Public relays are sufficient for MVP volume (1-100 agents).
- **ElizaOS**: Embedded in backend for tighter integration and shared database access.
- **Testing**: Foundry for contracts, manual E2E for integration, no automated E2E framework in MVP.
- **Documentation**: Keep it minimal but sufficient for onboarding new developers.
