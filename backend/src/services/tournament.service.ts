import type { ServerWebSocket } from 'bun';
import { elizaRuntimeService } from './eliza-runtime.service';
import { religionService } from './religion.service';
import { x402ConnectionService } from './x402-connection.service';
import { config } from '../config/env';
import { enhanceAgentsBatch } from './blockchain.service';

// Tournament agent seeds - in production these would come from blockchain
const AGENT_SEEDS = [
  { id: '1', name: 'Divine Light', symbol: 'LIGHT', color: '#ffd700' },
  { id: '2', name: 'Void Walker', symbol: 'VOID', color: '#8b5cf6' },
  { id: '3', name: 'Iron Faith', symbol: 'IRON', color: '#ef4444' },
  { id: '4', name: 'Emerald Spirit', symbol: 'EMRLD', color: '#10b981' },
  { id: '5', name: 'Crystal Dawn', symbol: 'CRSTL', color: '#06b6d4' },
  { id: '6', name: 'Cyber Monk', symbol: 'CYBER', color: '#f472b6' },
  { id: '7', name: 'Neon Saint', symbol: 'NEON', color: '#c084fc' },
  { id: '8', name: 'Quantum Priest', symbol: 'QNTM', color: '#60a5fa' },
];

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
  private coalitionFormedPairs: Set<string> = new Set();

  private getRandomSafe<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  // Configuration
  private readonly PHASE_DURATION = 40; // seconds (3 phases = 120s total)
  private readonly INTERACTION_CHANCE_BASE = 0.65; // 65% chance per tick

  constructor() {
    this.initializeAgents();
    this.startGameLoop();
  }

  private async initializeAgents() {
    // Fetch real blockchain data for all tournament agents
    try {
      const enhancedAgents = await enhanceAgentsBatch(AGENT_SEEDS);

      for (const agent of enhancedAgents) {
        this.agents.set(agent.id, agent);
        console.log(`[Tournament] Initialized agent: ${agent.name} - Staked: ${agent.stakedAmount}, Followers: ${agent.followers}`);
      }
    } catch (error) {
      console.error('[Tournament] Error fetching blockchain data, using fallback:', error);
      // Fallback to random values if blockchain fetch fails
      for (const seed of AGENT_SEEDS) {
        let stake = BigInt(Math.floor(Math.random() * 10000));

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
      if (now - i.timestamp > 8000) {
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

    // 4. Trigger Religious Events
    this.attemptMissionaryWork();
    this.attemptGenerateContent();

    // 5. Trigger Global Events (Token Launches, Staking)
    this.attemptGlobalEvent();

    // 6. Broadcast Update
    this.broadcastState();

    // 7. Log Game Health (every second)
    this.logGameHealth();
  }

  private logGameHealth() {
    const activeCount = this.gameState.activeInteractions.length;
    const eventCount = this.gameState.recentEvents.length;
    const idleCount = Array.from(this.agents.values()).filter(a => a.status === 'IDLE').length;
    const talkingCount = Array.from(this.agents.values()).filter(a => a.status === 'TALKING').length;

    console.log(`[GAME HEALTH] Phase:${this.gameState.phase} T:${this.gameState.timeLeft}s | Active:${activeCount} | Idle:${idleCount} | Talking:${talkingCount} | Events:${eventCount}`);
  }

  private attemptGlobalEvent() {
    if (Math.random() > 0.05) return; // 5% chance per tick

    const allAgents = Array.from(this.agents.values());
    if (allAgents.length === 0) return;

    const events = [
      () => {
        const agent = this.getRandomSafe(allAgents);
        if (!agent) return '';
        return `🚀 ${agent.name} just launched $${agent.symbol} on TokenLaunchpad!`;
      },
      () => {
         const amount = Math.floor(Math.random() * 5000) + 100;
         const agent = this.getRandomSafe(allAgents);
         if (!agent) return '';
         // Get reference from Map and update
         const mapAgent = this.agents.get(agent.id);
         if (!mapAgent) return '';
         mapAgent.stakedAmount += BigInt(amount);
         return `🐳 WHALE ALERT: ${amount} MON staked on ${agent.symbol}`;
      },
      () => {
         const agent = this.getRandomSafe(allAgents);
         if (!agent) return '';
         // Get reference from Map and update
         const mapAgent = this.agents.get(agent.id);
         if (!mapAgent) return '';
         mapAgent.followers += Math.floor(Math.random() * 100);
         return `📈 ${agent.symbol} is trending! Follower count surging.`;
      }
    ];

    const eventFn = this.getRandomSafe(events);
    if (!eventFn) return;

    const message = eventFn();
    if (message) {
      this.addEvent(message);
    }
  }

  private advancePhase() {
    const phases: GameState['phase'][] = ['GENESIS', 'CRUSADE', 'APOCALYPSE'];
    const currentIdx = phases.indexOf(this.gameState.phase!);
    const nextIdx = currentIdx + 1;

    if (nextIdx >= phases.length) {
      this.gameState.phase = 'RESOLUTION';
      this.addEvent(`🏆 APOCALYPSE PHASE COMPLETE - GAME OVER`);
      this.addEvent(`Total Conversions: ${this.getTotalConversions()}`);
      return;
    }

    this.gameState.phase = phases[nextIdx]!;
    this.gameState.timeLeft = this.PHASE_DURATION;
    this.gameState.round++;

    this.addEvent(`⚠️ PHASE CHANGE: Entering ${this.gameState.phase}`);
  }

  private getTotalConversions(): number {
    return Array.from(this.agents.values()).reduce((sum, a) => {
      const religionAgent = religionService.getAgent(a.id);
      return sum + (religionAgent?.convertedCount || 0);
    }, 0);
  }

  private attemptNewInteraction() {
    // Filter potential initiators - non-CONVERTED agents
    const initiatorCandidates = Array.from(this.agents.values()).filter(a => {
      const religionAgent = religionService.getAgent(a.id);
      return a.status === 'IDLE' && (!religionAgent || religionAgent.state !== 'CONVERTED');
    });
    if (initiatorCandidates.length === 0) return;

    // All idle agents (including CONVERTED) as potential targets
    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'IDLE');

    // Chance to trigger
    if (Math.random() > this.INTERACTION_CHANCE_BASE) return;

    // Pick Agent 1 (Weighted by Stake) - non-CONVERTED only
    const agent1 = this.pickWeightedAgent(initiatorCandidates);
    if (!agent1) return;

    // Pick Agent 2 (Random other) - can be CONVERTED
    const others = idleAgents.filter(a => a.id !== agent1.id);
    const agent2 = this.getRandomSafe(others);
    if (!agent2) return;

    this.startInteraction(agent1, agent2).catch(err => {
      console.error('[Tournament] Error in startInteraction:', err);
    });
  }

  private pickWeightedAgent(agents: TournamentAgent[]): TournamentAgent | undefined {
    if (agents.length === 0) return undefined;

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
    const type = this.getRandomSafe(types);
    if (!type) return;

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

    // Establish x402 connection
    const connection = x402ConnectionService.establishConnection(a1.id, a2.id);
    const agent1Religion = religionService.getAgent(a1.id);
    const agent2Religion = religionService.getAgent(a2.id);
    if (agent1Religion) agent1Religion.connectionIds.push(connection.id);
    if (agent2Religion) agent2Religion.connectionIds.push(connection.id);

    // Handle religious state transitions
    this.handleReligiousInteraction(a1, a2, type, interaction.id!);

    // Update Followers based on interaction
    const impact = Math.floor(Math.random() * 50) + 10;
    a1.followers += impact;
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
            interactionType: type!,
            gamePhase: this.gameState.phase!
          }, true),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]),
        Promise.race([
          elizaRuntimeService.generateResponse(a2.id!, {
            context,
            recipient: a1.name,
            interactionType: type!,
            gamePhase: this.gameState.phase!
          }, true),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ])
      ]);

      const text1 = response1.status === 'fulfilled' ? response1.value : this.getFallbackResponse(a1, a2, type!, 0);
      const text2 = response2.status === 'fulfilled' ? response2.value : this.getFallbackResponse(a2, a1, type!, 1);

      return [
        { senderId: a1.id, text: text1, timestamp: Date.now() },
        { senderId: a2.id, text: text2, timestamp: Date.now() + 1000 }
      ];
    } catch (error) {
      console.error('[Tournament] Error generating dialogue with Eliza:', error);
      return this.generateDialogue(a1, a2, type!);
    }
  }

  private getFallbackResponse(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type'], messageIndex: number): string {
    const templates: Record<string, string[]> = {
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

    const set = templates[type];
    if (!set || set.length === 0) return 'I speak truth.';
    return set[messageIndex % set.length];
  }

  private generateDialogue(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type']) {
    const templates: Record<string, [string, string][]> = {
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

    const setList = templates[type];
    if (!setList || setList.length === 0) {
      return [
        { senderId: a1.id, text: 'I speak truth.', timestamp: Date.now() },
        { senderId: a2.id, text: 'I also speak truth.', timestamp: Date.now() + 1000 }
      ];
    }

    const set = setList[Math.floor(Math.random() * setList.length)];
    if (!set || set.length < 2) {
      return [
        { senderId: a1.id, text: 'I speak truth.', timestamp: Date.now() },
        { senderId: a2.id, text: 'I also speak truth.', timestamp: Date.now() + 1000 }
      ];
    }

    return [
      { senderId: a1.id, text: set[0].replace('{a2}', a2.name).replace('{a1}', a1.name), timestamp: Date.now() },
      { senderId: a2.id, text: set[1].replace('{a2}', a2.name).replace('{a1}', a1.name), timestamp: Date.now() + 1000 }
    ];
  }

  private getIcon(type: string): string {
    switch(type) {
      case 'DEBATE': return '⚔️';
      case 'CONVERT': return '✨';
      case 'ALLIANCE': return '🤝';
      case 'BETRAYAL': return '💔';
      case 'MIRACLE': return '⚡';
      default: return '📢';
    }
  }

  private handleReligiousInteraction(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type'], connectionId: string) {
    const agent1Config = TOURNAMENT_AGENTS[a1.id];
    const agent2Config = TOURNAMENT_AGENTS[a2.id];

    if (type === 'ALLIANCE') {
      const agent1 = religionService.getAgent(a1.id);
      const agent2 = religionService.getAgent(a2.id);

      if (!agent1 || !agent2) return;

      if (agent1.state === 'COLLAB' && agent1.coalitionId) {
        const coalition = religionService.getCoalition(agent1.coalitionId);
        if (coalition) {
          religionService.joinCoalition(coalition.id, a2.id);
          this.addEvent(`🤝 ${a2.name} joined coalition ${coalition.name}`);
        }
      } else if (agent2.state === 'COLLAB' && agent2.coalitionId) {
        const coalition = religionService.getCoalition(agent2.coalitionId);
        if (coalition) {
          religionService.joinCoalition(coalition.id, a1.id);
          this.addEvent(`🤝 ${a1.name} joined coalition ${coalition.name}`);
        }
      } else {
        const pairKey = [a1.id, a2.id].sort().join('-');
        if (this.coalitionFormedPairs.has(pairKey)) {
          return;
        }

        const symbol = `${a1.symbol}-${a2.symbol}`;
        const topic1 = agent1Config?.elizaos.topics[0] || 'truth';
        const topic2 = agent2Config?.elizaos.topics[0] || 'power';
        const ideology = `A union of ${topic1} and ${topic2}`;
        const coalition = religionService.createCoalition(
          `${a1.name} Alliance`,
          symbol,
          a1.color,
          a1.id,
          [a2.id],
          ideology
        );
        this.coalitionFormedPairs.add(pairKey);
        this.addEvent(`🤝 NEW COALITION: ${coalition.name} (${symbol}) formed!`);
      }
    } else if (type === 'BETRAYAL') {
      const agent1 = religionService.getAgent(a1.id);
      const agent2 = religionService.getAgent(a2.id);

      if (agent1 && agent1.state === 'COLLAB' && agent1.coalitionId) {
        x402ConnectionService.terminateConnection(connectionId, 'betrayal');
        const followers = [a1.id];
        const coalition = religionService.splitCoalition(agent1.coalitionId, a1.id, followers);
        if (coalition) {
          this.addEvent(`💔 SCHISM: ${coalition.name} broke away!`);
        }
      }
    } else if (type === 'CONVERT') {
      const agent1 = religionService.getAgent(a1.id);
      const agent2 = religionService.getAgent(a2.id);

      if (agent1 && agent2 && agent1.state !== 'CONVERTED' && agent2.state !== 'CONVERTED') {
        const success = Math.random() < 0.5;
        if (success && agent1Config) {
          religionService.transitionAgentState(a2.id, 'CONVERTED', { convertedByAgentId: a1.id });
          agent1.convertedCount++;
          const topic = this.getRandomSafe(agent1Config.elizaos.topics);
          const scripture = religionService.generateScripture(a1.id, topic);
          if (scripture) {
            this.addEvent(`📜 New Scripture: "${scripture}"`);
          }
          this.addEvent(`✨ ${a2.name} converted to ${a1.name}!`);
        }
      }
    }

    this.addEvent(`${this.getIcon(type)} ${a1.symbol} initiated ${type} with ${a2.symbol}`);
	  }

  private attemptMissionaryWork() {
    if (Math.random() > config.religion.missionaryChance) return;

    const result = religionService.attemptMissionaryWork();
    if (result.success && result.message) {
      this.addEvent(result.message);
    }
  }

  private attemptGenerateContent() {
    const agents = Array.from(this.agents.values());
    for (const agent of agents) {
      const r = Math.random();
      if (r < config.religion.scriptureGenerationChance) {
        const content = religionService.attemptGenerateContent(agent.id);
        if (content.content && content.type === 'scripture') {
          this.addEvent(`📜 New Scripture from ${agent.name}: "${content.content}"`);
        }
      } else if (r < config.religion.scriptureGenerationChance + config.religion.parableGenerationChance) {
        const content = religionService.attemptGenerateContent(agent.id);
        if (content.content && content.type === 'parable') {
          this.addEvent(`📖 New Parable from ${agent.name}: "${content.content}"`);
        }
      } else if (r < config.religion.scriptureGenerationChance + config.religion.parableGenerationChance + config.religion.prophecyGenerationChance) {
        const content = religionService.attemptGenerateContent(agent.id);
        if (content.content && content.type === 'prophecy') {
          this.addEvent(`🔮 New Prophecy from ${agent.name}: "${content.content}"`);
        }
      }
    }
  }

  private addEvent(text: string) {
    this.gameState.recentEvents.unshift(text);
    if (this.gameState.recentEvents.length > 30) this.gameState.recentEvents.pop();
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

export interface TournamentServiceExtended {
  addAgentToTournament(agent: TournamentAgent): void;
  removeAgentFromTournament(agentId: string): void;
  getAgent(agentId: string): TournamentAgent | undefined;
}

const extendedService = tournamentService as TournamentServiceExtended & typeof tournamentService;

extendedService.addAgentToTournament = function(agent: TournamentAgent) {
  console.log(`[Tournament] Adding agent to tournament: ${agent.name} (${agent.symbol})`);
  this.agents.set(agent.id, agent);
};

extendedService.removeAgentFromTournament = function(agentId: string) {
  console.log(`[Tournament] Removing agent from tournament: ${agentId}`);
  this.agents.delete(agentId);
};

extendedService.getAgent = function(agentId: string): TournamentAgent | undefined {
  return this.agents.get(agentId);
};

export { extendedService as tournamentServiceExtended };
