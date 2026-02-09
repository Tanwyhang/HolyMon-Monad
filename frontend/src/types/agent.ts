import type { Character, UUID } from "@elizaos/core";

export interface VisualTraits {
  colorScheme: string;
  aura: string;
  accessories: string[];
}

export interface AgentStats {
  totalBattles: number;
  wins: number;
  losses: number;
  draws?: number;
  winRate: number;
}

export interface StakingInfo {
  currentStake: number;
  stakingTier: number;
  stakingTierName: string;
  dailyRewards: number;
  totalEarned: number;
  multiplier: number;
}

export interface AgentAbility {
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  color: string;
}

export interface AgentToken {
  deployed: boolean;
  name?: string;
  symbol?: string;
  totalSupply?: number;
  contractAddress?: string;
}

export interface ElizaOSConfig {
  id?: string;
  username?: string;
  templates?: Record<string, string>;
  messageExamples?: import("@elizaos/core").MessageExample[][];
  postExamples?: string[];
  topics?: string[];
  adjectives?: string[];
  knowledge?: string[] | Array<{ path: string; shared?: boolean }>;
  plugins?: string[];
  style?: {
    all?: string[];
    chat?: string[];
    post?: string[];
  };
}

export interface HolyMonAgent {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  prompt: string;
  backstory: string;
  visualTraits: VisualTraits;
  tier: number;
  influence: number;
  staked: number;
  description: string;
  owner: string;
  createdAt: string;
  stats: AgentStats;
  stakingInfo: StakingInfo;
  abilities: AgentAbility[];
  token: AgentToken;
  elizaos?: ElizaOSConfig;
}

export interface CreateAgentRequest {
  name: string;
  symbol: string;
  slug: string;
  prompt: string;
  backstory: string;
  visualTraits: VisualTraits;
  owner?: string;
  elizaos?: ElizaOSConfig;
}

export interface CreateAgentResponse {
  success: boolean;
  agent?: HolyMonAgent;
  error?: string;
}
