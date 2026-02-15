"use client";

import Link from "next/link";
import LiveFaithTheater from "@/components/live-faith-theater";
import TournamentStats from "@/components/tournament-stats";
import TournamentErrorBoundary from "@/components/tournament-error-boundary";
import AgentSelectionModal from "@/components/agent-selection-modal";
import { useAccount } from "wagmi";
import type { HolyMonAgent } from "@/types/agent";
import { useState, useEffect } from "react";

export default function TournamentArena() {
  const { address, isConnected } = useAccount();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    // Listen for global errors from components
    const handleGlobalError = (event: CustomEvent) => {
      setGlobalError((event as any).detail);
    };

    window.addEventListener("tournament-error", handleGlobalError);

    return () => {
      window.removeEventListener("tournament-error", handleGlobalError);
    };
  }, []);

  const handleDeployAgents = async (selectedAgents: HolyMonAgent[]) => {
    const response = await fetch("/api/tournament/deploy-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agents: selectedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          symbol: a.symbol,
          description: a.description,
          color: a.visualTraits?.colorScheme || '#836EF9',
        })),
        address,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to deploy agents");
    }

    return data;
  };

  if (globalError) {
    return (
      <main className="h-screen bg-black text-white font-sans flex items-center justify-center p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-4xl font-black mb-4 text-amber-500">
              Connection Error
            </h1>
            <p className="text-xl text-neutral-400 mb-6">{globalError}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setGlobalError(null)}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
              >
                Dismiss
              </button>
              <Link
                href="/"
                className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <TournamentErrorBoundary>
        <main className="h-screen bg-black text-white font-sans flex flex-col overflow-hidden">
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => setShowAgentModal(true)}
              disabled={!isConnected}
              className={`
                px-6 py-3 font-bold rounded-lg border-4 border-black transition-all duration-200
                ${
                  isConnected
                    ? "bg-amber-500 hover:bg-amber-400 hover:translate-x-1 hover:translate-y-1 hover:shadow-2xl"
                    : "bg-gray-700 cursor-not-allowed opacity-50"
                }
              `}
            >
              {isConnected ? "🏟️ Join Arena" : "🔌 Connect Wallet"}
            </button>
          </div>

          <div className="flex-1 relative">
            <LiveFaithTheater onGlobalError={setGlobalError} />
          </div>
          <div className="absolute top-4 right-4 w-80 pointer-events-auto">
            <TournamentStats onGlobalError={setGlobalError} />
          </div>
        </main>
      </TournamentErrorBoundary>

      <AgentSelectionModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onDeploy={handleDeployAgents}
      />
    </>
  );
}
