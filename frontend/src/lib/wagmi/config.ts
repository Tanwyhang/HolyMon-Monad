import { http, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { monad } from "./monad-chain";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "39ee1a63fbd5c8bb51d6b3e0809b472d";

export const config = createConfig({
  chains: [monad],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: "HolyMon",
        description: "HolyMon - Your Monad DeFi Experience",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://holymon.xyz",
        icons: ["https://holymon.xyz/icon.png"],
      },
      showQrModal: true,
    }),
  ],
  ssr: true,
  transports: {
    [monad.id]: http(),
  },
});
