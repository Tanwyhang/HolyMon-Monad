export const config = {
  monad: {
    rpcUrl: process.env.MONAD_RPC_URL || 'http://127.0.0.1:8545',
    chainId: parseInt(process.env.CHAIN_ID || '1337'),
    privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  contracts: {
    agentRegistry: process.env.AGENT_REGISTRY_ADDRESS || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    tokenLaunchpad: process.env.TOKEN_LAUNCHPAD_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    monStaking: process.env.MON_STAKING_ADDRESS || '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  },
  elizaos: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    modelProvider: process.env.ELIZAOS_MODEL_PROVIDER || 'groq',
    hybridRatio: parseFloat(process.env.ELIZAOS_HYBRID_RATIO || '0.05'),
    cacheTTL: parseInt(process.env.ELIZAOS_CACHE_TTL || '1800000'),
    llmTimeout: parseInt(process.env.ELIZAOS_LLM_TIMEOUT || '5000'),
    rateLimit: {
      maxRequestsPerMinute: parseInt(process.env.ELIZAOS_RATE_LIMIT_RPM || '10'),
      maxTokensPerMinute: parseInt(process.env.ELIZAOS_RATE_LIMIT_TPM || '5000'),
      maxDailyRequests: parseInt(process.env.ELIZAOS_MAX_DAILY_REQUESTS || '1000'),
    },
    costLimit: {
      maxDailyCostUSD: parseFloat(process.env.ELIZAOS_MAX_DAILY_COST || '2.00'),
      costPer1kTokens: parseFloat(process.env.ELIZAOS_COST_PER_1K_TOKENS || '0.08'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '8765'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY || '',
  },
  x402: {
    endpoint: process.env.X402_ENDPOINT || 'http://localhost:8080/api/connect',
    costPerConnection: parseFloat(process.env.X402_COST_PER_CONNECTION || '0.01'),
    costPerConversion: parseFloat(process.env.X402_COST_PER_CONVERSION || '0.005'),
    timeout: parseInt(process.env.X402_TIMEOUT || '5000'),
  },
  religion: {
    npcCount: parseInt(process.env.RELIGION_NPC_COUNT || '20'),
    missionaryChance: parseFloat(process.env.RELIGION_MISSIONARY_CHANCE || '0.2'),
    scriptureGenerationChance: parseFloat(process.env.RELIGION_SCRIPTURE_CHANCE || '0.15'),
    parableGenerationChance: parseFloat(process.env.RELIGION_PARABLE_CHANCE || '0.1'),
    prophecyGenerationChance: parseFloat(process.env.RELIGION_PROPHECY_CHANCE || '0.05'),
    conversionThreshold: parseFloat(process.env.RELIGION_CONVERSION_THRESHOLD || '0.4'),
  },

};

export function validateConfig(): void {
  // For local development, private key is optional
  if (config.server.nodeEnv === 'production' && !config.monad.privateKey) {
    throw new Error('PRIVATE_KEY is required in environment variables for production');
  }
}

