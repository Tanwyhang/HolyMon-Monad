"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PixelBlast from "@/components/PixelBlast";
import LargeNFTAvatar from "@/components/large-nft-avatar";
import { createHolyMonAgent } from "@/lib/api-client";
import type { CreateAgentRequest } from "@/types/agent";

const COLOR_OPTIONS = [
  { name: "purple", color: "#836EF9" },
  { name: "pink", color: "#EC4899" },
  { name: "amber", color: "#F59E0B" },
  { name: "blue", color: "#3B82F6" },
  { name: "cyan", color: "#06B6D4" },
  { name: "red", color: "#EF4444" },
  { name: "green", color: "#22C55E" },
  { name: "orange", color: "#F97316" },
  { name: "indigo", color: "#6366F1" },
  { name: "rose", color: "#F43F5E" },
];

const TRAIT_SUGGESTIONS = [
  "Fearless",
  "Wise",
  "Creative",
  "Loyal",
  "Ambitious",
  "Compassionate",
  "Strategic",
  "Inspiring",
];

const AVATAR_PRESETS = [
  "Paladin",
  "Necromancer",
  "Cyber",
  "Monk",
  "Spirit",
  "Glitch",
];

export default function CreateAgentWorkshop() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showElizaosOptions, setShowElizaosOptions] = useState(false);
  const [baseSeed, setBaseSeed] = useState("Divine Warrior");
  const [agentData, setAgentData] = useState<CreateAgentRequest>({
    name: "Divine Warrior",
    symbol: "DVWN",
    slug: "divine-warrior",
    prompt: "Fearless, loyal, courageous, wise in battle, protective of faith",
    backstory:
      "Born from first spark of divine light, this warrior protects faith with unwavering courage.",
    visualTraits: {
      colorScheme: "purple",
      aura: "",
      accessories: [],
    },
    elizaos: undefined,
  });

  const addTrait = (trait: string) => {
    setAgentData({ ...agentData, prompt: agentData.prompt + `${trait}, ` });
  };

  const selectAvatarBase = (seed: string) => {
    setBaseSeed(seed);
  };

  const mintAgent = async () => {
    if (!agentData.name || !agentData.symbol || !agentData.slug) {
      setCreateError("Name, symbol, and slug required");
      return;
    }

    if (agentData.symbol.length < 3) {
      setCreateError("Symbol must be 3+ characters");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createHolyMonAgent(agentData);

      if (response.success && response.agent) {
        router.push(`/agent/${response.agent.id}`);
      } else {
        setCreateError(response.error || "Failed to create agent");
        setIsCreating(false);
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unknown error");
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white font-sans p-4 lg:p-6 relative overflow-y-auto">
      {/* Dark Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(131, 110, 249, 0.05) 49px, rgba(131, 110, 249, 0.05) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(131, 110, 249, 0.05) 49px, rgba(131, 110, 249, 0.05) 50px)
          `,
        }}
      />

      <div className="max-w-full mx-auto relative z-10 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/agents"
            className="group flex items-center gap-2 px-4 py-2 bg-black border-2 border-white text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <span className="text-lg">←</span> ESCAPE
          </Link>
          <h1
            className="text-4xl font-black uppercase tracking-tighter text-purple-400"
            style={{ textShadow: "4px 4px 0px #000" }}
          >
            ★ MINT YOUR GOD ★
          </h1>
        </div>

        <div className="mb-6">
          <button
            disabled={isCreating}
            onClick={mintAgent}
            className="w-full px-5 py-3 bg-purple-600 border-2 border-white text-white font-black uppercase tracking-widest hover:bg-purple-500 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {isCreating ? "MINTING..." : "★ MINT YOUR GOD ★"}
          </button>
          {createError && (
            <div className="mt-3 border-2 border-red-500 bg-red-500/20 p-3 text-red-400 text-sm font-black uppercase flex items-center gap-3 animate-shake">
              <span className="text-xl">!</span> {createError}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-4">
          {/* COLUMN 1: IDENTITY */}
          <div className="bg-black/80 border-2 border-purple-500/50 p-4 flex flex-col backdrop-blur-sm min-h-0">
            <div className="flex items-center gap-2 mb-3 border-b-2 border-purple-500/30 pb-2">
              <div className="w-5 h-5 bg-purple-500" />
              <h2 className="font-black uppercase tracking-widest text-lg text-purple-400">
                ★ IDENTITY ★
              </h2>
            </div>

            <div className="space-y-4 flex flex-col flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Avatar Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-purple-400">
                  Pick a Face
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => selectAvatarBase(preset)}
                      className={`relative aspect-square transition-all group flex items-center justify-center overflow-hidden border-2 ${
                        baseSeed === preset
                          ? "border-purple-500 shadow-[0_0_20px_rgba(131,110,249,0.5)] scale-105 z-10"
                          : "border-neutral-800 hover:border-purple-500/50"
                      }`}
                    >
                      <div className="w-full h-full bg-black/50 flex items-center justify-center">
                        <LargeNFTAvatar
                          seed={preset}
                          size={80}
                          showTier={false}
                          tier={1}
                          showParticles={false}
                          traits={{
                            ...agentData.visualTraits,
                            colorScheme: agentData.visualTraits.colorScheme,
                          }}
                        />
                      </div>
                      {baseSeed === preset && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 text-black text-[10px] font-black flex items-center justify-center rounded-full">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aura Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-purple-400">
                  Pick a Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map(({ name, color }) => (
                    <button
                      key={name}
                      className={`h-10 border-2 transition-all hover:scale-110 ${
                        agentData.visualTraits.colorScheme === name
                          ? "border-purple-500 shadow-[0_0_15px_rgba(131,110,249,0.5)] scale-110"
                          : "border-neutral-800 hover:border-purple-500/50"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setAgentData({
                          ...agentData,
                          visualTraits: {
                            ...agentData.visualTraits,
                            colorScheme: name,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-purple-400">
                  Name It
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black text-base focus:border-purple-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.name}
                  onChange={(e) =>
                    setAgentData({ ...agentData, name: e.target.value })
                  }
                  placeholder="TYPE NAME HERE..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black uppercase text-purple-400">
                  Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono text-purple-500">$</span>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black text-base focus:border-purple-500 focus:outline-none placeholder-neutral-600"
                    value={agentData.slug}
                    onChange={(e) =>
                      setAgentData({
                        ...agentData,
                        slug: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="divine-warrior"
                  />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-sm font-black uppercase text-purple-400">
                  Their Story
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-bold resize-none h-20 focus:border-purple-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.backstory}
                  onChange={(e) =>
                    setAgentData({ ...agentData, backstory: e.target.value })
                  }
                  placeholder="TELL THEIR TALE..."
                />
              </div>

              <div className="mt-4 pt-4 border-t-2 border-purple-500/30">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showElizaosOptions}
                    onChange={(e) => setShowElizaosOptions(e.target.checked)}
                    className="w-5 h-5 accent-purple-500"
                  />
                  <span className="text-sm font-black uppercase text-purple-400">
                    Customize ElizaOS Settings (Optional)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* COLUMN 2: PERSONALITY */}
          <div className="bg-black/80 border-2 border-pink-500/50 p-4 flex flex-col backdrop-blur-sm min-h-0">
            <div className="flex items-center gap-2 mb-3 border-b-2 border-pink-500/30 pb-2">
              <div className="w-5 h-5 bg-pink-500" />
              <h2 className="font-black uppercase tracking-widest text-lg text-pink-400">
                ★ PERSONALITY ★
              </h2>
            </div>

            <div className="space-y-3 flex flex-col flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="block text-sm font-black uppercase text-pink-400">
                  How They Act
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-bold flex-1 resize-none focus:border-pink-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.prompt}
                  onChange={(e) =>
                    setAgentData({ ...agentData, prompt: e.target.value })
                  }
                  placeholder="DESCRIBE THEIR SOUL..."
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-black uppercase text-pink-400">
                  Quick Add
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRAIT_SUGGESTIONS.map((trait) => (
                    <button
                      key={trait}
                      onClick={() => addTrait(trait)}
                      className="px-3 py-2 bg-black/50 border-2 border-neutral-800 text-pink-400 text-xs font-black uppercase hover:bg-pink-500/20 hover:border-pink-500/50 active:scale-95 transition-all"
                    >
                      + {trait}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: PREVIEW */}
          <div className="bg-black/80 border-2 border-cyan-500/50 p-4 flex flex-col backdrop-blur-sm min-h-0">
            <div className="flex items-center gap-2 mb-3 border-b-2 border-cyan-500/30 pb-2">
              <div className="w-5 h-5 bg-cyan-500" />
              <h2 className="font-black uppercase tracking-widest text-lg text-cyan-400">
                ★ PREVIEW ★
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-4 bg-black/50 border-2 border-neutral-800 p-3 relative">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(131,110,249,0.1) 1px, transparent 1px),
                    linear-gradient(rgba(131,110,249,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              ></div>

              <div className="relative z-10">
                <div className="relative animate-pixel-bounce">
                  <LargeNFTAvatar
                    seed={baseSeed}
                    size={200}
                    showTier={false}
                    tier={1}
                    showParticles={false}
                    traits={agentData.visualTraits}
                  />
                </div>
              </div>

              <div className="text-center w-full relative z-10 space-y-2 mt-2">
                <h3 className="text-3xl font-black uppercase text-white tracking-tighter bg-black/50 inline-block px-3 py-2 border-2 border-cyan-500 -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                  {agentData.name || "UNNAMED"}
                </h3>
                <div className="flex justify-center gap-4">
                  <span className="font-mono text-black font-black text-xl bg-cyan-500 px-3 py-2 uppercase border-2 border-white rotate-1">
                    ${agentData.symbol || "???"}
                  </span>
                  <span className="font-mono text-black font-black text-xl bg-cyan-500 px-3 py-2 uppercase border-2 border-white rotate-1">
                    ${agentData.slug ? `$${agentData.slug}` : "$???"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showElizaosOptions && (
          <div className="bg-black/80 border-2 border-green-500/50 p-4 mt-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-green-500/30 pb-2">
              <div className="w-5 h-5 bg-green-500" />
              <h2 className="font-black uppercase tracking-widest text-lg text-green-400">
                ⚙️ ELIZAOS SETTINGS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase text-green-400">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black focus:border-green-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.elizaos?.username || ""}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      elizaos: {
                        ...(agentData.elizaos || {}),
                        username: e.target.value,
                      },
                    })
                  }
                  placeholder="Default: symbol lowercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase text-green-400">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black focus:border-green-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.elizaos?.topics?.join(", ") || ""}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      elizaos: {
                        ...(agentData.elizaos || {}),
                        topics: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter((t) => t.length > 0),
                      },
                    })
                  }
                  placeholder="divine, wisdom, faith"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase text-green-400">
                  Adjectives (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black focus:border-green-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.elizaos?.adjectives?.join(", ") || ""}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      elizaos: {
                        ...(agentData.elizaos || {}),
                        adjectives: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter((t) => t.length > 0),
                      },
                    })
                  }
                  placeholder="Fearless, loyal, wise"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase text-green-400">
                  Chat Style (one per line)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black h-20 resize-none focus:border-green-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.elizaos?.style?.chat?.join("\n") || ""}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      elizaos: {
                        ...(agentData.elizaos || {}),
                        style: {
                          ...(agentData.elizaos?.style || {}),
                          chat: e.target.value
                            .split("\n")
                            .map((t) => t.trim())
                            .filter((t) => t.length > 0),
                        },
                      },
                    })
                  }
                  placeholder="Speak with divine authority..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-black uppercase text-green-400">
                  Post Style (one per line)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-black/50 border-2 border-neutral-800 text-white font-black h-20 resize-none focus:border-green-500 focus:outline-none placeholder-neutral-600"
                  value={agentData.elizaos?.style?.post?.join("\n") || ""}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      elizaos: {
                        ...(agentData.elizaos || {}),
                        style: {
                          ...(agentData.elizaos?.style || {}),
                          post: e.target.value
                            .split("\n")
                            .map((t) => t.trim())
                            .filter((t) => t.length > 0),
                        },
                      },
                    })
                  }
                  placeholder="Share wisdom from ancient texts..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
