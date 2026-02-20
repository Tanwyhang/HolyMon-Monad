"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import TournamentErrorBoundary from "@/components/tournament-error-boundary";
import type { HolyMonAgent } from "@/types/agent";
import { useState, useEffect } from "react";

// Dynamically import components that use WalletConnect to avoid SSR issues
const LiveFaithTheater = dynamic(
  () => import("@/components/live-faith-theater").then((m) => m.default),
  {
    ssr: false,
  },
);

const TournamentStats = dynamic(
  () => import("@/components/tournament-stats").then((m) => m.default),
  {
    ssr: false,
  },
);

const AgentSelectionModal = dynamic(
  () => import("@/components/agent-selection-modal").then((m) => m.default),
  {
    ssr: false,
  },
);

// Simple tournament arena content without wallet functionality
function TournamentArenaContent() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      setGlobalError((event as any).detail);
    };

    window.addEventListener("tournament-error", handleGlobalError);

    return () => {
      window.removeEventListener("tournament-error", handleGlobalError);
    };
  }, []);

  const handleDeployAgents = async (selectedAgents: HolyMonAgent[]) => {
    console.log("Deploying agents:", selectedAgents);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
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
          <div className="flex-1 relative">
            <LiveFaithTheater onGlobalError={setGlobalError} />
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

export default function TournamentArena() {
  return <TournamentArenaContent />;
}
