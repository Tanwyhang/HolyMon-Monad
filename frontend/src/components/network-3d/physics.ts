import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Agent, Interaction } from './types';

export function useForceLayout(agents: Agent[], interactions: Interaction[]) {
  const positions = useRef<Map<string, THREE.Vector3>>(new Map());
  const velocities = useRef<Map<string, THREE.Vector3>>(new Map());

  // Config
  const REPULSION = 300;      // Reduced repulsion to pull them tight
  const ATTRACTION = 0.02;    // Strong connection pull
  const CENTER_PULL = 0.04;   // Strong center gravity for a dense core
  const DAMPING = 0.90;       // Balanced damping

  // Initialize positions for new agents
  useEffect(() => {
    agents.forEach(agent => {
      if (!positions.current.has(agent.id)) {
        positions.current.set(agent.id, new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        ));
        velocities.current.set(agent.id, new THREE.Vector3());
      }
    });
  }, [agents]);

  const update = () => {
    const posMap = positions.current;
    const velMap = velocities.current;

    agents.forEach(a1 => {
      const p1 = posMap.get(a1.id);
      const v1 = velMap.get(a1.id);
      if (!p1 || !v1) return;

      // 1. Repulsion
      agents.forEach(a2 => {
        if (a1.id === a2.id) return;
        const p2 = posMap.get(a2.id);
        if (!p2) return;

        const diff = new THREE.Vector3().subVectors(p1, p2);
        const distSq = diff.lengthSq();
        
        // Always apply repulsion, but cap minimum distance to prevent infinity
        // Increase effective radius
        const effectiveDistSq = Math.max(distSq, 1.0); 
        
        const force = diff.normalize().multiplyScalar(REPULSION / effectiveDistSq);
        v1.add(force);
      });

      // 2. Center Pull
      v1.sub(p1.clone().multiplyScalar(CENTER_PULL));

      // 3. Edge Attraction
      interactions.forEach(int => {
        let targetId = null;
        if (int.agent1Id === a1.id) targetId = int.agent2Id;
        else if (int.agent2Id === a1.id) targetId = int.agent1Id;

        if (targetId) {
          const p2 = posMap.get(targetId);
          if (p2) {
            const diff = new THREE.Vector3().subVectors(p2, p1);
            v1.add(diff.multiplyScalar(ATTRACTION));
          }
        }
      });

      // 4. Apply
      v1.multiplyScalar(DAMPING);
      v1.clampLength(0, 0.5);
      p1.add(v1);
    });
  };

  return {
    positions,
    update
  };
}
