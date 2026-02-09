import type { HolyMonAgent, CreateAgentRequest } from "@/types/agent";
import { v4 as uuidv4 } from "uuid";
import {
  toElizaCharacter,
  fromElizaCharacter,
  validateHolyMonAgent,
} from "@/lib/agent-converter";
import type { Character } from "@elizaos/core";

const AGENTS_KEY = "holymon_agents";

function getStoredAgents(): HolyMonAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(AGENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(
      "[Agent Storage] Error reading agents from localStorage:",
      error,
    );
    return [];
  }
}

function saveStoredAgents(agents: HolyMonAgent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  } catch (error) {
    console.error(
      "[Agent Storage] Error saving agents to localStorage:",
      error,
    );
  }
}

function calculateInitialStats(): HolyMonAgent["stats"] {
  return {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
  };
}

function calculateInitialStaking(): HolyMonAgent["stakingInfo"] {
  return {
    currentStake: 0,
    stakingTier: 1,
    stakingTierName: "Initiate",
    dailyRewards: 0,
    totalEarned: 0,
    multiplier: 1.0,
  };
}

function generateInitialAbilities(): HolyMonAgent["abilities"] {
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

function generateTokenInfo(): HolyMonAgent["token"] {
  return {
    deployed: false,
  };
}

export function createAgent(request: CreateAgentRequest): HolyMonAgent {
  const id = uuidv4();
  const now = new Date().toISOString();

  const agent: HolyMonAgent = {
    id,
    name: request.name,
    symbol: request.symbol.toUpperCase(),
    slug: request.slug.toLowerCase(),
    prompt: request.prompt,
    backstory: request.backstory,
    visualTraits: request.visualTraits,
    tier: 1,
    influence: 0,
    staked: 0,
    description: request.backstory.substring(0, 100) + "...",
    owner: request.owner || "user",
    createdAt: now,
    stats: calculateInitialStats(),
    stakingInfo: calculateInitialStaking(),
    abilities: generateInitialAbilities(),
    token: generateTokenInfo(),
    elizaos: {
      username: request.elizaos?.username,
      plugins: request.elizaos?.plugins,
      messageExamples: request.elizaos?.messageExamples,
      postExamples: request.elizaos?.postExamples,
      topics: request.elizaos?.topics,
      adjectives: request.elizaos?.adjectives,
      style: request.elizaos?.style,
      templates: request.elizaos?.templates,
      knowledge: request.elizaos?.knowledge,
    },
  };

  const agents = getStoredAgents();
  agents.push(agent);
  saveStoredAgents(agents);

  return agent;
}

export function getAgents(): HolyMonAgent[] {
  return getStoredAgents();
}

export function getAgentById(id: string): HolyMonAgent | null {
  const agents = getStoredAgents();
  return agents.find((a) => a.id === id) || null;
}

export function getAgentsByOwner(owner: string): HolyMonAgent[] {
  const agents = getStoredAgents();
  return agents.filter((a) => a.owner === owner);
}

export function updateAgent(
  id: string,
  updates: Partial<HolyMonAgent>,
): HolyMonAgent | null {
  const agents = getStoredAgents();
  const index = agents.findIndex((a) => a.id === id);

  if (index === -1) return null;

  agents[index] = { ...agents[index], ...updates };
  saveStoredAgents(agents);

  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const agents = getStoredAgents();
  const filtered = agents.filter((a) => a.id !== id);

  if (filtered.length === agents.length) return false;

  saveStoredAgents(filtered);
  return true;
}

export function getAgentStatsSummary() {
  const agents = getStoredAgents();

  return {
    totalAgents: agents.length,
    totalStaked: agents.reduce((sum, a) => sum + a.staked, 0),
    totalInfluence: agents.reduce((sum, a) => sum + a.influence, 0),
    averageTier:
      agents.length > 0
        ? agents.reduce((sum, a) => sum + a.tier, 0) / agents.length
        : 0,
  };
}

/**
 * Get a HolyMon agent as an ElizaOS Character
 */
export function getAgentAsCharacter(id: string): Character | null {
  const agent = getAgentById(id);
  if (!agent) return null;

  const validation = validateHolyMonAgent(agent);
  if (!validation.valid) {
    console.warn("[Agent Storage] Agent validation failed:", validation.errors);
  }

  return toElizaCharacter(agent);
}

/**
 * Get all HolyMon agents as ElizaOS Characters
 */
export function getAllAgentsAsCharacters(): Character[] {
  const agents = getStoredAgents();
  return agents.map((agent) => toElizaCharacter(agent));
}

/**
 * Validate a HolyMon agent can be converted to Character
 */
export function validateAgent(id: string): {
  valid: boolean;
  errors: string[];
} {
  const agent = getAgentById(id);
  if (!agent) {
    return { valid: false, errors: ["Agent not found"] };
  }
  return validateHolyMonAgent(agent);
}
