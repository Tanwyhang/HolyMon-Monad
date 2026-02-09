"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentAvatar } from "@/components/agent-avatar";
import { MarketChart } from "@/components/market-chart";
import PixelBlast from "@/components/PixelBlast";
import { WrapMon } from "@/components/wrap-mon";
import { StakeMon } from "@/components/stake-mon";
import { useAccount, useBalance } from "wagmi";

export default function Dashboard() {
  const [activeWalletTab, setActiveWalletTab] = useState<"wrap" | "stake">(
    "wrap",
  );
  const { address, isConnected } = useAccount();
  const { data: monBalance } = useBalance({ address });

  const liquidMon = monBalance?.value
    ? (Number(monBalance.value) / 1e18).toFixed(2)
    : "0.00";

  const walletStats = [
    { label: "LIQUID MON", value: isConnected ? liquidMon : "0.00" },
    { label: "STAKED", value: "0" },
    { label: "TOTAL INFLUENCE", value: "0" },
    { label: "GLOBAL RANK", value: "N/A" },
  ];

  const userAgents = [
    {
      id: "dvwn",
      name: "Divine Warrior",
      type: "Paladin",
      tier: 3,
      status: "IDLE",
      influence: 2450,
    },
    {
      id: "orcl",
      name: "Sacred Oracle",
      type: "Seer",
      tier: 2,
      status: "ARENA",
      influence: 1200,
    },
    {
      id: "void",
      name: "Void Walker",
      type: "Rogue",
      tier: 1,
      status: "IDLE",
      influence: 800,
    },
    {
      id: "flmx",
      name: "Flame Mage",
      type: "Mage",
      tier: 2,
      status: "IDLE",
      influence: 1850,
    },
    {
      id: "shdk",
      name: "Shadow Knight",
      type: "Assassin",
      tier: 3,
      status: "ARENA",
      influence: 3200,
    },
    {
      id: "frst",
      name: "Frost Giant",
      type: "Tank",
      tier: 1,
      status: "IDLE",
      influence: 650,
    },
    {
      id: "stmw",
      name: "Storm Witch",
      type: "Caster",
      tier: 2,
      status: "IDLE",
      influence: 1400,
    },
  ];

  const tournaments = [
    {
      id: "weekly-gauntlet",
      name: "Weekly Gauntlet",
      prize: "5,000 MON",
      fee: "100",
      players: "12/32",
      status: "OPEN",
    },
    {
      id: "daily-skirmish",
      name: "Daily Skirmish",
      prize: "500 MON",
      fee: "10",
      players: "8/16",
      status: "OPEN",
    },
    {
      id: "high-roller",
      name: "High Roller",
      prize: "25,000 MON",
      fee: "1,000",
      players: "4/8",
      status: "LOCKED",
    },
  ];

  const chartData1 = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 1000 + Math.random() * 500 - 250 + i * 20,
  }));

  const chartData2 = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 800 + Math.random() * 300 - 150 - i * 10,
  }));

  const chartData3 = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 400 + Math.random() * 100 - 50,
  }));

  // UPDATED COLORS: Fun/Cyber aesthetic (Neon Pink, Cyber Yellow, Bright Cyan)
  const marketTrends = [
    {
      symbol: "DVWN",
      name: "Divine Warrior",
      price: "1,240",
      change: "+5.4%",
      data: chartData1,
      color: "#ff00ff",
    }, // Magenta
    {
      symbol: "ORCL",
      name: "Sacred Oracle",
      price: "890",
      change: "-2.1%",
      data: chartData2,
      color: "#facc15",
    }, // Yellow
    {
      symbol: "VOID",
      name: "Void Walker",
      price: "450",
      change: "+1.2%",
      data: chartData3,
      color: "#22d3ee",
    }, // Cyan
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
        {/* Vignette Mask */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* SECTION 1: WALLET SUMMARY (Top Bar) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {walletStats.map((stat, i) => (
            <div
              key={i}
              className="bg-black p-6 flex flex-col justify-between h-32 relative overflow-hidden group"
            >
              {/* Purple Glow Particle (Always Purple) */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-30 bg-[#836EF9]" />

              <div className="relative z-10">
                <div className="text-xs text-neutral-500 font-bold tracking-widest mb-2 uppercase">
                  {stat.label}
                </div>
                <div className="text-3xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(131,110,249,0.9)]">
                  {stat.value}
                </div>
              </div>

              {/* Big Monad Logo Watermark */}
              {(stat.label.includes("MON") ||
                stat.label.includes("STAKED")) && (
                <img
                  src="https://unavatar.io/twitter/monad_xyz"
                  alt="Monad Logo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
                />
              )}
            </div>
          ))}
        </div>

        {/* SECTION 2: WRAP/STAKE INTERFACE */}
        <div className="relative bg-[#0f0a1a] border-2 border-[#836EF9] overflow-hidden shadow-[0_0_30px_rgba(131,110,249,0.3)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#836EF9]/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#836EF9]/40" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#836EF9]/40" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#836EF9]/40" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#836EF9]/40" />

          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white tracking-wide uppercase">
                MON Operations
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveWalletTab("wrap")}
                  className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
                    activeWalletTab === "wrap"
                      ? "bg-[#836EF9] text-white"
                      : "bg-neutral-900 text-neutral-500 hover:text-white"
                  }`}
                >
                  Wrap/Unwrap
                </button>
                <button
                  onClick={() => setActiveWalletTab("stake")}
                  className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
                    activeWalletTab === "stake"
                      ? "bg-[#836EF9] text-white"
                      : "bg-neutral-900 text-neutral-500 hover:text-white"
                  }`}
                >
                  Stake
                </button>
              </div>
            </div>

            {isConnected ? (
              <div>
                {activeWalletTab === "wrap" ? <WrapMon /> : <StakeMon />}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <div className="text-sm font-bold uppercase tracking-wider mb-2">
                  Connect Your Wallet
                </div>
                <div className="text-xs">
                  Connect to wrap, unwrap, and stake MON tokens
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: FEATURED TOURNAMENT HERO */}
        <div className="relative group border-2 border-neutral-700 bg-black">
          {/* Hero Banner */}
          <div className="relative">
            <img
              src="/holybanner.png"
              alt={tournaments[0].name}
              className="w-full h-40 md:h-48 object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1.5 font-bold text-xs uppercase tracking-widest ${
                  tournaments[0].status === "OPEN"
                    ? "bg-green-500 text-black"
                    : "bg-neutral-700 text-neutral-400"
                }`}
              >
                {tournaments[0].status === "OPEN"
                  ? "LIVE"
                  : tournaments[0].status}
              </span>
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
                <div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                    Featured
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    {tournaments[0].name}
                  </h2>

                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">
                        Prize
                      </div>
                      <div className="text-lg font-black text-amber-500">
                        {tournaments[0].prize}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-neutral-700" />
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">
                        Entry
                      </div>
                      <div className="text-lg font-black text-white">
                        {tournaments[0].fee} MON
                      </div>
                    </div>
                    <div className="w-px h-8 bg-neutral-700" />
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">
                        Players
                      </div>
                      <div className="text-lg font-black text-white">
                        {tournaments[0].players}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="px-6 py-3 bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)] whitespace-nowrap">
                  JOIN BATTLE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN 1: MY SQUAD (Width: 5/12) */}
          <div className="lg:col-span-5">
            <div className="relative bg-[#0f0a1a] border-2 border-[#836EF9] p-5 overflow-hidden shadow-[0_0_30px_rgba(131,110,249,0.3)]">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#836EF9]/10 rounded-full blur-3xl" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#836EF9]/40" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#836EF9]/40" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#836EF9]/40" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#836EF9]/40" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white tracking-wide uppercase">
                  My Squad
                </h2>
                <Link
                  href="/create-agent"
                  className="text-xs bg-[#836EF9] text-white px-3 py-1.5 font-bold hover:bg-[#9d8afc] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] uppercase tracking-wider"
                >
                  + NEW
                </Link>
              </div>

              {/* Squad Grid */}
              <div className="relative z-10 grid grid-cols-4 gap-3">
                {userAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.id}`}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      {/* Glow on hover */}
                      <div className="absolute inset-0 bg-[#836EF9] rounded-lg blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 [transition-timing-function:cubic-bezier(0,.4,.01,.99)] scale-110" />

                      {/* Avatar frame */}
                      <div className="relative bg-black p-1 border-2 border-neutral-700 group-hover:border-[#836EF9] transition-all duration-300 [transition-timing-function:cubic-bezier(0,.4,.01,.99)] rounded-lg overflow-hidden group-hover:scale-105">
                        <AgentAvatar
                          seed={agent.id}
                          size={80}
                          className="w-12 h-12 rounded-md"
                        />
                      </div>

                      {/* Status indicator */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a12] ${
                          agent.status === "ARENA"
                            ? "bg-blue-500"
                            : "bg-neutral-600"
                        }`}
                      />

                      {/* Tier badge */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-black text-black border-2 border-[#0a0a12]">
                        {agent.tier}
                      </div>
                    </div>

                    <div className="text-[10px] font-bold text-neutral-400 group-hover:text-white transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] text-center truncate w-full">
                      {agent.name.split(" ")[0]}
                    </div>
                  </Link>
                ))}

                {/* Add New Agent */}
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

              {/* Footer stats */}
              <div className="relative z-10 mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500">
                <div className="flex items-center gap-3">
                  <span>{userAgents.length} Active</span>
                  <span>
                    {userAgents.filter((a) => a.status === "ARENA").length} In
                    Battle
                  </span>
                </div>
                <div className="text-[#836EF9] font-mono">
                  {userAgents
                    .reduce((sum, a) => sum + a.influence, 0)
                    .toLocaleString()}{" "}
                  PWR
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: MARKET TRENDS (Width: 7/12) */}
          <div className="lg:col-span-7">
            <div className="bg-[#1a1a1a] border border-neutral-800 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Market
                </h2>
                <Link
                  href="/marketplace"
                  className="text-[10px] text-neutral-500 hover:text-white transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] uppercase tracking-wider"
                >
                  View All
                </Link>
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto max-h-64">
                {[...marketTrends, ...marketTrends, ...marketTrends].map(
                  (m, idx) => (
                    <div
                      key={`${m.symbol}-${idx}`}
                      className="px-4 py-2.5 border-b border-neutral-800/50 last:border-b-0 hover:bg-neutral-900/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] flex items-center gap-4 cursor-pointer"
                    >
                      <div className="text-[10px] text-neutral-600 font-mono w-4">
                        {idx + 1}
                      </div>

                      <div className="flex-shrink-0 w-20">
                        <div
                          className="font-bold text-sm text-white"
                          style={{
                            filter: `drop-shadow(0 0 4px ${m.color}99)`,
                          }}
                        >
                          {m.symbol}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {m.name}
                        </div>
                      </div>

                      <div className="flex-1 h-8">
                        <MarketChart
                          data={m.data}
                          color={m.color}
                          height={32}
                        />
                      </div>

                      <div className="flex-shrink-0 text-right w-16">
                        <div className="text-sm font-bold text-white font-mono">
                          {m.price}
                        </div>
                        <div
                          className={`text-[10px] font-mono ${m.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}
                        >
                          {m.change}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: OTHER TOURNAMENTS - Horizontal Card Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/50">
            <h2 className="text-lg font-bold text-white tracking-wide">
              MORE BATTLES
            </h2>
            <Link
              href="/arena"
              className="text-xs text-neutral-500 hover:text-white transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] uppercase tracking-wider"
            >
              VIEW ALL
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.slice(1).map((t) => (
              <div
                key={t.id}
                className="relative group overflow-hidden border border-neutral-800 bg-[#0a0a0a] hover:border-neutral-600 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
              >
                {/* Compact Banner */}
                <div className="h-24 w-full relative overflow-hidden">
                  <img
                    src="/holybanner.png"
                    alt={t.name}
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity [transition-timing-function:cubic-bezier(0,.4,.01,.99)] grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 font-bold text-[10px] uppercase tracking-wider ${
                        t.status === "OPEN"
                          ? "bg-green-500 text-black"
                          : "bg-neutral-700 text-neutral-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3 group-hover:text-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                    {t.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <div>
                      <div className="text-[10px] text-neutral-600 uppercase">
                        Prize
                      </div>
                      <div className="text-amber-500 font-bold">{t.prize}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-600 uppercase">
                        Fee
                      </div>
                      <div className="text-white font-bold">{t.fee} MON</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-600 uppercase">
                        Slots
                      </div>
                      <div className="text-white font-mono">{t.players}</div>
                    </div>
                  </div>

                  <button
                    disabled={t.status === "LOCKED"}
                    className={`w-full px-4 py-2 font-bold uppercase tracking-wider text-xs transition-all [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
                      t.status === "LOCKED"
                        ? "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                        : "bg-white text-black hover:bg-amber-500 shadow-[3px_3px_0px_0px_rgba(131,110,249,0.6)]"
                    }`}
                  >
                    {t.status === "LOCKED" ? "LOCKED" : "JOIN →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
