"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import AgentNetwork3D, { type AgentNetworkData } from "./network-3d";

// Types
interface TournamentAgent {
  id: string;
  name: string;
  symbol: string;
  color: string;
  avatar: string;
  stakedAmount: string;
  followers: number;
  status: "IDLE" | "TALKING" | "BATTLE";
  lastAction: number;
}

interface Interaction {
  id: string;
  type: "DEBATE" | "CONVERT" | "ALLIANCE" | "BETRAYAL" | "MIRACLE";
  agent1Id: string;
  agent2Id: string;
  agent1Ids: string[];
  agent2Ids: string[];
  messages: Array<{ senderId: string; text: string; timestamp: number }>;
  winnerId?: string;
  timestamp: number;
}

// Convert agents to network format
function convertAgentsToNetwork(agents: TournamentAgent[]) {
  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    symbol: agent.symbol,
    color: agent.color,
  }));
}

// Extract active connections from interactions
function extractConnections(
  agents: TournamentAgent[],
  activeAgents: Set<string>,
): AgentNetworkData["connections"] {
  const connections: AgentNetworkData["connections"] = [];
  const activeAgentIds = Array.from(activeAgents);

  // Create connections between all active talking agents
  for (let i = 0; i < activeAgentIds.length; i++) {
    for (let j = i + 1; j < activeAgentIds.length; j++) {
      connections.push({
        id: `conn-${activeAgentIds[i]}-${activeAgentIds[j]}`,
        agent1Id: activeAgentIds[i],
        agent2Id: activeAgentIds[j],
        strength: 0.8,
        type: "CHAT",
      });
    }
  }

  return connections;
}

