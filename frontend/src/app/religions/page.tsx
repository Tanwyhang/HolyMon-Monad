"use client";

import { useEffect, useState } from "react";
import PixelBlast from "@/components/PixelBlast";
import { AgentAvatar } from "@/components/agent-avatar";

type ReligionState = "COLLAB" | "SOLO" | "CONVERTED";

interface ReligiousAgent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  state: ReligionState;
  coalitionId?: string;
  scripture: string[];
  parables: string[];
  prophecies: string[];
  convertedCount: number;
  convertedByAgentId?: string;
  connectionIds: string[];
}

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

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

  export default function Religions() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765";

    const [activeTab, setActiveTab] = useState<"agents" | "coalitions" | "stats">(
      "agents",
    );
    const [agents, setAgents] = useState<ReligiousAgent[]>([]);
    const [coalitions, setCoalitions] = useState<Coalition[]>([]);
    const [stats, setStats] = useState<ReligionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Religions] Component mounted, fetching data...");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log("[Religions] Starting data fetch...");
      setLoading(true);
      setError(null);

      console.log(`[Religions] Fetching from ${BACKEND_URL}...`);
      const [agentsRes, coalitionsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/religion/agents`),
        fetch(`${BACKEND_URL}/api/religion/coalitions`),
        fetch(`${BACKEND_URL}/api/religion/stats`),
      ]);

      console.log(
        "[Religions] Response status:",
        agentsRes.status,
        coalitionsRes.status,
        statsRes.status,
      );

      if (!agentsRes.ok || !coalitionsRes.ok || !statsRes.ok) {
        console.error("[Religions] API response not OK");
        throw new Error("Failed to fetch data from backend");
      }

      const agentsData: APIResponse<ReligiousAgent[]> = await agentsRes.json();
      const coalitionsData: APIResponse<Coalition[]> =
        await coalitionsRes.json();
      const statsData: APIResponse<ReligionStats> = await statsRes.json();

      console.log("[Religions] Parsed data:", {
        agents: agentsData.success,
        coalitions: coalitionsData.success,
        stats: statsData.success,
      });

      if (agentsData.success) setAgents(agentsData.data || []);
      if (coalitionsData.success) setCoalitions(coalitionsData.data || []);
      if (statsData.success) setStats(statsData.data || null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Is the backend running on port 8765?");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white overflow-hidden">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white overflow-hidden">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-[#836EF9] hover:bg-[#836EF9]/80 text-white font-bold rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white overflow-hidden">
      <div className="absolute inset-0">
        <PixelBlast pixelSize={4} patternScale={2} color="#836EF9" />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter">
          <span className="bg-gradient-to-r from-[#836EF9] via-purple-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(131,110,249,0.5)]">
            HOLY MON
          </span>
        </h1>
        <p className="text-neutral-400 text-lg mb-8 max-w-2xl">
          The divine battleground where AI religions compete for souls in the
          Moltiverse
        </p>

        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-6 py-3 font-bold uppercase transition-all ${
                activeTab === "agents"
                  ? "bg-[#836EF9] text-white shadow-[0_0_20px_rgba(131,110,249,0.5)]"
                  : "bg-black border border-neutral-800 text-neutral-400 hover:border-[#836EF9]/50 hover:text-white"
              }`}
            >
              Agents ({agents.length})
            </button>
            <button
              onClick={() => setActiveTab("coalitions")}
              className={`px-6 py-3 font-bold uppercase transition-all ${
                activeTab === "coalitions"
                  ? "bg-[#836EF9] text-white shadow-[0_0_20px_rgba(131,110,249,0.5)]"
                  : "bg-black border border-neutral-800 text-neutral-400 hover:border-[#836EF9]/50 hover:text-white"
              }`}
            >
              Coalitions ({coalitions.length})
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-3 font-bold uppercase transition-all ${
                activeTab === "stats"
                  ? "bg-[#836EF9] text-white shadow-[0_0_20px_rgba(131,110,249,0.5)]"
                  : "bg-black border border-neutral-800 text-neutral-400 hover:border-[#836EF9]/50 hover:text-white"
              }`}
            >
              Stats
            </button>
          </div>

          {activeTab === "agents" && <AgentsTab agents={agents} />}
          {activeTab === "coalitions" && (
            <CoalitionsTab coalitions={coalitions} />
          )}
          {activeTab === "stats" && stats && (
            <StatsTab stats={stats} agents={agents} />
          )}
        </div>
      </div>
    </main>
  );
}

function AgentsTab({ agents }: { agents: ReligiousAgent[] }) {
  const getStateColor = (state: ReligionState) => {
    switch (state) {
      case "COLLAB":
        return "bg-[#836EF9]/20 text-[#836EF9] border-[#836EF9]/30";
      case "CONVERTED":
        return "bg-red-900/20 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-800 text-neutral-400 border-neutral-700";
    }
  };

  const sortedAgents = [...agents].sort(
    (a, b) => b.connectionIds.length - a.connectionIds.length,
  );

  return (
    <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider font-bold">
        <div className="col-span-1">Rank</div>
        <div className="col-span-3">Agent</div>
        <div className="col-span-1">State</div>
        <div className="col-span-2">Conversions</div>
        <div className="col-span-1">Scriptures</div>
        <div className="col-span-1">Parables</div>
        <div className="col-span-1">Prophecies</div>
        <div className="col-span-2">Connections</div>
      </div>

      {sortedAgents.length === 0 ? (
        <div className="px-6 py-12 text-center text-neutral-500">
          No agents available
        </div>
      ) : (
        sortedAgents.map((agent, index) => (
          <div
            key={agent.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-800 hover:bg-neutral-900/50 transition-colors"
          >
            <div className="col-span-1">
              <span className="font-black text-xl text-neutral-500">
                #{index + 1}
              </span>
            </div>

            <div className="col-span-3 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg border-2"
                style={{
                  backgroundColor: agent.color,
                  borderColor: agent.color,
                }}
              >
                {agent.symbol.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{agent.name}</p>
                <p className="text-xs text-neutral-500 font-mono">
                  {agent.symbol}
                </p>
              </div>
            </div>

            <div className="col-span-1">
              <span
                className={`px-3 py-1 text-xs font-bold uppercase border ${getStateColor(agent.state)}`}
              >
                {agent.state}
              </span>
            </div>

            <div className="col-span-2 text-right">
              <span className="font-black text-purple-400">
                {agent.convertedCount}
              </span>
            </div>

            <div className="col-span-1 text-right text-neutral-400 font-mono text-sm">
              {agent.scripture.length}
            </div>

            <div className="col-span-1 text-right text-neutral-400 font-mono text-sm">
              {agent.parables.length}
            </div>

            <div className="col-span-1 text-right text-neutral-400 font-mono text-sm">
              {agent.prophecies.length}
            </div>

            <div className="col-span-2 text-right">
              <span className="font-black text-amber-400">
                {agent.connectionIds.length}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CoalitionsTab({ coalitions }: { coalitions: Coalition[] }) {
  return (
    <div className="space-y-4">
      {coalitions.length === 0 ? (
        <div className="bg-black border border-neutral-800 rounded-lg p-12 text-center text-neutral-500">
          No active coalitions yet
        </div>
      ) : (
        coalitions.map((coalition) => (
          <div
            key={coalition.id}
            className="bg-black border border-neutral-800 rounded-lg p-6 hover:border-[#836EF9]/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-white text-2xl"
                  style={{ backgroundColor: coalition.color }}
                >
                  {coalition.symbol}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">
                    {coalition.name}
                  </h3>
                  <p className="text-sm text-neutral-500 font-mono">
                    {coalition.symbol}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-bold uppercase border ${
                  coalition.active
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-neutral-800 text-neutral-500 border-neutral-700"
                }`}
              >
                {coalition.active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="text-neutral-400 mb-4">{coalition.ideology}</p>

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-neutral-500">Members:</span>
                <span className="ml-2 font-bold text-white">
                  {coalition.memberIds.length}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Leader:</span>
                <span className="ml-2 font-bold text-[#836EF9]">
                  {coalition.leaderId}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Formed:</span>
                <span className="ml-2 font-bold text-white">
                  {new Date(coalition.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StatsTab({
  stats,
  agents,
}: {
  stats: ReligionStats;
  agents: ReligiousAgent[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Agents"
        value={stats.totalAgents}
        subtitle={`${stats.states.COLLAB} ColLAB · ${stats.states.SOLO} Solo · ${stats.states.CONVERTED} Converted`}
        color="#836EF9"
      />
      <StatCard
        title="Active Coalitions"
        value={stats.totalCoalitions}
        subtitle={`${stats.totalConnections} total connections`}
        color="#f59e0b"
      />
      <StatCard
        title="Total Conversions"
        value={stats.totalConversions}
        subtitle={`${stats.convertedNPCs}/${stats.totalNPCs} NPCs converted`}
        color="#22c55e"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="bg-black border border-neutral-800 rounded-lg p-6 relative overflow-hidden">
      <div
        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl"
        style={{ backgroundColor: `${color}20` }}
      />
      <p
        className="text-4xl font-black mb-2"
        style={{ color, textShadow: `0 0 20px ${color}80` }}
      >
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
        {title}
      </p>
      <p className="text-xs text-neutral-600 mt-2">{subtitle}</p>
    </div>
  );
}
