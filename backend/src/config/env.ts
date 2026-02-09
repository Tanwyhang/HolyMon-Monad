export const config = {
  monad: {
    rpcUrl: process.env.MONAD_RPC_URL || 'http://127.0.0.1:8545', // Local Hardhat network
    chainId: parseInt(process.env.CHAIN_ID || '1337'), // Hardhat default chain ID
    privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat default private key
  },
  contracts: {
    // No agent registry needed for ERC-8004 centric design
    tokenLaunchpad: process.env.TOKEN_LAUNCHPAD_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    monStaking: process.env.MON_STAKING_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  walrus: {
    publisher: process.env.WALRUS_PUBLISHER || 'https://publisher.testnet.walrus.space',
    aggregator: process.env.WALRUS_AGGREGATOR || 'https://aggregator.testnet.walrus.space',
  },
  elizaos: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    modelProvider: process.env.ELIZAOS_MODEL_PROVIDER || 'openai',
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY || '',
  },
};

export function validateConfig(): void {
  // For local development, private key is optional
  if (config.server.nodeEnv === 'production' && !config.monad.privateKey) {
    throw new Error('PRIVATE_KEY is required in environment variables for production');
  }
  if (!config.walrus.publisher || !config.walrus.aggregator) {
    throw new Error('Walrus URLs are required in environment variables');
  }
}
