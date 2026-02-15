import { TOURNAMENT_AGENTS, type TournamentAgentConfig } from '../config/eliza-agents';
import { config } from '../config/env';
import { aiPaymentService } from './ai-payment.service';

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

interface RequestRecord {
  timestamp: number;
  tokensUsed: number;
  cost: number;
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
  
  private requestHistory: RequestRecord[] = [];
  private dailyCost = 0;
  private dailyRequestCount = 0;
  private lastDailyReset = Date.now();
  private resetInterval = 24 * 60 * 60 * 1000;

  private resetDailyCounters(): void {
    const now = Date.now();
    if (now - this.lastDailyReset >= this.resetInterval) {
      this.dailyCost = 0;
      this.dailyRequestCount = 0;
      this.lastDailyReset = now;
      console.log('[ElizaRuntime] Daily counters reset');
    }
  }

  private checkRateLimit(): { allowed: boolean; reason?: string } {
    this.resetDailyCounters();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestHistory.filter(r => r.timestamp > oneMinuteAgo);
    
    const requestsPerMinute = recentRequests.length;
    const tokensPerMinute = recentRequests.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    if (requestsPerMinute >= config.elizaos.rateLimit.maxRequestsPerMinute) {
      return { allowed: false, reason: `Rate limit: ${requestsPerMinute}/${config.elizaos.rateLimit.maxRequestsPerMinute} requests/minute` };
    }
    
    if (tokensPerMinute >= config.elizaos.rateLimit.maxTokensPerMinute) {
      return { allowed: false, reason: `Rate limit: ${tokensPerMinute}/${config.elizaos.rateLimit.maxTokensPerMinute} tokens/minute` };
    }
    
    if (this.dailyRequestCount >= config.elizaos.rateLimit.maxDailyRequests) {
      return { allowed: false, reason: `Daily limit: ${this.dailyRequestCount}/${config.elizaos.rateLimit.maxDailyRequests} requests` };
    }
    
    return { allowed: true };
  }

  private checkCostLimit(requestCost: number): { allowed: boolean; reason?: string } {
    this.resetDailyCounters();
    
    if (this.dailyCost + requestCost > config.elizaos.costLimit.maxDailyCostUSD) {
      return { 
        allowed: false, 
        reason: `Daily cost limit: $${this.dailyCost.toFixed(2)}/$${config.elizaos.costLimit.maxDailyCostUSD.toFixed(2)}` 
      };
    }
    
    return { allowed: true };
  }

  private trackRequest(tokensUsed: number): void {
    const cost = (tokensUsed / 1000) * config.elizaos.costLimit.costPer1kTokens;
    
    const record: RequestRecord = {
      timestamp: Date.now(),
      tokensUsed,
      cost,
    };
    
    this.requestHistory.push(record);
    this.dailyCost += cost;
    this.dailyRequestCount++;
    
    const oneHourAgo = Date.now() - 3600000;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > oneHourAgo);
    
