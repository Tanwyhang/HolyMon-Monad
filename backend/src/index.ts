import { config, validateConfig } from './config/env';
import { handleHealthCheck } from './routes/health';
import {
  handleAddAIFunds,
  handleGetAIBalance,
  handleGetAllAIBalances,
  handleGetAgentUsage,
  handleGetNPCCosts,
  handleDistributeNPCCosts,
} from './routes/ai-payment';
import {
  handleGetReligionAgents,
  handleGetReligionStats,
  handleGetCoalitions,
  handleGetCoalition,
  handleGetAgentConnections,
  handleGetAgentScripture,
  handleGenerateScripture,
  handleGetAgentParables,
  handleGenerateParable,
  handleGetAgentProphecies,
  handleGenerateProphecy,
  handleGetNPCs,
} from './routes/religion';
import { handleDeployAgents } from './routes/tournament-deploy.handler';

console.log('[Backend] Starting HolyMon backend service...');

try {
  validateConfig();
  console.log('[Backend] Configuration validated');
} catch (error) {
  console.error('[Backend] Configuration error:', error);
  process.exit(1);
}

import { tournamentService } from './services/tournament.service';
import { elizaRuntimeService } from './services/eliza-runtime.service';

async function startServer() {
  try {
    await elizaRuntimeService.initializeAgents();
    console.log('[Backend] ElizaOS agents initialized');
  } catch (error) {
    console.error('[Backend] Failed to initialize ElizaOS agents:', error);
    console.log('[Backend] Tournament will fall back to procedural dialogue');
  }

  Bun.serve({
    port: config.server.port,
    websocket: {
      open(ws) {
        console.log('[WS] Client connected');
        tournamentService.registerClient(ws);
      },
      message(ws, message) {
        console.log('[WS] Received:', message);
      },
      close(ws) {
        console.log('[WS] Client disconnected');
        tournamentService.removeClient(ws);
      },
    },
    async fetch(req, server) {
      const url = new URL(req.url);
      const path = url.pathname;

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (path === '/tournament/ws') {
        const success = server.upgrade(req);
        if (success) return undefined;
        return new Response('WebSocket upgrade failed', { status: 400 });
      }

      const method = req.method;

      console.log(`[${method}] ${path}`);

      try {
        if (path === '/health' && method === 'GET') {
          return jsonResponse(handleHealthCheck());
        }

        if (path === '/api/elizaos/status' && method === 'GET') {
          return jsonResponse({
            success: true,
            data: {
              initialized: elizaRuntimeService.isInitialized(),
              agentsReady: elizaRuntimeService.getAgentCount(),
              rateLimit: elizaRuntimeService.getRateLimitStatus(),
              usage: elizaRuntimeService.getUsageReport(),
              cache: elizaRuntimeService.getCacheStats(),
            },
          });
        }

        if (path === '/api/ai/funds/add' && method === 'POST') {
          const body = await req.json();
          return jsonResponse(await handleAddAIFunds(body));
        }

        if (path.startsWith('/api/ai/balance/') && method === 'GET') {
          const agentId = path.split('/')[4];
          return jsonResponse(await handleGetAIBalance(agentId));
        }

        if (path === '/api/ai/balances' && method === 'GET') {
          return jsonResponse(await handleGetAllAIBalances());
        }

        if (path.startsWith('/api/ai/usage/') && method === 'GET') {
          const agentId = path.split('/')[4];
          return jsonResponse(await handleGetAgentUsage(agentId));
        }

        if (path === '/api/ai/npc/costs' && method === 'GET') {
          return jsonResponse(await handleGetNPCCosts());
        }

        if (path === '/api/ai/npc/distribute' && method === 'POST') {
          const body = await req.json();
          return jsonResponse(await handleDistributeNPCCosts(body));
        }

        if (path === '/api/religion/agents' && method === 'GET') {
          return jsonResponse(await handleGetReligionAgents());
        }

        if (path === '/api/religion/stats' && method === 'GET') {
          return jsonResponse(await handleGetReligionStats());
        }

        if (path === '/api/religion/coalitions' && method === 'GET') {
          return jsonResponse(await handleGetCoalitions());
        }

        if (path.startsWith('/api/religion/coalition/') && method === 'GET') {
          const coalitionId = path.split('/')[4];
          if (coalitionId) return jsonResponse(await handleGetCoalition(coalitionId));
        }

        if (path.startsWith('/api/religion/connections/') && method === 'GET') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGetAgentConnections(agentId));
        }

        if (path.startsWith('/api/religion/scripture/') && method === 'GET') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGetAgentScripture(agentId));
        }

        if (path.startsWith('/api/religion/generate-scripture/') && method === 'POST') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGenerateScripture(agentId));
        }

        if (path.startsWith('/api/religion/parables/') && method === 'GET') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGetAgentParables(agentId));
        }

        if (path.startsWith('/api/religion/generate-parable/') && method === 'POST') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGenerateParable(agentId));
        }

        if (path.startsWith('/api/religion/prophecies/') && method === 'GET') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGetAgentProphecies(agentId));
        }

        if (path.startsWith('/api/religion/generate-prophecy/') && method === 'POST') {
          const agentId = path.split('/')[4];
          if (agentId) return jsonResponse(await handleGenerateProphecy(agentId));
        }

        if (path === '/api/religion/npcs' && method === 'GET') {
          return jsonResponse(await handleGetNPCs());
        }

        if (path === '/api/tournament/deploy-agents' && method === 'POST') {
          return jsonResponse(await handleDeployAgents(req));
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
}

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
console.log('  GET  /api/elizaos/status (rate limits & usage)');
console.log('  POST /api/ai/funds/add');
console.log('  GET  /api/ai/balance/:agentId');
console.log('  GET  /api/ai/balances');
console.log('  GET  /api/ai/usage/:agentId');
console.log('  GET  /api/ai/npc/costs');
console.log('  POST /api/ai/npc/distribute');
console.log('  GET  /api/religion/stats');
console.log('  GET  /api/religion/coalitions');
console.log('  GET  /api/religion/coalition/:id');
console.log('  GET  /api/religion/connections/:agentId');
console.log('  GET  /api/religion/scripture/:agentId');
console.log('  POST /api/religion/generate-scripture/:agentId');
console.log('  GET  /api/religion/parables/:agentId');
console.log('  POST /api/religion/generate-parable/:agentId');
console.log('  GET  /api/religion/prophecies/:agentId');
console.log('  POST /api/religion/generate-prophecy/:agentId');
console.log('  GET  /api/religion/npcs');
console.log('  POST /api/tournament/deploy-agents');
console.log('  WS   /tournament/ws');

startServer();
