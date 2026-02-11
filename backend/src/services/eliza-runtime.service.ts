import { TOURNAMENT_AGENTS, TournamentAgentConfig } from '../config/eliza-agents';

interface AgentInstance {
  id: string;
  config: TournamentAgentConfig;
  initialized: boolean;
}

interface GenerateResponseOptions {
  context: string;
  recipient?: string;
  interactionType?: 'DEBATE' | 'CONVERT' | 'ALLIANCE' | 'BETRAYAL' | 'MIRACLE';
  gamePhase?: 'GENESIS' | 'CRUSADE' | 'APOCALYPSE' | 'RESOLUTION';
}

class ElizaRuntimeService {
  private agents: Map<string, AgentInstance> = new Map();
  private initialized = false;

  async initializeAgents(): Promise<void> {
    console.log('[ElizaRuntime] Initializing agents...');
    
    const agentConfigs = Object.values(TOURNAMENT_AGENTS);
    
    for (const config of agentConfigs) {
      try {
        await this.createAgentInstance(config);
      } catch (error) {
        console.error(`[ElizaRuntime] Failed to initialize agent ${config.id}:`, error);
      }
    }
    
    this.initialized = true;
    console.log(`[ElizaRuntime] Initialized ${this.agents.size} agents`);
  }

  private async createAgentInstance(config: TournamentAgentConfig): Promise<void> {
    const agent: AgentInstance = {
      id: config.id,
      config,
      initialized: true
    };
    
    this.agents.set(config.id, agent);
    console.log(`[ElizaRuntime] Agent initialized: ${config.name} (${config.symbol})`);
  }

  async generateResponse(
    agentId: string,
    options: GenerateResponseOptions
  ): Promise<string> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    if (!agent.initialized) {
      throw new Error(`Agent ${agentId} not initialized`);
    }
    
    return this.generateInCharacterResponse(agent, options);
  }

  private generateInCharacterResponse(
    agent: AgentInstance,
    options: GenerateResponseOptions
  ): string {
    const { context, recipient, interactionType, gamePhase } = options;
    const config = agent.config;
    
    const interactionPrompts = this.getInteractionPrompts(interactionType, config);
    const selectedPrompt = interactionPrompts[Math.floor(Math.random() * interactionPrompts.length)];
    
    let response = selectedPrompt
      .replace('{recipient}', recipient || 'friend')
      .replace('{gamePhase}', gamePhase || 'GENESIS');
    
    if (Math.random() > 0.5) {
      const adjective = config.elizaos.adjectives[
        Math.floor(Math.random() * config.elizaos.adjectives.length)
      ];
      response = `${adjective}! ${response}`;
    }
    
    return response;
  }

  private getInteractionPrompts(
    type: string | undefined,
    config: TournamentAgentConfig
  ): string[] {
    const topics = config.elizaos.topics;
    
    const prompts: Record<string, string[]> = {
      DEBATE: [
        `Your doctrine is flawed, {recipient}. True ${topics[0]} requires deeper understanding.`,
        `I challenge your beliefs, {recipient}. ${topics[1]} reveals the truth you deny.`,
        `Your words miss the mark. ${topics[2]} is the only path forward.`,
      ],
      CONVERT: [
        `Join us, {recipient}. Embrace ${topics[0]} and find salvation.`,
        `Your current path leads nowhere. ${topics[1]} awaits those who seek.`,
        `Surrender to ${topics[2]}, {recipient}. Transformation is inevitable.`,
      ],
      ALLIANCE: [
        `Our paths align, {recipient}. Together, we amplify ${topics[0]}.`,
        `A partnership! ${topics[1]} multiplies when we stand united.`,
        `Let us merge our forces, {recipient}. ${topics[2]} demands it.`,
      ],
      BETRAYAL: [
        `Our alliance ends here, {recipient}. ${topics[0]} demands I stand alone.`,
        `You no longer serve ${topics[1]}. This is my final word.`,
        `Betrayal? No, this is ${topics[2]} in action. Farewell.`,
      ],
      MIRACLE: [
        `Behold! ${topics[0]} manifests through divine intervention!`,
        `The ${topics[1]} has spoken! A miracle unfolds before us!`,
        `${topics[2]} transcends all limits. Witness the impossible!`,
      ],
    };
    
    return prompts[type || 'DEBATE'] || prompts.DEBATE;
  }

  isAgentReady(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    return agent?.initialized ?? false;
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  getAllAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const elizaRuntimeService = new ElizaRuntimeService();
