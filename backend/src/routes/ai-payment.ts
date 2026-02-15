import { aiPaymentService } from '../services/ai-payment.service';
import type { APIResponse } from '../types';

export async function handleAddAIFunds(body: { agentId: string; amountX402: number }): Promise<APIResponse> {
  const { agentId, amountX402 } = body;
  
  if (!agentId || amountX402 <= 0) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: 'Invalid agent ID or amount',
    };
  }
  
  aiPaymentService.addAgentFunds(agentId, amountX402);
  
  const newBalance = aiPaymentService.getAgentBalance(agentId);
  
  return {
    success: true,
    data: {
      agentId,
      previousBalance: newBalance - amountX402,
      added: amountX402,
      newBalance,
    },
  };
}

export async function handleGetAIBalance(agentId: string): Promise<APIResponse> {
  const balance = aiPaymentService.getAgentBalance(agentId);
  
  return {
    success: true,
    data: {
      agentId,
      balanceX402: balance,
    },
  };
}

export async function handleGetAllAIBalances(): Promise<APIResponse> {
  const balances = aiPaymentService.getAllBalances();
  const npcCosts = aiPaymentService.getNPCTotalCost();
  
  return {
    success: true,
    data: {
      balances,
      npcTotalCostX402: npcCosts,
      totalAgents: Object.keys(balances).length,
    },
  };
}

export async function handleGetAgentUsage(agentId: string): Promise<APIResponse> {
  const usage = aiPaymentService.getAgentUsage(agentId);
  const history = aiPaymentService.getUsageHistory(agentId);
  
  return {
    success: true,
    data: {
      agentId,
      usage: {
        totalTokens: usage.totalTokens,
        totalCostX402: usage.totalCost,
        requestCount: usage.requestCount,
      },
      recentHistory: history.slice(-10),
    },
  };
}

export async function handleGetNPCCosts(): Promise<APIResponse> {
  const totalCost = aiPaymentService.getNPCTotalCost();
  
  return {
    success: true,
    data: {
      totalCostX402: totalCost,
      readyForDistribution: totalCost > 0,
    },
  };
}

export async function handleDistributeNPCCosts(body: { tournamentId: string }): Promise<APIResponse> {
  const totalCost = aiPaymentService.getNPCTotalCost();
  
  if (totalCost <= 0) {
    return {
      success: false,
      error: 'NO_COSTS',
      message: 'No NPC costs to distribute',
    };
  }
  
  const costBeforeReset = totalCost;
  aiPaymentService.resetNPCCosts();
  
  return {
    success: true,
    data: {
      tournamentId: body.tournamentId,
      distributedX402: costBeforeReset,
      resetAt: new Date().toISOString(),
    },
  };
}
