import type { TournamentAgent } from './tournament.service';

interface TournamentService {
  deployAgents(agentIds: string[], address: string): Promise<{
    success: boolean;
    deployed: TournamentAgent[];
    error?: string;
  }>;
}

export class TournamentServiceImpl implements TournamentService {
  async deployAgents(agentIds: string[], address: string): Promise<{
    success: boolean;
    deployed: TournamentAgent[];
    error?: string;
  }> {
    try {
      console.log(`[TournamentService] Deploying agents: ${agentIds.join(', ')} for ${address}`);

      const deployedAgents: TournamentAgent[] = [];

      for (const agentId of agentIds) {
        const agent = await this.fetchAgentDetails(agentId);
        if (!agent) {
          console.warn(`[TournamentService] Agent ${agentId} not found`);
          continue;
        }

        const tournamentAgent: TournamentAgent = {
          id: agentId,
          name: agent.name,
          symbol: agent.symbol,
          color: agent.color || '#836EF9',
          avatar: agent.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.name}`,
          stakedAmount: BigInt(0),
          followers: 100,
          status: 'IDLE',
          lastAction: 0,
        };

        deployedAgents.push(tournamentAgent);
      }

      return {
        success: true,
        deployed: deployedAgents,
      };
    } catch (error) {
      console.error('[TournamentService] Error deploying agents:', error);
      return {
        success: false,
        deployed: [],
        error: error instanceof Error ? error.message : 'Failed to deploy agents',
      };
    }
  }

  private async fetchAgentDetails(agentId: string): Promise<any> {
    const backendUrl = process.env.AGENT_REGISTRY_ADDRESS;
    
    const response = await fetch(`/api/backend-proxy/agents/${agentId}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  }
}