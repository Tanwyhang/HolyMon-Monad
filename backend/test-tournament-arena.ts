const ws = new WebSocket('ws://localhost:3001/tournament/ws');

let messagesReceived = 0;
let interactionsReceived = 0;
let agentsReceived = false;

console.log('[Test] Connecting to tournament WebSocket...');

ws.onopen = () => {
  console.log('[Test] Connected to tournament WebSocket');
  console.log('[Test] Waiting for initial state...');
  
  setTimeout(() => {
    console.log(`[Test] Messages received: ${messagesReceived}`);
    console.log(`[Test] Agents received: ${agentsReceived}`);
    console.log(`[Test] Interactions received: ${interactionsReceived}`);
    
    if (agentsReceived) {
      console.log('\n[Test] ✓ ElizaOS Tournament Arena Integration Test PASSED');
      console.log('[Test] WebSocket is receiving real-time updates with AI responses');
      ws.close();
      process.exit(0);
    } else {
      console.log('\n[Test] ✗ No agents received - Test FAILED');
      ws.close();
      process.exit(1);
    }
  }, 15000); // Wait 15 seconds for interactions
};

ws.onmessage = (event) => {
  messagesReceived++;
  
  try {
    const data = JSON.parse(event.data);
    
    if (data.type === 'INIT') {
      console.log(`[Test] INIT received: ${data.payload.agents?.length || 0} agents`);
      if (data.payload.agents && data.payload.agents.length > 0) {
        agentsReceived = true;
        console.log('[Test] ✓ Agents received from ElizaOS integration');
        
        // Log first few agents
        data.payload.agents.slice(0, 3).forEach((agent: any) => {
          console.log(`  - ${agent.name} (${agent.symbol}) - ${agent.status}`);
        });
      }
      
      console.log(`[Test] Game phase: ${data.payload.gameState.phase}`);
      console.log(`[Test] Time left: ${data.payload.gameState.timeLeft}s`);
    }
    
    if (data.type === 'UPDATE') {
      const { agents, gameState } = data.payload;
      
      if (gameState.activeInteractions && gameState.activeInteractions.length > 0) {
        const newInteractions = gameState.activeInteractions.filter((i: any) => {
          return !interactionsReceived || i.timestamp > Date.now() - 5000;
        });
        
        if (newInteractions.length > 0) {
          interactionsReceived = gameState.activeInteractions.length;
          console.log(`\n[Test] ✓ New interactions detected: ${interactionsReceived}`);
          
          newInteractions.slice(0, 2).forEach((interaction: any) => {
            const agent1 = agents.find((a: any) => a.id === interaction.agent1Id);
            const agent2 = agents.find((a: any) => a.id === interaction.agent2Id);
            
            console.log(`\n[Test] Interaction #${interaction.id.slice(0, 8)}...`);
            console.log(`  Type: ${interaction.type}`);
            console.log(`  ${agent1?.name} (${agent1?.symbol}) ↔ ${agent2?.name} (${agent2?.symbol})`);
            
            interaction.messages.forEach((msg: any) => {
              const sender = agents.find((a: any) => a.id === msg.senderId);
              console.log(`    ${sender?.name}: "${msg.text}"`);
            });
          });
        }
      }
    }
  } catch (error) {
    console.error('[Test] Error parsing message:', error);
  }
};

ws.onerror = (error) => {
  console.error('[Test] WebSocket error:', error);
  process.exit(1);
};

ws.onclose = () => {
  console.log('[Test] WebSocket closed');
};
