import type { APIResponse, StakingTier, UserStakeInfo } from '../types';
import { contractService } from './contract.service';

export async function handleGetTiers(): Promise<APIResponse<{ tiers: StakingTier[] }>> {
  try {
    const contractTiers = await contractService.getAllTiers();

    const tiers: StakingTier[] = contractTiers.map((tier) => ({
      minStake: tier.minStake.toString(),
      multiplier: Number(tier.multiplier) / 100,
      name: tier.name,
    }));

    return {
      success: true,
      data: { tiers },
    };
  } catch (error) {
    console.error('[Staking Routes] Get tiers error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch staking tiers',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetUserStake(user: string): Promise<APIResponse<UserStakeInfo>> {
  try {
    const stakeInfo = await contractService.getUserStakeInfo(user as `0x${string}`);
    const contractTiers = await contractService.getAllTiers();

    const multiplier = Number(stakeInfo.multiplier) / 100;
    const tier = contractTiers.find((t) => Number(t.multiplier) / 100 === multiplier);

    const userStakeInfo: UserStakeInfo = {
      stakedAmount: stakeInfo.amount.toString(),
      startTime: Number(stakeInfo.startTime),
      lastClaimTime: Number(stakeInfo.lastClaimTime),
      multiplier,
      tier: tier
        ? {
            minStake: tier.minStake.toString(),
            multiplier: Number(tier.multiplier) / 100,
            name: tier.name,
          }
        : {
            minStake: '100000000000000000000',
            multiplier: 1,
            name: 'Basic Staker',
          },
      pendingRewards: stakeInfo.pendingRewards.toString(),
    };

    return {
      success: true,
      data: userStakeInfo,
    };
  } catch (error) {
    console.error('[Staking Routes] Get user stake error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch stake info',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetGlobalStats(): Promise<APIResponse<{ totalStaked: string; totalStakers: string }>> {
  try {
    const stats = await contractService.getGlobalStats();

    return {
      success: true,
      data: {
        totalStaked: stats.totalStaked.toString(),
        totalStakers: stats.totalStakers.toString(),
      },
    };
  } catch (error) {
    console.error('[Staking Routes] Get global stats error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch global stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleStake(body: any): Promise<APIResponse<{ txHash: string }>> {
  try {
    const { amount } = body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid stake amount',
      };
    }

    const result = await contractService.stake(BigInt(amount));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[Staking Routes] Stake error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to stake MON',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleUnstake(body: any): Promise<APIResponse<{ txHash: string }>> {
  try {
    const { amount } = body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid unstake amount',
      };
    }

    const result = await contractService.unstake(BigInt(amount));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[Staking Routes] Unstake error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to unstake MON',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleClaimRewards(): Promise<APIResponse<{ txHash: string }>> {
  try {
    const result = await contractService.claimRewards();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[Staking Routes] Claim rewards error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to claim rewards',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
