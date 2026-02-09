import type { CreateAgentRequest, CreateAgentResponse, Agent } from '../types';
import { contractService } from './contract.service';
import { walrusService } from './walrus.service';
import { elizaService } from './eliza.service';

export class AgentService {
  async createAgent(request: CreateAgentRequest, owner: string): Promise<CreateAgentResponse> {
    try {
      console.log('[AgentService] Creating agent:', request.name, request.symbol);

      const metadata = {
        name: request.name,
        symbol: request.symbol,
        prompt: request.prompt,
        backstory: request.backstory || '',
        visualTraits: request.visualTraits || {
          colorScheme: '',
          aura: '',
          accessories: [],
        },
        elizaos: request.elizaos || {},
        createdAt: Date.now(),
      };

      const { blobId } = await walrusService.uploadMetadata(metadata);
      const metadataURI = await walrusService.getMetadataURI(blobId);

      const { agentId, txHash } = await contractService.createAgent(
        request.name,
        request.symbol,
        request.prompt,
        metadataURI,
      );

      await elizaService.startAgent(agentId, request);

      const agent: Agent = {
        id: agentId,
        owner,
        name: request.name,
        symbol: request.symbol,
        prompt: request.prompt,
        metadataURI,
        createdAt: Date.now(),
      };

      return {
        success: true,
        agentId,
        agent,
        txHash,
        metadataBlobId: blobId,
      };
    } catch (error) {
      console.error('[AgentService] Create agent error:', error);
      throw new Error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const contractAgent = await contractService.getAgent(agentId);
      if (!contractAgent) {
        return null;
      }

      return {
        id: contractAgent.id.toString(),
        owner: contractAgent.owner,
        name: contractAgent.name,
        symbol: contractAgent.symbol,
        prompt: contractAgent.prompt,
        metadataURI: contractAgent.metadataURI,
        createdAt: 0,
      };
    } catch (error) {
      console.error('[AgentService] Get agent error:', error);
      return null;
    }
  }

  async getUserAgents(owner: string): Promise<Agent[]> {
    try {
      const agentIds = await contractService.getUserAgents(owner as `0x${string}`);
      const agents: Agent[] = [];

      for (const agentId of agentIds) {
        const agent = await this.getAgent(agentId.toString());
        if (agent) {
          agents.push(agent);
        }
      }

      return agents;
    } catch (error) {
      console.error('[AgentService] Get user agents error:', error);
      return [];
    }
  }

  async updateAgent(agentId: string, metadata: any): Promise<{ txHash: string; blobId: string }> {
    try {
      const { blobId } = await walrusService.uploadMetadata(metadata);
      const metadataURI = await walrusService.getMetadataURI(blobId);

      const hash = await contractService.updateAgentMetadata(agentId, metadataURI);

      return { txHash: hash, blobId };
    } catch (error) {
      console.error('[AgentService] Update agent error:', error);
      throw new Error(`Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const agentService = new AgentService();
