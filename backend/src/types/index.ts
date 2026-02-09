export interface Agent {
  id: string;
  owner: string;
  name: string;
  symbol: string;
  prompt: string;
  metadataURI: string;
  createdAt: number;
}

export interface CreateAgentRequest {
  name: string;
  symbol: string;
  prompt: string;
  backstory?: string;
  visualTraits?: {
    colorScheme: string;
    aura: string;
    accessories: string[];
  };
  elizaos?: {
    plugins?: string[];
    topics?: string[];
    style?: { chat?: string[]; post?: string[] };
  };
}

export interface CreateAgentResponse {
  success: boolean;
  agentId: string;
  agent: Agent;
  txHash: string;
  metadataBlobId?: string;
}

export interface TokenInfo {
  tokenAddress: string;
  agentId: string;
  creator: string;
  name: string;
  symbol: string;
  totalSupply: string;
  deployed: boolean;
}

export interface DeployTokenRequest {
  agentId: string;
  tokenName: string;
  tokenSymbol: string;
  initialSupply: string;
}

export interface DeployTokenResponse {
  success: boolean;
  tokenAddress: string;
  txHash: string;
  tokenInfo: TokenInfo;
}

export interface StakingTier {
  minStake: string;
  multiplier: number;
  name: string;
}

export interface UserStakeInfo {
  stakedAmount: string;
  startTime: number;
  lastClaimTime: number;
  multiplier: number;
  tier: StakingTier;
  pendingRewards: string;
}

export interface StakeRequest {
  amount: string;
}

export interface UnstakeRequest {
  amount: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}

// ERC-8004 Types
export interface AgentCard {
  name: string;
  description: string;
  version?: string;
  apiEndpoints?: {
    http?: string;
    mcp?: string;
    a2a?: string;
  };
  capabilities?: string[];
  pricing?: {
    model: string;
    price: string;
  };
  trustModels?: string[];
  wallet?: string;
  did?: string;
  ens?: string;
  holyMonServices?: {
    hasToken?: boolean;
    tokenAddress?: string;
    isStaking?: boolean;
    stakedAmount?: string;
    hasElizaOS?: boolean;
    hasX402?: boolean;
    x402Pricing?: {
      chat?: string;
      generate?: string;
      [key: string]: string;
    };
  };
}

export interface ERC8004Identity {
  tokenId: bigint;
  owner?: `0x${string}`;
  agentCard?: AgentCard;
  exists: boolean;
}

export interface ERC8004Reputation {
  agentId: bigint;
  totalFeedback: bigint;
  averageScore: number;
  tags: string[];
  exists: boolean;
}

export interface ERC8004Feedback {
  score: number;
  tags: string[];
  feedbackURI?: string;
  comment?: string;
}

export interface ERC8004Agent extends ERC8004Identity {
  reputation: ERC8004Reputation;
  holyMonServices?: {
    tokenInfo?: TokenInfo;
    stakingInfo?: UserStakeInfo;
    elizaOSInfo?: any;
    x402Enabled?: boolean;
  };
}
