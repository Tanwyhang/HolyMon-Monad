import { ServerWebSocket } from 'bun';
import { elizaService } from './eliza.service';
import { contractService } from './contract.service';
import { elizaRuntimeService } from './eliza-runtime.service';

export interface TournamentAgent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  avatar: string;
  stakedAmount: bigint;
  followers: number;
  status: 'IDLE' | 'TALKING' | 'BATTLE';
  lastAction: number;
}

export interface Interaction {
  id: string;
  type: 'DEBATE' | 'CONVERT' | 'ALLIANCE' | 'BETRAYAL' | 'MIRACLE';
  agent1Id: string;
  agent2Id: string;
  messages: Array<{
    senderId: string;
    text: string;
    timestamp: number;
  }>;
  winnerId?: string;
  timestamp: number;
}

export interface GameState {
  phase: 'GENESIS' | 'CRUSADE' | 'APOCALYPSE' | 'RESOLUTION';
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

class TournamentService {
  private clients: Set<ServerWebSocket<any>> = new Set();
  private agents: Map<string, TournamentAgent> = new Map();
  private gameState: GameState = {
    phase: 'GENESIS',
    round: 1,
    timeLeft: 60,
    activeInteractions: [],
    recentEvents: [],
  };
  private loopInterval: Timer | null = null;

  // Configuration
  private readonly PHASE_DURATION = 60; // seconds
  private readonly INTERACTION_CHANCE_BASE = 0.3; // 30% chance per tick

  constructor() {
    this.initializeAgents();
    this.startGameLoop();
  }

