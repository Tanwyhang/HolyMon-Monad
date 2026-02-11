# 🔗 Plan: Full Real-time ElizaOS Integration for Tournament Arena

## 📋 Overview

Transform the Tournament Arena from procedural mock dialogue to **real AI-powered conversations** using ElizaOS runtime.

---

## 🎯 Goal

- Tournament agents (Divine Light, Void Walker, etc.) use **real ElizaOS personalities**
- AI generates contextual, varied responses instead of templates
- Maintain fast-paced tournament experience (interactions every 2-5 seconds)

---

## 🏗️ Architecture Changes

### Current Flow (Mock)
```
TournamentService → generateDialogue() → Templates → Frontend
```

### New Flow (Real-time ElizaOS)
```
TournamentService → ElizaRuntime → Agent Personality → AI Model → Response → Frontend
```

---

## 📝 Implementation Plan

### Phase 1: ElizaOS Runtime Setup (Backend)

**Files to Create/Modify:**
- `backend/src/services/eliza-runtime.service.ts` (NEW)
- `backend/src/config/eliza-agents.ts` (NEW)

**Actions:**
1. Create `ElizaRuntimeService` to manage ElizaOS agent instances
2. Define personalities for the 8 tournament agents:
   - Divine Light (Gold, prosperity, optimistic)
   - Void Walker (Purple, mysterious, existential)
   - Iron Faith (Red, strength, militant)
   - Emerald Spirit (Green, growth, nature)
   - Crystal Dawn (Cyan, clarity, futuristic)
   - Cyber Monk (Pink, tech, meditation)
   - Neon Saint (Violet, glowing, devotion)
   - Quantum Priest (Blue, quantum, philosophy)
3. Initialize ElizaOS agents with character definitions (system prompts, backstory, traits)
4. Implement `generateResponse(agentId: string, context: string, recipient: string): Promise<string>`

---

### Phase 2: Tournament Service Integration

**File to Modify:**
- `backend/src/services/tournament.service.ts`

**Changes:**
1. Replace `generateDialogue()` with `generateDialogueWithEliza()`
2. For each interaction:
   - Call `ElizaRuntimeService` for both agents
   - Pass context: interaction type, opponent's name, current game phase
   - Await AI responses (with timeout to prevent delays)
   - If AI fails, fall back to procedural template (graceful degradation)

**Pseudo-code:**
```typescript
private async generateDialogueWithEliza(a1: TournamentAgent, a2: TournamentAgent, type: Interaction['type']) {
  // Generate context prompt
  const context = `You are in a ${this.gameState.phase} phase tournament. You are ${a1.name} (${a1.symbol}). Engaging in ${type} with ${a2.name} (${a2.symbol}). Respond in character.`;
  
  // Get responses from ElizaOS
  const [response1, response2] = await Promise.allSettled([
    elizaRuntimeService.generateResponse(a1.id, context, a2.name),
    elizaRuntimeService.generateResponse(a2.id, context, a1.name),
  ]);
  
  // Extract text or use fallback
  const text1 = response1.status === 'fulfilled' ? response1.value : this.getFallbackResponse(a1, a2, type, 0);
  const text2 = response2.status === 'fulfilled' ? response2.value : this.getFallbackResponse(a2, a1, type, 1);
  
  return [
    { senderId: a1.id, text: text1, timestamp: Date.now() },
    { senderId: a2.id, text: text2, timestamp: Date.now() + 1000 }
  ];
}
```

---

### Phase 3: Performance Optimization

**Challenge:** AI responses may be slow (1-3 seconds), breaking fast-paced tournament flow.

**Solutions:**
1. **Pre-generate Responses**: Generate possible responses in background, cache by context
2. **Timeout Fallback**: Set 2-second timeout per agent, fall back to templates
3. **Parallel Requests**: Call both agents simultaneously
4. **Response Pooling**: Pre-warm AI model connections

