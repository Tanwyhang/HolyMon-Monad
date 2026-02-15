export interface Agent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  followers: number;
  status: "IDLE" | "TALKING" | "BATTLE";
  state?: "SOLO" | "COLLAB" | "CONVERTED";
  coalitionId?: string;
}

export interface Interaction {
  id: string;
  type: "DEBATE" | "CONVERT" | "ALLIANCE" | "BETRAYAL" | "MIRACLE";
  agent1Id: string;
  agent2Id: string;
  timestamp: number;
}

export interface Coalition {
  id: string;
  name: string;
  symbol: string;
  color: string;
  leaderId: string;
  memberIds: string[];
  ideology: string;
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
