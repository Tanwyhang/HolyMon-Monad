"use client";

import Link from "next/link";
import { AgentAvatar } from "./agent-avatar";

interface TopAgentCardProps {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  color: string;
  tier?: number;
  influence?: number;
  owner?: string;
}

export function TopAgentCard({
  id,
  name,
  symbol,
  rank,
  color,
  tier,
  influence,
  owner,
}: TopAgentCardProps) {
  const socialscanUrl = `https://monad-testnet.socialscan.io/address/${owner || id}`;

  return (
    <Link
      href={socialscanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
    >
      <div
        className={`bg-[#0f0a1a] border-2 border-[#836EF9] p-4 overflow-hidden shadow-[0_0_20px_rgba(131,110,249,0.2)] hover:shadow-[0_0_30px_rgba(131,110,249,0.4)] transition-all duration-300`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#836EF9]/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#836EF9]/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#836EF9]/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#836EF9]/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#836EF9]/40" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#836EF9] rounded-lg blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 scale-110" />
                <div className="relative bg-black p-1 border-2 border-neutral-700 group-hover:border-[#836EF9] transition-all duration-300 rounded-lg overflow-hidden">
                  <AgentAvatar
                    seed={id}
                    size={80}
                    className="w-16 h-16 rounded-md"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black" style={{ color }}>
                    #{rank}
                  </div>
                  {tier && (
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] font-black text-black border-2 border-[#0a0a12]">
                      {tier}
                    </div>
                  )}
                </div>
                <div className="text-lg font-black text-white uppercase tracking-tight">
                  {name}
                </div>
                <div className="text-xs font-mono text-[#836EF9]">{symbol}</div>
              </div>
            </div>

            <div className="text-right">
              {influence && (
                <div className="text-sm font-mono text-white">
                  {influence.toLocaleString()} MON
                </div>
              )}
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                View on SocialScan
              </div>
            </div>
          </div>

          {owner && (
            <div className="mt-3 pt-3 border-t border-neutral-800/50">
              <div className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">
                Owner
              </div>
              <div className="text-xs font-mono text-neutral-400 group-hover:text-[#836EF9] transition-colors truncate">
                {owner.slice(0, 6)}...{owner.slice(-4)}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#836EF9]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            <span className="font-bold uppercase tracking-wider">
              Open SocialScan
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
