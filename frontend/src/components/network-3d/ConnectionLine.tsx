import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Interaction } from "./types";

interface ConnectionLineProps {
  interaction: Interaction;
  startRef: React.MutableRefObject<THREE.Vector3 | undefined>;
  endRef: React.MutableRefObject<THREE.Vector3 | undefined>;
}

export function ConnectionLine({
  interaction,
  startRef,
  endRef,
}: ConnectionLineProps) {
  const lineRef = useRef<THREE.Line>(null);

  // Create initial buffer geometry
  const positions = useMemo(() => new Float32Array(6), []); // 2 points * 3 coords
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);

  // Initialize geometry with positions
  useMemo(() => {
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [geometry, positions]);

  useFrame(() => {
    if (lineRef.current && startRef.current && endRef.current) {
      const posArray = positions;

      // Update start point
      posArray[0] = startRef.current.x;
      posArray[1] = startRef.current.y;
      posArray[2] = startRef.current.z;

      // Update end point
      posArray[3] = endRef.current.x;
      posArray[4] = endRef.current.y;
      posArray[5] = endRef.current.z;

      geometry.attributes.position.needsUpdate = true;

      // Pulse effect
      const age = Date.now() - interaction.timestamp;
      const material = lineRef.current.material as THREE.LineBasicMaterial;

      if (age < 500) {
        material.opacity = 1;
        material.linewidth = 3;
      } else {
        material.opacity = 0.3;
        material.linewidth = 1;
      }
    }
  });

  return (
    <primitive
      ref={lineRef}
      object={
        new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color: getInteractionColor(interaction.type),
            transparent: true,
            opacity: 0.5,
          }),
        )
      }
    />
  );
}

function getInteractionColor(type: string) {
  switch (type) {
    case "DEBATE":
      return "#ff4444";
    case "CONVERT":
      return "#ffd700";
    case "ALLIANCE":
      return "#44ff44";
    case "BETRAYAL":
      return "#ff00ff";
    case "MIRACLE":
      return "#00ffff";
    default:
      return "#ffffff";
  }
}
