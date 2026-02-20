export interface AgentConnection {
  id: string;
  name: string;
  symbol: string;
  color: string;
}

export interface ActiveConnection {
  id: string;
  agent1Id: string;
  agent2Id: string;
  strength: number;
  type: "CHAT" | "LINK";
}

export interface AgentNetworkData {
  agents: AgentConnection[];
  connections: ActiveConnection[];
}
