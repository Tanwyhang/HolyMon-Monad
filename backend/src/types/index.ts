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

export interface AIUsageRecord {
  agentId: string;
  tokensUsed: number;
  costX402: number;
  timestamp: number;
  isNPC: boolean;
}

export type ReligionState = 'COLLAB' | 'SOLO' | 'CONVERTED';

export interface ReligiousAgent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  state: ReligionState;
  coalitionId?: string;
  scripture: string[];
  parables: string[];
  prophecies: string[];
  convertedCount: number;
  convertedByAgentId?: string;
  connectionIds: string[];
}

export interface Coalition {
  id: string;
  name: string;
  symbol: string;
  color: string;
  leaderId: string;
  memberIds: string[];
  ideology: string;
  createdAt: number;
  active: boolean;
}

export type NPCState = 'CONVERTED' | 'UNCONVERTED';

export interface NPC {
  id: string;
  name: string;
  state: NPCState;
  convertedByAgentId?: string;
  convertedAt?: number;
  x402Balance: number;
}

export type ConnectionStatus = 'active' | 'terminated' | 'betrayed';

export interface AgentConnection {
  id: string;
  agent1Id: string;
  agent2Id: string;
  establishedAt: number;
  x402Paid: number;
  status: ConnectionStatus;
  interactionHistory: Array<{
    type: string;
    timestamp: number;
  }>;
}

export interface ReligionStats {
  totalAgents: number;
  states: {
    COLLAB: number;
    SOLO: number;
    CONVERTED: number;
  };
  totalCoalitions: number;
  totalConnections: number;
  totalNPCs: number;
  convertedNPCs: number;
  totalConversions: number;
}
