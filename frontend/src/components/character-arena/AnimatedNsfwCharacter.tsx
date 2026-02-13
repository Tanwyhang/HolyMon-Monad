"use client";

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import type { Triple } from '@react-three/fiber';
import { ALL_NSFW_FBX_PATHS } from './nsfwPaths';

interface AnimatedNsfwCharacterProps {
  /** Index into ALL_NSFW_FBX_PATHS for the model (0 = Boss, 1 = Leng). */
  modelIndex: number;
  /** Index into ALL_NSFW_FBX_PATHS for the animation FBX (2 = BossIdle, 3 = LengTwerk). */
  animationIndex: number;
  position?: Triple;
  scale?: number;
}

export function AnimatedNsfwCharacter({
  modelIndex,
  animationIndex,
  position = [0, 0, 0],
  scale = 1,
}: AnimatedNsfwCharacterProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const allFbxs = useLoader(FBXLoader, ALL_NSFW_FBX_PATHS);
  const model = allFbxs[modelIndex] ?? allFbxs[0];
  const animFbx = allFbxs[animationIndex];

  const clone = useMemo(
    () => (model ? SkeletonUtils.clone(model as THREE.Object3D) : null),
    [model]
  );

  const clip = useMemo(
    () => (animFbx?.animations?.length ? animFbx.animations[0] : null),
    [animFbx]
  );

  useEffect(() => {
    if (!clone || !clip) return;
    if (mixerRef.current) mixerRef.current.stopAllAction();
    mixerRef.current = new THREE.AnimationMixer(clone);
    mixerRef.current.clipAction(clip).reset().play();
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [clone, clip]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  if (!clone) return null;

  return (
    <group position={position} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}
