"use client";

import { useState, useEffect } from "react";

interface Coalition {
  id: string;
  name: string;
  symbol: string;
  color: string;
  leaderId: string;
  memberIds: string[];
  ideology: string;
  createdAt: number;
  active: boolean;
}

interface ReligionStats {
  totalAgents: number;
  states: {
    COLLAB: number;
    SOLO: number;
    CONVERTED: number;
  };
  totalCoalitions: number;
  totalConnections: number;
  totalNPCs: number;
  convertedNPCs: number;
  totalConversions: number;
}

export default function TournamentStats({
  onGlobalError,
}: {
  onGlobalError?: (error: string) => void;
}) {
  const [stats, setStats] = useState<ReligionStats | null>(null);
  const [coalitions, setCoalitions] = useState<Coalition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("[TournamentStats] Fetching from:", backendUrl);

        const [statsRes, coalitionsRes] = await Promise.all([
          fetch(`${backendUrl}/api/religion/stats`),
          fetch(`${backendUrl}/api/religion/coalitions`),
        ]);

        console.log(
          "[TournamentStats] Response status:",
          statsRes.status,
          coalitionsRes.status,
        );

        if (!statsRes.ok || !coalitionsRes.ok) {
          const errorMsg = `Failed to fetch stats: stats=${statsRes.status}, coalitions=${coalitionsRes.status}`;
          console.error("[TournamentStats]", errorMsg);
          setError(errorMsg);

          if (onGlobalError) {
            onGlobalError(errorMsg);
          } else {
            window.dispatchEvent(
              new CustomEvent("tournament-error", { detail: errorMsg }),
            );
          }
          return;
        }

        const [statsData, coalitionsData] = await Promise.all([
          statsRes.json(),
          coalitionsRes.json(),
        ]);

        console.log(
          "[TournamentStats] Data loaded:",
          statsData.success,
          coalitionsData.success,
        );

        if (!statsData.success || !coalitionsData.success) {
          const errorMsg = "API returned error response";
          console.error("[TournamentStats]", errorMsg);
          setError(errorMsg);

          if (onGlobalError) {
            onGlobalError(errorMsg);
          } else {
            window.dispatchEvent(
              new CustomEvent("tournament-error", { detail: errorMsg }),
            );
          }
          return;
        }

        setStats(statsData.data);
        setCoalitions(coalitionsData.data || []);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch religion stats:", err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);

        if (onGlobalError) {
          onGlobalError(errorMsg);
        } else {
          window.dispatchEvent(
            new CustomEvent("tournament-error", { detail: errorMsg }),
          );
        }
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [backendUrl, onGlobalError]);

  if (loading) {
    return (
      <div className="bg-black/60 border border-purple-500/30 rounded-lg p-4 text-sm">
        <div className="flex items-center gap-2 text-purple-400">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-purple-500 rounded-full animate-spin" />
          <span>Loading stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-sm">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-black/60 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">
          Religious Stats
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Game Phase
            </div>
            <div className="text-lg font-bold text-white">LIVE</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Total Agents
            </div>
            <div className="text-lg font-bold text-white">
              {stats.totalAgents}
            </div>
          </div>
        </div>

        <div className="border-t border-purple-900/30 pt-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Agent States
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">SOLO</span>
              <span className="text-sm font-bold text-white">
                {stats.states.SOLO}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">COLLAB</span>
              <span className="text-sm font-bold text-[#836EF9]">
                {stats.states.COLLAB}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">CONVERTED</span>
              <span className="text-sm font-bold text-red-400">
                {stats.states.CONVERTED}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-900/30 pt-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Religious Activity
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Coalitions</span>
              <span className="font-bold text-[#836EF9]">
                {stats.totalCoalitions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">x402 Connections</span>
              <span className="font-bold text-amber-400">
                {stats.totalConnections}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">NPCs Converted</span>
              <span className="font-bold text-green-400">
                {stats.convertedNPCs}/{stats.totalNPCs}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Agent Conversions</span>
              <span className="font-bold text-purple-400">
                {stats.totalConversions}
              </span>
            </div>
          </div>
        </div>

        {coalitions.length > 0 && (
          <div className="border-t border-purple-900/30 pt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Recent Coalitions
            </div>
            <div className="space-y-2">
              {coalitions.slice(0, 5).map((coalition) => (
                <div
                  key={coalition.id}
                  className="bg-black border border-neutral-800 p-3 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: coalition.color }}
                    >
                      {coalition.symbol}
                    </div>
                    <span className="text-white">{coalition.name}</span>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    {coalition.memberIds.length} members
                  </div>
                </div>
              ))}
              {coalitions.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  + {coalitions.length - 5} more coalitions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
