import type { APIResponse } from '../types';
import { config } from '../config/env';

export function handleHealthCheck(): APIResponse {
  return {
    success: true,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      version: '1.0.0',
      monadChainId: config.monad.chainId,
      contracts: {
        agentRegistry: config.contracts.agentRegistry || 'Not deployed',
        tokenLaunchpad: config.contracts.tokenLaunchpad || 'Not deployed',
        monStaking: config.contracts.monStaking || 'Not deployed',
      },
      elizaos: {
        initialized: true,
        modelProvider: config.elizaos.modelProvider,
      },
    },
  };
}
