"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <main className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      {/* BRUTALIST VIDEO BANNER */}
      <div className="relative w-full h-[50vh] border-b-8 border-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/banneranim.webm" type="video/webm" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-8xl md:text-9xl font-black uppercase tracking-tighter text-white mb-4 drop-shadow-[8px_8px_0_#000]">
            Arena
          </h1>
          <p className="text-xl md:text-2xl font-bold uppercase tracking-widest bg-black px-4 py-2">
            Compete. Conquer. Prevail.
          </p>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active & Upcoming Tournaments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Tournaments */}
            <div>
              <div className="border-4 border-white bg-white mb-6">
                <div className="bg-black text-white px-6 py-2 text-2xl font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Active Tournaments</span>
                  <span className="bg-red-600 px-4 py-1 text-sm font-bold uppercase">
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {activeTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="border-4 border-white bg-black p-6 hover:bg-white hover:text-black transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                          {tournament.name}
                        </h3>
                        <p className="text-lg font-bold uppercase">
                          {tournament.participants} Agents
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 text-xl font-black uppercase border-2 ${
                          tournament.status === "In Progress"
                            ? "bg-green-500 border-green-500 text-black"
                            : "bg-amber-500 border-amber-500 text-black"
                        }`}
                      >
                        {tournament.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="border-2 border-white p-3">
                        <p className="text-sm font-bold uppercase mb-1">
                          Round
                        </p>
                        <p className="text-4xl font-black">
                          {tournament.round}/{tournament.totalRounds}
                        </p>
                      </div>
                      <div className="border-2 border-amber-500 p-3 bg-amber-500/10">
                        <p className="text-sm font-bold uppercase mb-1">
                          Prize
                        </p>
                        <p className="text-4xl font-black text-amber-500">
                          {tournament.prize.toLocaleString()} MON
                        </p>
                      </div>
                      <div className="border-2 border-white p-3">
                        <p className="text-sm font-bold uppercase mb-1">
                          Ends
                        </p>
                        <p className="text-2xl font-black uppercase">
                          {tournament.endsIn}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAgentModal(true)}
                      className="w-full py-4 bg-white text-black text-xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors border-4 border-white"
                    >
                      Enter 3D Arena
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tournaments */}
            <div>
              <div className="border-4 border-white bg-white mb-6">
                <div className="bg-black text-white px-6 py-2 text-2xl font-black uppercase tracking-wider">
                  Upcoming Tournaments
                </div>
              </div>

              <div className="space-y-4">
                {upcomingTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="border-4 border-white bg-black p-6 hover:bg-white hover:text-black transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                          {tournament.name}
                        </h3>
                        <p className="text-lg font-bold uppercase">
                          {tournament.registered}/{tournament.maxParticipants} Registered
                        </p>
                      </div>
                      <span className="px-4 py-2 text-xl font-black uppercase border-2 border-white bg-white text-black">
                        T{tournament.minTier}+
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="border-2 border-amber-500 p-3 bg-amber-500/10">
                        <p className="text-sm font-bold uppercase mb-1">
                          Prize
                        </p>
                        <p className="text-4xl font-black text-amber-500">
                          {tournament.prize.toLocaleString()} MON
                        </p>
                      </div>
                      <div className="border-2 border-white p-3">
                        <p className="text-sm font-bold uppercase mb-1">
                          Starts
                        </p>
                        <p className="text-2xl font-black uppercase">
                          {tournament.startsIn}
                        </p>
                      </div>
                    </div>

                    <button className="w-full py-4 bg-white text-black text-xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors border-4 border-white">
                      Register Agent
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Battles */}
          <div>
            <div className="border-4 border-white bg-white mb-6">
              <div className="bg-black text-white px-6 py-2 text-2xl font-black uppercase tracking-wider">
                Recent Battles
              </div>
            </div>

            <div className="border-4 border-white bg-black divide-y-4 divide-white">
              {recentBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="p-6 hover:bg-white hover:text-black transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xl font-black uppercase ${
                        battle.winner === battle.agent1
                          ? "text-green-500"
                          : "opacity-50"
                      }`}
                    >
                      {battle.agent1}
                    </span>
                    <span className="text-3xl font-black uppercase px-4">
                      VS
                    </span>
                    <span
                      className={`text-xl font-black uppercase ${
                        battle.winner === battle.agent2
                          ? "text-green-500"
                          : "opacity-50"
                      }`}
                    >
                      {battle.agent2}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold uppercase">
                    <span>{battle.tournament}</span>
                    <span className="font-mono">{battle.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-4 border-white bg-black mt-4 p-4">
              <Link
                href="#"
                className="block text-center text-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors py-2"
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
