# ElizaOS Agent Integration

This directory contains the converter utilities for 100% ElizaOS compatibility with HolyMon agents.

## Architecture

### Bidirectional Conversion

The `agent-converter.ts` provides bidirectional conversion between HolyMon agents and ElizaOS Characters:

1. **HolyMon → ElizaOS**: `toElizaCharacter(agent: HolyMonAgent): Character`

   - Converts HolyMon agent data to ElizaOS Character format
   - Stores HolyMon-specific fields in `Character.settings.holyMonData`
   - Maps core fields: `prompt` → `system`, `backstory` → `bio`
   - Preserves ElizaOS configuration from `agent.elizaos`

2. **ElizaOS → HolyMon**: `fromElizaCharacter(character: Character): HolyMonAgent`
   - Extracts HolyMon data from `Character.settings.holyMonData`
   - Preserves ElizaOS configuration in `agent.elizaos`
   - Handles missing HolyMon data with defaults

### Data Preservation

All HolyMon-specific data is preserved in the conversion process:

| HolyMon Field | ElizaOS Location                  |
| ------------- | --------------------------------- |
| symbol        | settings.holyMonData.symbol       |
| visualTraits  | settings.holyMonData.visualTraits |
| tier          | settings.holyMonData.tier         |
| influence     | settings.holyMonData.influence    |
| staked        | settings.holyMonData.staked       |
| stats         | settings.holyMonData.stats        |
| stakingInfo   | settings.holyMonData.stakingInfo  |
| abilities     | settings.holyMonData.abilities    |
| token         | settings.holyMonData.token        |
| owner         | settings.holyMonData.owner        |

ElizaOS configuration is stored in `agent.elizaos`:

| ElizaOS Field   | Location                      |
| --------------- | ----------------------------- |
| id              | agent.elizaos.id              |
| username        | agent.elizaos.username        |
| plugins         | agent.elizaos.plugins         |
| messageExamples | agent.elizaos.messageExamples |
| postExamples    | agent.elizaos.postExamples    |
| topics          | agent.elizaos.topics          |
| adjectives      | agent.elizaos.adjectives      |
| style           | agent.elizaos.style           |
| templates       | agent.elizaos.templates       |
| knowledge       | agent.elizaos.knowledge       |

## API Usage

### Format Parameter

All agent API endpoints support a `format` query parameter:

```typescript
// Get HolyMon format (default)
GET /api/agent/123 -> returns HolyMonAgent

// Get ElizaOS Character format
GET /api/agent/123?format=character -> returns Character

// List in ElizaOS format
GET /api/agent/list?format=character -> returns Character[]

// Create and get Character format
POST /api/agent/create?format=character -> returns Character
```

### API Client Methods

```typescript
import {
  getHolyMonAgent,
  getHolyMonAgentAsCharacter,
  createHolyMonAgent,
  createHolyMonAgentAsCharacter,
  getHolyMonAgents,
  getHolyMonAgentsAsCharacters,
} from "@/lib/api-client";
```

### Storage Methods

```typescript
import {
  getAgentById,
  getAgentAsCharacter,
  getAgents,
  getAllAgentsAsCharacters,
  validateAgent,
} from "@/lib/agent-storage";
```

## Converter Methods

### toElizaCharacter(agent: HolyMonAgent): Character

Converts a HolyMon agent to ElizaOS Character.

**Key Mappings:**

- `agent.id` → `character.id` (as UUID)
- `agent.name` → `character.name`
- `agent.symbol` → `character.username` (lowercase, or from `agent.elizaos.username` if provided)
- `agent.prompt` → `character.system`
- `agent.backstory` → `character.bio`
- HolyMon fields → `character.settings.holyMonData`
- ElizaOS fields → direct mapping

**Example:**

```typescript
const agent: HolyMonAgent = {
  id: "abc-123",
  name: "Divine Warrior",
  symbol: "DVWN",
  prompt: "You are a divine warrior...",
  backstory: "Born from first spark of divine light...",
  visualTraits: { colorScheme: "purple", aura: "glowing", accessories: [] },
  // ... other HolyMon fields
};

const character = toElizaCharacter(agent);
console.log(character.system); // "You are a divine warrior..."
console.log(character.settings?.holyMonData?.symbol); // "DVWN"
```

### fromElizaCharacter(character: Character): HolyMonAgent

Converts an ElizaOS Character back to HolyMon agent.

**Key Mappings:**

- `character.id` → `agent.id`
- `character.name` → `agent.name`
- `character.username` → `agent.elizaos.username`
- `character.system` → `agent.prompt`
- `character.bio` → `agent.backstory`
- `character.settings.holyMonData` → HolyMon fields
- ElizaOS fields → `agent.elizaos`

**Example:**

```typescript
const character: Character = {
  id: "abc-123" as UUID,
  name: "Divine Warrior",
  system: "You are a divine warrior...",
  bio: "Born from first spark of divine light...",
  username: "divinewarrior",
  settings: {
    holyMonData: {
      symbol: "DVWN",
      visualTraits: { colorScheme: "purple", aura: "glowing", accessories: [] },
      // ... other HolyMon fields
    },
  },
  // ... other ElizaOS fields
};

const agent = fromElizaCharacter(character);
console.log(agent.symbol); // "DVWN"
console.log(agent.elizaos?.username); // "divinewarrior"
```

### validateHolyMonAgent(agent: HolyMonAgent): ValidationResult

Validates that a HolyMon agent can be converted to ElizaOS Character.