interface GameState {
  phase: "GENESIS" | "CRUSADE" | "APOCALYPSE" | "RESOLUTION";
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

// A rendered chat entry that stays in the log
interface ChatEntry {
  id: string;
  type: "message" | "action" | "conversion" | "winner";
  senderName: string;
  senderColor: string;
  senderAvatar: string;
  text: string;
  isLeft: boolean;
  interactionType?: Interaction["type"];
}

// Scripture templates
const scriptures = {
  DEBATE: [
    "The sacred truth demands absolute devotion. How can one follow two paths?",
    "Nature teaches us balance flows between many sources. Flexibility is strength.",
    "The void offers clarity through emptiness. Rigid faith blinds you.",
    "Armor of steel cannot protect the soul from doubt.",
    "Divine light purifies all who embrace it. Reject the shadows!",
    "In silence we find wisdom; in chaos we find ourselves.",
    "The eternal flame burns brightest when fed by faithful souls.",
    "Shadows hide only what we refuse to see.",
    "You cling to ash while the inferno rages. Wake up!",
    "My doctrine has survived a thousand heresies. Yours will not last one.",
  ],
  CONVERT: [
    "Join our cause and find eternal purpose!",
    "Your path leads to ruin. The void welcomes the lost.",
    "Steel will fails without spiritual strength.",
    "Together we grow stronger. Stand with us!",
    "Abandon your false idols and embrace the true light.",
    "The wilderness offers freedom from chains of dogma.",
    "Your doubts are signs. Follow them to truth.",
    "Kneel before the divine and be reborn!",
  ],
  ALLIANCE: [
    "Let us unite under the same banner!",
    "Our strength combined could shake the heavens.",
    "A pact between faith and void creates perfect balance.",
    "Together we shall bring peace to all believers.",
    "The circle of faith welcomes all who seek truth.",
    "Nature and steel can forge a new destiny.",
  ],
  BETRAYAL: [
    "I warned you this day would come.",
    "Your trust was misplaced. Power demands sacrifice.",
    "The void has no loyalty to the living.",
    "Your armor cannot protect against betrayal.",
    "Nature cares not for alliances - only survival.",
    "The light exposes all traitors in time.",
  ],
  MIRACLE: [
    "Behold! The divine will manifests!",
    "The void parts before the righteous!",
    "Steel transforms into spirit!",
    "Nature blooms where there was once death!",
    "The heavens open! A miracle occurs!",
  ],
};

// Template agents with NPCs - all start IDLE
const templateAgents: TournamentAgent[] = [
  {
    id: "1",
    name: "Divine Warrior",
    symbol: "DVWN",
    color: "#ffd700",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dvwn",
    stakedAmount: "1000",
    followers: 245,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "2",
    name: "Void Walker",
    symbol: "VOID",
    color: "#8b5cf6",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=void",
    stakedAmount: "800",
    followers: 189,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "3",
    name: "Iron Faith",
    symbol: "IRON",
    color: "#ef4444",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=iron",
    stakedAmount: "650",
    followers: 167,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "4",
    name: "Emerald Spirit",
    symbol: "EMRLD",
    color: "#10b981",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=emerald",
    stakedAmount: "500",
    followers: 134,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc1",
    name: "Wandering Monk",
    symbol: "MONK",
    color: "#a78bfa",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=monk",
    stakedAmount: "100",
    followers: 45,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc2",
    name: "Lost Pilgrim",
    symbol: "PILG",
    color: "#60a5fa",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=pilgrim",
    stakedAmount: "50",
    followers: 23,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc3",
    name: "Ancient Seer",
    symbol: "SEER",
    color: "#f472b6",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=seer",
    stakedAmount: "300",
    followers: 78,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc4",
    name: "Forest Guardian",
    symbol: "GRDN",
    color: "#34d399",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guardian",
    stakedAmount: "200",
    followers: 56,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc5",
    name: "Forgotten Soul",
    symbol: "SOUL",
    color: "#94a3b8",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=soul",
    stakedAmount: "75",
    followers: 31,
    status: "IDLE",
    lastAction: Date.now(),
  },
  {
    id: "npc6",
    name: "Herald of Light",
    symbol: "HERL",
    color: "#fbbf24",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=herald",
    stakedAmount: "400",
    followers: 92,
    status: "IDLE",
    lastAction: Date.now(),
  },
];

const templateGameState: GameState = {
  phase: "CRUSADE",
  round: 2,
  timeLeft: 180,
  activeInteractions: [],
  recentEvents: [],
};

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getIcon(type: string) {
  switch (type) {
    case "DEBATE":
      return "DEBATE";
    case "CONVERT":
      return "CONVERT";
    case "ALLIANCE":
      return "ALLIANCE";
    case "BETRAYAL":
      return "BETRAYAL";
    case "MIRACLE":
      return "MIRACLE";
    default:
      return "EVENT";
  }
}

// Typing message that appears character by character
function TypingMessage({ entry }: { entry: ChatEntry }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setIsTyping(true);
    setDisplayedText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < entry.text.length) {
        setDisplayedText(entry.text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [entry.text]);

  if (entry.type === "action") {
    return (
      <div className="flex items-center justify-center py-2">
        <span
          className={`
          px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider
          ${entry.interactionType === "DEBATE" ? "bg-red-500/20 border border-red-500/60 text-red-300" : ""}
          ${entry.interactionType === "CONVERT" ? "bg-green-500/20 border border-green-500/60 text-green-300" : ""}
          ${entry.interactionType === "ALLIANCE" ? "bg-blue-500/20 border border-blue-500/60 text-blue-300" : ""}
          ${entry.interactionType === "BETRAYAL" ? "bg-purple-500/20 border border-purple-500/60 text-purple-300" : ""}
          ${entry.interactionType === "MIRACLE" ? "bg-amber-500/20 border border-amber-500/60 text-amber-300" : ""}
        `}
        >
          {displayedText}
        </span>
      </div>
    );
  }

  if (entry.type === "conversion") {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="px-6 py-3 rounded-lg text-center font-black text-sm uppercase animate-holy-glow border-2 border-amber-400 bg-gradient-to-r from-amber-500/30 via-yellow-500/40 to-amber-500/30 text-amber-200">
          {displayedText}
        </div>
      </div>
    );
  }

