import { tournamentServiceExtended } from '../services/tournament.service';
import { TournamentServiceImpl } from '../services/tournament-deploy.service';
import { TournamentServiceImpl } from '../services/tournament-deploy.service';
import type { APIResponse } from '../types';

export async function handleDeployAgents(req: Request): Promise<APIResponse> {
  try {
    const body = await req.json();
    const { agents, address } = body;

    if (!agents || !Array.isArray(agents)) {
      return {
        success: false,
        error: 'Invalid agents'
      };
    }

    if (!address) {
      return {
        success: false,
        error: 'Address required'
      };
    }

    if (agents.length === 0) {
      return {
        success: false,
        error: 'No agents to deploy'
      };
    }

    console.log(`[API] Deploying ${agents.length} agents to tournament for ${address}`);

    const deployService = new TournamentServiceImpl();
    const result = await deployService.deployAgents(agents, address);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Deployment failed'
      };
    }

    const tournamentAgents = result.deployed || [];

    tournamentAgents.forEach(agent => {
      tournamentServiceExtended.addAgentToTournament(agent);
    });

    console.log(`[API] Returning ${tournamentAgents.length} deployed agents`);

    const serializedAgents = tournamentAgents.map(agent => ({
      ...agent,
      stakedAmount: agent.stakedAmount.toString(),
    }));

    return {
      success: true,
      deployed: serializedAgents,
      message: `Successfully deployed ${tournamentAgents.length} agents to the arena`,
    };
  } catch (error) {
    console.error('[API] Error in deploy-agents handler:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}