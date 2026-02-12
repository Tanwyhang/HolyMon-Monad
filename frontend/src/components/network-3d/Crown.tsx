import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

export function Crown({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      // Bobbing motion
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
    }
  });

  const goldMaterial = <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} emissive="#FFA500" emissiveIntensity={0.2} />;

  return (
    <group ref={groupRef} position={position}>
      {/* Base Ring */}
      <Torus args={[0.5, 0.1, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
        {goldMaterial}
      </Torus>
      
      {/* Spikes */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <Cylinder args={[0.05, 0.15, 0.8, 8]} position={[0.5, 0.4, 0]} rotation={[0, 0, -0.2]}>
            {goldMaterial}
          </Cylinder>
          {/* Jewel on tip */}
          <mesh position={[0.55, 0.85, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#ff0000" : "#00ff00"} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
