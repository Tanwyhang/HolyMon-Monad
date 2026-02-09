"use client";

import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { WMON_CONTRACT } from "@/lib/constants/wmon";

const WMON_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
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
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export function useWrapMon() {
  const { address } = useAccount();
  const { data: monBalance } = useBalance({ address });
  const { data: wmonBalance } = useReadContract({
    address: WMON_CONTRACT.address,
    abi: WMON_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
  });
  const { data: totalSupply } = useReadContract({
    address: WMON_CONTRACT.address,
    abi: WMON_ABI,
    functionName: "totalSupply",
  });

  const {
    data: depositHash,
    writeContract: deposit,
    isPending: isDepositing,
  } = useWriteContract();
  const {
    data: withdrawHash,
    writeContract: withdraw,
    isPending: isWithdrawing,
  } = useWriteContract();

  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const wrap = async (amount: string) => {
    const amountInWei = parseEther(amount);
    deposit({
      address: WMON_CONTRACT.address,
      abi: WMON_ABI,
      functionName: "deposit",
      value: amountInWei,
      chain: undefined,
      account: undefined,
    } as any);
  };

  const unwrap = async (amount: string) => {
    const amountInWei = parseEther(amount);
    withdraw({
      address: WMON_CONTRACT.address,
      abi: WMON_ABI,
      functionName: "withdraw",
      args: [amountInWei],
      chain: undefined,
      account: undefined,
    } as any);
  };

  return {
    monBalance: monBalance?.value ?? 0n,
    wmonBalance: wmonBalance ?? 0n,
    totalSupply: totalSupply ?? 0n,
    wrap,
    unwrap,
    isDepositing,
    isWithdrawing,
    isDepositConfirming,
    isWithdrawConfirming,
    depositHash,
    withdrawHash,
  };
}