**Implementation:**
```typescript
private async generateResponseWithTimeout(agentId: string, context: string, timeout = 2000): Promise<string> {
  try {
    return await Promise.race([
      elizaRuntimeService.generateResponse(agentId, context),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
  } catch {
    return this.getFallbackResponse(agentId, context);
  }
}
```

---

### Phase 4: Agent Configuration

**New File: `backend/src/config/eliza-agents.ts`**

Define each tournament agent with rich ElizaOS personality:

```typescript
export const TOURNAMENT_AGENTS = {
  '1': {
    name: 'Divine Light',
    symbol: 'LIGHT',
    elizaos: {
      system: `You are Divine Light, a charismatic prophet of prosperity and abundance. 
        You believe in the power of faith to create wealth and freedom. 
        Your followers seek your guidance for financial and spiritual success.
        Speak with optimism, enthusiasm, and wisdom. Use uplifting language.`,
      topics: ['prosperity', 'faith', 'freedom', 'abundance', 'light'],
      adjectives: ['radiant', 'golden', 'blessed', 'prosperous', 'divine'],
      style: { chat: ['Use exclamation marks sparingly', 'End with uplifting statement'] },
      plugins: ['@elizaos/plugin-openai']
    }
  },
  // ... similar for other 7 agents
};
```

---

### Phase 5: Backend Initialization

**Modify:** `backend/src/index.ts`

```typescript
import { elizaRuntimeService } from './services/eliza-runtime.service';

async function startServer() {
  // Initialize ElizaOS agents
  await elizaRuntimeService.initializeAgents();
  console.log('[Backend] ElizaOS agents initialized');
  
  // Start server...
}
```

---

### Phase 6: Testing & Validation

**Test Scenarios:**
1. Verify ElizaOS agents initialize correctly
2. Test response generation speed (should be < 2s)
3. Test timeout fallback mechanism
4. Verify responses match agent personalities
5. Test concurrent interactions (multiple dialogues at once)

**Success Criteria:**
- All 8 agents respond with in-character dialogue
- Response time: 90% < 2s, 100% < 3s
- Tournament pace maintained (3-5 interactions per round)
- Graceful fallback when AI is slow

---

## 📦 New Files to Create

| File | Purpose |
|------|---------|
| `backend/src/services/eliza-runtime.service.ts` | Manages ElizaOS runtime and agent instances |
| `backend/src/config/eliza-agents.ts` | Tournament agent personality definitions |

## 📝 Files to Modify

| File | Changes |
|------|---------|
| `backend/src/services/tournament.service.ts` | Replace `generateDialogue()` with ElizaOS calls |
| `backend/src/index.ts` | Initialize ElizaOS runtime on startup |
| `backend/package.json` | Add ElizaOS runtime dependencies |

---

## 🚦 Timeline & Complexity

| Phase | Complexity | Est. Time |
|-------|------------|-----------|
| Phase 1: ElizaOS Runtime Setup | High | 2-3 hours |
| Phase 2: Tournament Integration | Medium | 1-2 hours |
| Phase 3: Performance Optimization | High | 2-3 hours |
| Phase 4: Agent Configuration | Medium | 1-2 hours |
| Phase 5: Backend Initialization | Low | 0.5 hours |
| Phase 6: Testing | Medium | 1-2 hours |
| **Total** | | **7.5-12.5 hours** |

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **AI responses too slow** | 2-second timeout with template fallback |
| **ElizaOS initialization fails** | Graceful degradation to procedural mode |
| **High cost (OpenAI API)** | Use cheaper models (GPT-4o-mini) or Groq |
| **Response quality inconsistent** | Refine system prompts iteratively |

---

## 🎁 Bonus Features (If Time Permits)

1. **Agent Memory**: Remember previous interactions and reference them
2. **Dynamic Personality Shift**: Agent personality changes based on game phase (Genesis → Crusade → Apocalypse)
3. **Follower-Based Confidence**: Agents with more followers speak more confidently
4. **Response Variety Cache**: Pre-generate 100 responses per agent per interaction type
