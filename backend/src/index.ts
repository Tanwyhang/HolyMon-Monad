import { config, validateConfig } from './config/env';
import { handleHealthCheck } from './routes/health';
import {
  handleGetERC8004Agent,
  handleGetAgentReputation,
  handleSubmitFeedback,
  handleDiscoverAgents,
} from './routes/erc8004';
import {
  handleEnableTokenLaunchpad,
  handleEnableStaking,
  handleGetServicesStatus,
} from './routes/holymon-services';
import {
  handleGetTiers,
  handleGetUserStake,
  handleGetGlobalStats,
  handleStake,
  handleUnstake,
  handleClaimRewards,
} from './routes/staking';

console.log('[Backend] Starting HolyMon backend service...');

try {
  validateConfig();
  console.log('[Backend] Configuration validated');
} catch (error) {
  console.error('[Backend] Configuration error:', error);
  process.exit(1);
}

const server = Bun.serve({
  port: config.server.port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    console.log(`[${method}] ${path}`);

    try {
      if (path === '/health' && method === 'GET') {
        return jsonResponse(handleHealthCheck());
      }

      if (path === '/api/agents' && method === 'POST') {
        const body = await req.json();
        const owner = req.headers.get('x-owner-address') || config.monad.privateKey;
        return jsonResponse(await handleCreateAgent(body, owner));
      }

      if (path.startsWith('/api/agents/') && method === 'GET') {
        const agentId = path.split('/')[3];
        
        if (path.includes('/metadata')) {
          return jsonResponse(await handleGetAgentMetadata(agentId));
        }
        
        return jsonResponse(await handleGetAgent(agentId));
      }

      if (path === '/api/agents' && method === 'GET') {
        const owner = url.searchParams.get('owner') || undefined;
        return jsonResponse(await handleListAgents(owner));
      }

      if (path === '/api/tokens/deploy' && method === 'POST') {
        const body = await req.json();
        const sender = req.headers.get('x-sender-address') || config.monad.privateKey;
        return jsonResponse(await handleDeployToken(body, sender));
      }

      if (path.startsWith('/api/tokens/') && method === 'GET') {
        const tokenAddress = path.split('/')[3];
        
        if (path.includes('/agent')) {
          const agentId = path.split('/')[5];
          return jsonResponse(await handleGetTokenByAgent(agentId));
        }
        
        if (path.includes('/holders')) {
          return jsonResponse({
            success: true,
            data: { holders: [] },
          });
        }
        
        return jsonResponse(await handleGetToken(tokenAddress));
      }

      if (path === '/api/tokens' && method === 'GET') {
        const creator = url.searchParams.get('creator') || undefined;
        return jsonResponse(await handleListTokens(creator));
      }

      if (path === '/api/staking/tiers' && method === 'GET') {
        return jsonResponse(await handleGetTiers());
      }

      if (path === '/api/staking/stats' && method === 'GET') {
        return jsonResponse(await handleGetGlobalStats());
      }

      if (path.startsWith('/api/staking/user/') && method === 'GET') {
        const user = path.split('/')[4];
        return jsonResponse(await handleGetUserStake(user));
      }

      if (path === '/api/staking/stake' && method === 'POST') {
        const body = await req.json();
        return jsonResponse(await handleStake(body));
      }

      if (path === '/api/staking/unstake' && method === 'POST') {
        const body = await req.json();
        return jsonResponse(await handleUnstake(body));
      }

      if (path === '/api/staking/claim' && method === 'POST') {
        return jsonResponse(await handleClaimRewards());
      }

      if (path.startsWith('/api/eliza/agents/') && method === 'POST') {
        const agentId = path.split('/')[4];
        const action = path.split('/')[5];
        const body = await req.json();

        if (action === 'start') {
          return jsonResponse(await handleStartAgent(agentId, body));
        }

        if (action === 'stop') {
          return jsonResponse(await handleStopAgent(agentId));
        }

        if (action === 'config') {
          return jsonResponse(await handleUpdateAgentConfig(agentId, body));
        }
      }

      if (path.startsWith('/api/eliza/agents/') && method === 'GET') {
        const agentId = path.split('/')[4];
        const action = path.split('/')[5];

        if (action === 'status') {
          return jsonResponse(await handleGetAgentStatus(agentId));
        }

        if (action === 'character') {
          return jsonResponse(await handleGetAgentCharacter(agentId));
        }
      }

      if (path === '/api/eliza/agents' && method === 'GET') {
        return jsonResponse(await handleListElizaAgents());
      }

      // ERC-8004 Routes
      if (path.startsWith('/api/erc8004/agent/') && method === 'GET') {
        const tokenId = path.split('/')[4];
        const action = path.split('/')[5];

        if (action === 'reputation') {
          return jsonResponse(await handleGetAgentReputation(tokenId));
        }

        return jsonResponse(await handleGetERC8004Agent(tokenId));
      }

      if (path.startsWith('/api/erc8004/feedback/') && method === 'POST') {
        const tokenId = path.split('/')[4];
        const body = await req.json();
        const signer = req.headers.get('x-signer-address') || config.monad.privateKey;
        return jsonResponse(await handleSubmitFeedback(tokenId, body, signer));
      }

      if (path === '/api/erc8004/discover' && method === 'GET') {
        const query = Object.fromEntries(url.searchParams);
        return jsonResponse(await handleDiscoverAgents(query));
      }

      // HolyMon Services Routes (for ERC-8004 agents)
      if (path.startsWith('/api/holymon/') && method === 'POST') {
        const parts = path.split('/');
        const tokenId = parts[3];
        const action = parts[4];
        const body = await req.json();
        const signer = req.headers.get('x-signer-address') || config.monad.privateKey;

        if (action === 'launch-token') {
          return jsonResponse(await handleEnableTokenLaunchpad(tokenId, body, signer));
        }

        if (action === 'stake-mon') {
          return jsonResponse(await handleEnableStaking(tokenId, body, signer));
        }
      }

      if (path.startsWith('/api/holymon/') && method === 'GET') {
        const parts = path.split('/');
        const tokenId = parts[3];
        const action = parts[4];
        const signer = req.headers.get('x-signer-address') || config.monad.privateKey;

        if (action === 'status') {
          return jsonResponse(await handleGetServicesStatus(tokenId, signer));
        }
      }
    } catch (error) {
      console.error('[Backend] Request error:', error);
      return jsonResponse({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  },
});

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-owner-address, x-sender-address',
    },
  });
}

