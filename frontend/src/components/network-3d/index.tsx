"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NetworkScene } from './NetworkScene';
import { Agent, Interaction } from './types';

interface AgentNetworkProps {
  agents: Agent[];
  interactions: Interaction[];
}

export default function AgentNetwork3D({ agents, interactions }: AgentNetworkProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 20, 60], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]} // Handle HiDPI
      >
        <NetworkScene agents={agents} interactions={interactions} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          autoRotate 
          autoRotateSpeed={0.5} 
          maxDistance={200}
          minDistance={10}
        />
      </Canvas>
    </div>
  );
}
