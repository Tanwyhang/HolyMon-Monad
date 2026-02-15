import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Sphere, Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import { Agent } from "./types";
import { Crown } from "./Crown";

interface AgentNodeProps {
  agent: Agent;
  positionRef: React.MutableRefObject<THREE.Vector3 | undefined>;
  isLeader: boolean;
}

export function AgentNode({ agent, positionRef, isLeader }: AgentNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const npcRef = useRef<THREE.InstancedMesh>(null);

  // Scaling logic: Base + Logarithmic scaling for huge numbers
  const followerCount = Math.max(0, agent.followers || 0);
  const baseSize = 2.0 + Math.log10(followerCount + 1) * 0.8;

  // NPC Swarm logic: Fewer, Bigger NPCs
  const npcCount = Math.min(Math.floor(followerCount / 20), 50); // Divisor 20, Cap 50
  const npcDummy = useMemo(() => new THREE.Object3D(), []);

  // Generate stable random offsets for NPCs
  const npcOffsets = useMemo(() => {
    return new Array(npcCount).fill(0).map(() => ({
      radius: baseSize * 1.5 + Math.random() * baseSize * 1.5,
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI,
      speed: 0.2 + Math.random() * 0.3,
      yOffset: (Math.random() - 0.5) * 3,
    }));
  }, [npcCount, baseSize]);

  useFrame((state) => {
    // 1. Sync position of main group
    if (positionRef.current && groupRef.current) {
      groupRef.current.position.lerp(positionRef.current, 0.2);
    }

    const time = state.clock.getElapsedTime();

    // 2. Animate Main Agent (Pulse)
    if (agent.status === "TALKING" && meshRef.current && glowRef.current) {
      (
        meshRef.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = 1.5 + Math.sin(time * 10) * 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(time * 10) * 0.1;
      groupRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    } else if (groupRef.current && meshRef.current && glowRef.current) {
      (
        meshRef.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    // 3. Animate NPCs
    if (npcRef.current) {
      npcOffsets.forEach((data, i) => {
        const t = time * data.speed;
        // Orbit logic
        const x = Math.sin(data.theta + t) * data.radius;
        const z = Math.cos(data.theta + t) * data.radius;
        const y =
          Math.sin(data.phi + t * 0.5) * data.radius * 0.5 + data.yOffset; // Wobbly orbit

        npcDummy.position.set(x, y, z);
        npcDummy.scale.setScalar(0.35); // Bigger white balls (0.35)
        npcDummy.updateMatrix();
        npcRef.current!.setMatrixAt(i, npcDummy.matrix);
      });
      npcRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Leader Crown Indicator (3D) */}
      {isLeader && <Crown position={[0, baseSize + 1.5, 0]} />}

      {/* Core Sphere */}
      <Sphere ref={meshRef} args={[baseSize, 32, 32]}>
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.5}
        />
      </Sphere>

      {/* Glow Halo */}
      <Sphere ref={glowRef} args={[baseSize * 1.4, 32, 32]}>
        <meshBasicMaterial
          color={agent.color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* NPC Swarm */}
      <instancedMesh ref={npcRef} args={[undefined, undefined, npcCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="white" />
      </instancedMesh>

      {/* Label */}
      <Text
        position={[0, baseSize + 1.2, 0]}
        fontSize={0.8}
        color={isLeader ? "#FFD700" : agent.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="black"
      >
        {agent.symbol} {isLeader ? "(LEAD)" : ""}
      </Text>
    </group>
  );
}
