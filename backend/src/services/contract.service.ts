import { createPublicClient, createWalletClient, http, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config/env';

type Chain = {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] } };
};

const monadChain: Chain = {
  id: config.monad.chainId,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [config.monad.rpcUrl] } },
};

const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(),
});

const account = privateKeyToAccount(config.monad.privateKey as Hex);

const walletClient = createWalletClient({
  account,
  chain: monadChain,
  transport: http(),
});

export class ContractService {
  constructor(
    private tokenLaunchpadAddress: Address,
    private monStakingAddress: Address,
  ) {}

  /**
   * Deploy token for ERC-8004 agent
   * Note: agentId here is actually the ERC-8004 token ID (bigint)
   */
  async deployToken(
    agentId: string, // ERC-8004 token ID as string
    tokenName: string,
    tokenSymbol: string,
    initialSupply: bigint,
  ): Promise<{ tokenAddress: string; txHash: string }> {
    if (!this.tokenLaunchpadAddress) {
      throw new Error('TokenLaunchpad address not set');
    }

    const hash = await walletClient.writeContract({
      address: this.tokenLaunchpadAddress,
      abi: tokenLaunchpadABI,
      functionName: 'deployToken',
      args: [BigInt(agentId), tokenName, tokenSymbol, initialSupply],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenAddress = receipt.contractAddress || '';

    return { tokenAddress, txHash: hash };
  }

  async getTokenInfo(tokenAddress: Address): Promise<any> {
    if (!this.tokenLaunchpadAddress) {
      throw new Error('TokenLaunchpad address not set');
    }

    const tokenInfo = await publicClient.readContract({
      address: this.tokenLaunchpadAddress,
      abi: tokenLaunchpadABI,
      functionName: 'getTokenInfo',
      args: [tokenAddress],
    });

    return tokenInfo;
  }

  async getTokenByAgent(agentId: string): Promise<Address> {
    if (!this.tokenLaunchpadAddress) {
      throw new Error('TokenLaunchpad address not set');
    }

    const tokenAddress = await publicClient.readContract({
      address: this.tokenLaunchpadAddress,
      abi: tokenLaunchpadABI,
      functionName: 'getTokenByAgent',
      args: [BigInt(agentId)],
    });

    return tokenAddress as Address;
  }

  async getAllTokens(): Promise<Address[]> {
    if (!this.tokenLaunchpadAddress) {
      throw new Error('TokenLaunchpad address not set');
    }

    const tokenAddresses = await publicClient.readContract({
      address: this.tokenLaunchpadAddress,
      abi: tokenLaunchpadABI,
      functionName: 'getAllTokens',
      args: [],
    });

    return tokenAddresses as Address[];
  }

  async getAllTokensByCreator(creator: Address): Promise<Address[]> {
    if (!this.tokenLaunchpadAddress) {
      throw new Error('TokenLaunchpad address not set');
    }

    const tokenAddresses = await publicClient.readContract({
      address: this.tokenLaunchpadAddress,
      abi: tokenLaunchpadABI,
      functionName: 'getAllTokensByCreator',
      args: [creator],
    });

    return tokenAddresses as Address[];
  }

  async stake(amount: bigint): Promise<{ txHash: string }> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const hash = await walletClient.writeContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'stake',
      args: [amount],
      value: amount,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
  }

  async unstake(amount: bigint): Promise<{ txHash: string }> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const hash = await walletClient.writeContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'unstake',
      args: [amount],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
  }

  async claimRewards(): Promise<{ txHash: string }> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const hash = await walletClient.writeContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'claimRewards',
      args: [],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { txHash: hash };
  }

  async getUserStakeInfo(user: Address): Promise<{
    amount: bigint;
    startTime: bigint;
    lastClaimTime: bigint;
    multiplier: bigint;
    pendingRewards: bigint;
  }> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const stakeInfo = await publicClient.readContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'getStakeInfo',
      args: [user],
    });

    return {
      amount: stakeInfo[0] as bigint,
      startTime: stakeInfo[1] as bigint,
      lastClaimTime: stakeInfo[2] as bigint,
      multiplier: stakeInfo[3] as bigint,
      pendingRewards: stakeInfo[4] as bigint,
    };
  }

  async getAllTiers(): Promise<Array<{ minStake: bigint; multiplier: bigint; name: string }>> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const tiers = await publicClient.readContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'getAllTiers',
      args: [],
    });

    return tiers as Array<{ minStake: bigint; multiplier: bigint; name: string }>;
  }

  async getGlobalStats(): Promise<{ totalStaked: bigint; totalStakers: bigint }> {
    if (!this.monStakingAddress) {
      throw new Error('MONStaking address not set');
    }

    const stats = await publicClient.readContract({
      address: this.monStakingAddress,
      abi: monStakingABI,
      functionName: 'getGlobalStats',
      args: [],
    });

    return {
      totalStaked: stats[0] as bigint,
      totalStakers: stats[1] as bigint,
    };
  }
}

const tokenLaunchpadABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_agentId', type: 'uint256' },
      { internalType: 'string', name: '_tokenName', type: 'string' },
      { internalType: 'string', name: '_tokenSymbol', type: 'string' },
      { internalType: 'uint256', name: '_initialSupply', type: 'uint256' },
    ],
    name: 'deployToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_tokenAddress', type: 'address' }],
    name: 'getTokenInfo',
    outputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_agentId', type: 'uint256' }],
    name: 'getTokenByAgent',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_creator', type: 'address' }],
    name: 'getAllTokensByCreator',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const monStakingABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getStakeInfo',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTiers',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'minStake', type: 'uint256' },
          { internalType: 'uint256', name: 'multiplier', type: 'uint256' },
          { internalType: 'string', name: 'name', type: 'string' },
        ],
        internalType: 'struct MONStaking.StakingTier[5]',
        name: '',
        type: 'tuple[5]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlobalStats',
    outputs: [
      { internalType: 'uint256', name: '_totalStaked', type: 'uint256' },
      { internalType: 'uint256', name: '_totalStakers', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const contractService = new ContractService(
  config.contracts.tokenLaunchpad as Address,
  config.contracts.monStaking as Address,
);

// Export publicClient for use by other services
export { publicClient };
