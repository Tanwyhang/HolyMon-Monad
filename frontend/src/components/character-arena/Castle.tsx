"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Triple } from '@react-three/fiber';
import * as THREE from 'three';

interface CastleProps {
  position?: Triple;
  scale?: Triple;
}

function logCastleScene(scene: THREE.Object3D): void {
  let meshCount = 0;
  const meshInfo: string[] = [];
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount += 1;
      const geom = obj.geometry;
      const verts = geom?.attributes?.position?.count ?? 0;
      const mat = obj.material;
      const hasMap = Array.isArray(mat)
        ? mat.some((m) => m && 'map' in m && (m as THREE.MeshStandardMaterial).map)
        : mat && 'map' in mat && !!(mat as THREE.MeshStandardMaterial).map;
      meshInfo.push(
        `  [${meshCount}] "${obj.name}" | verts=${verts} | pos=(${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}) | hasTexture=${hasMap}`
      );
    }
  });
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log('[Castle.glb] Mesh count:', meshCount, '| Total bounds:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
  meshInfo.forEach((line) => console.log(line));
}

export function Castle({ position = [0, 0, -10], scale = [10, 10, 10] }: CastleProps) {
  const { scene } = useGLTF('/3d/Castle.glb');
  const didLog = useRef(false);
  useEffect(() => {
    if (didLog.current) return;
    didLog.current = true;
    logCastleScene(scene);
  }, [scene]);

  const cloned = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={position} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}
