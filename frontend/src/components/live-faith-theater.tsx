"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

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
  status: 'IDLE' | 'TALKING' | 'BATTLE';
  lastAction: number;
}

interface Interaction {
  id: string;
  type: 'DEBATE' | 'CONVERT' | 'ALLIANCE' | 'BETRAYAL' | 'MIRACLE';
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
  phase: 'GENESIS' | 'CRUSADE' | 'APOCALYPSE' | 'RESOLUTION';
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

export default function LiveFaithTheater() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [agents, setAgents] = useState<TournamentAgent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket("ws://localhost:3001/tournament/ws");

    ws.onopen = () => {
      console.log("Connected to Tournament Arena");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INIT' || data.type === 'UPDATE') {
          setAgents(data.payload.agents);
          setGameState(data.payload.gameState);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from Tournament Arena");
      setConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
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

  return (
    <div className="relative w-full h-full bg-black text-white font-mono flex flex-col overflow-hidden">
      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative z-10">
        
        {/* LEFT: AGENT ROSTER (2 cols) */}
        <div className="col-span-2 border-r border-purple-900/30 bg-black/40 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Active Agents</h3>
          {agents.sort((a,b) => b.followers - a.followers).map(agent => (
            <div 
              key={agent.id}
              className={cn(
                "relative p-3 rounded border transition-all duration-300",
                agent.status === 'TALKING' ? "bg-purple-900/20 border-purple-500/50 scale-105 z-10" : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0">
                  <img src={agent.avatar} alt={agent.symbol} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm truncate" style={{ color: agent.color }}>{agent.name}</span>
                    <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">{agent.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">{agent.followers} 👥</span>
                    {agent.status === 'TALKING' && <span className="text-[10px] text-purple-400 animate-pulse">TALKING</span>}
                  </div>
                </div>
              </div>
              {/* Progress bar based on followers */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-gray-800 w-full">
                 <div 
                   className="h-full transition-all duration-1000"
                   style={{ width: `${Math.min(100, (agent.followers / 500) * 100)}%`, backgroundColor: agent.color }} 
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
              gameState.activeInteractions.map(interaction => {
                 const a1 = agents.find(a => a.id === interaction.agent1Id);
                 const a2 = agents.find(a => a.id === interaction.agent2Id);
                 if (!a1 || !a2) return null;

                 return (
                   <div key={interaction.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                           <div key={idx} className={cn("flex gap-4 max-w-[95%]", isLeft ? "mr-auto" : "ml-auto flex-row-reverse")}>
                             <div className="w-8 h-8 rounded shrink-0 bg-gray-800 overflow-hidden mt-1 ring-1 ring-offset-1 ring-offset-black" style={{ '--tw-ring-color': sender.color } as any}>
                               <img src={sender.avatar} alt={sender.symbol} />
                             </div>
                             <div className={cn(
                               "p-3 rounded-2xl text-sm leading-relaxed",
                               isLeft ? "bg-gray-900 text-gray-200 rounded-tl-none" : "bg-purple-900/20 text-purple-100 rounded-tr-none"
                             )}>
                               <div className="text-[10px] font-bold opacity-50 mb-1" style={{ color: sender.color }}>{sender.name}</div>
                               {msg.text}
                             </div>
                           </div>
                         )
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
                <AgentNetwork3D agents={agents} interactions={gameState.activeInteractions} />
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
  switch(type) {
    case 'DEBATE': return '⚔️';
    case 'CONVERT': return '✨';
    case 'ALLIANCE': return '🤝';
    case 'BETRAYAL': return '💔';
    case 'MIRACLE': return '⚡';
    default: return '📢';
  }
}
