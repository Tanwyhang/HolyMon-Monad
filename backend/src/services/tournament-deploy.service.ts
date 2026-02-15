import type { TournamentAgent } from './tournament.service';

interface AgentData {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  color?: string;
}

interface TournamentService {
  deployAgents(agents: AgentData[], address: string): Promise<{
    success: boolean;
    deployed: TournamentAgent[];
    error?: string;
  }>;
}

export class TournamentServiceImpl implements TournamentService {
  async deployAgents(agents: AgentData[], address: string): Promise<{
    success: boolean;
    deployed: TournamentAgent[];
    error?: string;
  }> {
    try {
      console.log(`[TournamentService] Deploying agents: ${agents.map(a => a.name).join(', ')} for ${address}`);

      const deployedAgents: TournamentAgent[] = [];

      for (const agent of agents) {
        const tournamentAgent: TournamentAgent = {
          id: agent.id,
          name: agent.name,
          symbol: agent.symbol,
          color: agent.color || '#836EF9',
          avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.name}`,
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
}