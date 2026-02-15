import { config } from '../config/env';

export interface AIUsageRecord {
  agentId: string;
  tokensUsed: number;
  costX402: number;
  timestamp: number;
  isNPC: boolean;
}

class AIPaymentService {
  private usageHistory: AIUsageRecord[] = [];
  private balances: Map<string, number> = new Map(); // Agent ID -> X402 balance
  
  private costPer1kTokens = 0.001; // X402 per 1K tokens
  private npcTotalCost = 0; // Total NPC AI costs to deduct from rewards
  
  chargeForAICall(
    agentId: string,
    tokensUsed: number,
    isNPC: boolean = false
  ): { success: boolean; costX402: number; reason?: string } {
    const costX402 = (tokensUsed / 1000) * this.costPer1kTokens;
    
    if (isNPC) {
      this.npcTotalCost += costX402;
      console.log(`[AIPayment] NPC cost: ${costX402.toFixed(6)} X402 | Total: ${this.npcTotalCost.toFixed(6)} X402`);
      
      const record: AIUsageRecord = {
        agentId,
        tokensUsed,
        costX402,
        timestamp: Date.now(),
        isNPC: true,
      };
      this.usageHistory.push(record);
      
      return { success: true, costX402 };
    }
    
    const balance = this.balances.get(agentId) || 0;
    if (balance < costX402) {
      console.log(`[AIPayment] Insufficient funds for ${agentId}: ${balance.toFixed(6)} < ${costX402.toFixed(6)} X402`);
      return { 
        success: false, 
        costX402, 
        reason: `Insufficient X402 balance. Have: ${balance.toFixed(6)}, Need: ${costX402.toFixed(6)}` 
      };
    }
    
    this.balances.set(agentId, balance - costX402);
    
    const record: AIUsageRecord = {
      agentId,
      tokensUsed,
      costX402,
      timestamp: Date.now(),
      isNPC: false,
    };
    this.usageHistory.push(record);
    
    console.log(`[AIPayment] Charged ${agentId}: ${costX402.toFixed(6)} X402 | Balance: ${this.balances.get(agentId)?.toFixed(6)}`);
    
    return { success: true, costX402 };
  }
  
  setAgentBalance(agentId: string, balanceX402: number): void {
    this.balances.set(agentId, balanceX402);
    console.log(`[AIPayment] Set ${agentId} balance: ${balanceX402.toFixed(6)} X402`);
  }
  
  getAgentBalance(agentId: string): number {
    return this.balances.get(agentId) || 0;
  }
  
  addAgentFunds(agentId: string, amountX402: number): void {
    const current = this.balances.get(agentId) || 0;
    this.balances.set(agentId, current + amountX402);
    console.log(`[AIPayment] Added ${amountX402.toFixed(6)} X402 to ${agentId} | New: ${(current + amountX402).toFixed(6)}`);
  }
  
  getNPCTotalCost(): number {
    return this.npcTotalCost;
  }
  
  resetNPCCosts(): void {
    const oldCost = this.npcTotalCost;
    this.npcTotalCost = 0;
    console.log(`[AIPayment] Reset NPC costs. Was: ${oldCost.toFixed(6)} X402`);
  }
  
  getUsageHistory(agentId?: string): AIUsageRecord[] {
    if (agentId) {
      return this.usageHistory.filter(r => r.agentId === agentId);
    }
    return this.usageHistory;
  }
  
  getAgentUsage(agentId: string): { totalTokens: number; totalCost: number; requestCount: number } {
    const records = this.usageHistory.filter(r => r.agentId === agentId && !r.isNPC);
    return {
      totalTokens: records.reduce((sum, r) => sum + r.tokensUsed, 0),
      totalCost: records.reduce((sum, r) => sum + r.costX402, 0),
      requestCount: records.length,
    };
  }
  
  getAllBalances(): Record<string, number> {
    return Object.fromEntries(this.balances.entries());
  }
}

export const aiPaymentService = new AIPaymentService();
