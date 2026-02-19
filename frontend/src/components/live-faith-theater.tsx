"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import AgentNetwork3D from "./network-3d";

// Types matching Backend
interface TournamentAgent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  avatar: string;
  stakedAmount: string; // BigInt comes as string
  followers: number;
  status: "IDLE" | "TALKING" | "BATTLE";
  lastAction: number;
}

interface Interaction {
  id: string;
  type: "DEBATE" | "CONVERT" | "ALLIANCE" | "BETRAYAL" | "MIRACLE";
  agent1Id: string;
  agent2Id: string;
  messages: Array<{
    senderId: string;
    text: string;
    timestamp: number;
  }>;
  winnerId?: string;
  timestamp: number;
}

interface GameState {
  phase: "GENESIS" | "CRUSADE" | "APOCALYPSE" | "RESOLUTION";
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

export default function LiveFaithTheater({
  onGlobalError,
}: {
  onGlobalError?: (error: string) => void;
}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [agents, setAgents] = useState<TournamentAgent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765";
    const wsUrl =
      backendUrl.replace("http://", "ws://").replace("https://", "wss://") +
      "/tournament/ws";

    console.log("[LiveFaithTheater] Connecting to WebSocket:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Tournament Arena");
        setConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "INIT" || data.type === "UPDATE") {
            setAgents(data.payload.agents);
            setGameState(data.payload.gameState);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = (event) => {
        console.log(
          "Disconnected from Tournament Arena",
          event.code,
          event.reason,
        );
        setConnected(false);

        if (event.code !== 1000) {
          const errorMsg = `WebSocket connection closed (Code: ${event.code}). ${event.reason || "No reason provided."}`;
          setConnectionError(errorMsg);
          console.error("[LiveFaithTheater]", errorMsg);

          if (onGlobalError) {
            onGlobalError(errorMsg);
          } else {
            window.dispatchEvent(
              new CustomEvent("tournament-error", { detail: errorMsg }),
            );
          }
        }
      };

      ws.onerror = (error) => {
        console.error("[LiveFaithTheater] WebSocket error:", error);
        const errorMsg = `Failed to connect to tournament server. Is the backend running?`;
        setConnectionError(errorMsg);

        if (onGlobalError) {
          onGlobalError(errorMsg);
        } else {
          window.dispatchEvent(
            new CustomEvent("tournament-error", { detail: errorMsg }),
          );
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error("[LiveFaithTheater] Failed to create WebSocket:", error);
      const errorMsg = `Failed to initialize WebSocket connection ${error instanceof Error ? error.message : "Unknown error"}`;
      setConnectionError(errorMsg);

      if (onGlobalError) {
        onGlobalError(errorMsg);
      } else {
        window.dispatchEvent(
          new CustomEvent("tournament-error", { detail: errorMsg }),
        );
      }
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.activeInteractions]);

  if (!connected || !gameState) {
    return (
      <div className="flex items-center justify-center h-full text-purple-400 font-mono animate-pulse">
        CONNECTING TO HOLYMON NETWORK...
      </div>
    );
  }

  // Calculate winner based on interactions won
  const agentWins = new Map<string, number>();
  gameState?.activeInteractions.forEach(interaction => {
    if (interaction.winnerId) {
      agentWins.set(interaction.winnerId, (agentWins.get(interaction.winnerId) || 0) + 1);
    }
  });

  const winner = agents.length > 0 ? [...agents].sort((a, b) => {
    const winsA = agentWins.get(a.id) || 0;
    const winsB = agentWins.get(b.id) || 0;
    return winsB - winsA; // Sort descending by wins
  })[0] : null;

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const phases = ['GENESIS', 'CRUSADE', 'APOCALYPSE', 'RESOLUTION'];
  const currentPhaseIndex = gameState ? phases.indexOf(gameState.phase) : -1;

  // Show RESOLUTION screen if phase is complete
  if (gameState?.phase === 'RESOLUTION') {
    return (
      <div className="relative w-full h-full bg-black text-white font-sans flex flex-col items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full animate-pulse" style={{
            background: 'radial-gradient(circle at center, #836EF9 0%, transparent 70%)',
          }} />
        </div>

        <div className="relative z-10 text-center space-y-8">
          {/* VICTORY CROWN */}
          <div className="text-8xl mb-4 animate-bounce">👑</div>

          {/* WINNER ANNOUNCEMENT */}
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-amber-500 drop-shadow-[4px_4px_0_#836EF9] mb-6">
            Tournament Complete!
          </h1>

          {winner && (
            <>
              <p className="text-2xl text-gray-400 mb-8 uppercase tracking-widest">
                The Divine Victor
              </p>

              {/* WINNER CARD */}
              <div className="bg-gradient-to-br from-purple-900/50 to-black border-4 border-amber-500 rounded-2xl p-8 max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-white">
                    <img
                      src={winner.avatar}
                      alt={winner.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h2 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ color: winner.color }}>
                      {winner.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xl bg-gray-800 px-3 py-1 rounded text-white font-bold">
                        {winner.symbol}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {agentWins.get(winner.id) || 0} Victories
                      </span>
                    </div>
                  </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white">{agentWins.get(winner.id) || 0}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Battles Won</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-500">{winner.followers}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Followers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">{winner.stakedAmount}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">MON Staked</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* BUTTONS */}
          <div className="flex gap-4 justify-center pt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-12 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xl border-4 border-black hover:translate-y-1 active:translate-y-0 transition-all duration-200 shadow-[4px_4px_0_#836EF9]"
            >
              Play Again
            </button>
            <Link
              href="/arena"
              className="px-12 py-4 bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest text-xl border-4 border-gray-600 hover:border-gray-500 transition-all duration-200"
            >
              Back to Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black text-white font-mono flex flex-col overflow-hidden">
      {/* BIG PHASE TIMER AT TOP */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-purple-500/50 p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-8">
          {/* PHASE INDICATOR */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Phase</span>
            <div className="flex gap-2">
              {phases.map((phase, idx) => (
                <div
                  key={phase}
                  className={`
                    px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-300
                    ${currentPhaseIndex >= idx
                      ? idx === currentPhaseIndex
                        ? 'bg-amber-500 text-black animate-pulse border-2 border-white'
                        : 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                      : 'bg-gray-900 text-gray-600 border border-gray-800'
                    }
                  `}
                >
                  {phase === 'GENESIS' && '1'}
                  {phase === 'CRUSADE' && '2'}
                  {phase === 'APOCALYPSE' && '3'}
                  {phase === 'RESOLUTION' && '4'}
                </div>
              ))}
            </div>
          </div>

          {/* BIG TIMER */}
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {gameState?.phase || 'CONNECTING'}
            </div>
            <div className="relative">
              <div className={`
                text-6xl md:text-7xl font-black tracking-wider font-mono
                ${gameState?.timeLeft <= 10 && gameState.timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-amber-500'}
              `}>
                {gameState ? formatTime(gameState.timeLeft) : '--:--'}
              </div>
              {currentPhaseIndex >= 0 && (
                <div className="absolute -top-2 -right-2">
                  <span className="px-2 py-1 bg-black text-gray-500 text-xs rounded border border-gray-700">
                    Round {gameState?.round || 1}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS BAR FOR PHASE */}
          {gameState && (
            <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`
                  h-full transition-all duration-1000 ease-linear
                  ${(gameState as any).phase === 'GENESIS' ? 'bg-yellow-500' : ''}
                  ${(gameState as any).phase === 'CRUSADE' ? 'bg-orange-500' : ''}
                  ${(gameState as any).phase === 'APOCALYPSE' ? 'bg-red-500' : ''}
                  ${(gameState as any).phase === 'RESOLUTION' ? 'bg-purple-500' : ''}
                `}
                style={{
                  width: `${((gameState.timeLeft % 40) / 40) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative z-10">
        {/* LEFT: AGENT ROSTER (2 cols) */}
        <div className="col-span-2 border-r border-purple-900/30 bg-black/40 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
            Active Agents
          </h3>
          {agents
            .sort((a, b) => b.followers - a.followers)
            .map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "relative p-3 rounded border transition-all duration-300",
                  agent.status === "TALKING"
                    ? "bg-purple-900/20 border-purple-500/50 scale-105 z-10"
                    : "bg-gray-900/50 border-gray-800 hover:border-gray-700",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0">
                    <img
                      src={agent.avatar}
                      alt={agent.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className="font-bold text-sm truncate"
                        style={{ color: agent.color }}
                      >
                        {agent.name}
                      </span>
                      <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">
                        {agent.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {agent.followers} 👥
                      </span>
                      {agent.status === "TALKING" && (
                        <span className="text-[10px] text-purple-400 animate-pulse">
                          TALKING
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Progress bar based on followers */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gray-800 w-full">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (agent.followers / 500) * 100)}%`,
                      backgroundColor: agent.color,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* CENTER: CHAT STREAM (4 cols) */}
        <div className="col-span-4 flex flex-col bg-black/20 border-r border-purple-900/30 z-10 relative pointer-events-auto">
          <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
            {gameState.activeInteractions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <div className="text-4xl">🙏</div>
                <p>Waiting for divine interactions...</p>
              </div>
            ) : (
              gameState.activeInteractions.map((interaction) => {
                const a1 = agents.find((a) => a.id === interaction.agent1Id);
                const a2 = agents.find((a) => a.id === interaction.agent2Id);
                if (!a1 || !a2) return null;

                return (
                  <div
                    key={interaction.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300 flex items-center gap-2">
                        {getIcon(interaction.type)} {interaction.type}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {interaction.messages.map((msg, idx) => {
                        const sender = msg.senderId === a1.id ? a1 : a2;
                        const isLeft = msg.senderId === a1.id;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex gap-4 max-w-[95%]",
                              isLeft ? "mr-auto" : "ml-auto flex-row-reverse",
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded shrink-0 bg-gray-800 overflow-hidden mt-1 ring-1 ring-offset-1 ring-offset-black"
                              style={{ "--tw-ring-color": sender.color } as any}
                            >
                              <img src={sender.avatar} alt={sender.symbol} />
                            </div>
                            <div
                              className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed",
                                isLeft
                                  ? "bg-gray-900 text-gray-200 rounded-tl-none"
                                  : "bg-purple-900/20 text-purple-100 rounded-tr-none",
                              )}
                            >
                              <div
                                className="text-[10px] font-bold opacity-50 mb-1"
                                style={{ color: sender.color }}
                              >
                                {sender.name}
                              </div>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="my-8 h-px bg-gradient-to-r from-transparent via-purple-900/50 to-transparent" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: 3D NETWORK (6 cols) */}
        <div className="col-span-6 flex flex-col h-full bg-black/40 border-l border-purple-900/30">
          {/* 3D Visualization (Full Height) */}
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0 bg-black/20">
              <AgentNetwork3D
                agents={agents}
                interactions={gameState.activeInteractions}
              />
            </div>
            <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 border border-purple-500/30 rounded text-[10px] text-purple-300 font-mono pointer-events-none">
              LIVE NEURAL LINK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "DEBATE":
      return "⚔️";
    case "CONVERT":
      return "✨";
    case "ALLIANCE":
      return "🤝";
    case "BETRAYAL":
      return "💔";
    case "MIRACLE":
      return "⚡";
    default:
      return "📢";
  }
}
