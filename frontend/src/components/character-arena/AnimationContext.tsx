"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AnimationState, NPCInstance } from './types';

interface AnimationContextType {
  jesusState: AnimationState;
  npcs: NPCInstance[];
  actionInProgress: boolean;

  spawnNPC: () => void;
  triggerTalk: () => void;
  triggerSuccess: () => void;
  triggerFail: () => void;
  resetArena: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [jesusState, setJesusState] = useState<AnimationState>('idle');
  const [npcs, setNPCs] = useState<NPCInstance[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  const spawnNPC = useCallback(() => {
    if (actionInProgress) return;

    const newNPC: NPCInstance = {
      id: `npc-${Date.now()}-${Math.random()}`,
      baseModelIndex: Math.floor(Math.random() * 5), // Unconverted 1-5
      position: [
        (Math.random() - 0.5) * 30, // Random X
        0,                           // Ground level
        (Math.random() - 0.5) * 20,  // Random Z
      ],
      currentAnimation: 'walking',
      isConverted: false,
      walkAnimationIndex: Math.floor(Math.random() * 3), // Store walk 1-3
    };

    setNPCs(prev => [...prev, newNPC]);
  }, [actionInProgress]);

  const triggerTalk = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setJesusState('talking');

    // Set all NPCs to random idle
    setNPCs(prev => prev.map(npc => ({
      ...npc,
      currentAnimation: 'talking',
    })));

    // Reset after animation duration
    setTimeout(() => {
      setActionInProgress(false);
    }, 3000);
  }, [actionInProgress]);

  const triggerSuccess = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);

    // Jesus cheers; NPCs run their own timeline (Idle3+spin → 4s load converted → 4–6s opacity crossfade → 9s Success anim)
    setJesusState('cheering');
    setNPCs(prev => prev.map(npc => ({
      ...npc,
      currentAnimation: 'cheering',
      // isConverted set at 6s when crossfade completes
    })));

    setTimeout(() => {
      setNPCs(prev => prev.map(npc => ({ ...npc, isConverted: true })));
    }, 6000);

    setTimeout(() => {
      setActionInProgress(false);
    }, 12000);
  }, [actionInProgress]);

  const triggerFail = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);

    // Jesus: Walk Backward once (~2.5s), then Flying Kick once
    setJesusState('walkBackward');

    const walkBackwardMs = 1000;
    const flyingKickMs = 1500;
    const npcFailedMs = 2000;

    setTimeout(() => {
      setJesusState('flyingKick');
      setNPCs(prev => prev.map(npc => ({
        ...npc,
        currentAnimation: 'flyingKick', // NPCs play Failed 1 or Failed 2
      })));
    }, walkBackwardMs);

    setTimeout(() => {
      setJesusState('idle');
    }, walkBackwardMs + flyingKickMs);

    setTimeout(() => {
      setNPCs(prev => prev.map(npc => ({
        ...npc,
        currentAnimation: 'walking', // Back to their own Walk 1/2/3
      })));
    }, walkBackwardMs + npcFailedMs);

    setTimeout(() => {
      setActionInProgress(false);
    }, walkBackwardMs + Math.max(flyingKickMs, npcFailedMs) + 500);
  }, [actionInProgress]);

  const resetArena = useCallback(() => {
    setJesusState('idle');
    setNPCs([]);
    setActionInProgress(false);
  }, []);

  return (
    <AnimationContext.Provider value={{
      jesusState,
      npcs,
      actionInProgress,
      spawnNPC,
      triggerTalk,
      triggerSuccess,
      triggerFail,
      resetArena,
    }}>
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return context;
};
