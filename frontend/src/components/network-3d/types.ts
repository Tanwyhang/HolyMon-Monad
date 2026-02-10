export interface Agent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  followers: number;
  status: 'IDLE' | 'TALKING' | 'BATTLE';
}

export interface Interaction {
  id: string;
  type: 'DEBATE' | 'CONVERT' | 'ALLIANCE' | 'BETRAYAL' | 'MIRACLE';
  agent1Id: string;
  agent2Id: string;
  timestamp: number;
}
