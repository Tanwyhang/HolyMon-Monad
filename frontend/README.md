# HolyMon Frontend

A production-ready Next.js application for integrating with ElizaOS agents, featuring real-time messaging, Web3 connectivity, and comprehensive agent interaction.

## Overview

This frontend serves as the web interface for the HolyMon platform, enabling:
- Real-time agent communication via Socket.IO
- Web3 wallet integration with Monad network
- Agent registration and management
- Token launchpad interaction
- Staking interface for MON tokens

## Tech Stack

### Core Framework
- **Next.js 16.1.6** - React framework with App Router
- **React 19.1.0** - Latest React version
- **TypeScript v5** - Type-safe development

### Styling & UI
- **Tailwind CSS v4.0.0-beta** - Utility-first CSS framework
- **@headlessui/react** - Unstyled, accessible UI components
- **@heroicons/react** - Heroicons icon set
- **Lucide React** - Icon library
- **next-themes** - Dark/light mode support
- **sonner** - Toast notifications

### ElizaOS Integration
- **@elizaos/core v1.0.9** - Core agent framework
- **@elizaos/cli v1.0.9** - CLI tools
- **@elizaos/plugin-anthropic** - Anthropic AI provider
- **@elizaos/plugin-groq** - Groq AI provider
- **@elizaos/plugin-openai** - OpenAI AI provider
- **@elizaos/plugin-knowledge** - Knowledge base plugin
- **@elizaos/plugin-sql** - SQL database plugin

### Real-time & Data
- **socket.io-client** - Real-time bidirectional communication
- **@tanstack/react-query** - Data fetching and caching
- **@libsql/client** - SQLite database client

### Web3 & Blockchain
- **@web3modal/wagmi** - Web3 Modal for wallet connection
- **viem** - TypeScript interface for Ethereum
- **wagmi** - React Hooks for Ethereum
- **zod** - Schema validation

### Code & Data Visualization
- **codemirror** - Versatile text editor
- **@codemirror/lang-* modules** - Language support (CSS, HTML, JS, JSON, Markdown, SQL)
- **recharts** - Charting library
- **marked** - Markdown parser
- **markdown-to-jsx** - Markdown to React component converter

### 3D & Graphics
- **three** - 3D JavaScript library
- **postprocessing** - Post-processing effects for Three.js

### Developer Tools
- **tsup** - TypeScript bundler for agent building
- **vitest** - Unit testing framework
- **prettier** - Code formatter
- **eslint** - Code linting

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (app)/               # App layout group
│   │   ├── (landing)/           # Landing page layout
│   │   ├── (marketing)/         # Marketing pages
│   │   ├── api/                 # API routes
│   │   │   └── eliza/           # ElizaOS proxy routes
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Core utilities
│   │   ├── api-client.ts        # ElizaOS API wrapper
│   │   └── socketio-manager.ts  # Real-time communication
│   ├── types/                   # TypeScript definitions
│   └── agent.ts                 # ElizaOS agent definition
├── public/                      # Static assets
├── AGENTS.md                    # AI agent configuration
└── README.md                    # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun (recommended)
- ElizaOS server running on port 3000
- Monad testnet RPC endpoint

### Installation

```bash
# Clone repository
cd frontend

# Install dependencies (USE BUN ONLY)
bun install

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env
```

### Environment Variables

```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=true
NEXT_PUBLIC_NODE_ENV="development"

# ElizaOS Agent Configuration
NEXT_PUBLIC_AGENT_ID=your-agent-id-here
NEXT_PUBLIC_WORLD_ID=00000000-0000-0000-0000-000000000000

# Web3 Configuration
NEXT_PUBLIC_MONAD_RPC=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=14314

# Debug Mode
# NEXT_PUBLIC_DEBUG=true

# Repository Context (Optional)
REPO_DIR_NAME=holymon
REPO_URL=https://github.com/your-repo/holymon.git
REPO_BRANCH=main
```

## Available Scripts

```bash
# Development
bun run dev                    # Start Next.js dev server (port 3000)
bun run dev:with-agent        # Start both ElizaOS agent and Next.js

# Building
bun run build                 # Build both agent and Next.js
bun run build:next-only       # Build Next.js only

# Production
bun start                     # Start production server

# Code Quality
bun run lint                  # Format code with Prettier
bun run format                # Same as lint
bun run format:check          # Check formatting

# Testing
bun run test                  # Run Vitest tests
bun run test:coverage         # Run tests with coverage
bun run test:watch            # Watch mode
```