  private async initializeAgents() {
    // In a real scenario, fetch from ERC8004/ElizaService
    // For now, we seed with the "all" agents requested
    const seeds = [
      { id: '1', name: 'Divine Light', symbol: 'LIGHT', color: '#ffd700' },
      { id: '2', name: 'Void Walker', symbol: 'VOID', color: '#8b5cf6' },
      { id: '3', name: 'Iron Faith', symbol: 'IRON', color: '#ef4444' },
      { id: '4', name: 'Emerald Spirit', symbol: 'EMRLD', color: '#10b981' },
      { id: '5', name: 'Crystal Dawn', symbol: 'CRSTL', color: '#06b6d4' },
      { id: '6', name: 'Cyber Monk', symbol: 'CYBER', color: '#f472b6' },
      { id: '7', name: 'Neon Saint', symbol: 'NEON', color: '#c084fc' },
      { id: '8', name: 'Quantum Priest', symbol: 'QNTM', color: '#60a5fa' },
    ];

    for (const seed of seeds) {
      // Try to get real stake if possible, else random
      let stake = BigInt(Math.floor(Math.random() * 10000)); 
      try {
         // Mock call to contract service if we had addresses
         // const info = await contractService.getUserStakeInfo(...)
      } catch (e) {}

      this.agents.set(seed.id, {
        ...seed,
        avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed.name}`,
        stakedAmount: stake,
        followers: 100 + Number(stake) / 100,
        status: 'IDLE',
        lastAction: 0,
      });
    }
  }

  public registerClient(ws: ServerWebSocket<any>) {
    this.clients.add(ws);
    // Send initial state
    ws.send(JSON.stringify({
      type: 'INIT',
      payload: {
        agents: Array.from(this.agents.values()),
        gameState: this.gameState
      }
    }, (key, value) => typeof value === 'bigint' ? value.toString() : value));
  }

  public removeClient(ws: ServerWebSocket<any>) {
    this.clients.delete(ws);
  }

  private startGameLoop() {
    this.loopInterval = setInterval(() => {
      this.updateGameLoop();
    }, 1000); // 1 tick per second
  }

  private updateGameLoop() {
    // 1. Update Time
    this.gameState.timeLeft--;
    if (this.gameState.timeLeft <= 0) {
      this.advancePhase();
    }

    // 2. Resolve Old Interactions (after 5 seconds)
    const now = Date.now();
    this.gameState.activeInteractions = this.gameState.activeInteractions.filter(i => {
      if (now - i.timestamp > 8000) { // Keep for 8s
        // Free up agents
        const a1 = this.agents.get(i.agent1Id);
        const a2 = this.agents.get(i.agent2Id);
        if (a1) a1.status = 'IDLE';
        if (a2) a2.status = 'IDLE';
        return false;
      }
      return true;
    });

    // 3. Trigger New Interactions
    this.attemptNewInteraction();

    // 4. Trigger Global Events (Token Launches, Staking)
    this.attemptGlobalEvent();

    // 5. Broadcast Update
    this.broadcastState();
  }

  private attemptGlobalEvent() {
    if (Math.random() > 0.05) return; // 5% chance per tick

    const events = [
      () => {
        const agent = Array.from(this.agents.values())[Math.floor(Math.random() * this.agents.size)];
        return `🚀 ${agent.name} just launched $${agent.symbol} on TokenLaunchpad!`;
      },
      () => {
         const amount = Math.floor(Math.random() * 5000) + 100;
         const agent = Array.from(this.agents.values())[Math.floor(Math.random() * this.agents.size)];
         agent.stakedAmount += BigInt(amount);
         return `🐳 WHALE ALERT: ${amount} MON staked on ${agent.symbol}`;
      },
      () => {
        const agent = Array.from(this.agents.values())[Math.floor(Math.random() * this.agents.size)];
        agent.followers += Math.floor(Math.random() * 100);
        return `📈 ${agent.symbol} is trending! Follower count surging.`;
      }
    ];

    const eventFn = events[Math.floor(Math.random() * events.length)];
    this.addEvent(eventFn());
  }

  private advancePhase() {
    const phases: GameState['phase'][] = ['GENESIS', 'CRUSADE', 'APOCALYPSE', 'RESOLUTION'];
    const currentIdx = phases.indexOf(this.gameState.phase);
    const nextIdx = (currentIdx + 1) % phases.length;
    
    this.gameState.phase = phases[nextIdx];
    this.gameState.timeLeft = this.PHASE_DURATION;
    this.gameState.round++;

    this.addEvent(`⚠️ PHASE CHANGE: Entering ${this.gameState.phase}`);
  }

  private attemptNewInteraction() {
    // Filter idle agents
    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'IDLE');
    if (idleAgents.length < 2) return;
 
    // Chance to trigger
    if (Math.random() > this.INTERACTION_CHANCE_BASE) return;
 
    // Pick Agent 1 (Weighted by Stake)
    const agent1 = this.pickWeightedAgent(idleAgents);
    // Pick Agent 2 (Random other)
    const others = idleAgents.filter(a => a.id !== agent1.id);
    if (others.length === 0) return;
    const agent2 = others[Math.floor(Math.random() * others.length)];

    this.startInteraction(agent1, agent2).catch(err => {
      console.error('[Tournament] Error in startInteraction:', err);
    });
  }

  private pickWeightedAgent(agents: TournamentAgent[]): TournamentAgent {
    // Simple weight based on staked amount
    const totalStake = agents.reduce((sum, a) => sum + Number(a.stakedAmount), 0);
    let r = Math.random() * totalStake;
    for (const agent of agents) {
      r -= Number(agent.stakedAmount);
      if (r <= 0) return agent;
    }
    return agents[0];
  }

  private async startInteraction(a1: TournamentAgent, a2: TournamentAgent) {
    a1.status = 'TALKING';
    a2.status = 'TALKING';
    a1.lastAction = Date.now();
    a2.lastAction = Date.now();

    const types: Interaction['type'][] = ['DEBATE', 'CONVERT', 'ALLIANCE', 'BETRAYAL', 'MIRACLE'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Generate Dialogue with ElizaOS (async, with fallback)
    const messages = await this.generateDialogueWithEliza(a1, a2, type);

    const interaction: Interaction = {
      id: crypto.randomUUID(),
      type,
      agent1Id: a1.id,
      agent2Id: a2.id,
      messages,
      timestamp: Date.now()
    };

    this.gameState.activeInteractions.push(interaction);
    
    // Update Followers based on interaction
    const impact = Math.floor(Math.random() * 50) + 10;
    a1.followers += impact; // Simplified: Initiator gains
    if (type === 'ALLIANCE') a2.followers += impact;
    else if (type === 'BETRAYAL') a2.followers -= impact;

    this.addEvent(`${this.getIcon(type)} ${a1.symbol} initiated ${type} with ${a2.symbol}`);
  }

  private async generateDialogueWithEliza(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type']) {
    const context = `You are in a ${this.gameState.phase} phase tournament. Engaging in ${type} with ${a2.name} (${a2.symbol}).`;
    
    const timeoutMs = 2000;
    
    try {
      const [response1, response2] = await Promise.allSettled([
        Promise.race([
          elizaRuntimeService.generateResponse(a1.id, {
            context,
            recipient: a2.name,
            interactionType: type,
            gamePhase: this.gameState.phase
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]),
        Promise.race([
          elizaRuntimeService.generateResponse(a2.id, {
            context,
            recipient: a1.name,
            interactionType: type,
            gamePhase: this.gameState.phase
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ])
      ]);
      
      const text1 = response1.status === 'fulfilled' ? response1.value : this.getFallbackResponse(a1, a2, type, 0);
      const text2 = response2.status === 'fulfilled' ? response2.value : this.getFallbackResponse(a2, a1, type, 1);
      
      return [
        { senderId: a1.id, text: text1, timestamp: Date.now() },
        { senderId: a2.id, text: text2, timestamp: Date.now() + 1000 }
      ];
    } catch (error) {
      console.error('[Tournament] Error generating dialogue with Eliza:', error);
      return this.generateDialogue(a1, a2, type);
    }
  }

  private getFallbackResponse(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type'], messageIndex: number): string {
    const templates = {
      DEBATE: [
        `Your doctrine is flawed, ${a2.name}!`,
        `My faith is iron, ${a1.name}. You cannot break me.`,
        `The blockchain reveals all truth, ${a2.name}.`,
        `But it does not reveal the soul, ${a1.name}.`,
        `Efficiency is the only god.`,
        `Compassion outweighs your logic.`
      ],
      CONVERT: [
        `Join the ${a1.name} protocol, find salvation.`,
        `I am tempted... your staking yields are high.`,
        `Abandon your false idols!`,
        `My followers would never forgive me.`
      ],
      ALLIANCE: [
        `Let us merge our liquidity pools.`,
        `Agreed. Together we are unstoppable.`,
        `A strategic partnership?`,
        `Yes, for the greater good of Monad.`
      ],
      BETRAYAL: [
        `I sold all your tokens, ${a2.name}.`,
        `Traitor! You will burn for this!`,
        `Our alliance ends here.`,
        `I knew you were never true code.`
      ],
      MIRACLE: [
        `BEHOLD! A 1000x multiplier!`,
        `By the great Monad... it's beautiful.`,
        `I summon the Genesis Block!`,
        `The power... it's overwhelming!`
      ]
    };
    
    const set = templates[type] || templates.DEBATE;
    return set[messageIndex % set.length];
  }

