import { religionService } from '../services/religion.service';
import { x402ConnectionService } from '../services/x402-connection.service';
import type { APIResponse } from '../types';

export async function handleGetReligionAgents(): Promise<APIResponse> {
  try {
    const agents = religionService.getAllAgents();
    return {
      success: true,
      data: agents
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_AGENTS',
      message: 'Failed to get religion agents',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetReligionStats(): Promise<APIResponse> {
  try {
    const stats = religionService.getStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_STATS',
      message: 'Failed to get religion stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetCoalitions(): Promise<APIResponse> {
  try {
    const coalitions = religionService.getAllCoalitions();
    return {
      success: true,
      data: coalitions
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_COALITIONS',
      message: 'Failed to get coalitions',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetCoalition(coalitionId: string): Promise<APIResponse> {
  try {
    const coalition = religionService.getCoalition(coalitionId);
    if (!coalition) {
      return {
        success: false,
        error: 'COALITION_NOT_FOUND',
        message: 'Coalition not found'
      };
    }
    return {
      success: true,
      data: coalition
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_COALITION',
      message: 'Failed to get coalition',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetAgentConnections(agentId: string): Promise<APIResponse> {
  try {
    const connections = x402ConnectionService.getAgentConnections(agentId);
    return {
      success: true,
      data: connections
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_CONNECTIONS',
      message: 'Failed to get connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetAgentScripture(agentId: string): Promise<APIResponse> {
  try {
    const agent = religionService.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        error: 'AGENT_NOT_FOUND',
        message: 'Agent not found'
      };
    }
    return {
      success: true,
      data: agent.scripture
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_SCRIPTURE',
      message: 'Failed to get scripture',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGenerateScripture(agentId: string): Promise<APIResponse> {
  try {
    const scripture = religionService.generateScripture(agentId);
    if (!scripture) {
      return {
        success: false,
        error: 'SCRIPTURE_GENERATION_FAILED',
        message: 'Failed to generate scripture'
      };
    }
    return {
      success: true,
      data: { scripture }
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GENERATE_SCRIPTURE',
      message: 'Failed to generate scripture',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetAgentParables(agentId: string): Promise<APIResponse> {
  try {
    const agent = religionService.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        error: 'AGENT_NOT_FOUND',
        message: 'Agent not found'
      };
    }
    return {
      success: true,
      data: agent.parables
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_PARABLES',
      message: 'Failed to get parables',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGenerateParable(agentId: string): Promise<APIResponse> {
  try {
    const parable = religionService.generateParable(agentId);
    if (!parable) {
      return {
        success: false,
        error: 'PARABLE_GENERATION_FAILED',
        message: 'Failed to generate parable'
      };
    }
    return {
      success: true,
      data: { parable }
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GENERATE_PARABLE',
      message: 'Failed to generate parable',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetAgentProphecies(agentId: string): Promise<APIResponse> {
  try {
    const agent = religionService.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        error: 'AGENT_NOT_FOUND',
        message: 'Agent not found'
      };
    }
    return {
      success: true,
      data: agent.prophecies
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_PROPHECIES',
      message: 'Failed to get prophecies',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGenerateProphecy(agentId: string): Promise<APIResponse> {
  try {
    const prophecy = religionService.generateProphecy(agentId);
    if (!prophecy) {
      return {
        success: false,
        error: 'PROPHECY_GENERATION_FAILED',
        message: 'Failed to generate prophecy'
      };
    }
    return {
      success: true,
      data: { prophecy }
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GENERATE_PROPHECY',
      message: 'Failed to generate prophecy',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleGetNPCs(): Promise<APIResponse> {
  try {
    const npcs = religionService.getNPCs();
    return {
      success: true,
      data: npcs
    };
  } catch (error) {
    return {
      success: false,
      error: 'FAILED_TO_GET_NPCS',
      message: 'Failed to get NPCs',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
