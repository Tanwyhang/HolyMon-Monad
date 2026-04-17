"use client";

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimationProvider } from './AnimationContext';
import { CharacterScene } from './CharacterScene';
import { useAnimationContext } from './AnimationContext';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[#050505]">
      <div className="text-purple-500 text-2xl font-bold animate-pulse">
        Loading 3D Arena...
      </div>
    </div>
  );
}

function ArenaButtons() {
  const {
    triggerFullFlow,
    triggerBossMeetTalkDeal,
    triggerNpcMeetTalkFail,
    triggerNpcMeetTalkSuccess,
    triggerCrowdCheer,
    actionInProgress,
  } = useAnimationContext();
  const [fullFlowHidden, setFullFlowHidden] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 z-10">
      {!fullFlowHidden && (
        <button
          type="button"
          onClick={() => {
            triggerFullFlow();
            setFullFlowHidden(true);
          }}
          disabled={actionInProgress}
          className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg"
        >
          1
        </button>
      )}
      <button
        type="button"
        onClick={triggerBossMeetTalkDeal}
        disabled={actionInProgress}
        className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg"
      >
        2
      </button>
      <button
        type="button"
        onClick={triggerNpcMeetTalkFail}
        disabled={actionInProgress}
        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg"
      >
        3
      </button>
      <button
        type="button"
        onClick={triggerNpcMeetTalkSuccess}
        disabled={actionInProgress}
        className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg"
      >
        4
      </button>
      <button
        type="button"
        onClick={triggerCrowdCheer}
        disabled={actionInProgress}
        className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg"
      >
        5
      </button>
    </div>
  );
}

export default function CharacterArena() {
  return (
    <div className="w-full h-screen relative bg-[#050505]">
      <AnimationProvider>
        <Canvas
          camera={{ position: [0, 8, 25], fov: 50, near: 0.1, far: 1000 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <CharacterScene />
          </Suspense>
        </Canvas>
        <ArenaButtons />
      </AnimationProvider>
    </div>
  );
}
