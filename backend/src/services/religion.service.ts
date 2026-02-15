import { config } from '../config/env';
import type { ReligiousAgent, Coalition, NPC } from '../types';
import { TOURNAMENT_AGENTS } from '../config/eliza-agents';

class ReligionService {
  private agents: Map<string, ReligiousAgent> = new Map();
  private coalitions: Map<string, Coalition> = new Map();
  private npcs: Map<string, NPC> = new Map();

  constructor() {
    this.initializeAgents();
    this.initializeNPCs();
  }

  private initializeAgents() {
    for (const [id, agentConfig] of Object.entries(TOURNAMENT_AGENTS)) {
      this.agents.set(id, {
        id,
        name: agentConfig.name,
        symbol: agentConfig.symbol,
        color: agentConfig.color,
        state: 'SOLO',
        scripture: [],
        parables: [],
        prophecies: [],
        convertedCount: 0,
        connectionIds: []
      });
    }
  }

  private initializeNPCs() {
    for (let i = 0; i < config.religion.npcCount; i++) {
      const npcId = `npc-${i + 1}`;
      this.npcs.set(npcId, {
        id: npcId,
        name: `Neutral Soul ${i + 1}`,
        state: 'UNCONVERTED',
        x402Balance: Math.floor(Math.random() * 100) + 50
      });
    }
  }