  private generateDialogue(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type']) {
    const templates = {
      DEBATE: [
        ["Your doctrine is flawed, {a2}!", "My faith is iron, {a1}. You cannot break me."],
        ["The blockchain reveals all truth, {a2}.", "But it does not reveal the soul, {a1}."],
        ["Efficiency is the only god.", "Compassion outweighs your logic."]
      ],
      CONVERT: [
        ["Join the {a1} protocol, find salvation.", "I am tempted... your staking yields are high."],
        ["Abandon your false idols!", "My followers would never forgive me."]
      ],
      ALLIANCE: [
        ["Let us merge our liquidity pools.", "Agreed. Together we are unstoppable."],
        ["A strategic partnership?", "Yes, for the greater good of Monad."]
      ],
      BETRAYAL: [
        ["I sold all your tokens, {a2}.", "Traitor! You will burn for this!"],
        ["Our alliance ends here.", "I knew you were never true code."]
      ],
      MIRACLE: [
        ["BEHOLD! A 1000x multiplier!", "By the great Monad... it's beautiful."],
        ["I summon the Genesis Block!", "The power... it's overwhelming!"]
      ]
    };

    const set = templates[type][Math.floor(Math.random() * templates[type].length)];
    return [
      { senderId: a1.id, text: set[0].replace('{a2}', a2.name).replace('{a1}', a1.name), timestamp: Date.now() },
      { senderId: a2.id, text: set[1].replace('{a2}', a2.name).replace('{a1}', a1.name), timestamp: Date.now() + 1000 }
    ];
  }

  private getIcon(type: string) {
    switch(type) {
      case 'DEBATE': return '⚔️';
      case 'CONVERT': return '✨';
      case 'ALLIANCE': return '🤝';
      case 'BETRAYAL': return '💔';
      case 'MIRACLE': return '⚡';
      default: return '📢';
    }
  }

  private addEvent(text: string) {
    this.gameState.recentEvents.unshift(text);
    if (this.gameState.recentEvents.length > 20) this.gameState.recentEvents.pop();
  }

  private broadcastState() {
    const data = JSON.stringify({
      type: 'UPDATE',
      payload: {
        agents: Array.from(this.agents.values()),
        gameState: this.gameState
      }
    }, (key, value) => typeof value === 'bigint' ? value.toString() : value);

    for (const client of this.clients) {
      client.send(data);
    }
  }
}

export const tournamentService = new TournamentService();
