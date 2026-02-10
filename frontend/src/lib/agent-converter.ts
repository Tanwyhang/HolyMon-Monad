import { v4 as uuidv4 } from "uuid";
import type { Character, UUID } from "@elizaos/core";
import type { HolyMonAgent, ElizaOSConfig } from "@/types/agent";

interface HolyMonDataSettings {
  slug: string;
  symbol: string;
  visualTraits: { colorScheme: string; aura: string; accessories: string[] };
  tier: number;
  influence: number;
  staked: number;
  stats: {
    totalBattles: number;
    wins: number;
    losses: number;
    draws?: number;
    winRate: number;
  };
  stakingInfo: {
    currentStake: number;
    stakingTier: number;
    stakingTierName: string;
    dailyRewards: number;
    totalEarned: number;
    multiplier: number;
  };
  abilities: Array<{
    name: string;
    description: string;
    level: number;
    maxLevel: number;
    color: string;
  }>;
  token: {
    deployed: boolean;
    name?: string;
    symbol?: string;
    totalSupply?: number;
    contractAddress?: string;
  };
  owner: string;
  createdAt: string;
}

function defaultStats() {
  return {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
  };
}

function defaultStakingInfo() {
  return {
    currentStake: 0,
    stakingTier: 1,
    stakingTierName: "Initiate",
    dailyRewards: 0,
    totalEarned: 0,
    multiplier: 1.0,
  };
}

function defaultAbilities() {
  return [
    {
      name: "Divine Voice",
      description: "+5% to all persuasion attempts",
      level: 1,
      maxLevel: 10,
      color: "green",
    },
  ];
}

function defaultTokenInfo() {
  return {
    deployed: false,
  };
}

function deriveAdjectivesFromPrompt(prompt: string): string[] {
  return prompt
    .split(/[,.]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
}

function deriveStyleFromAgent(agent: HolyMonAgent): {
  chat?: string[];
  post?: string[];
} {
  const traits = deriveAdjectivesFromPrompt(agent.prompt)
    .slice(0, 3)
    .join(", ");
  return {
    chat: [`Speak in a way that reflects: ${traits}`],
    post: [`Share ${agent.name}'s perspective as: ${traits}`],
  };
}

export function toElizaCharacter(agent: HolyMonAgent): Character {
  const derivedAdjectives = deriveAdjectivesFromPrompt(agent.prompt);
  const derivedStyle = deriveStyleFromAgent(agent);

  const character: Character = {
    id: agent.id as UUID,
    name: agent.name,
    username: agent.elizaos?.username || agent.symbol.toLowerCase(),
    system: agent.prompt,
    bio: agent.backstory,
    settings: {
      holyMonData: {
        slug: agent.slug,
        symbol: agent.symbol,
        visualTraits: agent.visualTraits,
        tier: agent.tier,
        influence: agent.influence,
        staked: agent.staked,
        stats: agent.stats,
        stakingInfo: agent.stakingInfo,
        abilities: agent.abilities,
        token: agent.token,
        owner: agent.owner,
        createdAt: agent.createdAt,
      },
    },
    templates: agent.elizaos?.templates as any,
    messageExamples: agent.elizaos?.messageExamples,
    postExamples: agent.elizaos?.postExamples,
    topics: agent.elizaos?.topics,
    adjectives: agent.elizaos?.adjectives || derivedAdjectives,
    knowledge: agent.elizaos?.knowledge as any,
    plugins: agent.elizaos?.plugins || ["@elizaos/plugin-sql"],
    style: {
      all: agent.elizaos?.style?.all,
      chat: agent.elizaos?.style?.chat || derivedStyle.chat,
      post: agent.elizaos?.style?.post || derivedStyle.post,
    },
  };

  return character;
}

export function fromElizaCharacter(character: Character): HolyMonAgent {
  const settings = character.settings as Record<string, unknown>;
  const hmData = (settings?.holyMonData as HolyMonDataSettings | undefined) || {
    slug: "",
    symbol: "",
    visualTraits: { colorScheme: "purple", aura: "", accessories: [] },
    tier: 1,
    influence: 0,
    staked: 0,
    stats: defaultStats(),
    stakingInfo: defaultStakingInfo(),
    abilities: defaultAbilities(),
    token: defaultTokenInfo(),
    owner: "user",
    createdAt: new Date().toISOString(),
  };

  return {
    id: character.id || uuidv4(),
    name: character.name,
    symbol: hmData.symbol || "",
    slug: hmData.slug || "",
    prompt: character.system || "",
    backstory: Array.isArray(character.bio)
      ? character.bio.join("\n")
      : character.bio || "",
    visualTraits: hmData.visualTraits || {
      colorScheme: "purple",
      aura: "",
      accessories: [],
    },
    tier: hmData.tier || 1,
    influence: hmData.influence || 0,
    staked: hmData.staked || 0,
    description:
      (Array.isArray(character.bio)
        ? character.bio.join("")
        : character.bio || ""
      ).substring(0, 100) + "...",
    owner: hmData.owner || "user",
    createdAt: hmData.createdAt || new Date().toISOString(),
    stats: hmData.stats || defaultStats(),
    stakingInfo: hmData.stakingInfo || defaultStakingInfo(),
    abilities: hmData.abilities || defaultAbilities(),
    token: hmData.token || defaultTokenInfo(),
    elizaos: {
      id: character.id,
      username: character.username,
      templates: character.templates as any,
      messageExamples: character.messageExamples,
      postExamples: character.postExamples,
      topics: character.topics,
      adjectives: character.adjectives,
      knowledge: character.knowledge as any,
      plugins: character.plugins,
      style: character.style,
    },
  };
}

export function validateHolyMonAgent(agent: HolyMonAgent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!agent.id) errors.push("Missing id");
  if (!agent.name) errors.push("Missing name");
  if (!agent.symbol) errors.push("Missing symbol");
  if (!agent.slug) errors.push("Missing slug");
  if (!agent.prompt) errors.push("Missing prompt");
  if (!agent.backstory) errors.push("Missing backstory");
  if (!agent.visualTraits) errors.push("Missing visualTraits");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateElizaCharacter(character: Character): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!character.name) errors.push("Missing name");
  if (!character.system) errors.push("Missing system prompt");
  if (!character.bio) errors.push("Missing bio");
  if (!character.settings) errors.push("Missing settings");

  return {
    valid: errors.length === 0,
    errors,
  };
}
