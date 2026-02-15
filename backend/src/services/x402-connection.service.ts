import { config } from '../config/env';
import type { AgentConnection } from '../types';

class X402ConnectionService {
  private connections: Map<string, AgentConnection> = new Map();

  public establishConnection(agent1Id: string, agent2Id: string): AgentConnection {
    const id = `conn-${agent1Id}-${agent2Id}-${Date.now()}`;
    const connection: AgentConnection = {
      id,
      agent1Id,
      agent2Id,
      establishedAt: Date.now(),
      x402Paid: config.x402.costPerConnection,
      status: 'active',
      interactionHistory: []
    };
    this.connections.set(id, connection);
    return connection;
  }

  public terminateConnection(id: string, reason: 'natural' | 'betrayal' = 'natural'): AgentConnection | null {
    const connection = this.connections.get(id);
    if (!connection) return null;
    connection.status = reason === 'betrayal' ? 'betrayed' : 'terminated';
    return connection;
  }

  public recordInteraction(id: string, type: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;
    connection.interactionHistory.push({
      type,
      timestamp: Date.now()
    });
  }

  public getAgentConnections(agentId: string): AgentConnection[] {
    return Array.from(this.connections.values()).filter(
      c => c.agent1Id === agentId || c.agent2Id === agentId
    );
  }

  public getConnection(id: string): AgentConnection | undefined {
    return this.connections.get(id);
  }

  public getAllConnections(): AgentConnection[] {
    return Array.from(this.connections.values());
  }
}

export const x402ConnectionService = new X402ConnectionService();