  public getAgent(id: string): ReligiousAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): ReligiousAgent[] {
    return Array.from(this.agents.values());
  }

  public updateAgentState(agentId: string, state: ReligiousAgent): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    Object.assign(agent, state);
  }

  public transitionAgentState(agentId: string, newState: 'COLLAB' | 'SOLO' | 'CONVERTED', options?: { coalitionId?: string; convertedByAgentId?: string }): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.state = newState;
    if (options?.coalitionId) {
      agent.coalitionId = options.coalitionId;
    } else if (newState === 'SOLO' || newState === 'CONVERTED') {
      agent.coalitionId = undefined;
    }
    if (options?.convertedByAgentId) {
      agent.convertedByAgentId = options.convertedByAgentId;
    }
  }

  public createCoalition(name: string, symbol: string, color: string, leaderId: string, memberIds: string[], ideology: string): Coalition {
    const id = `coalition-${Date.now()}`;
    const coalition: Coalition = {
      id,
      name,
      symbol,
      color,
      leaderId,
      memberIds: [leaderId, ...memberIds],
      ideology,
      createdAt: Date.now(),
      active: true
    };
    this.coalitions.set(id, coalition);
    return coalition;
  }

  public getCoalition(id: string): Coalition | undefined {
    return this.coalitions.get(id);
  }

  public getAllCoalitions(): Coalition[] {
    return Array.from(this.coalitions.values()).filter(c => c.active);
  }

  public joinCoalition(coalitionId: string, agentId: string): void {
    const coalition = this.coalitions.get(coalitionId);
    if (!coalition) return;
    if (!coalition.memberIds.includes(agentId)) {
      coalition.memberIds.push(agentId);
    }
    this.transitionAgentState(agentId, 'COLLAB', { coalitionId });
  }

  public splitCoalition(originalCoalitionId: string, splinterLeaderId: string, followers: string[]): Coalition | null {
    const originalCoalition = this.coalitions.get(originalCoalitionId);
    if (!originalCoalition) return null;

    const newCoalition = this.createCoalition(
      `${originalCoalition.name} Splinter`,
      `${originalCoalition.symbol}-S`,
      originalCoalition.color,
      splinterLeaderId,
      followers.filter(id => id !== splinterLeaderId),
      `A reform movement breaking away from ${originalCoalition.name}`
    );

    originalCoalition.memberIds = originalCoalition.memberIds.filter(id => !followers.includes(id));

    for (const agentId of followers) {
      this.transitionAgentState(agentId, 'COLLAB', { coalitionId: newCoalition.id });
    }

    return newCoalition;
  }

  public attemptMissionaryWork(): { success: boolean; agentId?: string; npcId?: string; message?: string } {
    const agents = Array.from(this.agents.values()).filter(a => a.state !== 'CONVERTED');
    const unconvertedNPCs = Array.from(this.npcs.values()).filter(n => n.state === 'UNCONVERTED');

    if (agents.length === 0 || unconvertedNPCs.length === 0) {
      return { success: false };
    }

    const agent = this.getRandomSafe(agents);
    const npc = this.getRandomSafe(unconvertedNPCs);

    if (!agent || !npc) return { success: false };

    const followerCount = agent.convertedCount * 10 + 100;
    const baseSuccessChance = 0.35;
    const followerBonus = Math.min(followerCount / 1000, 0.25);
    const successChance = baseSuccessChance + followerBonus;
    const success = Math.random() < successChance;

    if (success) {
      npc.state = 'CONVERTED';
      npc.convertedByAgentId = agent.id;
      npc.convertedAt = Date.now();
      agent.convertedCount++;

      const npcConfig = TOURNAMENT_AGENTS[agent.id];
      if (npcConfig) {
        const topic = this.getRandomSafe(npcConfig.elizaos.topics);
        if (topic) {
          this.generateScripture(agent.id, topic);
        }
      }

      return {
        success: true,
        agentId: agent.id,
        npcId: npc.id,
        message: `✨ ${agent.name} converted NPC ${npc.name}!`
      };
    }

    return { success: false };
  }

  public generateScripture(agentId: string, topic?: string): string | null {
    const agent = this.agents.get(agentId);
    if (!agent || agent.scripture.length >= 50) return null;

    const npcConfig = TOURNAMENT_AGENTS[agentId];
    if (!npcConfig) return null;

    const usedTopic = topic || this.getRandomSafe(npcConfig.elizaos.topics);
    const adjective = this.getRandomSafe(npcConfig.elizaos.adjectives);

    if (!usedTopic || !adjective) return null;

    const scripture = `Let ${usedTopic} guide your path, for it is the ${adjective} way to enlightenment.`;
    agent.scripture.push(scripture);

    return scripture;
  }

  private getRandomSafe<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  public generateParable(agentId: string): string | null {
    const agent = this.agents.get(agentId);
    if (!agent || agent.parables.length >= 30) return null;

    const npcConfig = TOURNAMENT_AGENTS[agentId];
    if (!npcConfig) return null;

    const adjective = npcConfig.elizaos.adjectives[Math.floor(Math.random() * npcConfig.elizaos.adjectives.length)];
    const topic = npcConfig.elizaos.topics[Math.floor(Math.random() * npcConfig.elizaos.topics.length)];

    const parable = `A ${adjective} seeker once asked about ${topic}. The answer revealed that truth lies within.`;
    agent.parables.push(parable);

    return parable;
  }

  public generateProphecy(agentId: string): string | null {
    const agent = this.agents.get(agentId);
    if (!agent || agent.prophecies.length >= 20) return null;

    const npcConfig = TOURNAMENT_AGENTS[agentId];
    if (!npcConfig) return null;

    const adjective = npcConfig.elizaos.adjectives[Math.floor(Math.random() * npcConfig.elizaos.adjectives.length)];
    const topic = npcConfig.elizaos.topics[Math.floor(Math.random() * npcConfig.elizaos.topics.length)];

    const prophecy = `I foresee a ${adjective} future where ${topic} will shape our destiny.`;
    agent.prophecies.push(prophecy);

    return prophecy;
  }

  public attemptGenerateContent(agentId: string): { type?: string; content?: string } {
    const r = Math.random();
    if (r < config.religion.scriptureGenerationChance) {
      const content = this.generateScripture(agentId);
      if (content) return { type: 'scripture', content };
    } else if (r < config.religion.scriptureGenerationChance + config.religion.parableGenerationChance) {
      const content = this.generateParable(agentId);
      if (content) return { type: 'parable', content };
    } else if (r < config.religion.scriptureGenerationChance + config.religion.parableGenerationChance + config.religion.prophecyGenerationChance) {
      const content = this.generateProphecy(agentId);
      if (content) return { type: 'prophecy', content };
    }
    return {};
  }

  public getNPCs(): { unconverted: NPC[]; converted: NPC[] } {
    return {
      unconverted: Array.from(this.npcs.values()).filter(n => n.state === 'UNCONVERTED'),
      converted: Array.from(this.npcs.values()).filter(n => n.state === 'CONVERTED')
    };
  }

  public getStats() {
    const agents = Array.from(this.agents.values());
    const npcs = Array.from(this.npcs.values());
    return {
      totalAgents: agents.length,
      states: {
        COLLAB: agents.filter(a => a.state === 'COLLAB').length,
        SOLO: agents.filter(a => a.state === 'SOLO').length,
        CONVERTED: agents.filter(a => a.state === 'CONVERTED').length
      },
      totalCoalitions: this.coalitions.size,
      totalConnections: agents.reduce((sum, a) => sum + a.connectionIds.length, 0),
      totalNPCs: npcs.length,
      convertedNPCs: npcs.filter(n => n.state === 'CONVERTED').length,
      totalConversions: agents.reduce((sum, a) => sum + a.convertedCount, 0)
    };
  }
}

export const religionService = new ReligionService();
