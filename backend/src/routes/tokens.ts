import type { APIResponse, DeployTokenRequest, DeployTokenResponse, TokenInfo } from '../types';
import { contractService } from './contract.service';

export async function handleDeployToken(body: any, sender: string): Promise<APIResponse<DeployTokenResponse>> {
  try {
    const { agentId, tokenName, tokenSymbol, initialSupply } = body;

    if (!agentId || !tokenName || !tokenSymbol || !initialSupply) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'agentId, tokenName, tokenSymbol, and initialSupply are required',
      };
    }

    if (tokenName.length < 1 || tokenName.length > 50) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'tokenName must be 1-50 characters',
      };
    }

    if (tokenSymbol.length < 2 || tokenSymbol.length > 8) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'tokenSymbol must be 2-8 characters',
      };
    }

    const request: DeployTokenRequest = {
      agentId,
      tokenName,
      tokenSymbol,
      initialSupply,
    };

    const result = await contractService.deployToken(
      agentId,
      tokenName,
      tokenSymbol,
      BigInt(initialSupply),
    );

    const tokenInfo: TokenInfo = {
      tokenAddress: result.tokenAddress,
      agentId,
      creator: sender,
      name: tokenName,
      symbol: tokenSymbol,
      totalSupply: initialSupply,
      deployed: true,
    };

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
    console.error('[Tokens Routes] Deploy token error:', error);
    return {
      success: false,
      error: 'CONTRACT_ERROR',
      message: 'Failed to deploy token',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetToken(tokenAddress: string): Promise<APIResponse<TokenInfo>> {
  try {
    const contractTokenInfo = await contractService.getTokenInfo(tokenAddress as `0x${string}`);

    const tokenInfo: TokenInfo = {
      tokenAddress,
      agentId: contractTokenInfo.agentId.toString(),
      creator: contractTokenInfo.creator,
      name: contractTokenInfo.name,
      symbol: contractTokenInfo.symbol,
      totalSupply: contractTokenInfo.totalSupply.toString(),
      deployed: contractTokenInfo.exists,
    };

    return {
      success: true,
      data: tokenInfo,
    };
  } catch (error) {
    console.error('[Tokens Routes] Get token error:', error);
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Token not found',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleGetTokenByAgent(agentId: string): Promise<APIResponse<TokenInfo | null>> {
  try {
    const tokenAddress = await contractService.getTokenByAgent(agentId);

    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return {
        success: true,
        data: null,
      };
    }

    return handleGetToken(tokenAddress);
  } catch (error) {
    console.error('[Tokens Routes] Get token by agent error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch token',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function handleListTokens(creator?: string): Promise<APIResponse<{ tokens: TokenInfo[] }>> {
  try {
    if (creator) {
      const creatorTokenAddresses = await contractService.getAllTokensByCreator(creator as `0x${string}`);
      const tokens = await Promise.all(
        creatorTokenAddresses.map(async (addr) => {
          const contractTokenInfo = await contractService.getTokenInfo(addr);
          return {
            tokenAddress: addr,
            agentId: contractTokenInfo.agentId.toString(),
            creator: contractTokenInfo.creator,
            name: contractTokenInfo.name,
            symbol: contractTokenInfo.symbol,
            totalSupply: contractTokenInfo.totalSupply.toString(),
            deployed: contractTokenInfo.exists,
          } as TokenInfo;
        })
      );

      return {
        success: true,
        data: { tokens },
      };
    }

    const allTokenAddresses = await contractService.getAllTokens();
    const tokens = await Promise.all(
      allTokenAddresses.map(async (addr) => {
        const contractTokenInfo = await contractService.getTokenInfo(addr);
        return {
          tokenAddress: addr,
          agentId: contractTokenInfo.agentId.toString(),
          creator: contractTokenInfo.creator,
          name: contractTokenInfo.name,
          symbol: contractTokenInfo.symbol,
          totalSupply: contractTokenInfo.totalSupply.toString(),
          deployed: contractTokenInfo.exists,
        } as TokenInfo;
      })
    );

    return {
      success: true,
      data: { tokens },
    };
  } catch (error) {
    console.error('[Tokens Routes] List tokens error:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to list tokens',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
