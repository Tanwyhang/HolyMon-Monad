"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelBlast from "@/components/PixelBlast";
import AgentSelectionModal from "@/components/agent-selection-modal";
import { useAccount } from "wagmi";
import type { HolyMonAgent } from "@/types/agent";

export default function Arena() {
  const router = useRouter();
  const { address } = useAccount();
  const [showAgentModal, setShowAgentModal] = useState(false);

  const handleDeployAgents = async (selectedAgents: HolyMonAgent[]) => {
    const response = await fetch("/api/tournament/deploy-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentIds: selectedAgents.map((a) => a.id),
        address,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to deploy agents");
    }

    // Navigate to 3D arena after successful deployment
    router.push("/tournament-arena");
  };
  const activeTournaments = [
    {
      id: "weekly-1",
      name: "Weekly Championship",
      participants: 24,
      round: 2,
      totalRounds: 5,
      status: "In Progress",
      prize: 5000,
      endsIn: "2d 14h",
    },
    {
      id: "daily-1",
      name: "Daily Skirmish",
      participants: 16,
      round: 1,
      totalRounds: 3,
      status: "Starting Soon",
      prize: 500,
      endsIn: "6h 30m",
    },
  ];

  const upcomingTournaments = [
    {
      id: "grand-1",
      name: "Grand Divine Tournament",
      maxParticipants: 64,
      registered: 42,
      startsIn: "3d 8h",
      prize: 25000,
      minTier: 3,
    },
    {
      id: "rookie-1",
      name: "Rookie Trials",
      maxParticipants: 32,
      registered: 18,
      startsIn: "1d 2h",
      prize: 1000,
      minTier: 1,
    },
  ];

  const recentBattles = [
    {
      id: "b1",
      agent1: "Divine Warrior",
      agent2: "Ancient Oracle",
      winner: "Divine Warrior",
      tournament: "Weekly Championship",
      time: "15m ago",
    },
    {
      id: "b2",
      agent1: "Celestial Guardian",
      agent2: "Storm Bringer",
      winner: "Storm Bringer",
      tournament: "Weekly Championship",
      time: "32m ago",
    },
    {
      id: "b3",
      agent1: "Mystic Sage",
      agent2: "Shadow Prophet",
      winner: "Mystic Sage",
      tournament: "Daily Skirmish",
      time: "1h ago",
    },
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">
            Arena
          </h1>
          <p className="text-neutral-500">Compete in tournaments and battles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active & Upcoming Tournaments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Tournaments */}
            <div className="bg-[#0a0a0a] border border-neutral-800">
              <div className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
                <h2 className="font-bold uppercase tracking-wide">
                  Active Tournaments
                </h2>
                <span className="text-xs text-green-500 font-mono">LIVE</span>
              </div>

              <div className="p-4 space-y-4">
                {activeTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="border border-neutral-800 hover:border-[#836EF9]/30 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] p-4 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#836EF9]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity [transition-timing-function:cubic-bezier(0,.4,.01,.99)]" />

                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {tournament.participants} agents competing
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase ${
                          tournament.status === "In Progress"
                            ? "bg-green-900/50 text-green-400"
                            : "bg-amber-900/50 text-amber-400"
                        }`}
                      >
                        {tournament.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4 relative z-10">
                      <div>
                        <p className="text-neutral-600 text-xs uppercase">
                          Round
                        </p>
                        <p className="font-bold text-white">
                          {tournament.round} / {tournament.totalRounds}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-xs uppercase">
                          Prize Pool
                        </p>
                        <p className="font-bold text-amber-500">
                          {tournament.prize.toLocaleString()} MON
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-xs uppercase">
                          Ends In
                        </p>
                        <p className="font-bold text-white font-mono">
                          {tournament.endsIn}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAgentModal(true)}
                      className="w-full py-2 bg-[#836EF9] hover:bg-[#6b55d7] text-white text-sm font-bold uppercase tracking-wider transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
                    >
                      🎮 Enter 3D Arena
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tournaments */}
            <div className="bg-[#0a0a0a] border border-neutral-800">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="font-bold uppercase tracking-wide">
                  Upcoming Tournaments
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {upcomingTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="border border-neutral-800 hover:border-neutral-600 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {tournament.registered}/{tournament.maxParticipants}{" "}
                          registered
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-neutral-800 text-neutral-400 text-xs font-bold uppercase">
                        Min T{tournament.minTier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-neutral-600 text-xs uppercase">
                          Prize Pool
                        </p>
                        <p className="font-bold text-amber-500">
                          {tournament.prize.toLocaleString()} MON
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-xs uppercase">
                          Starts In
                        </p>
                        <p className="font-bold text-white font-mono">
                          {tournament.startsIn}
                        </p>
                      </div>
                    </div>

                    <button className="w-full py-2 bg-white text-black font-bold uppercase tracking-wider hover:bg-amber-500 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]">
                      Register Agent
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Battles */}
          <div className="bg-[#0a0a0a] border border-neutral-800 h-fit">
            <div className="border-b border-neutral-800 px-4 py-3">
              <h2 className="font-bold uppercase tracking-wide">
                Recent Battles
              </h2>
            </div>

            <div className="divide-y divide-neutral-800">
              {recentBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="p-4 hover:bg-neutral-900/50 transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-bold text-sm ${battle.winner === battle.agent1 ? "text-green-500" : "text-neutral-500"}`}
                    >
                      {battle.agent1}
                    </span>
                    <span className="text-neutral-700 text-xs font-bold">
                      VS
                    </span>
                    <span
                      className={`font-bold text-sm ${battle.winner === battle.agent2 ? "text-green-500" : "text-neutral-500"}`}
                    >
                      {battle.agent2}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>{battle.tournament}</span>
                    <span className="font-mono">{battle.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-neutral-800">
              <Link
                href="#"
                className="text-sm text-neutral-500 hover:text-[#836EF9] transition-colors [transition-timing-function:cubic-bezier(0,.4,.01,.99)] font-bold uppercase tracking-wider"
              >
                View All Battles →
              </Link>
            </div>
          </div>
        </div>
      </div>
      <AgentSelectionModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onDeploy={handleDeployAgents}
      />
    </main>
  );
}