console.log(`[Backend] Server running on http://localhost:${config.server.port}`);
console.log('[Backend] Available endpoints:');
console.log('  GET  /health');
console.log('  POST /api/agents (deprecated - use ERC-8004)');
console.log('  GET  /api/agents/:id (deprecated - use ERC-8004)');
console.log('  GET  /api/agents?owner=0x... (deprecated - use ERC-8004)');
console.log('  GET  /api/agents/:id/metadata (deprecated - use ERC-8004)');
console.log('  POST /api/tokens/deploy (deprecated - use HolyMon services)');
console.log('  GET  /api/tokens/:address');
console.log('  GET  /api/tokens/agent/:agentId (deprecated)');
console.log('  GET  /api/staking/tiers');
console.log('  GET  /api/staking/user/:address');
console.log('  GET  /api/staking/stats');
console.log('  POST /api/staking/stake (deprecated - use HolyMon services)');
console.log('  POST /api/staking/unstake (deprecated - use HolyMon services)');
console.log('  POST /api/staking/claim');
console.log('  POST /api/eliza/agents/:id/start (deprecated)');
console.log('  POST /api/eliza/agents/:id/stop (deprecated)');
console.log('  GET  /api/eliza/agents/:id/status (deprecated)');
console.log('  GET  /api/eliza/agents/:id/character (deprecated)');
console.log('  GET  /api/eliza/agents (deprecated)');
console.log('  GET  /api/erc8004/agent/:tokenId');
console.log('  GET  /api/erc8004/agent/:tokenId/reputation');
console.log('  POST /api/erc8004/feedback/:tokenId');
console.log('  GET  /api/erc8004/discover');
console.log('  POST /api/holymon/:tokenId/launch-token');
console.log('  POST /api/holymon/:tokenId/stake-mon');
console.log('  GET  /api/holymon/:tokenId/status');