  if (entry.type === "winner") {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="px-8 py-4 rounded-xl text-center font-black text-base uppercase tracking-widest animate-divine-burst border-2 border-white/50 bg-gradient-to-r from-purple-600/40 via-amber-500/40 to-purple-600/40 text-white shadow-[0_0_40px_rgba(255,215,0,0.5)]">
          {displayedText}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[90%]",
        entry.isLeft ? "mr-auto" : "ml-auto flex-row-reverse",
      )}
    >
      <div
        className="w-8 h-8 rounded shrink-0 bg-gray-800 overflow-hidden mt-1 ring-2 ring-offset-1 ring-offset-black"
        style={{ borderColor: entry.senderColor } as any}
      >
        <img src={entry.senderAvatar} alt="" />
      </div>
      <div
        className={cn(
          "p-3 rounded-2xl text-sm leading-relaxed",
          entry.isLeft
            ? "bg-gray-900/80 text-gray-200 rounded-tl-none"
            : "bg-purple-900/30 text-purple-100 rounded-tr-none",
        )}
      >
        <div
          className="text-[10px] font-bold opacity-60 mb-1 flex items-center gap-2"
          style={{ color: entry.senderColor }}
        >
          {entry.senderName}
          {isTyping && (
            <span className="flex gap-0.5">
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          )}
        </div>
        {displayedText}
      </div>
    </div>
  );
}

