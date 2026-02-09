"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PixelBlast from "@/components/PixelBlast";
import LargeNFTAvatar from "@/components/large-nft-avatar";
import { getHolyMonAgents } from "@/lib/api-client";
import type { HolyMonAgent } from "@/types/agent";

export default function MyAgents() {
  const [agents, setAgents] = useState<HolyMonAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agent/${agent.id}`}
              className="group bg-black border-2 border-white p-5 hover:border-purple-500 transition-colors relative overflow-hidden shadow-[8px_8px_0px_0px_#333] hover:shadow-[8px_8px_0px_0px_#836EF9] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
            >
              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="transform transition-transform group-hover:scale-105">
                  <LargeNFTAvatar
                    seed={agent.name}
                    size={80}
                    showTier={false}
                    tier={agent.tier}
                    traits={agent.visualTraits}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-black text-xl text-white uppercase tracking-tight truncate group-hover:text-purple-500 transition-colors">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-white text-black text-[10px] font-bold uppercase border border-black">
                        {agent.symbol}
                      </span>
                      <span className="px-2 py-0.5 bg-black border border-white text-white text-[10px] font-bold uppercase">
                        T{agent.tier}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-400 mb-4 relative z-10 line-clamp-2 font-medium border-t-2 border-dashed border-neutral-800 pt-3 mt-2">
                {agent.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase">
                <div className="bg-[#111] p-2 border border-neutral-800">
                  <span className="text-neutral-500 block mb-1">Influence</span>
                  <span className="text-green-500 text-lg">
                    {agent.influence.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#111] p-2 border border-neutral-800">
                  <span className="text-neutral-500 block mb-1">Staked</span>
                  <span className="text-amber-500 text-lg">
                    {agent.staked.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}

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
        </div>
      </div>
    </main>
  );
}
