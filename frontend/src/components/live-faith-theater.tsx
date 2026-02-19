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
    typing?: boolean;
  }>;
  winnerId?: string;
  timestamp: number;
  effect?: {
    type: "CONVERSION" | "FOLLOWER_GAIN" | "MIRACLE";
    message: string;
    agentId: string;
  };
}

interface GameState {
  phase: "GENESIS" | "CRUSADE" | "APOCALYPSE" | "RESOLUTION";
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

// Message queue for sequential chat rendering
interface QueuedMessage {
  id: string;
  msg: { senderId: string; text: string; timestamp: number; typing?: boolean };
  sender: TournamentAgent;
  isLeft: boolean;
  delay: number;
  showEffect?: 'SCREEN_SHAKE' | 'FLASH' | 'GLITCH' | 'RAINBOW';
}

interface GameState {
  phase: "GENESIS" | "CRUSADE" | "APOCALYPSE" | "RESOLUTION";
  round: number;
  timeLeft: number;
  activeInteractions: Interaction[];
  recentEvents: string[];
}

// Scripture templates for interactions
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
  ],
  CONVERT: [
    "Join our cause and find eternal purpose!",
    "Your path leads to ruin. The void welcomes the lost.",
    "Steel will fails without spiritual strength.",
    "Together we grow stronger. Stand with us!",
    "Abandon your false idols and embrace the true light.",
    "The wilderness offers freedom from chains of dogma.",
    "Your doubts are signs. Follow them to truth.",
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

// Template data with NPCs
const templateAgents: TournamentAgent[] = [
  {
    id: "1",
    name: "Divine Warrior",
    symbol: "DVWN",
    color: "#ffd700",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dvwn",
    stakedAmount: "1000",
    followers: 245,
    status: "TALKING",
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
    lastAction: Date.now() - 5000,
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
    lastAction: Date.now() - 10000,
  },
  {
    id: "4",
    name: "Emerald Spirit",
    symbol: "EMRLD",
    color: "#10b981",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=emerald",
    stakedAmount: "500",
    followers: 134,
    status: "TALKING",
    lastAction: Date.now() - 2000,
  },
  // NPCs
  {
    id: "npc1",
    name: "Wandering Monk",
    symbol: "MONK",
    color: "#a78bfa",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=monk",
    stakedAmount: "100",
    followers: 45,
    status: "IDLE",
    lastAction: Date.now() - 15000,
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
    lastAction: Date.now() - 20000,
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
    lastAction: Date.now() - 8000,
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
    lastAction: Date.now() - 12000,
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
    lastAction: Date.now() - 25000,
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
    lastAction: Date.now() - 6000,
  },
];

const templateInteractions: Interaction[] = [
  {
    id: "int1",
    type: "DEBATE",
    agent1Id: "1",
    agent2Id: "4",
    messages: [
      {
        senderId: "1",
        text: "The sacred path requires absolute devotion. How can one follow two masters?",
        timestamp: Date.now() - 10000,
      },
      {
        senderId: "4",
        text: "Nature teaches us that balance flows between many sources. Flexibility is strength.",
        timestamp: Date.now() - 5000,
      },
      {
        senderId: "1",
        text: "Flexibility is the path of the weak. Choose your banner and stand firm!",
        timestamp: Date.now(),
      },
    ],
    winnerId: "1",
    timestamp: Date.now(),
  },
  {
    id: "int2",
    type: "CONVERT",
    agent1Id: "2",
    agent2Id: "3",
    messages: [
      {
        senderId: "2",
        text: "The void offers clarity through emptiness. Your rigid faith blinds you.",
        timestamp: Date.now() - 8000,
      },
      {
        senderId: "3",
        text: "Never! My armor has weathered countless storms. Your void is merely another shadow.",
        timestamp: Date.now() - 3000,
      },
    ],
    timestamp: Date.now(),
  },
];

const templateGameState: GameState = {
  phase: "CRUSADE",
  round: 2,
  timeLeft: 180,
  activeInteractions: templateInteractions,
  recentEvents: ["Divine Warrior gained 12 followers", "Void Walker initiated a debate"],
};

// Helper to get random item from array
function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Typing animation effect
function useTypingEffect(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setIsTyping(true);
    setDisplayedText("");
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isTyping };
}

// Brutal chromatic effects for conversions
interface ChromaticEffectProps {
  effectType: 'SCREEN_SHAKE' | 'FLASH' | 'GLITCH' | 'RAINBOW';
  onComplete: () => void;
  intensity?: 'low' | 'medium' | 'high';
}

