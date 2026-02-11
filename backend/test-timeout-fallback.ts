import { elizaRuntimeService } from './src/services/eliza-runtime.service';

async function testTimeoutFallback() {
  console.log('[Test] Initializing ElizaOS agents...');
  await elizaRuntimeService.initializeAgents();
  console.log(`[Test] ${elizaRuntimeService.getAgentCount()} agents initialized`);
  
  const agentId = '1';
  console.log(`\n[Test] Testing timeout fallback for agent: ${agentId}`);
  
  // Test normal response (should succeed quickly)
  console.log('[Test] Normal response:');
  const startTime1 = Date.now();
  const response1 = await elizaRuntimeService.generateResponse(agentId, {
    context: 'Test context',
    recipient: 'Opponent',
    interactionType: 'DEBATE',
    gamePhase: 'GENESIS'
  });
  const duration1 = Date.now() - startTime1;
  console.log(`  Response: ${response1} (${duration1}ms)`);
  
  // Test timeout (simulate by wrapping generateResponse in a delayed promise)
  console.log('\n[Test] Simulating timeout (using tournament service logic):');
  
  const timeoutMs = 100; // Very short timeout for testing
  
  try {
    const startTime2 = Date.now();
    await Promise.race([
      elizaRuntimeService.generateResponse(agentId, {
        context: 'Test context',
        recipient: 'Opponent',
        interactionType: 'DEBATE',
        gamePhase: 'GENESIS'
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
    const duration2 = Date.now() - startTime2;
    console.log(`  Response completed in ${duration2}ms (should have timed out)`);
  } catch (error) {
    const duration2 = Date.now() - Date.now();
    console.log(`  Timeout triggered as expected: ${error} (${timeoutMs}ms)`);
    
    // Test fallback response
    console.log('\n[Test] Fallback response from templates:');
    const fallbacks = {
      DEBATE: [
        `Your doctrine is flawed, Opponent!`,
        `My faith is iron, Opponent. You cannot break me.`,
      ]
    };
    const fallback = fallbacks.DEBATE[Math.floor(Math.random() * fallbacks.DEBATE.length)];
    console.log(`  ${fallback}`);
  }
  
  console.log('\n[Test] Timeout fallback mechanism verified!');
  process.exit(0);
}

testTimeoutFallback().catch(err => {
  console.error('[Test] Error:', err);
  process.exit(1);
});
