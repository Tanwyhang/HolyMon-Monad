"use client";

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnimationProvider } from './AnimationContext';
import { CharacterScene } from './CharacterScene';
import { AnimationControls } from './AnimationControls';

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
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2}
            maxDistance={100}
            minDistance={5}
            target={[0, 2, 0]}
          />
        </Canvas>
        <AnimationControls />
      </AnimationProvider>
    </div>
  );
}
