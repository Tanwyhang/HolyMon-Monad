import type { APIResponse, DeployTokenResponse, UserStakeInfo, TokenInfo } from '../types';
import { contractService } from '../services/contract.service';
import { erc8004Service } from '../services/erc8004.service';

/**
 * Enable token launchpad for ERC-8004 agent
 */
export async function handleEnableTokenLaunchpad(
  tokenId: string,
  body: any,
  signer: string
): Promise<APIResponse<DeployTokenResponse>> {
  try {
    // Verify the signer owns the ERC-8004 token
    const identity = await erc8004Service.getAgentIdentity(BigInt(tokenId));
    if (!identity.exists || identity.owner !== signer) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must own this ERC-8004 agent to enable token launchpad',
      };
    }

    const { tokenName, tokenSymbol, initialSupply } = body;

    if (!tokenName || !tokenSymbol || !initialSupply) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'tokenName, tokenSymbol, and initialSupply are required',
      };
    }

    // Use ERC-8004 token ID as the "agentId" for contract purposes
    const result = await contractService.deployToken(
      tokenId, // Using ERC-8004 token ID
      tokenName,
      tokenSymbol,
      BigInt(initialSupply),
    );

    const tokenInfo: TokenInfo = {
      tokenAddress: result.tokenAddress,
      agentId: tokenId, // ERC-8004 token ID
      creator: signer,
      name: tokenName,
      symbol: tokenSymbol,
      totalSupply: initialSupply,
      deployed: true,
    };

    // Update agent card metadata with token launchpad service
    await erc8004Service.updateAgentCardServices(BigInt(tokenId), {
      tokenLaunchpad: {
        enabled: true,
        tokenAddress: result.tokenAddress,
      },
    });

    return {
      success: true,
      data: {
        success: true,
        tokenAddress: result.tokenAddress,
        txHash: result.txHash,
        tokenInfo,
      },
    };
  } catch (error) {
    console.error('[HolyMon Services] Enable token launchpad error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to enable token launchpad',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enable MON staking for ERC-8004 agent
 */
export async function handleEnableStaking(
  tokenId: string,
  body: any,
  signer: string
): Promise<APIResponse<{ txHash: string }>> {
  try {
    // Verify the signer owns the ERC-8004 token
    const identity = await erc8004Service.getAgentIdentity(BigInt(tokenId));
    if (!identity.exists || identity.owner !== signer) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must own this ERC-8004 agent to enable staking',
      };
    }

    const { amount } = body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid stake amount',
      };
    }

    const result = await contractService.stake(BigInt(amount));

    // Update agent card metadata with staking service
    await erc8004Service.updateAgentCardServices(BigInt(tokenId), {
      staking: {
        enabled: true,
        stakedAmount: amount,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[HolyMon Services] Enable staking error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to enable staking',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get HolyMon services status for ERC-8004 agent
 */
export async function handleGetServicesStatus(
  tokenId: string,
  signer: string
): Promise<APIResponse<{
  hasToken: boolean;
  tokenInfo?: TokenInfo;
  isStaking: boolean;
  stakingInfo?: UserStakeInfo;
  hasElizaOS: boolean;
  hasX402: boolean;
}>> {
  try {
    const tokenIdBigInt = BigInt(tokenId);

    // Check if agent has token
    let hasToken = false;
    let tokenInfo: TokenInfo | undefined;

    try {
      const tokenAddress = await contractService.getTokenByAgent(tokenId);
      if (tokenAddress !== '0x0000000000000000000000000000000000000000') {
        const contractTokenInfo = await contractService.getTokenInfo(tokenAddress as `0x${string}`);
        hasToken = contractTokenInfo.exists;
        if (hasToken) {
          tokenInfo = {
            tokenAddress,
            agentId: tokenId,
            creator: contractTokenInfo.creator,
            name: contractTokenInfo.name,
            symbol: contractTokenInfo.symbol,
            totalSupply: contractTokenInfo.totalSupply.toString(),
            deployed: true,
          };
        }
      }
    } catch (error) {
      console.log('[HolyMon Services] No token found for agent:', tokenId);
    }

    // Check if agent is staking
    let isStaking = false;
    let stakingInfo: UserStakeInfo | undefined;

    try {
      const stakeInfo = await contractService.getUserStakeInfo(signer as `0x${string}`);
      isStaking = stakeInfo.amount > 0n;
      if (isStaking) {
        const contractTiers = await contractService.getAllTiers();
        const multiplier = Number(stakeInfo.multiplier) / 100;
        const tier = contractTiers.find((t) => Number(t.multiplier) / 100 === multiplier);

        stakingInfo = {
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
      }
    } catch (error) {
      console.log('[HolyMon Services] No staking info found for agent:', tokenId);
    }

    // Check agent card metadata for additional services
    const cardServices = await erc8004Service.getAgentCardServices(tokenIdBigInt);

    // Placeholder for ElizaOS and x402 status - check card metadata first
    const hasElizaOS = cardServices?.elizaOS?.enabled || false;
    const hasX402 = cardServices?.x402?.enabled || false;

    return {
      success: true,
      data: {
        hasToken,
        tokenInfo,
        isStaking,
        stakingInfo,
        hasElizaOS,
        hasX402,
      },
    };
  } catch (error) {
    console.error('[HolyMon Services] Get services status error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get services status',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}