import type { APIResponse } from '../types';
import { elizaService } from './eliza.service';

export async function handleStartAgent(agentId: string, body: any): Promise<APIResponse> {
  try {
    const { agentData } = body;

    if (!agentData) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'agentData is required',
      };
    }

    const started = await elizaService.startAgent(agentId, agentData);

    if (!started) {
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to start agent',
      };
    }

    return {
      success: true,
      data: { message: 'Agent started successfully' },
    };
  } catch (error) {
    console.error('[Eliza Routes] Start agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to start agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleStopAgent(agentId: string): Promise<APIResponse> {
  try {
    const stopped = await elizaService.stopAgent(agentId);

    if (!stopped) {
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to stop agent',
      };
    }

    return {
      success: true,
      data: { message: 'Agent stopped successfully' },
    };
  } catch (error) {
    console.error('[Eliza Routes] Stop agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to stop agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetAgentStatus(agentId: string): Promise<APIResponse> {
  try {
    const status = await elizaService.getAgentStatus(agentId);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    console.error('[Eliza Routes] Get agent status error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get agent status',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetAgentCharacter(agentId: string): Promise<APIResponse> {
  try {
    const character = await elizaService.getCharacter(agentId);

    if (!character) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Agent character not found',
      };
    }

    return {
      success: true,
      data: character,
    };
  } catch (error) {
    console.error('[Eliza Routes] Get agent character error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get agent character',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleUpdateAgentConfig(agentId: string, body: any): Promise<APIResponse> {
  try {
    const { config: agentConfig } = body;

    if (!agentConfig) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'config is required',
      };
    }

    const updated = await elizaService.updateConfig(agentId, agentConfig);

    if (!updated) {
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update agent config',
      };
    }

    return {
      success: true,
      data: { message: 'Agent config updated successfully' },
    };
  } catch (error) {
    console.error('[Eliza Routes] Update agent config error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update agent config',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleListAgents(): Promise<APIResponse> {
  try {
    const agents = elizaService.getAllAgents();

    return {
      success: true,
      data: { agents },
    };
  } catch (error) {
    console.error('[Eliza Routes] List agents error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to list agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