**Returns:**

```typescript
{
  valid: boolean; // true if all required fields are present
  errors: string[]; // list of missing/invalid fields
}
```

### validateElizaCharacter(character: Character): ValidationResult

Validates that an ElizaOS Character can be converted to HolyMon agent.

**Returns:**

```typescript
{
  valid: boolean; // true if all required fields are present
  errors: string[]; // list of missing/invalid fields
}
```

## Type Definitions

### ElizaOSConfig

Optional ElizaOS configuration for HolyMon agents:

```typescript
interface ElizaOSConfig {
  id?: string;
  username?: string;
  templates?: Record<string, string>;
  messageExamples?: MessageExample[][];
  postExamples?: string[];
  topics?: string[];
  adjectives?: string[];
  knowledge?: string[] | KnowledgeItem[];
  plugins?: string[];
  style?: {
    all?: string[];
    chat?: string[];
    post?: string[];
  };
}
```

### HolyMonAgent (Extended)

HolyMon agents now include optional ElizaOS configuration:

```typescript
interface HolyMonAgent {
  // HolyMon-specific fields
  id: string;
  name: string;
  symbol: string;
  prompt: string;
  backstory: string;
  visualTraits: VisualTraits;
  tier: number;
  influence: number;
  staked: number;
  description: string;
  owner: string;
  createdAt: string;
  stats: AgentStats;
  stakingInfo: StakingInfo;
  abilities: AgentAbility[];
  token: AgentToken;

  // NEW: Optional ElizaOS configuration
  elizaos?: ElizaOSConfig;
}
```

## Testing

Run tests with:

```bash
npm run test agent-converter
```

Tests cover:

- Bidirectional conversion
- Data preservation
- Validation
- Default handling
- Missing data scenarios

## Usage Patterns

### Create Agent with ElizaOS Config

```typescript
import { createHolyMonAgent } from "@/lib/api-client";

const request: CreateAgentRequest = {
  name: "Divine Warrior",
  symbol: "DVWN",
  prompt: "You are a divine warrior...",
  backstory: "Born from first spark of divine light...",
  visualTraits: { colorScheme: "purple", aura: "glowing", accessories: [] },
  owner: "user123",
  elizaos: {
    username: "divinewarrior",
    plugins: ["@elizaos/plugin-sql", "@elizaos/plugin-openai"],
    topics: ["divine", "warfare", "protection"],
    adjectives: ["fierce", "loyal", "wise"],
    style: {
      chat: ["Speak with divine authority", "Use metaphors of light"],
      post: ["Share wisdom from ancient texts", "Inspire followers"],
    },
  },
};

const response = await createHolyMonAgent(request);
console.log(response.agent);
```

### Get Agent as ElizaOS Character

```typescript
import { getHolyMonAgentAsCharacter } from "@/lib/api-client";

const character = await getHolyMonAgentAsCharacter("agent-id");
if (character) {
  // Now you have a fully ElizaOS-compatible Character
  console.log(character.system);
  console.log(character.plugins);
  console.log(character.messageExamples);
}
```

### Use with ElizaOS Runtime

```typescript
import { getAgentAsCharacter } from "@/lib/agent-storage";
import { AgentRuntime } from "@elizaos/core";

const character = getAgentAsCharacter("agent-id");
if (character) {
  // Character can be loaded into ElizaOS runtime
  const runtime = new AgentRuntime(character);
  await runtime.initialize();
}
```

## Best Practices

1. **Always Validate**: Use validation functions before conversion

   ```typescript
   const validation = validateHolyMonAgent(agent);
   if (!validation.valid) {
     console.error("Invalid agent:", validation.errors);
     return;
   }
   ```

2. **Handle Missing Data**: Provide defaults for optional fields

   ```typescript
   const hmData = character.settings?.holyMonData as HolyMonDataSettings;
   const symbol = hmData?.symbol || "";
   ```

3. **Use Format Parameter**: Request the format you need

   ```typescript
   // Get HolyMon format for UI
   const agent = await getHolyMonAgent(id);

   // Get ElizaOS format for runtime
   const character = await getHolyMonAgentAsCharacter(id);
   ```

4. **Preserve ElizaOS Config**: Store ElizaOS configuration in agent.elizaos
   ```typescript
   agent.elizaos = {
     plugins: ["@elizaos/plugin-sql"],
     style: { ... },
   };
   ```

## Migration Guide

For existing HolyMon agents without ElizaOS configuration:

1. Agents created before this update will have `elizaos: undefined`
2. Default values will be used when converting to Character:
   - `username`: lowercase symbol
   - `plugins`: `["@elizaos/plugin-sql"]`
   - All other ElizaOS fields: `undefined`

To add ElizaOS configuration to existing agents:

```typescript
import { updateAgent } from "@/lib/agent-storage";

const agent = getAgentById("agent-id");
if (agent) {
  const updated = await updateAgent("agent-id", {
    elizaos: {
      username: "custom-username",
      plugins: ["@elizaos/plugin-sql", "@elizaos/plugin-openai"],
      topics: ["custom-topic"],
      // ... other ElizaOS fields
    },
  });
}
```

## Future Enhancements

- [ ] Add support for ElizaOS MessageExample generation based on HolyMon traits
- [ ] Auto-generate style guides from visual traits
- [ ] Create HolyMon-specific plugins for ElizaOS
- [ ] Add validation for ElizaOS field constraints
- [ ] Implement migration script for existing agents
