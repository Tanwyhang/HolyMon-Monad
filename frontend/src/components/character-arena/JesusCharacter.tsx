"use client";

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import type { Triple } from '@react-three/fiber';
import type { AnimationState } from './types';
import * as THREE from 'three';
import { FBXLoaderSilent } from './fbxLoaderSilent';
import { ALL_JESUS_FBX_PATHS, JESUS_ANIMATION_INDEX } from './jesusPaths';

const ANIMATION_STATES: AnimationState[] = [
  'idle',
  'walking',
  'talking',
  'cheering',
  'walkBackward',
  'flyingKick',
  'deal',
  'praying',
];

interface JesusCharacterProps {
  animationState: AnimationState;
  position?: Triple;
  scale?: number;
}

export function JesusCharacter({ animationState, position = [0, 0, 0], scale = 1 }: JesusCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<AnimationState, THREE.AnimationAction>>(new Map());
  const prevStateRef = useRef<AnimationState>(animationState);

  const loaded = useLoader(FBXLoaderSilent, ALL_JESUS_FBX_PATHS) as THREE.Group[];
  const model = loaded[0] ?? null;

  const clipsByState = useMemo(() => {
    const map = new Map<AnimationState, THREE.AnimationClip>();
    ANIMATION_STATES.forEach((state) => {
      const idx = JESUS_ANIMATION_INDEX[state];
      const fbx = loaded[idx];
      const clip = fbx?.animations?.[0];
      if (clip) map.set(state, clip);
    });
    return map;
  }, [loaded]);

  useEffect(() => {
    if (!model || !clipsByState.size) return;
    if (mixerRef.current) mixerRef.current.stopAllAction();
    mixerRef.current = new THREE.AnimationMixer(model);
    const mixer = mixerRef.current;
    clipsByState.forEach((clip, state) => {
      const action = mixer.clipAction(clip);
      if (state === 'walkBackward' || state === 'flyingKick' || state === 'deal' || state === 'praying') {
        action.setLoop(THREE.LoopOnce, 0);
      }
      actionsRef.current.set(state, action);
    });
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
      actionsRef.current.clear();
    };
  }, [model, clipsByState]);

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = animationState;
    const currAction = actionsRef.current.get(animationState);
    const prevAction = actionsRef.current.get(prevState);
    if (!currAction) return;

    if (prevAction && prevAction !== currAction && prevAction.isRunning()) {
      prevAction.crossFadeTo(currAction, 0.3, false);
      currAction.reset().play();
    } else {
      currAction.reset().fadeIn(0.25).play();
    }
  }, [animationState]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  if (!model) return null;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
