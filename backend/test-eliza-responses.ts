import { elizaRuntimeService } from './src/services/eliza-runtime.service';

async function testAgentResponses() {
  console.log('[Test] Initializing ElizaOS agents...');
  await elizaRuntimeService.initializeAgents();
  console.log(`[Test] ${elizaRuntimeService.getAgentCount()} agents initialized`);
  
  const agentIds = elizaRuntimeService.getAllAgentIds();
  console.log('[Test] Agent IDs:', agentIds);
  
  const interactionTypes = ['DEBATE', 'CONVERT', 'ALLIANCE', 'BETRAYAL', 'MIRACLE'] as const;
  const gamePhases = ['GENESIS', 'CRUSADE', 'APOCALYPSE', 'RESOLUTION'] as const;
  
  for (const agentId of agentIds) {
    console.log(`\n[Test] Testing agent: ${agentId}`);
    
    for (const interactionType of interactionTypes) {
      for (const gamePhase of gamePhases) {
        const context = `You are in a ${gamePhase} phase tournament. Engaging in ${interactionType} with Opponent.`;
        
        const startTime = Date.now();
        const response = await elizaRuntimeService.generateResponse(agentId, {
          context,
          recipient: 'Opponent',
          interactionType,
          gamePhase
        });
        const duration = Date.now() - startTime;
        
        console.log(`  [${interactionType}/${gamePhase}] ${response} (${duration}ms)`);
      }
    }
  }
  
  console.log('\n[Test] All agents tested successfully!');
  process.exit(0);
}

testAgentResponses().catch(err => {
  console.error('[Test] Error:', err);
  process.exit(1);
});
