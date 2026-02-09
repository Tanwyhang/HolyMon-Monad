"use client";

import { useAccount, useDisconnect } from "wagmi";
import { web3Modal } from "@/lib/wagmi/web3modal";
import { useState } from "react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isHovered, setIsHovered] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative inline-flex items-center justify-center"
      >
        <span
          className={`absolute inset-0 w-full h-full bg-[#836EF9] transition-transform duration-200 ease-out border-4 border-black ${
            isHovered
              ? "translate-x-3 translate-y-3"
              : "translate-x-2 translate-y-2"
          }`}
        />
        <span
          className={`relative inline-block px-6 py-3 bg-white border-4 border-black text-black font-bold text-sm uppercase tracking-widest transition-transform duration-200 ease-out hover:bg-amber-400 ${
            isHovered ? "-translate-y-1 -translate-x-1" : ""
          }`}
        >
          {formatAddress(address)}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => web3Modal.open()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative inline-flex items-center justify-center"
    >
      <span
        className={`absolute inset-0 w-full h-full bg-[#836EF9] transition-transform duration-200 ease-out border-4 border-black ${
          isHovered
            ? "translate-x-3 translate-y-3"
            : "translate-x-2 translate-y-2"
        }`}
      />
      <span
        className={`relative inline-block px-6 py-3 bg-white border-4 border-black text-black font-bold text-sm uppercase tracking-widest transition-transform duration-200 ease-out hover:bg-amber-400 ${
          isHovered ? "-translate-y-1 -translate-x-1" : ""
        }`}
      >
        Connect Wallet
      </span>
    </button>
  );
}
