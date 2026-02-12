import type { APIResponse, CreateAgentRequest, CreateAgentResponse, ErrorResponse } from '../types';
import { agentService } from '../services/agent.service';

export async function handleCreateAgent(body: any, owner: string): Promise<APIResponse<CreateAgentResponse>> {
  try {
    const { name, symbol, prompt, backstory, visualTraits, elizaos } = body;

    if (!name || !symbol || !prompt) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'name, symbol, and prompt are required',
      };
    }

    if (name.length < 3 || name.length > 50) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'name must be 3-50 characters',
      };
    }

    if (symbol.length < 3 || symbol.length > 8) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'symbol must be 3-8 characters',
      };
    }

    if (!/^[A-Z0-9]+$/.test(symbol)) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'symbol must be uppercase letters and numbers only',
      };
    }

    if (prompt.length < 10) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'prompt must be at least 10 characters',
      };
    }

    const request: CreateAgentRequest = {
      name,
      symbol,
      prompt,
      backstory,
      visualTraits,
      elizaos,
    };

    const result = await agentService.createAgent(request, owner);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[Agents Routes] Create agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetAgent(agentId: string): Promise<APIResponse> {
  try {
    const agent = await agentService.getAgent(agentId);

    if (!agent) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Agent not found',
      };
    }

    return {
      success: true,
      data: agent,
    };
  } catch (error) {
    console.error('[Agents Routes] Get agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleListAgents(owner?: string): Promise<APIResponse> {
  try {
    if (owner) {
      const agents = await agentService.getUserAgents(owner);
      return {
        success: true,
        data: { agents },
      };
    }

    return {
      success: true,
      data: { agents: [] },
    };
  } catch (error) {
    console.error('[Agents Routes] List agents error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to list agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

