"use client";

import { useState } from "react";
import { useStake } from "@/hooks/use-stake";
import { STAKING_TIERS } from "@/lib/constants/wmon";

export function StakeMon() {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [needsApproval, setNeedsApproval] = useState(false);

  const {
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
    refreshAll,
  } = useStake();

  const isProcessing =
    isApproving ||
    isStaking ||
    isUnstaking ||
    isClaiming ||
    isApproveConfirming ||
    isStakeConfirming ||
    isUnstakeConfirming ||
    isClaimConfirming;

  const handleMax = () => {
    if (mode === "stake") {
      setAmount((Number(wmonBalance) / 1e18).toFixed(6));
    } else {
      setAmount((Number(stakedAmount) / 1e18).toFixed(6));
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;

    if (mode === "stake") {
      if (Number(amount) * 1e18 > Number(wmonBalance)) {
        alert("Insufficient WMON balance");
        return;
      }
      if (needsApproval) {
        await approveStaking(amount);
        setNeedsApproval(false);
      } else {
        await stakeTokens(amount);
        refreshAll();
      }
    } else {
      if (Number(amount) * 1e18 > Number(stakedAmount)) {
        alert("Insufficient staked balance");
        return;
      }
      await unstakeTokens(amount);
      refreshAll();
    }
  };

  const handleClaimRewards = async () => {
    await claimRewardsAction();
    refreshAll();
  };

  const handleStakeClick = () => {
    if (mode === "stake" && !needsApproval) {
      setNeedsApproval(true);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black border border-neutral-800 p-6 space-y-4">
          <div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              Current Stake
            </div>
            <div className="text-3xl font-black text-white">
              {stakingInfo.currentStake.toLocaleString()} WMON
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-500 text-black text-xs font-bold uppercase">
              Tier {stakingInfo.stakingTier}
            </span>
            <span className="text-amber-500 font-bold">
              {stakingInfo.stakingTierName} ({stakingInfo.multiplier}x)
            </span>
          </div>
          <div>
            <div className="text-xs text-neutral-500 uppercase mb-1">
              Daily Rewards
            </div>
            <div className="text-xl font-mono font-bold text-green-500">
              ~{stakingInfo.dailyRewards.toFixed(3)} WMON
            </div>
          </div>
        </div>

        <div className="bg-black border border-neutral-800 p-6 space-y-4">
          <div>
            <div className="text-xs text-neutral-500 uppercase mb-1">
              Available to Claim
            </div>
            <div className="text-3xl font-black text-green-500">
              {(Number(earnedAmount) / 1e18).toFixed(4)} WMON
            </div>
          </div>
          <button
            onClick={handleClaimRewards}
            disabled={isClaiming || Number(earnedAmount) === 0}
            className={`w-full py-3 font-bold uppercase tracking-wider transition-all ${
              isClaiming || Number(earnedAmount) === 0
                ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            {isClaiming ? "Claiming..." : "Claim Rewards"}
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wide">
            Manage Stake
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode("stake");
                setNeedsApproval(false);
              }}
              className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
                mode === "stake"
                  ? "bg-[#836EF9] text-white"
                  : "bg-neutral-900 text-neutral-500 hover:text-white"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => {
                setMode("unstake");
                setNeedsApproval(false);
              }}
              className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
                mode === "unstake"
                  ? "bg-[#836EF9] text-white"
                  : "bg-neutral-900 text-neutral-500 hover:text-white"
              }`}
            >
              Unstake
            </button>
          </div>
        </div>

        <div className="bg-black border border-neutral-800 p-4">
          <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">
            {mode === "stake" ? "WMON to Stake" : "WMON to Unstake"}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-mono font-bold text-white focus:outline-none"
              disabled={isProcessing}
            />
            <button
              onClick={handleMax}
              className="px-3 py-1 text-xs font-bold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              MAX
            </button>
            <span className="text-sm font-bold text-white">WMON</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Balance:{" "}
            {mode === "stake"
              ? `${(Number(wmonBalance) / 1e18).toFixed(6)} WMON`
              : `${(Number(stakedAmount) / 1e18).toFixed(6)} staked`}
          </div>
        </div>

        {mode === "stake" && needsApproval && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-500">
            First transaction approves the staking contract to spend your WMON
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleStakeClick}
            disabled={!amount || Number(amount) <= 0 || isProcessing}
            className={`flex-1 py-4 font-black uppercase tracking-wider transition-all ${
              isProcessing || !amount || Number(amount) <= 0
                ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                : needsApproval
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-white text-black hover:bg-amber-500 shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)]"
            }`}
          >
            {isProcessing
              ? "Processing..."
              : needsApproval
                ? "Approve"
                : mode === "stake"
                  ? "Stake WMON"
                  : "Unstake WMON"}
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-neutral-800 p-6">
        <h3 className="text-lg font-bold uppercase tracking-wide mb-4">
          Devotion Tiers
        </h3>
        <div className="space-y-2">
          {STAKING_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`flex items-center justify-between p-4 border transition-colors ${
                tier.tier === stakingInfo.stakingTier
                  ? "border-[#836EF9]/50 bg-[#836EF9]/10"
                  : "border-neutral-800 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-neutral-600">
                  T{tier.tier}
                </span>
                <span className="font-bold text-white">{tier.name}</span>
              </div>
              <div className="text-right">
                <p className="font-mono text-white">
                  {tier.minStake.toLocaleString()}+ WMON
                </p>
                <p className="text-amber-500 text-sm">{tier.multiplier}x</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
