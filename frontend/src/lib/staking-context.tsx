"use client";

import { createContext, useContext, ReactNode } from "react";

interface StakingContextType {
  refreshStakingData: () => void;
}

const StakingContext = createContext<StakingContextType | undefined>(undefined);

export function StakingProvider({ children }: { children: ReactNode }) {
  const refreshStakingData = () => {
    window.dispatchEvent(new CustomEvent("refresh-staking"));
  };

  return (
    <StakingContext.Provider value={{ refreshStakingData }}>
      {children}
    </StakingContext.Provider>
  );
}

export function useStakingContext() {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error("useStakingContext must be used within a StakingProvider");
  }
  return context;
}
