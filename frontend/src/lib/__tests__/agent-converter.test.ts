import { describe, it, expect } from "vitest";
import {
  toElizaCharacter,
  fromElizaCharacter,
  validateHolyMonAgent,
  validateElizaCharacter,
} from "@/lib/agent-converter";
import type { HolyMonAgent } from "@/types/agent";

describe("Agent Converter", () => {
  const sampleAgent: HolyMonAgent = {
    id: "test-agent-id",
    name: "Test Agent",
    symbol: "TSTAG",
    slug: "test-agent",
    prompt: "Test prompt",
    backstory: "Test backstory",
    visualTraits: {
      colorScheme: "purple",
      aura: "glowing",
      accessories: ["crown"],
    },
    tier: 2,
    influence: 100,
    staked: 500,
    description: "Test description...",
    owner: "user123",
    createdAt: "2024-01-01T00:00:00.000Z",
    stats: {
      totalBattles: 10,
      wins: 5,
      losses: 4,
      draws: 1,
      winRate: 50,
    },
    stakingInfo: {
      currentStake: 500,
      stakingTier: 2,
      stakingTierName: "Devoted Follower",
      dailyRewards: 0.5,
      totalEarned: 100,
      multiplier: 1.25,
    },
    abilities: [
      {
        name: "Test Ability",
        description: "Test ability",
        level: 3,
        maxLevel: 10,
        color: "green",
      },
    ],
    token: {
      deployed: true,
      name: "Test Token",
      symbol: "TT",
      totalSupply: 1000000,
      contractAddress: "0x123...",
    },
    elizaos: {
      username: "testagent",
      plugins: ["@elizaos/plugin-sql"],
      topics: ["test", "demo"],
      adjectives: ["smart", "friendly"],
    },
  };

  it("should convert HolyMonAgent to Character", () => {
    const character = toElizaCharacter(sampleAgent);

    expect(character).toBeDefined();
    expect(character.name).toBe("Test Agent");
    expect(character.username).toBe("testagent");
    expect(character.plugins).toEqual(["@elizaos/plugin-sql"]);
    expect(character.topics).toEqual(["test", "demo"]);
    expect(character.adjectives).toEqual(["smart", "friendly"]);

    // Check that HolyMon data is in settings
    const settings = character.settings as Record<string, unknown>;
    const hmData = settings?.holyMonData as HolyMonAgent | undefined;
    expect(hmData).toBeDefined();
    expect(hmData?.symbol).toBe("TSTAG");
    expect(hmData?.slug).toBe("test-agent");
    expect(hmData?.tier).toBe(2);
    expect(hmData?.influence).toBe(100);
  });

  it("should convert Character back to HolyMonAgent", () => {
    const character = toElizaCharacter(sampleAgent);
    const agent = fromElizaCharacter(character);

    expect(agent).toBeDefined();
    expect(agent.name).toBe("Test Agent");
    expect(agent.symbol).toBe("TSTAG");
    expect(agent.prompt).toBe("Test prompt");
    expect(agent.backstory).toBe("Test backstory");
    expect(agent.tier).toBe(2);
    expect(agent.influence).toBe(100);
    expect(agent.staked).toBe(500);
    expect(agent.elizaos?.username).toBe("testagent");
    expect(agent.elizaos?.plugins).toEqual(["@elizaos/plugin-sql"]);
  });

  it("should validate HolyMonAgent", () => {
    const validation = validateHolyMonAgent(sampleAgent);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should validate ElizaOS Character", () => {
    const character = toElizaCharacter(sampleAgent);
    const validation = validateElizaCharacter(character);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should handle agent without ElizaOS config", () => {
    const basicAgent: HolyMonAgent = {
      ...sampleAgent,
      elizaos: undefined,
    };

    const character = toElizaCharacter(basicAgent);
    expect(character).toBeDefined();
    expect(character.name).toBe("Test Agent");
    expect(character.username).toBe("testagent"); // Should use lowercase slug
    expect(character.plugins).toEqual(["@elizaos/plugin-sql"]); // Default plugin
  });
});