function ChromaticEffect({ effectType, onComplete, intensity = 'medium' }: ChromaticEffectProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 100);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const effectStyles = {
    SCREEN_SHAKE: {
      animation: `shake ${intensity === 'high' ? '0.3s' : '0.5s'} ease-in-out`,
    },
    FLASH: {
      animation: `flash ${intensity === 'high' ? '0.6s' : '0.4s'} ease-out`,
    },
    GLITCH: {
      animation: 'glitch 0.5s steps(3)',
    },
    RAINBOW: {
      animation: `rainbow 1s linear infinite`,
    },
  };

  const style = effectStyles[effectType] || {};

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 ${effectType === 'SCREEN_SHAKE' ? 'animate-shake' : ''}`}
      style={style as React.CSSProperties}
    >
      {effectType === 'FLASH' && (
        <div className="absolute inset-0 bg-white/50 animate-flash" />
      )}
      {effectType === 'GLITCH' && (
        <div className="absolute inset-0 bg-red-500/20 animate-glitch" />
      )}
      {effectType === 'RAINBOW' && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 opacity-20 animate-rainbow" />
      )}
    </div>
  );
}

// Conversion effect component
function ConversionEffect({ 
  effect, 
  agent 
}: { 
  effect: { type: string; message: string; agentId: string }; 
  agent: TournamentAgent | undefined;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || !agent) return null;

  return (
    <div 
      className={`
        absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider
        animate-in fade-in zoom-in duration-300
        ${effect.type === 'CONVERSION' ? 'bg-green-500/90 text-black border-2 border-green-300' : ''}
        ${effect.type === 'FOLLOWER_GAIN' ? 'bg-amber-500/90 text-black border-2 border-amber-300' : ''}
        ${effect.type === 'MIRACLE' ? 'bg-purple-500/90 text-white border-2 border-purple-300' : ''}
      `}
    >
      {effect.message}
      <div className="text-xs mt-1 opacity-75">by {agent.name}</div>
    </div>
  );
}

// Typing message component - uses the hook properly
function TypingMessage({ 
  msg, 
  sender, 
  isLeft,
  onTypingComplete 
}: { 
  msg: { senderId: string; text: string; timestamp: number; typing?: boolean };
  sender: TournamentAgent;
  isLeft: boolean;
  onTypingComplete: () => void;
}) {
  const { displayedText, isTyping } = useTypingEffect(msg.text, 25);

  // Notify parent when typing is done
  useEffect(() => {
    if (!isTyping) {
      onTypingComplete();
    }
  }, [isTyping, onTypingComplete]);

  return (
    <div
      className={cn(
        "flex gap-4 max-w-[95%]",
        isLeft ? "mr-auto" : "ml-auto flex-row-reverse",
      )}
    >
      <div
        className={`
          w-8 h-8 rounded shrink-0 bg-gray-800 overflow-hidden mt-1 ring-1 ring-offset-1 ring-offset-black
          ${sender.status === 'TALKING' ? 'ring-2 ring-green-500 animate-pulse' : ''}
        `}
        style={{ "--tw-ring-color": sender.color } as any}
      >
        <img src={sender.avatar} alt={sender.symbol} />
      </div>
      <div
        className={cn(
          "p-3 rounded-2xl text-sm leading-relaxed relative",
          isLeft
            ? "bg-gray-900 text-gray-200 rounded-tl-none"
            : "bg-purple-900/20 text-purple-100 rounded-tr-none",
        )}
      >
        <div
          className="text-[10px] font-bold opacity-50 mb-1 flex items-center gap-2"
          style={{ color: sender.color }}
        >
          {sender.name}
          {isTyping && (
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
        <div className="relative">
          {displayedText}
        </div>
      </div>
    </div>
  );
}

// Generate a new interaction using scripture templates
function generateInteraction(allAgents: TournamentAgent[]): Interaction {
  const activeAgents = allAgents.filter(a => !a.id.startsWith('npc'));
  const agent1 = getRandomItem(activeAgents);
  const agent2 = getRandomItem(allAgents.filter(a => a.id !== agent1.id));
  
  const interactionTypes: ("DEBATE" | "CONVERT" | "ALLIANCE" | "BETRAYAL")[] = ["DEBATE", "CONVERT", "ALLIANCE", "BETRAYAL"];
  const type = getRandomItem(interactionTypes);
  const typeScripts = scriptures[type];
  
  // Generate more messages for longer, argumentative debate
  const messageCount = type === 'DEBATE' ? 6 : 3;
  const messages: Array<{ senderId: string; text: string; timestamp: number }> = [];
  const baseTime = Date.now();
  const messageDelay = 1500; // 1.5s between messages
  
  for (let i = 0; i < messageCount; i++) {
    const sender = i % 2 === 0 ? agent1.id : agent2.id;
    messages.push({
      senderId: sender,
      text: getRandomItem(typeScripts),
      timestamp: baseTime - (messageCount - 1 - i) * messageDelay,
    });
  }
  
  return {
    id: `int-${Date.now()}-${Math.random()}`,
    type,
    agent1Id: agent1.id,
    agent2Id: agent2.id,
    messages,
    winnerId: Math.random() > 0.5 ? agent1.id : agent2.id,
    timestamp: Date.now(),
  };
}

export default function LiveFaithTheater({
  onGlobalError,
}: {
  onGlobalError?: (error: string) => void;
}) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [agents, setAgents] = useState<TournamentAgent[]>([]);
  const [activeEffects, setActiveEffects] = useState<any[]>([]);
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Draggable phase timer state - MUST be defined before any early returns
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Process message queue sequentially
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const processNextMessage = () => {
      setMessageQueue(prev => {
        if (prev.length === 0) return prev;
        const [next, ...remaining] = prev;
        return remaining;
      });
    };

    const delay = messageQueue[0]?.delay || 800;
    const timer = setTimeout(processNextMessage, delay);

    return () => clearTimeout(timer);
  }, [messageQueue]);

  // When new interaction starts, add all messages to queue with staggered delays
  useEffect(() => {
    if (!gameState) return;

    gameState.activeInteractions.forEach(interaction => {
      const agent1 = agents.find(a => a.id === interaction.agent1Id);
      const agent2 = agents.find(a => a.id === interaction.agent2Id);
      if (!agent1 || !agent2) return;

      const interactionType = interaction.type;
      
      interaction.messages.forEach((msg, idx) => {
        const sender = msg.senderId === interaction.agent1Id ? agent1 : agent2;
        const isLeft = msg.senderId === interaction.agent1Id;
        
        // Stagger delays: 0.8s, 1.2s, 1.6s, 2.0s for each message
        const delay = 800 + (idx * 400);
        
        // Show chromatic effect on conversion (last message)
        const showEffect = idx === interaction.messages.length - 1 && interactionType === 'CONVERT';
        
        const queuedMsg: QueuedMessage = {
          id: `${interaction.id}-${idx}`,
          msg,
          sender: sender!,
          isLeft,
          delay,
          showEffect: showEffect ? 'SCREEN_SHAKE' : undefined,
        };

        setMessageQueue(prev => {
          // Only add if not already in queue
          if (prev.some(m => m.id === queuedMsg.id)) return prev;
          return [...prev, queuedMsg];
        });
      });
    });
  }, [gameState, agents]);

  useEffect(() => {
    setAgents(templateAgents);
    setGameState(templateGameState);
  }, []);

  // Fast interaction generation - every 1-2 seconds
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        
        const newInteraction = generateInteraction(agents);
        const updatedInteractions = [newInteraction, ...prev.activeInteractions].slice(0, 10);
        
        // Update agent statuses
        setAgents(prevAgents => prevAgents.map(a => ({
          ...a,
          status: (a.id === newInteraction.agent1Id || a.id === newInteraction.agent2Id) 
            ? 'TALKING' as const 
            : 'IDLE' as const,
          lastAction: Date.now(),
        })));

        // Generate events
        const agent1 = agents.find(a => a.id === newInteraction.agent1Id);
        const agent2 = agents.find(a => a.id === newInteraction.agent2Id);
        const winnerName = newInteraction.winnerId === newInteraction.agent1Id ? agent1?.name : agent2?.name;
        const winnerAgent = newInteraction.winnerId === newInteraction.agent1Id ? agent1 : agent2;

        // Add visual effects
        const newEffect = {
          id: `effect-${Date.now()}`,
          type: 'CONVERSION',
          message: `${winnerName} WON!`,
          agentId: newInteraction.winnerId!,
        };
        setActiveEffects(prev => [newEffect, ...prev].slice(0, 3));

        const events = [
          `${winnerName} won a ${newInteraction.type}!`,
          `${newInteraction.type}: ${agent1?.name} vs ${agent2?.name}`,
        ];

        return {
          ...prev,
          activeInteractions: updatedInteractions,
          recentEvents: events,
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [gameState, agents]);

  // Timer countdown
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.timeLeft <= 0) return prev;
        
        // Phase progression
        let newPhase = prev.phase;
        let newRound = prev.round;
        let newTimeLeft = prev.timeLeft - 1;

        if (newTimeLeft <= 0) {
          const phases: GameState['phase'][] = ['GENESIS', 'CRUSADE', 'APOCALYPSE', 'RESOLUTION'];
          const currentIdx = phases.indexOf(prev.phase);
          
          if (currentIdx < phases.length - 1) {
            newPhase = phases[currentIdx + 1] as any;
            newTimeLeft = 180;
            if (newPhase === 'CRUSADE') {
              newRound = 2;
            } else if (newPhase === 'APOCALYPSE') {
              newRound = 3;
            }
          } else {
            newPhase = 'RESOLUTION';
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

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.activeInteractions]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full text-purple-400 font-mono animate-pulse">
        INITIALIZING HOLYMON ARENA...
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

  const phases: GameState['phase'][] = ['GENESIS', 'CRUSADE', 'APOCALYPSE', 'RESOLUTION'];
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
      {/* PHASE TIMER POPUP */}
      {gameState && gameState.phase !== phases[3] && (
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className={`
            absolute z-50 cursor-move transition-all duration-300
            ${isDragging ? 'scale-105' : ''}
          `}
          style={{
            right: `${Math.max(16, 100 - position.x)}px`,
            top: `${Math.max(16, position.y)}px`,
          }}
        >
          <div className={`
            bg-black/95 backdrop-blur-md border-2 border-purple-500 shadow-[0_0_30px_rgba(131,110,249,0.5)]
            ${isExpanded ? 'rounded-xl p-5' : 'rounded-lg p-2'}
            transition-all duration-300
          `}>
            <div className="flex items-center gap-4">
              {/* PHASE INDICATOR - Compact in square mode */}
              <div className={`flex items-center gap-2 ${isExpanded ? 'gap-3' : ''}`}>
                {!isExpanded && (
                  <span className="text-xs text-gray-400 uppercase tracking-wider">P</span>
                )}
                <div className={`flex gap-1 ${isExpanded ? 'gap-2' : ''}`}>
                  {phases.map((phase, idx) => (
                    <div
                      key={phase}
                      className={`
                        flex items-center justify-center font-bold transition-all duration-300
                        ${isExpanded ? 'w-10 h-10 rounded-lg text-sm' : 'w-6 h-6 rounded text-[10px]'}
                        ${currentPhaseIndex >= idx
                          ? idx === currentPhaseIndex
                            ? 'bg-amber-500 text-black animate-pulse border-2 border-white'
                            : 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-900 text-gray-600 border border-gray-800'
                        }
                      `}
                    >
                      {phase === phases[0] && '1'}
                      {phase === phases[1] && '2'}
                      {phase === phases[2] && '3'}
                      {phase === phases[3] && '4'}
                    </div>
                  ))}
                </div>
              </div>

              {/* TIMER - Shows in expanded mode or as compact */}
              {isExpanded && (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    {gameState.phase}
                  </div>
                  <div className="relative">
                    <div className={`
                      text-3xl font-black tracking-wider font-mono
                      ${gameState.timeLeft <= 10 && gameState.timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-amber-500'}
                    `}>
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

              {/* EXPAND/TOGGLE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`
                  ml-2 p-1 rounded hover:bg-purple-900/30 transition-colors
                  ${isExpanded ? 'text-purple-400' : 'text-gray-500'}
                `}
              >
                <svg className={`w-4 h-4 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* PROGRESS BAR - Only in expanded mode */}
            {isExpanded && (
              <div className="mt-3 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full transition-all duration-1000 ease-linear
                    ${gameState.phase === phases[0] ? 'bg-yellow-500' : ''}
                    ${gameState.phase === phases[1] ? 'bg-orange-500' : ''}
                    ${gameState.phase === phases[2] ? 'bg-red-500' : ''}
                    ${gameState.phase === phases[3] ? 'bg-purple-500' : ''}
                  `}
                  style={{
                    width: `${(gameState.timeLeft / 180) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

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
          {/* Visual Effects Overlay */}
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {activeEffects.map((effect) => {
              const agent = agents.find(a => a.id === effect.agentId);
              return <ConversionEffect key={effect.id} effect={effect} agent={agent} />;
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
            {messageQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <div className="text-4xl">🙏</div>
                <p>Waiting for divine interactions...</p>
              </div>
            ) : (
              messageQueue.map((queued, idx) => (
                <div
                  key={queued.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  {queued.showEffect && (
                    <ChromaticEffect
                      effectType={queued.showEffect}
                      onComplete={() => {}}
                      intensity="high"
                    />
                  )}

                  <TypingMessage key={idx} msg={queued.msg} sender={queued.sender} isLeft={queued.isLeft} onTypingComplete={() => {}} />

                  <div className="my-8 h-px bg-gradient-to-r from-transparent via-purple-900/50 to-transparent" />
                </div>
              ))
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