## Key Features

### 1. Agent Integration

Real-time communication with ElizaOS agents through:

- **Socket.IO Connection**: Bidirectional real-time messaging
- **API Proxy**: CORS-friendly communication pattern
- **Agent Participation**: Automatic channel registration
- **Message Filtering**: Duplicate prevention via sender ID

### 2. Web3 Wallet Connection

- **Wallet Connect**: Web3 Modal for seamless wallet connection
- **Network Support**: Monad testnet (Chain ID: 14314)
- **Transaction Signing**: Seamless blockchain interactions

### 3. Smart Contract Interaction

- **Agent Registry**: Create and manage AI agents
- **Token Launchpad**: Deploy ERC-20 tokens
- **MON Staking**: Stake MON with tiered multipliers

### 4. Code Editor

- **CodeMirror Integration**: Full-featured code editor
- **Language Support**: JavaScript, TypeScript, CSS, HTML, Markdown, SQL, JSON
- **Syntax Highlighting**: Professional code display

## Architecture Patterns

### API Proxy Pattern

All ElizaOS API calls go through Next.js proxy to avoid CORS:

```typescript
// Proxied request
const response = await fetch('/api/eliza/server/ping');

// Never do this (CORS blocked)
// const response = await fetch('http://localhost:3000/api/server/ping');
```

### Socket.IO Integration

```typescript
// Connect to ElizaOS server
const socket = io(NEXT_PUBLIC_SERVER_URL);

// Listen for messages
socket.on('messageBroadcast', (data) => {
  if (data.channelId === CENTRAL_CHANNEL_ID) {
    handleMessage(data);
  }
});
```

### React Query for Data Fetching

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: async () => {
    const response = await fetch('/api/agents');
    return response.json();
  }
});
```

## Development Guidelines

### Package Management
- **ALWAYS USE `bun`** for all package management
- **NEVER USE `npm` or `pnpm`**
- Run `bun install` for dependencies
- Run `bun run <script>` for scripts

### Code Style
- Use TypeScript with strict mode
- Follow existing component patterns
- Use functional programming over classes
- Implement error boundaries

### Testing
- Write tests for core functionality
- Use Vitest for unit tests
- Mock ElizaOS and Web3 in tests
- Aim for >80% coverage

## Deployment

### Production Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SERVER_URL=https://your-elizaos-server.com
NEXT_PUBLIC_MONAD_RPC=https://monad-rpc.com
NEXT_PUBLIC_CHAIN_ID=14314
NEXT_PUBLIC_NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=true
```

### Build Process

1. **Agent Build**: tsup compiles agent to `dist/agent.js`
2. **Next.js Build**: Standard Next.js production build
3. **Asset Optimization**: Images, CSS, and JS optimization
4. **Environment Validation**: Check all required env vars

### Deployment Platforms

- **Vercel**: Recommended for Next.js
- **Netlify**: Alternative with good Next.js support
- **Docker**: Containerized deployment
- **Static Export**: For static hosting

## Troubleshooting

### Common Issues

1. **Agent not responding**
   - Check browser console for agent participation logs
   - Verify `NEXT_PUBLIC_SERVER_URL` is correct
   - Ensure ElizaOS server is running

2. **CORS errors**
   - All requests should go through `/api/eliza/*`
   - Never make direct requests to ElizaOS from browser

3. **Wallet connection issues**
   - Verify Monad RPC URL
   - Check wallet network settings
   - Ensure wallet supports testnet

4. **Build failures**
   - Check `.env` file
   - Run `bun install`
   - Verify TypeScript types

## Documentation

- **AGENTS.md**: AI agent configuration and rules
- **package.json**: All scripts and dependencies
- **tsconfig.json**: TypeScript configuration
- **next.config.ts**: Next.js configuration

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [ElizaOS Documentation](https://github.com/elizaos/eliza)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Web3Modal](https://web3modal.com/)
- [Socket.IO](https://socket.io/docs/)

## License

MIT

---

**Built with ❤️ for the HolyMon community**
