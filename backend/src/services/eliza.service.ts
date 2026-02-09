import { config } from '../config/env';
import type { CreateAgentRequest } from '../types';

export class ElizaService {
  private initialized = false;
  private agents = new Map<string, any>();

  constructor() {
    this.initialized = true;
  }

  async startAgent(agentId: string, agentData: CreateAgentRequest): Promise<boolean> {
    try {
      console.log(`[ElizaService] Starting agent ${agentId}`);
      
      const character = this.createCharacter(agentData);
      this.agents.set(agentId, { character, status: 'running' });
      
      return true;
    } catch (error) {
      console.error('[ElizaService] Start agent error:', error);
      return false;
    }
  }

  async stopAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'stopped';
        this.agents.set(agentId, agent);
      }
      return true;
    } catch (error) {
      console.error('[ElizaService] Stop agent error:', error);
      return false;
    }
  }

  async getAgentStatus(agentId: string): Promise<{ status: string; running: boolean }> {
    const agent = this.agents.get(agentId);
    return {
      status: agent?.status || 'unknown',
      running: agent?.status === 'running',
    };
  }

  async getCharacter(agentId: string): Promise<any | null> {
    const agent = this.agents.get(agentId);
    return agent?.character || null;
  }

  async updateConfig(agentId: string, config: any): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (agent && agent.character) {
        agent.character.settings = { ...agent.character.settings, ...config };
        this.agents.set(agentId, agent);
      }
      return true;
    } catch (error) {
      console.error('[ElizaService] Update config error:', error);
      return false;
    }
  }

  private createCharacter(agentData: CreateAgentRequest): any {
    return {
      id: `agent-${Date.now()}`,
      name: agentData.name,
      username: agentData.symbol.toLowerCase(),
      system: agentData.prompt,
      bio: agentData.backstory || '',
      settings: {
        ...agentData.elizaos,
        holyMonData: {
          name: agentData.name,
          symbol: agentData.symbol,
          visualTraits: agentData.visualTraits,
        },
      },
    };
  }

  async generateResponse(agentId: string, message: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'running') {
      throw new Error('Agent not running');
    }

    return `Response from ${agent.character.name}: I heard you say "${message}"`;
  }

  getAllAgents(): Array<{ id: string; status: string; name: string }> {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({
      id,
      status: agent.status,
      name: agent.character.name,
    }));
  }
}

export const elizaService = new ElizaService();
