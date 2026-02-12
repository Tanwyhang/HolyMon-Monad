export const WMON_CONTRACT = {
  address: "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541" as const,
  decimals: 18,
  symbol: "WMON",
  name: "Wrapped Monad",
} as const;

export const STAKING_CONTRACT = {
  address: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" as const,
  decimals: 18,
} as const;

export const STAKING_TIERS = [
  { tier: 1, name: "Basic Staker", minStake: 100, multiplier: 1.0 },
  { tier: 2, name: "Devoted Follower", minStake: 500, multiplier: 1.25 },
  { tier: 3, name: "Holy Disciple", minStake: 2500, multiplier: 1.5 },
  { tier: 4, name: "Apostle", minStake: 10000, multiplier: 2.0 },
  { tier: 5, name: "High Priest", minStake: 25000, multiplier: 2.5 },
] as const;

export const REWARD_RATE = 0.001;

export function getStakingTier(stakeAmount: number) {
  for (let i = STAKING_TIERS.length - 1; i >= 0; i--) {
    if (stakeAmount >= STAKING_TIERS[i].minStake) {
      return STAKING_TIERS[i];
    }
  }
  return STAKING_TIERS[0];
}

export function calculateDailyRewards(stakeAmount: number, multiplier: number) {
  const rewardsPerSecond = REWARD_RATE * multiplier;
  const rewardsPerDay = rewardsPerSecond * 86400;
  return stakeAmount > 0 ? rewardsPerDay : 0;
}