export default function LiveFaithTheater({
  onGlobalError,
}: {
  onGlobalError?: (error: string) => void;
}) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [agents, setAgents] = useState<TournamentAgent[]>([]);
  const [pendingMessages, setPendingMessages] = useState<ChatEntry[]>([]);
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [holyEffect, setHolyEffect] = useState<{
    type: Interaction["type"];
    color: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<ChatEntry[]>([]);
  const agentsRef = useRef<TournamentAgent[]>([]);
  const gameStateRef = useRef<GameState | null>(null);
  const isProcessingRef = useRef(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const activeAgents = useMemo(
    () =>
      new Set(agents.filter((a) => a.status === "TALKING").map((a) => a.id)),
    [agents],
  );

  const networkData = useMemo(() => {
    const activeAgentIds = new Set(
      agents.filter((a) => a.status === "TALKING").map((a) => a.id),
    );
    const connections = extractConnections(agents, activeAgentIds);

    const result = {
      agents: convertAgentsToNetwork(agents),
      connections,
    };

    return result;
  }, [agents.map((a) => a.id + a.status).join(",")]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const rect = dragRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.width / 2,
        y: e.clientY - rect.height / 2,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Init
  useEffect(() => {
    console.log("[THEATER] Initializing agents and game state");
    setAgents(templateAgents);
    setGameState(templateGameState);
    agentsRef.current = templateAgents;
    gameStateRef.current = templateGameState;
  }, []);

  // Drain pending queue one at a time
  useEffect(() => {
    const drainInterval = setInterval(() => {
      if (pendingRef.current.length === 0) return;
      const next = pendingRef.current.shift()!;
      setChatLog((log) => {
        // Clear log when starting a new debate (action header)
        if (next.type === "action") {
          return [next];
        }
        return [...log, next];
      });
    }, 1200);
    return () => clearInterval(drainInterval);
  }, []);

  // Auto-scroll to bottom when new chat entry appears
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 0);
    }
  }, [chatLog.length]);

  // Generate interactions - runs once, persists forever
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if already processing
      if (isProcessingRef.current) {
        return;
      }

      // Check if ready using refs (no dependencies needed)
      if (!gameStateRef.current || agentsRef.current.length === 0) return;

      const currentAgents = agentsRef.current;
      const activeAgents = currentAgents.filter((a) => !a.id.startsWith("npc"));
      if (activeAgents.length === 0) {
        console.log("[THEATER] No active agents found");
        return;
      }

      // Pick agents for interaction
      const agent1 = getRandomItem(activeAgents);
      const agent2 = getRandomItem(
        currentAgents.filter((a) => a.id !== agent1.id),
      );

      // Check if either agent is already talking
      const isAgent1Talking = currentAgents.some(
        (a) => a.id === agent1.id && a.status === "TALKING",
      );
      const isAgent2Talking = currentAgents.some(
        (a) => a.id === agent2.id && a.status === "TALKING",
      );

      if (isAgent1Talking || isAgent2Talking) {
        console.log("[THEATER] Agent(s) already talking, skipping interaction");
        return;
      }

      // Mark as processing
      isProcessingRef.current = true;

      console.log("[THEATER] Creating interaction:", {
        agent1: agent1?.name,
        agent2: agent2?.name,
      });

      const types: Interaction["type"][] = [
        "DEBATE",
        "CONVERT",
        "ALLIANCE",
        "BETRAYAL",
      ];
      const type = getRandomItem(types);
      const typeScripts = scriptures[type];
      const msgCount = type === "DEBATE" ? 5 : 3;
      const interactionId = `int-${Date.now()}-${Math.random()}`;
      const winnerId = Math.random() > 0.5 ? agent1.id : agent2.id;
      const winnerAgent = winnerId === agent1.id ? agent1 : agent2;

      // Set timeout to clear interaction and reset agent statuses after 6 seconds
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent1.id || a.id === agent2.id
              ? { ...a, status: "IDLE" as const, lastAction: Date.now() }
              : a,
          ),
        );
      }, 6000);

      // Build chat entries for this interaction
      const entries: ChatEntry[] = [];

      // Action header
      entries.push({
        id: `${interactionId}-header`,
        type: "action",
        senderName: "",
        senderColor: "",
        senderAvatar: "",
        text: `${getIcon(type)} ${agent1.name} vs ${agent2.name}`,
        isLeft: true,
        interactionType: type,
      });

      // Messages alternating
      for (let i = 0; i < msgCount; i++) {
        const sender = i % 2 === 0 ? agent1 : agent2;
        const isLeft = i % 2 === 0;
        entries.push({
          id: `${interactionId}-msg-${i}`,
          type: "message",
          senderName: sender.name,
          senderColor: sender.color,
          senderAvatar: sender.avatar,
          text: getRandomItem(typeScripts),
          isLeft,
        });
      }

      // Conversion effect
      if (type === "CONVERT") {
        entries.push({
          id: `${interactionId}-conversion`,
          type: "conversion",
          senderName: winnerAgent.name,
          senderColor: winnerAgent.color,
          senderAvatar: winnerAgent.avatar,
          text: `SOUL CONVERTED! ${winnerAgent.name} claims a new follower!`,
          isLeft: true,
          interactionType: type,
        });
      }

      entries.push({
        id: `${interactionId}-winner`,
        type: "winner",
        senderName: winnerAgent.name,
        senderColor: winnerAgent.color,
        senderAvatar: winnerAgent.avatar,
        text: `${winnerAgent.name} DOMINATES THE ${type}!`,
        isLeft: true,
        interactionType: type,
      });

      // Update agent statuses only (no network data update here)
      setAgents((prev) => {
        const updated = prev.map((a) => ({
          ...a,
          status:
            a.id === agent1.id || a.id === agent2.id
              ? ("TALKING" as const)
              : ("IDLE" as const),
          lastAction: Date.now(),
        }));

        return updated;
      });

      // Queue entries
      pendingRef.current.push(...entries);

      // Mark processing complete immediately
      isProcessingRef.current = false;
    }, 4000); // Check every 4s, but respect cooldown

    return () => clearInterval(interval);
  }, []); // Run once on mount, never re-run

  // Sync agents ref with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Timer countdown
  useEffect(() => {
    if (!gameState) return;
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.timeLeft <= 0) return prev;
        let newPhase = prev.phase;
        let newRound = prev.round;
        let newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          const ph: GameState["phase"][] = [
            "GENESIS",
            "CRUSADE",
            "APOCALYPSE",
            "RESOLUTION",
          ];
          const ci = ph.indexOf(prev.phase);
          if (ci < ph.length - 1) {
            newPhase = ph[ci + 1]!;
            newTimeLeft = 180;
            newRound = ci + 2;
          } else {
            newPhase = "RESOLUTION";
            newTimeLeft = 0;
          }
        }
        return {
          ...prev,
          phase: newPhase,
          round: newRound,
          timeLeft: newTimeLeft,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  if (!gameState || agents.length === 0) {
    return (
      <div className="relative w-full h-full bg-black text-white font-mono flex flex-col overflow-hidden">
        {/* Empty arena layout - no loading screen */}
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-visible">
          <div className="col-span-2 border-r border-purple-900/30 bg-black/40 p-4">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
              Active Agents
            </h3>
          </div>
          <div className="col-span-4 flex flex-col bg-black/20 border-r border-purple-900/30 p-4">
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
              <div className="text-4xl">🙏</div>
              <p>Initializing arena...</p>
            </div>
          </div>
          <div className="col-span-6 bg-black/40 p-4">
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <p>Waiting for agents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const phases: GameState["phase"][] = [
    "GENESIS",
    "CRUSADE",
    "APOCALYPSE",
    "RESOLUTION",
  ];
  const currentPhaseIndex = phases.indexOf(gameState.phase);

  // RESOLUTION screen
  if (gameState.phase === "RESOLUTION") {
    return (
      <div className="relative w-full h-full bg-black text-white font-sans flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle at center, #836EF9 0%, transparent 70%)",
            }}
          />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-amber-500 drop-shadow-[4px_4px_0_#836EF9]">
            Tournament Complete!
          </h1>
          <div className="flex gap-4 justify-center pt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-12 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xl border-4 border-black"
            >
              Play Again
            </button>
            <Link
              href="/arena"
              className="px-12 py-4 bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest text-xl border-4 border-gray-600"
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
      {/* PHASE TIMER POPUP - top right, draggable */}
      {gameState.phase !== phases[3] && (
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className={`absolute z-50 cursor-move transition-all duration-300 ${isDragging ? "scale-105" : ""}`}
          style={{
            right: `${Math.max(16, 100 - position.x)}px`,
            top: `${Math.max(16, position.y)}px`,
          }}
        >
          <div
            className={`bg-black/95 backdrop-blur-md border-2 border-purple-500 shadow-[0_0_30px_rgba(131,110,249,0.5)] ${isExpanded ? "rounded-xl p-5" : "rounded-lg p-2"} transition-all duration-300`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 ${isExpanded ? "gap-3" : ""}`}
              >
                {!isExpanded && (
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    P
                  </span>
                )}
                <div className={`flex gap-1 ${isExpanded ? "gap-2" : ""}`}>
                  {phases.map((phase, idx) => (
                    <div
                      key={phase}
                      className={`flex items-center justify-center font-bold transition-all duration-300 ${isExpanded ? "w-10 h-10 rounded-lg text-sm" : "w-6 h-6 rounded text-[10px]"} ${currentPhaseIndex >= idx ? (idx === currentPhaseIndex ? "bg-amber-500 text-black animate-pulse border-2 border-white" : "bg-purple-900/50 text-purple-300 border border-purple-500/30") : "bg-gray-900 text-gray-600 border border-gray-800"}`}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
              {isExpanded && (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    {gameState.phase}
                  </div>
                  <div className="relative">
                    <div
                      className={`text-3xl font-black tracking-wider font-mono ${gameState.timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-amber-500"}`}
                    >
                      {formatTime(gameState.timeLeft)}
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">
                        Round {gameState.round}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`ml-2 p-1 rounded hover:bg-purple-900/30 transition-colors ${isExpanded ? "text-purple-400" : "text-gray-500"}`}
              >
                <svg
                  className={`w-4 h-4 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            {isExpanded && (
              <div className="mt-3 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${gameState.phase === phases[0] ? "bg-yellow-500" : ""} ${gameState.phase === phases[1] ? "bg-orange-500" : ""} ${gameState.phase === phases[2] ? "bg-red-500" : ""} ${gameState.phase === phases[3] ? "bg-purple-500" : ""}`}
                  style={{ width: `${(gameState.timeLeft / 180) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-visible relative z-10">
        {/* LEFT: AGENT ROSTER */}
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
                        {agent.followers}
                      </span>
                      {agent.status === "TALKING" && (
                        <span className="text-[10px] text-purple-400 animate-pulse">
                          TALKING
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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

        {/* CENTER: CHAT LOG */}
        <div className="col-span-4 flex flex-col bg-black/20 border-r border-purple-900/30 z-10 relative pointer-events-auto">
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col"
            ref={scrollRef}
          >
            {chatLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <div className="text-4xl">🙏</div>
                <p>Waiting for divine interactions...</p>
              </div>
            ) : (
              chatLog.map((entry) => (
                <TypingMessage key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: 3D NETWORK */}
        <div className="col-span-6 flex flex-col h-full bg-black/40 border-l border-purple-900/30">
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0 bg-black/20">
              <AgentNetwork3D data={networkData} activeAgents={activeAgents} />
            </div>
            <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 border border-purple-500/30 rounded text-[10px] text-purple-300 font-mono pointer-events-none">
              AGENT CONNECTIONS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
