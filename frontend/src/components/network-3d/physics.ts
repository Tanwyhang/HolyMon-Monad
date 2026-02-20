import * as THREE from "three";
import { AgentConnection, ActiveConnection } from "./types";

interface ForceLayout {
  positions: Map<string, THREE.Vector3>;
  update: () => void;
}

export function useForceLayout(
  agents: AgentConnection[],
  connections: ActiveConnection[],
): ForceLayout {
  const positions = new Map<string, THREE.Vector3>();
  const velocities = new Map<string, THREE.Vector3>();

  const REPULSION = 20;
  const ATTRACTION = 0.08;
  const CENTER_PULL = 0.15;
  const DAMPING = 0.85;
  const MAX_DISTANCE = 20;
  const CENTER_Y = 5;

  // Initialize positions
  agents.forEach((agent) => {
    positions.set(
      agent.id,
      new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        Math.random() * 8,
        (Math.random() - 0.5) * 15,
      ),
    );
    velocities.set(agent.id, new THREE.Vector3());
  });

  const update = () => {
    const posMap = positions;
    const velMap = velocities;

    agents.forEach((a1) => {
      const p1 = posMap.get(a1.id);
      const v1 = velMap.get(a1.id);
      if (!p1 || !v1) return;

      agents.forEach((a2) => {
        if (a1.id === a2.id) return;
        const p2 = posMap.get(a2.id);
        if (!p2) return;

        const diff = new THREE.Vector3().subVectors(p1, p2);
        const distSq = diff.lengthSq();
        const effectiveDistSq = Math.max(distSq, 4.0);

        const force = diff
          .normalize()
          .multiplyScalar(REPULSION / effectiveDistSq);
        v1.add(force);
      });

      v1.sub(
        p1
          .clone()
          .sub(new THREE.Vector3(0, CENTER_Y, 0))
          .multiplyScalar(CENTER_PULL),
      );

      connections.forEach((conn) => {
        let targetId: string | null = null;
        if (conn.agent1Id === a1.id) targetId = conn.agent2Id;
        else if (conn.agent2Id === a1.id) targetId = conn.agent1Id;

        if (targetId) {
          const p2 = posMap.get(targetId);
          if (p2) {
            const diff = new THREE.Vector3().subVectors(p2, p1);
            v1.add(diff.multiplyScalar(ATTRACTION * conn.strength));
          }
        }
      });

      v1.multiplyScalar(DAMPING);
      v1.clampLength(0, 0.15);
      p1.add(v1);

      p1.clampLength(0, MAX_DISTANCE);
    });
  };

  return {
    positions,
    update,
  };
}
