import type { APIResponse, ERC8004Agent, ERC8004Reputation, ERC8004Feedback } from '../types';
import { erc8004Service } from '../services/erc8004.service';

/**
 * Get ERC-8004 agent identity and reputation
 */
export async function handleGetERC8004Agent(tokenId: string): Promise<APIResponse<ERC8004Agent>> {
  try {
    const tokenIdBigInt = BigInt(tokenId);

    const [identity, reputation] = await Promise.all([
      erc8004Service.getAgentIdentity(tokenIdBigInt),
      erc8004Service.getAgentReputation(tokenIdBigInt),
    ]);

    if (!identity.exists) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'ERC-8004 agent not found',
      };
    }

    const agent: ERC8004Agent = {
      ...identity,
      reputation,
    };

    return {
      success: true,
      data: agent,
    };
  } catch (error) {
    console.error('[ERC8004 Routes] Get agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch ERC-8004 agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get agent reputation only
 */
export async function handleGetAgentReputation(tokenId: string): Promise<APIResponse<ERC8004Reputation>> {
  try {
    const tokenIdBigInt = BigInt(tokenId);
    const reputation = await erc8004Service.getAgentReputation(tokenIdBigInt);

    return {
      success: true,
      data: reputation,
    };
  } catch (error) {
    console.error('[ERC8004 Routes] Get reputation error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch agent reputation',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit feedback for an agent
 */
export async function handleSubmitFeedback(
  tokenId: string,
  body: any,
  signer: string
): Promise<APIResponse<{ success: boolean; txHash?: string }>> {
  try {
    const { score, tags, feedbackURI, comment } = body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Score must be a number between 0 and 100',
      };
    }

    if (!Array.isArray(tags)) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Tags must be an array of strings',
      };
    }

    const feedback: ERC8004Feedback = {
      score,
      tags,
      feedbackURI,
      comment,
    };

    const tokenIdBigInt = BigInt(tokenId);
    const result = await erc8004Service.submitFeedback(tokenIdBigInt, feedback, signer as `0x${string}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[ERC8004 Routes] Submit feedback error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Discover ERC-8004 agents (placeholder - would need more complex logic)
 */
export async function handleDiscoverAgents(query?: {
  tags?: string[];
  minReputation?: number;
  capabilities?: string[];
  limit?: number;
}): Promise<APIResponse<{ agents: ERC8004Agent[] }>> {
  try {
    // Placeholder implementation - in reality would need to index ERC-8004 agents
    // This would require maintaining an off-chain index or querying events
    console.log('[ERC8004 Routes] Discovery query:', query);

    return {
      success: true,
      data: {
        agents: [], // Placeholder
      },
    };
  } catch (error) {
    console.error('[ERC8004 Routes] Discover agents error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to discover agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}