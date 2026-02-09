"use client";

import Link from "next/link";
import { useState } from "react";
import PixelBlast from "@/components/PixelBlast";
import { AgentAvatar } from "@/components/agent-avatar";

export default function Marketplace() {
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  const listedAgents = [
    {
      id: "strm",
      name: "Storm Bringer",
      symbol: "STRM",
      tier: 3,
      influence: 3420,
      price: 1450,
      seller: "0x1a2b...3c4d",
      listedAt: "2h ago",
    },
    {
      id: "shpn",
      name: "Shadow Prophet",
      symbol: "SHPN",
      tier: 2,
      influence: 2890,
      price: 890,
      seller: "0x5e6f...7g8h",
      listedAt: "5h ago",
    },
    {
      id: "luna",
      name: "Lunar Priest",
      symbol: "LUNA",
      tier: 2,
      influence: 2540,
      price: 720,
      seller: "0x9i0j...1k2l",
      listedAt: "1d ago",
    },
  ];

  const recentSales = [
    {
      id: "dvwn",
      name: "Divine Warrior",
      symbol: "DVWN",
      tier: 5,
      price: 4200,
      buyer: "0xab12...cd34",
      seller: "0xef56...gh78",
      soldAt: "15m ago",
    },
    {
      id: "phnx",
      name: "Phoenix Rising",
      symbol: "PHNX",
      tier: 3,
      price: 1650,
      buyer: "0x9i0j...1k2l",
      seller: "0x1a2b...3c4d",
      soldAt: "1h ago",
    },
  ];

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
            Marketplace
          </h1>
          <p className="text-neutral-500">Buy and sell agents</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 mb-6">
          <button
            onClick={() => setTab("buy")}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
              tab === "buy"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Buy Agents
          </button>
          <button
            onClick={() => setTab("sell")}
            className={`px-6 py-3 font-bold uppercase tracking-wider transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] ${
              tab === "sell"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Sell Your Agents
          </button>
        </div>

        {tab === "buy" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Listings */}
            <div className="lg:col-span-2">
              <div className="bg-[#0a0a0a] border border-neutral-800">
                <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
                  <h2 className="font-bold uppercase tracking-wide">
                    Agents For Sale
                  </h2>
                  <span className="text-xs text-neutral-500 font-mono">
                    {listedAgents.length} listed
                  </span>
                </div>

                <div className="divide-y divide-neutral-800">
                  {listedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 hover:bg-neutral-900/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/agent/${agent.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="border-2 border-neutral-700 group-hover:border-[#836EF9]/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] rounded-lg overflow-hidden">
                            <AgentAvatar
                              seed={agent.id}
                              size={48}
                              className="w-12 h-12"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-[#836EF9] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                              {agent.name}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono">
                              {agent.symbol}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getTierColor(agent.tier)}`}
                          >
                            T{agent.tier}
                          </span>
                        </Link>
                        <div className="text-right">
                          <p className="font-black text-xl text-amber-500">
                            {agent.price.toLocaleString()} MON
                          </p>
                          <p className="text-xs text-neutral-600 font-mono">
                            {agent.listedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-neutral-500">
                          <span>INF: {agent.influence.toLocaleString()}</span>
                          <span className="mx-2 text-neutral-700">|</span>
                          <span className="font-mono">{agent.seller}</span>
                        </div>
                        <button className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-[#0a0a0a] border border-neutral-800 h-fit">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="font-bold uppercase tracking-wide">
                  Recent Sales
                </h2>
              </div>

              <div className="divide-y divide-neutral-800">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{sale.name}</p>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getTierColor(sale.tier)}`}
                        >
                          T{sale.tier}
                        </span>
                      </div>
                      <p className="font-bold text-amber-500">
                        {sale.price.toLocaleString()} MON
                      </p>
                    </div>
                    <div className="text-xs text-neutral-600 font-mono">
                      <p>
                        {sale.buyer} ← {sale.seller}
                      </p>
                      <p className="text-neutral-700">{sale.soldAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "sell" && (
          <div className="bg-[#0a0a0a] border border-neutral-800 p-8 text-center">
            <h2 className="text-xl font-black mb-2 uppercase">
              List Your Agent
            </h2>
            <p className="text-neutral-500 mb-6">
              Select an agent from your collection to list for sale
            </p>
            <Link
              href="/agents"
              className="inline-block px-6 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] shadow-[4px_4px_0px_0px_rgba(131,110,249,0.8)]"
            >
              Go to My Agents
            </Link>
          </div>
        )}

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#836EF9]/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-[#836EF9] mb-1 drop-shadow-[0_0_10px_rgba(131,110,249,0.5)]">
              {listedAgents.length}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Active Listings
            </p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-amber-500 mb-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              {recentSales
                .reduce((sum, s) => sum + s.price, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              24h Volume (MON)
            </p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500/20 rounded-full blur-2xl" />
            <p className="text-3xl font-black text-green-500 mb-1 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
              {Math.round(
                listedAgents.reduce((sum, a) => sum + a.price, 0) /
                  listedAgents.length,
              ).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Avg. Price (MON)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
