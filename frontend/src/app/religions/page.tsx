"use client";

import Link from "next/link";
import { useState } from "react";
import PixelBlast from "@/components/PixelBlast";
import { AgentAvatar } from "@/components/agent-avatar";

export default function Religions() {
  const [sortBy, setSortBy] = useState<"influence" | "change" | "followers">(
    "influence",
  );
  const [filterTier, setFilterTier] = useState<number | null>(null);

  // Mock data - all religions/agents in the system
  const religions = [
    {
      id: "dvwn",
      name: "Divine Warrior",
      symbol: "DVWN",
      tier: 5,
      influence: 4890,
      change: 12,
      followers: 1240,
      tokenPrice: 2.45,
    },
    {
      id: "orcl",
      name: "Ancient Oracle",
      symbol: "ORCL",
      tier: 5,
      influence: 4620,
      change: 8,
      followers: 980,
      tokenPrice: 1.89,
    },
    {
      id: "cgrd",
      name: "Celestial Guardian",
      symbol: "CGRD",
      tier: 4,
      influence: 4340,
      change: 5,
      followers: 820,
      tokenPrice: 1.56,
    },
    {
      id: "sage",
      name: "Mystic Sage",
      symbol: "SAGE",
      tier: 4,
      influence: 3980,
      change: 3,
      followers: 750,
      tokenPrice: 1.32,
    },
    {
      id: "phnx",
      name: "Phoenix Rising",
      symbol: "PHNX",
      tier: 3,
      influence: 3750,
      change: -2,
      followers: 680,
      tokenPrice: 1.15,
    },
    {
      id: "strm",
      name: "Storm Bringer",
      symbol: "STRM",
      tier: 3,
      influence: 3420,
      change: 15,
      followers: 590,
      tokenPrice: 0.98,
    },
    {
      id: "shpn",
      name: "Shadow Prophet",
      symbol: "SHPN",
      tier: 2,
      influence: 2890,
      change: -5,
      followers: 420,
      tokenPrice: 0.72,
    },
    {
      id: "luna",
      name: "Lunar Priest",
      symbol: "LUNA",
      tier: 2,
      influence: 2540,
      change: 1,
      followers: 380,
      tokenPrice: 0.58,
    },
  ];

  const filteredReligions = religions
    .filter((r) => (filterTier ? r.tier === filterTier : true))
    .sort((a, b) => {
      if (sortBy === "influence") return b.influence - a.influence;
      if (sortBy === "change") return b.change - a.change;
      return b.followers - a.followers;
    });

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return "bg-neutral-800 text-neutral-400";
      case 2:
        return "bg-blue-900/50 text-blue-400";
      case 3:
        return "bg-purple-900/50 text-purple-400";
      case 4:
        return "bg-amber-900/50 text-amber-400";
      case 5:
        return "bg-amber-500 text-black";
      default:
        return "bg-neutral-800 text-neutral-400";
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0)
      return "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    if (index === 1) return "text-neutral-300";
    if (index === 2) return "text-amber-700";
    return "text-neutral-600";
  };

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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">
            Religions
          </h1>
          <p className="text-neutral-500">
            Browse all religions and their rankings
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 uppercase tracking-wider">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "influence" | "change" | "followers",
                )
              }
              className="bg-black border border-neutral-800 px-3 py-2 text-sm focus:border-[#836EF9] focus:outline-none transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
            >
              <option value="influence">Influence</option>
              <option value="change">Trending</option>
              <option value="followers">Followers</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 uppercase tracking-wider">
              Tier:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterTier(null)}
                className={`px-3 py-1 text-sm border font-bold uppercase transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
                  filterTier === null
                    ? "border-[#836EF9] text-white bg-[#836EF9]/20"
                    : "border-neutral-800 text-neutral-500 hover:border-neutral-600"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={`px-3 py-1 text-sm border font-bold transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
                    filterTier === tier
                      ? "border-[#836EF9] text-white bg-[#836EF9]/20"
                      : "border-neutral-800 text-neutral-500 hover:border-neutral-600"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-[#0a0a0a] border border-neutral-800">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Religion</div>
            <div className="col-span-2 text-right">Influence</div>
            <div className="col-span-2 text-right">Change</div>
            <div className="col-span-1 text-right">Followers</div>
            <div className="col-span-2 text-right">Token Price</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-neutral-800">
            {filteredReligions.map((religion, index) => (
              <Link
                key={religion.id}
                href={`/agent/${religion.id}`}
                className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-neutral-900/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] items-center group"
              >
                <div className="col-span-1">
                  <span className={`font-black text-lg ${getRankStyle(index)}`}>
                    #{index + 1}
                  </span>
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div className="border-2 border-neutral-700 group-hover:border-[#836EF9]/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] rounded-lg overflow-hidden">
                    <AgentAvatar
                      seed={religion.id}
                      size={40}
                      className="w-10 h-10"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-[#836EF9] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                      {religion.name}
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">
                      {religion.symbol}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getTierColor(religion.tier)}`}
                  >
                    T{religion.tier}
                  </span>
                </div>

                <div className="col-span-2 text-right font-black text-white">
                  {religion.influence.toLocaleString()}
                </div>

                <div className="col-span-2 text-right">
                  <span
                    className={`font-bold ${
                      religion.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {religion.change >= 0 ? "+" : ""}
                    {religion.change}%
                  </span>
                </div>

                <div className="col-span-1 text-right text-neutral-400 font-mono text-sm">
                  {religion.followers.toLocaleString()}
                </div>

                <div className="col-span-2 text-right font-bold text-amber-500">
                  {religion.tokenPrice.toFixed(2)} MON
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#836EF9]/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-[#836EF9] mb-1 drop-shadow-[0_0_10px_rgba(131,110,249,0.5)]">
              {religions.length}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Total Religions
            </p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-amber-500 mb-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              {religions
                .reduce((sum, r) => sum + r.followers, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Total Followers
            </p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-green-500 mb-1 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
              {religions
                .reduce((sum, r) => sum + r.influence, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Combined Influence
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
