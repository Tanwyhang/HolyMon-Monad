"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PixelBlast from "@/components/PixelBlast";
import { AgentAvatar } from "@/components/agent-avatar";
import LargeNFTAvatar from "@/components/large-nft-avatar";
import { StakeMon } from "@/components/stake-mon";
import { getHolyMonAgent } from "@/lib/api-client";
import type { HolyMonAgent } from "@/types/agent";
import { useAccount } from "wagmi";

interface AgentDetailPageProps {
  params: {
    id: string;
  };
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const agentId = params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [agent, setAgent] = useState<HolyMonAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    setIsLoading(true);
    try {
      const data = await getHolyMonAgent(agentId);
      setAgent(data);
    } catch (error) {
      console.error("Failed to load agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#050505] text-gray-200 font-sans p-4 lg:p-8 flex items-center justify-center">
        <div className="text-neutral-500">Loading agent...</div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#050505] text-gray-200 font-sans p-4 lg:p-8 flex items-center justify-center">
        <div className="text-red-500">Agent not found</div>
      </main>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "token", label: "Token" },
    { id: "staking", label: "Stake" },
    { id: "abilities", label: "Abilities" },
    { id: "battle", label: "Battle" },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#050505] text-gray-200 font-sans p-4 lg:p-8 relative overflow-hidden">
      {/* PIXEL BLAST BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <PixelBlast
          variant="square"
          pixelSize={4}
          patternScale={7}
          color="#836EF9"
          liquid={false}
          enableRipples={false}
          speed={2}
          className="w-full h-full opacity-90"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/agents"
            className="inline-flex items-center text-[#836EF9] hover:text-white font-bold transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
          >
            ← Back to My Agents
          </Link>
        </div>

        {/* Agent Header */}
        <div className="bg-[#0a0a0a] border border-neutral-800 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#836EF9]/10 rounded-full blur-3xl" />

          <div className="flex flex-col md:flex-row items-start md:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="border-2 border-neutral-700 rounded-lg overflow-hidden">
                <AgentAvatar
                  seed={agent.name || agentId}
                  size={96}
                  className="w-20 h-20"
                />
              </div>
              <div>
                <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">
                  {agent.name}
                </h1>
                <p className="text-lg text-neutral-500 font-mono">
                  {agent.symbol}
                </p>
              </div>
            </div>
            <div className="flex items-start md:items-end gap-2">
              <span className="px-4 py-2 bg-purple-900/50 text-purple-400 text-sm font-bold uppercase">
                Tier {agent.tier}
              </span>
              <button className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                Edit Agent
              </button>
            </div>
          </div>
          <p className="text-neutral-400 mt-4 relative z-10">
            {agent.backstory || agent.description}
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-[#0a0a0a] border border-neutral-800 mb-6">
          <div className="flex border-b border-neutral-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-bold uppercase text-sm tracking-wider transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
                  activeTab === tab.id
                    ? "text-white bg-[#836EF9]/20 border-b-2 border-[#836EF9]"
                    : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-[#0a0a0a] border border-neutral-800 p-6 min-h-[500px]">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-800 p-5">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">
                    Agent Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Total Battles
                      </span>
                      <span className="font-bold text-white">
                        {agent.stats.totalBattles}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Wins
                      </span>
                      <span className="font-bold text-green-500">
                        {agent.stats.wins} ({agent.stats.winRate}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Losses
                      </span>
                      <span className="font-bold text-red-500">
                        {agent.stats.losses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Win Rate
                      </span>
                      <span className="font-bold text-[#836EF9]">
                        {agent.stats.winRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-800 p-5">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">
                    Staking Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Current Stake
                      </span>
                      <span className="font-bold text-white">
                        {agent.staked.toLocaleString()} MON
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Staking Tier
                      </span>
                      <span className="font-bold text-amber-500">
                        {agent.stakingInfo.stakingTierName} (
                        {agent.stakingInfo.multiplier}x)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Daily Rewards
                      </span>
                      <span className="font-bold text-green-500">
                        ~{agent.stakingInfo.dailyRewards.toFixed(3)} MON
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-sm uppercase">
                        Total Earned
                      </span>
                      <span className="font-bold text-[#836EF9]">
                        {agent.stakingInfo.totalEarned} MON
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-6">
                <h3 className="text-lg font-bold mb-4 uppercase tracking-wide">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800">
                    <span className="text-2xl font-black text-green-500 w-8">
                      W
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-white">vs Ancient Oracle</p>
                      <p className="text-sm text-neutral-500">
                        Weekly Championship - Round 3
                      </p>
                    </div>
                    <span className="text-xs text-neutral-600">30m ago</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800">
                    <span className="text-2xl font-black text-red-500 w-8">
                      L
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-white">vs Ancient Sage</p>
                      <p className="text-sm text-neutral-500">
                        Daily Skirmish - Round 2
                      </p>
                    </div>
                    <span className="text-xs text-neutral-600">1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token Tab */}
          {activeTab === "token" && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-black mb-2 uppercase">
                  Token Launchpad
                </h2>
                <p className="text-neutral-500">
                  Deploy a divine ERC-20 token for your HolyMon agent
                </p>
              </div>

              <div className="border border-neutral-800 p-8 text-center">
                <p className="text-lg font-bold mb-2">No Token Deployed</p>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Launch your agent's divine token to represent them in the
                  digital realm.
                </p>
                <button className="px-8 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)]">
                  Launch Token
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Token Name", "Token Symbol", "Total Supply", "Contract"].map(
                  (label) => (
                    <div key={label} className="border border-neutral-800 p-4">
                      <h3 className="text-xs text-neutral-500 uppercase mb-2">
                        {label}
                      </h3>
                      <p className="text-neutral-600 font-mono text-sm">
                        Not deployed
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Staking Tab */}
          {activeTab === "staking" && <StakeMon />}

          {/* Abilities Tab */}
          {activeTab === "abilities" && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-black mb-2 uppercase">
                  Divine Abilities
                </h2>
                <p className="text-neutral-500">
                  {agent.name} has been blessed with sacred combat abilities
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.abilities.map((ability) => (
                  <div
                    key={ability.name}
                    className="border border-neutral-800 p-5"
                  >
                    <h3 className="font-bold text-lg text-white mb-2">
                      {ability.name}
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">
                      {ability.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${ability.color}-500`}
                          style={{ width: `${ability.level * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 font-mono">
                        {ability.level}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle Tab */}
          {activeTab === "battle" && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-black mb-2 uppercase">
                  Battle Simulator
                </h2>
                <p className="text-neutral-500">
                  Simulate how Divine Warrior performs in different scenarios
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-800 p-6">
                  <h3 className="text-sm font-bold mb-3 uppercase text-neutral-500">
                    Select Opponent
                  </h3>
                  <select className="w-full px-4 py-3 border border-neutral-700 bg-black text-white focus:border-[#836EF9] focus:outline-none transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                    <option value="">Choose an opponent...</option>
                    <option value="ancient-sage">Ancient Sage (SAGE)</option>
                    <option value="celestial-guardian">
                      Celestial Guardian (GARD)
                    </option>
                  </select>
                </div>

                <div className="border border-neutral-800 p-6">
                  <h3 className="text-sm font-bold mb-3 uppercase text-neutral-500">
                    Battle Type
                  </h3>
                  <select className="w-full px-4 py-3 border border-neutral-700 bg-black text-white focus:border-[#836EF9] focus:outline-none transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                    <option value="quick">Quick Battle (1 Round)</option>
                    <option value="full">Tournament (3 Rounds)</option>
                  </select>
                </div>
              </div>

              <button className="w-full py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)]">
                Start Simulation
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
