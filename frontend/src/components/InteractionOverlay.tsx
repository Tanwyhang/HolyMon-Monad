"use client";

import { useEffect, useState, useCallback } from "react";

interface InteractionOverlayProps {
  interactionType: string;
  agent1Name: string;
  agent2Name: string;
  winnerName: string;
  winnerColor: string;
  intensity: number;
  onDismiss: () => void;
}

const CRAZY_EFFECTS = {
  bg: [
    "from-purple-900/80",
    "from-red-900/80",
    "from-amber-900/80",
    "from-blue-900/80",
  ],
  text: [
    "text-purple-300",
    "text-red-300",
    "text-amber-300",
    "text-blue-300",
    "text-white",
  ],
  border: [
    "border-purple-500/80",
    "border-red-500/80",
    "border-amber-500/80",
    "border-blue-500/80",
    "border-white",
  ],
};

function InteractionOverlay({
  interactionType,
  agent1Name,
  agent2Name,
  winnerName,
  winnerColor,
  intensity,
  onDismiss,
}: InteractionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [scale, setScale] = useState(1);

  const icons: Record<string, string> = {
    DEBATE: "⚔️",
    CONVERT: "✨",
    ALLIANCE: "🤝",
    BETRAYAL: "💀",
    MIRACLE: "🌟",
  };

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setAnimationPhase(0);
      setScale(1);
    }, 300);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    setVisible(true);
    setAnimationPhase(1);

    setTimeout(() => setAnimationPhase(2), 100);
    setTimeout(() => setAnimationPhase(3), 200);
    setTimeout(() => setAnimationPhase(4), 300);
    setTimeout(() => setAnimationPhase(5), 400);
    setTimeout(() => setAnimationPhase(6), 500);

    setTimeout(() => setVisible(false), 800);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {animationPhase === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div
            className={`w-64 h-64 rounded-full border-4 transition-all duration-300`}
            style={{
              transform: `scale(${scale})`,
              borderColor:
                CRAZY_EFFECTS.border[intensity % CRAZY_EFFECTS.border.length],
              backgroundColor:
                CRAZY_EFFECTS.bg[intensity % CRAZY_EFFECTS.bg.length],
            }}
          ></div>
        </div>
      )}

      {animationPhase >= 1 && animationPhase <= 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95">
          <div className="flex flex-col items-center gap-8">
            <div
              className={`w-48 h-48 rounded-full border-4 animate-spin transition-all duration-500`}
              style={{
                borderColor:
                  CRAZY_EFFECTS.border[intensity % CRAZY_EFFECTS.border.length],
                borderWidth: "4px",
              }}
            />
            <div
              className={`text-6xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
            >
              {icons[interactionType] || "⚡️"}
            </div>
          </div>
        </div>
      )}

      {animationPhase >= 4 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900 via-transparent to-black">
          <div
            className={`text-center transition-all duration-500`}
            style={{
              animation: "crazy-in 2s infinite",
            }}
          >
            <div
              className={`text-8xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} animate-pulse`}
            >
              {interactionType.toUpperCase()}
            </div>
            <div
              className={`text-4xl text-white mt-4 ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} animate-bounce`}
            >
              {agent1Name} vs {agent2Name}
            </div>
            <div
              className={`text-2xl text-white mt-8 ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
            >
              {winnerName} WINS!
            </div>
            <div className="text-xl text-white mt-4">
              {icons[interactionType]} DOMINANCE!
            </div>
          </div>
        </div>
      )}

      {animationPhase === 5 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`max-w-2xl w-full p-8 rounded-2xl border-4 ${CRAZY_EFFECTS.border[intensity % CRAZY_EFFECTS.border.length]} bg-black/95 backdrop-blur-md`}
            style={{
              transform: `scale(${scale})`,
            }}
          >
            <div className="text-center">
              <h2
                className={`text-4xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} mb-4`}
              >
                DIVINE INTERVENTION
              </h2>
              <p
                className={`text-xl text-white mb-6 ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
              >
                <span className="text-purple-400">{agent1Name}</span>
                <span
                  className={`text-sm ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
                >
                  vs
                </span>
                <span className="text-red-400">{agent2Name}</span>
              </p>
              <p
                className={`text-2xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} mb-4`}
              >
                <span
                  className={`text-3xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
                >
                  {interactionType}
                </span>
              </p>
              <div
                className={`text-xl text-white mt-8 ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
              >
                <span
                  className={`text-3xl font-black ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]}`}
                >
                  {winnerName}
                </span>
                <span className="text-xl font-black">WINS</span>
              </div>
              <div className={`flex gap-4 justify-center mt-6`}>
                <button
                  onClick={handleDismiss}
                  className={`px-8 py-4 rounded-lg border-2 ${CRAZY_EFFECTS.border[intensity % CRAZY_EFFECTS.border.length]} ${CRAZY_EFFECTS.bg[intensity % CRAZY_EFFECTS.bg.length]} ${CRAZY_EFFECTS.text[intensity % CRAZY_EFFECTS.text.length]} hover:opacity-80 transition-all duration-200 font-bold`}
                >
                  CONTINUE WATCHING
                </button>
                <button
                  onClick={handleDismiss}
                  className={`px-8 py-4 rounded-lg border-2 ${CRAZY_EFFECTS.border[intensity % CRAZY_EFFECTS.border.length]} bg-gray-800 hover:bg-gray-700 text-white hover:opacity-80 transition-all duration-200 font-bold`}
                >
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
