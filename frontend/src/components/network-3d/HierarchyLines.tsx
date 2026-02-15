import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Agent } from "./types";

interface HierarchyLinesProps {
  agents: Agent[];
  visualRefs: React.MutableRefObject<Map<string, THREE.Vector3>>;
}

export function HierarchyLines({ agents, visualRefs }: HierarchyLinesProps) {
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);

  // Buffer size: Max possible lines = agents.length.
  // Each line has 2 points (start, end). Each point has 3 coords (x,y,z).
  const maxLines = agents.length;
  const positions = useMemo(
    () => new Float32Array(maxLines * 2 * 3),
    [maxLines],
  );

  useFrame(() => {
    if (!lineGeometryRef.current) return;

    let lineIndex = 0;
    const posMap = visualRefs.current;

    agents.forEach((agent) => {
      const myPos = posMap.get(agent.id);
      if (!myPos) return;

      // Logic: Connect to the CLOSEST agent that has MORE followers
      // This creates a "gradient tree" pointing towards the leaders
      let bestParentId = null;
      let minDistSq = Infinity;

      agents.forEach((other) => {
        if (other.id === agent.id) return;
        // Strict inequality avoids cycles.
        if (other.followers > agent.followers) {
          const otherPos = posMap.get(other.id);
          if (otherPos) {
            const dSq = myPos.distanceToSquared(otherPos);
            if (dSq < minDistSq) {
              minDistSq = dSq;
              bestParentId = other.id;
            }
          }
        }
      });

      if (bestParentId) {
        const parentPos = posMap.get(bestParentId)!;

        // Set line segment vertices
        const idx = lineIndex * 6;

        // Start (Child)
        positions[idx] = myPos.x;
        positions[idx + 1] = myPos.y;
        positions[idx + 2] = myPos.z;

        // End (Parent)
        positions[idx + 3] = parentPos.x;
        positions[idx + 4] = parentPos.y;
        positions[idx + 5] = parentPos.z;

        lineIndex++;
      }
    });

    // Collapse unused vertices to avoid artifacts
    // (Though setDrawRange handles rendering count, keeping buffer clean is good)
    for (let i = lineIndex * 6; i < positions.length; i++) {
      positions[i] = 0;
    }

    // Update geometry
    lineGeometryRef.current.attributes.position.needsUpdate = true;
    lineGeometryRef.current.setDrawRange(0, lineIndex * 2);
  });

  return (
    <lineSegments>
      <bufferGeometry ref={lineGeometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={maxLines * 2} // Total vertex count capacity
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#FFD700" // Gold lines for hierarchy
        transparent
        opacity={0.15} // Subtle background effect
        depthWrite={false}
      />
    </lineSegments>
  );
}
