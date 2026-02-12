export const config = {
  monad: {
    rpcUrl: process.env.MONAD_RPC_URL || 'http://127.0.0.1:8545', // Local Hardhat network
    chainId: parseInt(process.env.CHAIN_ID || '1337'), // Hardhat default chain ID
    privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat default private key
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
    hybridRatio: parseFloat(process.env.ELIZAOS_HYBRID_RATIO || '0.5'),
    cacheTTL: parseInt(process.env.ELIZAOS_CACHE_TTL || '300000'),
    llmTimeout: parseInt(process.env.ELIZAOS_LLM_TIMEOUT || '10000'),
  },
  server: {
    port: parseInt(process.env.PORT || '8765'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY || '',
  },
};

export function validateConfig(): void {
  // For local development, private key is optional
  if (config.server.nodeEnv === 'production' && !config.monad.privateKey) {
    throw new Error('PRIVATE_KEY is required in environment variables for production');
  }
}

