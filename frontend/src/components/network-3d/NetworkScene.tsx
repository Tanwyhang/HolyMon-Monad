import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Agent, Interaction } from './types';
import { useForceLayout } from './physics';
import { AgentNode } from './AgentNode';
import { ConnectionLine } from './ConnectionLine';
import { HierarchyLines } from './HierarchyLines';

interface NetworkSceneProps {
  agents: Agent[];
  interactions: Interaction[];
}

export function NetworkScene({ agents, interactions }: NetworkSceneProps) {
  const layout = useForceLayout(agents, interactions);
  
  // Find Leader (Max Followers)
  const leaderId = useMemo(() => {
    if (agents.length === 0) return null;
    return agents.reduce((prev, current) => 
      (prev.followers > current.followers) ? prev : current
    ).id;
  }, [agents]);
  
  // Stable refs for rendering components to read from
  const visualRefs = useRef<Map<string, THREE.Vector3>>(new Map());

  // Ensure every agent has a visual ref
  useEffect(() => {
    agents.forEach(a => {
      if (!visualRefs.current.has(a.id)) {
        visualRefs.current.set(a.id, new THREE.Vector3());
      }
    });
  }, [agents]);

  // Physics Loop
  useFrame(() => {
    layout.update();
    
    // Sync physics positions to visual refs
    layout.positions.current.forEach((pos, id) => {
      const visualPos = visualRefs.current.get(id);
      if (visualPos) {
        visualPos.copy(pos);
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Structural Hierarchy (Background Lines) */}
      <HierarchyLines agents={agents} visualRefs={visualRefs} />

      {/* Nodes */}
      {agents.map(agent => (
        <AgentNode 
          key={agent.id} 
          agent={agent} 
          isLeader={agent.id === leaderId}
          positionRef={{ current: visualRefs.current.get(agent.id) }} 
        />
      ))}

      {/* Active Interactions (Foreground Beams) */}
      {interactions.map(interaction => {
        const startRef = { current: visualRefs.current.get(interaction.agent1Id) };
        const endRef = { current: visualRefs.current.get(interaction.agent2Id) };
        
        if (!startRef.current || !endRef.current) return null;

        return (
          <ConnectionLine
            key={interaction.id}
            interaction={interaction}
            startRef={startRef}
            endRef={endRef}
          />
        );
      })}
    </group>
  );
}
