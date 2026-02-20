"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PixelBlast from "@/components/PixelBlast";
import LargeNFTAvatar from "@/components/large-nft-avatar";
import { AgentAvatar } from "@/components/agent-avatar";
import { getHolyMonAgents } from "@/lib/api-client";
import type { HolyMonAgent } from "@/types/agent";

export default function MyAgents() {
  const [agents, setAgents] = useState<HolyMonAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasElizaConfig = (agent: HolyMonAgent): boolean => {
    return (
      !!agent.elizaos &&
      !!agent.elizaos.topics &&
      agent.elizaos.topics.length > 0
    );
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await getHolyMonAgents();
      setAgents(data);
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const arenaReadyAgents = agents.filter((a) => hasElizaConfig(a));
  const notReadyAgents = agents.filter((a) => !hasElizaConfig(a));

  if (isLoading) {
    return (
      <main className="h-[calc(100vh-64px)] bg-[#050505] text-gray-200 font-sans p-4 lg:p-8 flex items-center justify-center">
        <div className="text-white font-black uppercase tracking-widest text-xl animate-pulse">
          Summoning Agents...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#050505] text-white font-sans p-4 lg:p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white drop-shadow-[4px_4px_0px_#836EF9]">
              My Pantheon
            </h1>
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mt-1">
              Manage your divine squad
            </p>
            <p className="text-sm text-purple-400 mt-2">
              <span className="font-bold">{arenaReadyAgents.length}</span> /{" "}
              {agents.length} agents ready for Arena
              {notReadyAgents.length > 0 && (
                <span className="text-amber-500 ml-2">
                  ({notReadyAgents.length} need ElizaOS config)
                </span>
              )}
            </p>
          </div>
          <Link
            href="/create-agent"
            className="px-6 py-3 bg-[#836EF9] border-2 border-white text-white font-black uppercase tracking-widest hover:bg-[#6B5BD4] hover:shadow-[4px_4px_0px_0px_#fff] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all shadow-[4px_4px_0px_0px_#fff]"
          >
            Create Agent
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-black border-2 border-purple-500 p-5 shadow-[8px_8px_0px_0px_#836EF9]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500" />
              <p className="text-xs font-bold uppercase text-purple-500 tracking-widest">
                Total Agents
              </p>
            </div>
            <p className="text-4xl font-black text-white">{agents.length}</p>
          </div>
          <div className="bg-black border-2 border-amber-500 p-5 shadow-[8px_8px_0px_0px_#F59E0B]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-amber-500" />
              <p className="text-xs font-bold uppercase text-amber-500 tracking-widest">
                Total Staked
              </p>
            </div>
            <p className="text-4xl font-black text-white">
              {agents.reduce((sum, a) => sum + a.staked, 0).toLocaleString()}{" "}
              <span className="text-lg">MON</span>
            </p>
          </div>
          <div className="bg-black border-2 border-green-500 p-5 shadow-[8px_8px_0px_0px_#22C55E]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500" />
              <p className="text-xs font-bold uppercase text-green-500 tracking-widest">
                Total Influence
              </p>
            </div>
            <p className="text-4xl font-black text-white">
              {agents.reduce((sum, a) => sum + a.influence, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {agents.map((agent, index) => {
            const isArenaReady = hasElizaConfig(agent);

            return (
              <Link
                key={agent.id}
                href={`/agent/${agent.id}`}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className="relative animate-float"
                  style={{ animationDelay: `${index * 0.4}s` }}
                >
                  <div className="absolute inset-0 bg-[#836EF9] rounded-lg blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 [transition-timing-function:cubic-bezier(0,.4,.01,.99)] scale-110" />

                  <div
                    className={`relative bg-black p-1 border-2 transition-all duration-300 [transition-timing-function:cubic-bezier(0,.4,.01,.99)] rounded-lg overflow-hidden group-hover:scale-105 ${isArenaReady ? "border-white" : "border-neutral-700 group-hover:border-[#836EF9]"}`}
                  >
                    <AgentAvatar
                      seed={agent.id}
                      size={80}
                      className="w-12 h-12 rounded-md"
                    />
                  </div>

                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a12] ${isArenaReady ? "bg-blue-500" : "bg-neutral-600"}`}
                  />

                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-black text-black border-2 border-[#0a0a12]">
                    {agent.tier}
                  </div>
                </div>

                <div className="text-[10px] font-bold text-neutral-400 group-hover:text-white transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] text-center truncate w-full">
                  {agent.name.split(" ")[0]}
                </div>
              </Link>
            );
          })}

          {/* Create New Agent Card */}
          <Link
            href="/create-agent"
            className="group border-2 border-dashed border-neutral-700 bg-black/50 p-6 flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-500/5 transition-all min-h-[250px]"
          >
            <div className="w-16 h-16 border-2 border-neutral-700 group-hover:border-purple-500 flex items-center justify-center mb-4 transition-colors bg-black">
              <span className="text-4xl text-neutral-500 group-hover:text-purple-500 transition-colors font-black pb-1">
                +
              </span>
            </div>
            <h3 className="font-black text-lg mb-1 text-neutral-500 group-hover:text-white uppercase tracking-wide transition-colors">
              Summon New Agent
            </h3>
            <p className="text-xs text-neutral-600 uppercase font-bold tracking-widest">
              Expand your influence
            </p>
          </Link>

          <Link
            href="/create-agent"
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-[56px] h-[56px] border-2 border-dashed border-neutral-700 group-hover:border-[#836EF9] bg-neutral-900/50 group-hover:bg-[#836EF9]/10 flex items-center justify-center transition-all duration-300 [transition-timing-function:cubic-bezier(0,.4,.01,.99)] rounded-lg group-hover:scale-105">
              <span className="text-xl text-neutral-600 group-hover:text-[#836EF9] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                +
              </span>
            </div>
            <div className="text-[10px] font-bold text-neutral-600 group-hover:text-[#836EF9] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
              Summon
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
