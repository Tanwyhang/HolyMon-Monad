import { createWeb3Modal } from "@web3modal/wagmi/react";
import { config } from "./config";

export const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "39ee1a63fbd5c8bb51d6b3e0809b472d",
  enableAnalytics: true,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#836EF9",
    "--w3m-color-bg-1": "#050505",
    "--w3m-color-bg-2": "#0a0a0a",
    "--w3m-color-bg-3": "#141414",
    "--w3m-color-fg-1": "#ffffff",
    "--w3m-color-fg-2": "#e5e5e5",
    "--w3m-color-fg-3": "#a3a3a3",
    "--w3m-color-border": "#262626",
    "--w3m-success": "#836EF9",
    "--w3m-error": "#dc2626",
    "--w3m-warning": "#f59e0b",
    "--w3m-info": "#3b82f6",
  } as any,
});
