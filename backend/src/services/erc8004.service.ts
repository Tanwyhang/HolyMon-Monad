import { Contract } from 'viem';
import { publicClient } from './contract.service';
import type { ERC8004Identity, ERC8004Reputation, ERC8004Feedback } from '../types';

// ERC-8004 Contract Addresses on Monad Testnet
const ERC8004_IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const ERC8004_REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';
const ERC8004_VALIDATION_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'; // Placeholder for future

// ERC-8004 Contract ABIs (simplified)
const ERC8004_IDENTITY_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC8004_REPUTATION_ABI = [
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getReputation',
    outputs: [{
      components: [
        { name: 'totalFeedback', type: 'uint256' },
        { name: 'averageScore', type: 'uint256' },
        { name: 'tags', type: 'string[]' },
      ],
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'score', type: 'uint256' },
      { name: 'tags', type: 'string[]' },
      { name: 'feedbackURI', type: 'string' },
    ],
    name: 'submitFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

class ERC8004Service {
  private identityRegistry: Contract<typeof ERC8004_IDENTITY_ABI>;
  private reputationRegistry: Contract<typeof ERC8004_REPUTATION_ABI>;

  constructor() {
    this.identityRegistry = {
      address: ERC8004_IDENTITY_REGISTRY as `0x${string}`,
      abi: ERC8004_IDENTITY_ABI,
    } as Contract<typeof ERC8004_IDENTITY_ABI>;

    this.reputationRegistry = {
      address: ERC8004_REPUTATION_REGISTRY as `0x${string}`,
      abi: ERC8004_REPUTATION_ABI,
    } as Contract<typeof ERC8004_REPUTATION_ABI>;
  }

  /**
   * Get agent identity from ERC-8004 Identity Registry
   */
  async getAgentIdentity(tokenId: bigint): Promise<ERC8004Identity> {
    try {
      const [tokenURI, owner] = await Promise.all([
        publicClient.readContract({
          address: this.identityRegistry.address,
          abi: this.identityRegistry.abi,
          functionName: 'tokenURI',
          args: [tokenId],
        }),
        publicClient.readContract({
          address: this.identityRegistry.address,
          abi: this.identityRegistry.abi,
          functionName: 'ownerOf',
          args: [tokenId],
        }),
      ]);

      // Parse agent card from tokenURI (assuming it's IPFS or HTTP URL)
      const agentCard = await this.fetchAgentCard(tokenURI as string);

      return {
        tokenId,
        owner: owner as `0x${string}`,
        agentCard,
        exists: true,
      };
    } catch (error) {
      console.error('[ERC8004] Error fetching agent identity:', error);
      return {
        tokenId,
        exists: false,
      };
    }
  }

  /**
   * Get agent reputation from ERC-8004 Reputation Registry
   */
  async getAgentReputation(tokenId: bigint): Promise<ERC8004Reputation> {
    try {
      const reputation = await publicClient.readContract({
        address: this.reputationRegistry.address,
        abi: this.reputationRegistry.abi,
        functionName: 'getReputation',
        args: [tokenId],
      });

      return {
        agentId: tokenId,
        totalFeedback: reputation[0] as bigint,
        averageScore: Number(reputation[1]) / 100, // Assuming score is stored as uint256 with 2 decimals
        tags: reputation[2] as string[],
        exists: true,
      };
    } catch (error) {
      console.error('[ERC8004] Error fetching agent reputation:', error);
      return {
        agentId: tokenId,
        totalFeedback: 0n,
        averageScore: 0,
        tags: [],
        exists: false,
      };
    }
  }

  /**
   * Submit feedback for an agent
   */
  async submitFeedback(
    agentId: bigint,
    feedback: ERC8004Feedback,
    signer: `0x${string}`
  ): Promise<{ success: boolean; txHash?: string }> {
    try {
      // This would need to be implemented with a wallet client
      // For now, return placeholder
      console.log(`[ERC8004] Submitting feedback for agent ${agentId}:`, feedback);
      return { success: false, txHash: undefined }; // Placeholder
    } catch (error) {
      console.error('[ERC8004] Error submitting feedback:', error);
      return { success: false };
    }
  }

  /**
   * Update agent card metadata with HolyMon services
   * Note: This would typically update off-chain metadata storage
   */
  async updateAgentCardServices(
    tokenId: bigint,
    services: {
      tokenLaunchpad?: { enabled: boolean; tokenAddress?: string };
      staking?: { enabled: boolean; stakedAmount?: string };
      elizaOS?: { enabled: boolean; endpoint?: string };
      x402?: { enabled: boolean; facilitatorAddress?: string };
    }
  ): Promise<{ success: boolean }> {
    try {
      // Get current agent card
      const identity = await this.getAgentIdentity(tokenId);
      if (!identity.exists) {
        return { success: false };
      }

      // Update agent card with HolyMon services
      const updatedCard = {
        ...identity.agentCard,
        holymon: {
          ...identity.agentCard.holymon,
          services,
          lastUpdated: Date.now(),
        }
      };

      // In a real implementation, this would update the metadata storage
      // For now, we'll store this locally or in a database
      console.log(`[ERC8004] Updated agent ${tokenId} card with HolyMon services:`, services);

      return { success: true };
    } catch (error) {
      console.error('[ERC8004] Error updating agent card services:', error);
      return { success: false };
    }
  }

  /**
   * Get HolyMon services from agent card metadata
   */
  async getAgentCardServices(tokenId: bigint): Promise<{
    tokenLaunchpad?: { enabled: boolean; tokenAddress?: string };
    staking?: { enabled: boolean; stakedAmount?: string };
    elizaOS?: { enabled: boolean; endpoint?: string };
    x402?: { enabled: boolean; facilitatorAddress?: string };
  } | null> {
    try {
      const identity = await this.getAgentIdentity(tokenId);
      if (!identity.exists || !identity.agentCard.holymon?.services) {
        return null;
      }

      return identity.agentCard.holymon.services;
    } catch (error) {
      console.error('[ERC8004] Error getting agent card services:', error);
      return null;
    }
  }
}

export const erc8004Service = new ERC8004Service();