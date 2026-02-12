import { TOURNAMENT_AGENTS, TournamentAgentConfig } from '../config/eliza-agents';
import { config } from '../config/env';

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

interface CachedResponse {
  text: string;
  timestamp: number;
}

class ElizaRuntimeService {
  private agents: Map<string, AgentInstance> = new Map();
  private initialized = false;
  private responseCache: Map<string, CachedResponse> = new Map();
  private apiCallCount: Map<string, number> = new Map();
  private hybridRatio = config.elizaos.hybridRatio;
  private cacheTTL = config.elizaos.cacheTTL;
  private llmTimeout = config.elizaos.llmTimeout;
  
  private groqClient: any = null;

  async initializeAgents(): Promise<void> {
    console.log('[ElizaRuntime] Initializing agents...');
    
    if (config.elizaos.groqApiKey && config.elizaos.groqApiKey !== 'gsk_xxx') {
      try {
        const { createGroq } = await import('@ai-sdk/groq');
        this.groqClient = createGroq({ 
          apiKey: config.elizaos.groqApiKey 
        });
        console.log('[ElizaRuntime] Groq client initialized successfully');
      } catch (error) {
        console.warn('[ElizaRuntime] Failed to initialize Groq client:', error);
        this.groqClient = null;
      }
    } else {
      console.log('[ElizaRuntime] No valid GROQ_API_KEY found, all agents will use templates only');
    }
    
    const agentConfigs = Object.values(TOURNAMENT_AGENTS);
    
    for (const tournamentConfig of agentConfigs) {
      const agent: AgentInstance = {
        id: tournamentConfig.id,
        config: tournamentConfig,
        initialized: true
      };
      
      this.agents.set(tournamentConfig.id, agent);
      console.log(`[ElizaRuntime] Agent registered: ${tournamentConfig.name} (${tournamentConfig.symbol})`);
    }
    
    this.initialized = true;
    console.log(`[ElizaRuntime] Total ${this.agents.size} agents ready`);
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
    
    const cacheKey = this.getCacheKey(agentId, options);
    const cached = this.responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.text;
    }
    
    const shouldUseAI = this.groqClient !== null && Math.random() < this.hybridRatio;
    
    let response: string;
    
    if (shouldUseAI) {
      try {
        response = await this.generateAIResponse(agent, options);
        this.responseCache.set(cacheKey, { text: response, timestamp: Date.now() });
      } catch (error) {
        console.warn(`[ElizaRuntime] AI generation failed for ${agentId}, using template:`, error);
        response = this.generateTemplateResponse(agent, options);
      }
    } else {
      response = this.generateTemplateResponse(agent, options);
    }
    
    return response;
  }

  private async generateAIResponse(
    agent: AgentInstance,
    options: GenerateResponseOptions
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }
    
    this.apiCallCount.set(agent.id, (this.apiCallCount.get(agent.id) || 0) + 1);
    
    const { generateText } = await import('ai');
    const prompt = this.buildContextPrompt(agent.config, options);
    
    try {
      const timeoutPromise = this.createTimeout(this.llmTimeout, 'LLM timeout');
      const aiPromise = generateText({
        model: this.groqClient('llama-3.1-8b-instant'),
        prompt: prompt,
        maxTokens: 150,
        temperature: 0.7,
        topP: 0.9,
      });
      
      const response = await Promise.race([aiPromise, timeoutPromise]);
      const messageText = response?.text || '';
      
      if (!messageText) {
        throw new Error('Empty response from LLM');
      }
      
      return messageText;
    } catch (error) {
      if (error instanceof Error && error.message === 'LLM timeout') {
        throw new Error(`LLM timeout after ${this.llmTimeout}ms`);
      }
      console.error(`[ElizaRuntime] LLM call error for ${agent.id}:`, error);
      throw error;
    }
  }

  private buildContextPrompt(
    config: TournamentAgentConfig,
    options: GenerateResponseOptions
  ): string {
    const { context, recipient, interactionType, gamePhase } = options;
    
    return `You are ${config.name}. ${config.elizaos.system}

Current Situation:
- Game Phase: ${gamePhase || 'GENESIS'}
- Interaction Type: ${interactionType || 'DEBATE'}
- Opponent: ${recipient || 'unknown'}

${context}

Respond as your character. Keep response concise (1-2 sentences). Use your distinctive personality traits and vocabulary.`;
  }

  private generateTemplateResponse(
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
        `I challenge your beliefs, {recipient}. ${topics[1]} reveals truth you deny.`,
        `Your words miss mark. ${topics[2]} is only path forward.`,
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

  private getCacheKey(agentId: string, options: GenerateResponseOptions): string {
    const { interactionType, gamePhase } = options;
    return `${agentId}-${interactionType || 'DEBATE'}-${gamePhase || 'GENESIS'}`;
  }

  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    );
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

  getUsageReport(): Record<string, number> {
    return Object.fromEntries(this.apiCallCount.entries());
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.responseCache.size,
      keys: Array.from(this.responseCache.keys()),
    };
  }
}

export const elizaRuntimeService = new ElizaRuntimeService();
