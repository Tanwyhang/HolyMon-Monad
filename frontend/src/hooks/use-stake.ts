"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  WMON_CONTRACT,
  STAKING_CONTRACT,
  getStakingTier,
  calculateDailyRewards,
} from "@/lib/constants/wmon";

const STAKING_ABI = [
  {
    inputs: [],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "stakeAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "stakedBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "earned",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const WMON_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

interface StakingInfo {
  currentStake: number;
  stakingTier: number;
  stakingTierName: string;
  dailyRewards: number;
  totalEarned: number;
  multiplier: number;
}

export function useStake() {
  const { address, isConnected } = useAccount();
  const [stakedAmount, setStakedAmount] = useState(0n);
  const [earnedAmount, setEarnedAmount] = useState(0n);
  const [wmonBalance, setWmonBalance] = useState(0n);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    address: STAKING_CONTRACT.address,
    abi: STAKING_ABI,
    functionName: "stakedBalance",
    args: address && isInitialized ? [address as `0x${string}`] : undefined,
    query: {
      enabled: isInitialized,
    },
  });

  const { data: earned, refetch: refetchEarned } = useReadContract({
    address: STAKING_CONTRACT.address,
    abi: STAKING_ABI,
    functionName: "earned",
    args: address && isInitialized ? [address as `0x${string}`] : undefined,
    query: {
      enabled: isInitialized,
    },
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: WMON_CONTRACT.address,
    abi: WMON_ABI,
    functionName: "balanceOf",
    args: address && isInitialized ? [address as `0x${string}`] : undefined,
    query: {
      enabled: isInitialized,
    },
  });

  useEffect(() => {
    if (isConnected && address) {
      setIsInitialized(true);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (stakedBalance !== undefined) setStakedAmount(stakedBalance as bigint);
  }, [stakedBalance]);

  useEffect(() => {
    if (earned !== undefined) setEarnedAmount(earned as bigint);
  }, [earned]);

  useEffect(() => {
    if (balance !== undefined) setWmonBalance(balance as bigint);
  }, [balance]);

  const {
    data: approveHash,
    writeContract: approve,
    isPending: isApproving,
  } = useWriteContract();
  const {
    data: stakeHash,
    writeContract: stake,
    isPending: isStaking,
  } = useWriteContract();
  const {
    data: unstakeHash,
    writeContract: unstake,
    isPending: isUnstaking,
  } = useWriteContract();
  const {
    data: claimHash,
    writeContract: claimRewards,
    isPending: isClaiming,
  } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isLoading: isStakeConfirming } = useWaitForTransactionReceipt({
    hash: stakeHash,
  });
  const { isLoading: isUnstakeConfirming } = useWaitForTransactionReceipt({
    hash: unstakeHash,
  });
  const { isLoading: isClaimConfirming } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const approveStaking = async (amount: string) => {
    const amountInWei = parseEther(amount);
    approve({
      address: WMON_CONTRACT.address,
      abi: WMON_ABI,
      functionName: "approve",
      args: [STAKING_CONTRACT.address, amountInWei],
      chain: undefined,
      account: undefined,
    } as any);
  };

  const stakeTokens = async (amount: string) => {
    const amountInWei = parseEther(amount);
    stake({
      address: STAKING_CONTRACT.address,
      abi: STAKING_ABI,
      functionName: "stakeAmount",
      args: [amountInWei],
      chain: undefined,
      account: undefined,
    } as any);
  };

  const unstakeTokens = async (amount: string) => {
    const amountInWei = parseEther(amount);
    unstake({
      address: STAKING_CONTRACT.address,
      abi: STAKING_ABI,
      functionName: "unstake",
      args: [amountInWei],
      chain: undefined,
      account: undefined,
    } as any);
  };

  const claimRewardsAction = async () => {
    claimRewards({
      address: STAKING_CONTRACT.address,
      abi: STAKING_ABI,
      functionName: "claimRewards",
      chain: undefined,
      account: undefined,
    } as any);
  };

  const stakeAmountNumber = Number(formatEther(stakedAmount));
  const tier = getStakingTier(stakeAmountNumber);
  const stakingInfo: StakingInfo = {
    currentStake: stakeAmountNumber,
    stakingTier: tier.tier,
    stakingTierName: tier.name,
    dailyRewards: calculateDailyRewards(stakeAmountNumber, tier.multiplier),
    totalEarned: Number(formatEther(earnedAmount)),
    multiplier: tier.multiplier,
  };

  const refreshAll = () => {
    refetchStaked();
    refetchEarned();
    refetchBalance();
  };

  return {
    stakedAmount,
    earnedAmount,
    wmonBalance,
    stakingInfo,
    approveStaking,
    stakeTokens,
    unstakeTokens,
    claimRewards: claimRewardsAction,
    isApproving,
    isStaking,
    isUnstaking,
    isClaiming,
    isApproveConfirming,
    isStakeConfirming,
    isUnstakeConfirming,
    isClaimConfirming,
    approveHash,
    stakeHash,
    unstakeHash,
    claimHash,
    refreshAll,
  };
}
