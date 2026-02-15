import { tournamentService } from '../services/tournament.service';
import { TournamentServiceImpl } from '../services/tournament-deploy.service';

export async function handleDeployAgents(req: Request) {
  try {
    const body = await req.json();
    const { agentIds, address } = body;

    if (!agentIds || !Array.isArray(agentIds)) {
      return Response.json(
        { success: false, error: 'Invalid agentIds' },
        { status: 400 }
      );
    }

    if (!address) {
      return Response.json(
        { success: false, error: 'Address required' },
        { status: 400 }
      );
    }

    if (agentIds.length === 0) {
      return Response.json(
        { success: false, error: 'No agents to deploy' },
        { status: 400 }
      );
    }

    console.log(`[API] Deploying ${agentIds.length} agents to tournament for ${address}`);

    const deployService = new TournamentServiceImpl();
    const result = await deployService.deployAgents(agentIds, address);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error || 'Deployment failed' },
        { status: 500 }
      );
    }

    const tournamentAgents = result.deployed || [];

    tournamentAgents.forEach(agent => {
      tournamentService.addAgentToTournament(agent);
    });

    return Response.json({
      success: true,
      deployed: tournamentAgents,
      message: `Successfully deployed ${tournamentAgents.length} agents to the arena`,
    });
  } catch (error) {
    console.error('[API] Error in deploy-agents handler:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}