    console.log(`[ElizaRuntime] Request tracked: ${tokensUsed} tokens, $${cost.toFixed(4)} | Daily: $${this.dailyCost.toFixed(2)}/${this.dailyRequestCount} reqs`);
  }

  async initializeAgents(): Promise<void> {
    console.log('[ElizaRuntime] Initializing agents...');
    console.log('[ElizaRuntime] Cost efficiency settings:');
    console.log(`  - AI usage ratio: ${(config.elizaos.hybridRatio * 100).toFixed(0)}% (templates for rest)`);
    console.log(`  - Rate limit: ${config.elizaos.rateLimit.maxRequestsPerMinute} req/min, ${config.elizaos.rateLimit.maxTokensPerMinute} tokens/min`);
    console.log(`  - Daily limit: ${config.elizaos.rateLimit.maxDailyRequests} requests`);
    console.log(`  - Cost limit: $${config.elizaos.costLimit.maxDailyCostUSD.toFixed(2)}/day @ $${config.elizaos.costLimit.costPer1kTokens.toFixed(3)}/1K tokens`);
    console.log(`  - Cache TTL: ${config.elizaos.cacheTTL}ms`);
    
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
    options: GenerateResponseOptions,
    isTournamentNPC: boolean = false
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
      const estimatedTokens = 150;
      const paymentCheck = aiPaymentService.chargeForAICall(
        agentId,
        estimatedTokens,
        isTournamentNPC
      );
      
      if (!paymentCheck.success) {
        console.warn(`[ElizaRuntime] ${paymentCheck.reason} - using template for ${agentId}`);
        response = this.generateTemplateResponse(agent, options);
      } else {
        try {
          response = await this.generateAIResponse(agent, options, isTournamentNPC, paymentCheck.costX402);
          this.responseCache.set(cacheKey, { text: response, timestamp: Date.now() });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          if (errorMsg.includes('Rate limit') || errorMsg.includes('Cost limit')) {
            console.warn(`[ElizaRuntime] ${errorMsg} - using template for ${agentId}`);
          } else {
            console.warn(`[ElizaRuntime] AI generation failed for ${agentId}, using template:`, error);
            
            if (!isTournamentNPC && paymentCheck.costX402 > 0) {
              aiPaymentService.addAgentFunds(agentId, paymentCheck.costX402);
              console.log(`[ElizaRuntime] Refunded ${paymentCheck.costX402.toFixed(6)} X402 to ${agentId} due to failed AI call`);
            }
          }
          
          response = this.generateTemplateResponse(agent, options);
        }
      }
    } else {
      response = this.generateTemplateResponse(agent, options);
    }
    
    return response;
  }

  private async generateAIResponse(
    agent: AgentInstance,
    options: GenerateResponseOptions,
    isTournamentNPC: boolean = false,
    estimatedCostX402: number = 0
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }
    
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      console.warn(`[ElizaRuntime] Rate limit exceeded: ${rateLimitCheck.reason}`);
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }
    
    this.apiCallCount.set(agent.id, (this.apiCallCount.get(agent.id) || 0) + 1);
    
    const { generateText } = await import('ai');
    const prompt = this.buildContextPrompt(agent.config, options);
    const maxTokens = 150;
    const estimatedCost = (maxTokens / 1000) * config.elizaos.costLimit.costPer1kTokens;
    
    const costCheck = this.checkCostLimit(estimatedCost);
    if (!costCheck.allowed) {
      console.warn(`[ElizaRuntime] Cost limit exceeded: ${costCheck.reason}`);
      throw new Error(`Cost limit exceeded: ${costCheck.reason}`);
    }
    
    try {
      const timeoutPromise = this.createTimeout(this.llmTimeout, 'LLM timeout');
      const aiPromise = generateText({
        model: this.groqClient('llama-3.1-8b-instant'),
        prompt: prompt,
        maxTokens: maxTokens,
        temperature: 0.7,
        topP: 0.9,
      });
      
      const response = await Promise.race([aiPromise, timeoutPromise]);
      const messageText = response?.text || '';
      
      if (!messageText) {
        throw new Error('Empty response from LLM');
      }
      
      const actualTokens = response?.usage?.totalTokens || maxTokens;
      const actualCostX402 = (actualTokens / 1000) * config.elizaos.costLimit.costPer1kTokens;
      
      if (!isTournamentNPC) {
        const costDifference = estimatedCostX402 - actualCostX402;
        if (costDifference > 0.000001) {
          aiPaymentService.addAgentFunds(agent.id, costDifference);
          console.log(`[ElizaRuntime] Refunded ${(costDifference).toFixed(6)} X402 to ${agent.id} (used ${actualTokens} tokens)`);
        } else if (costDifference < -0.000001) {
          const additionalCharge = Math.abs(costDifference);
          const currentBalance = aiPaymentService.getAgentBalance(agent.id);
          if (currentBalance >= additionalCharge) {
            aiPaymentService.setAgentBalance(agent.id, currentBalance - additionalCharge);
            console.log(`[ElizaRuntime] Charged additional ${(additionalCharge).toFixed(6)} X402 to ${agent.id} (used ${actualTokens} tokens)`);
          } else {
            console.warn(`[ElizaRuntime] Insufficient balance for additional charge, using template`);
            throw new Error('Insufficient X402 balance');
          }
        }
      } else {
        const actualCost = (actualTokens / 1000) * 0.001;
        aiPaymentService.chargeForAICall(agent.id, actualTokens, true);
      }
      
      this.trackRequest(actualTokens);
      
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

  getRateLimitStatus(): {
    requestsPerMinute: number;
    maxRequestsPerMinute: number;
    tokensPerMinute: number;
    maxTokensPerMinute: number;
    dailyRequests: number;
    maxDailyRequests: number;
    dailyCost: number;
    maxDailyCost: number;
    requestsHistory: number;
  } {
    this.resetDailyCounters();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestHistory.filter(r => r.timestamp > oneMinuteAgo);
    
    const requestsPerMinute = recentRequests.length;
    const tokensPerMinute = recentRequests.reduce((sum, r) => sum + r.tokensUsed, 0);
    
    return {
      requestsPerMinute,
      maxRequestsPerMinute: config.elizaos.rateLimit.maxRequestsPerMinute,
      tokensPerMinute,
      maxTokensPerMinute: config.elizaos.rateLimit.maxTokensPerMinute,
      dailyRequests: this.dailyRequestCount,
      maxDailyRequests: config.elizaos.rateLimit.maxDailyRequests,
      dailyCost: this.dailyCost,
      maxDailyCost: config.elizaos.costLimit.maxDailyCostUSD,
      requestsHistory: this.requestHistory.length,
    };
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.responseCache.size,
      keys: Array.from(this.responseCache.keys()),
    };
  }
}

export const elizaRuntimeService = new ElizaRuntimeService();
