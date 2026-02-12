"use client";

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import type { Triple } from '@react-three/fiber';
import type { AnimationState } from './types';
import * as THREE from 'three';
import { FBXLoaderSilent } from './fbxLoaderSilent';
import { JESUS_ANIMATION_PATHS } from './jesusPaths';

const ANIMATION_STATES: AnimationState[] = [
  'idle',
  'walking',
  'talking',
  'cheering',
  'walkBackward',
  'flyingKick',
];

interface JesusCharacterProps {
  animationState: AnimationState;
  position?: Triple;
  scale?: number;
}

export function JesusCharacter({ animationState, position = [0, 0, 0], scale = 1 }: JesusCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixersRef = useRef<Map<AnimationState, THREE.AnimationMixer>>(new Map());
  const actionsRef = useRef<Map<AnimationState, THREE.AnimationAction>>(new Map());

  const idleModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.idle);
  const walkingModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.walking);
  const talkingModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.talking);
  const cheeringModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.cheering);
  const walkBackwardModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.walkBackward);
  const flyingKickModel = useLoader(FBXLoaderSilent, JESUS_ANIMATION_PATHS.flyingKick);

  const modelByState: Record<AnimationState, THREE.Group> = useMemo(
    () => ({
      idle: idleModel,
      walking: walkingModel,
      talking: talkingModel,
      cheering: cheeringModel,
      walkBackward: walkBackwardModel,
      flyingKick: flyingKickModel,
    }),
    [idleModel, walkingModel, talkingModel, cheeringModel, walkBackwardModel, flyingKickModel]
  );

  const currentModel = modelByState[animationState] ?? idleModel;

  // Create one mixer per model once; never destroy on switch so switching is stable
  useEffect(() => {
    const mixers = mixersRef.current;
    const actions = actionsRef.current;
    ANIMATION_STATES.forEach((state) => {
      const model = modelByState[state];
      if (!model?.animations?.length || mixers.has(state)) return;
      const mixer = new THREE.AnimationMixer(model);
      const clip = model.animations[0];
      const action = mixer.clipAction(clip);
      if (state === 'walkBackward' || state === 'flyingKick') {
        action.setLoop(THREE.LoopOnce, 0);
      }
      mixers.set(state, mixer);
      actions.set(state, action);
    });
  }, [modelByState]);

  // When state changes: crossfade so new animation continues from last pose (no snap)
  const prevStateRef = useRef<AnimationState>(animationState);
  useEffect(() => {
    const actions = actionsRef.current;
    const prevState = prevStateRef.current;
    prevStateRef.current = animationState;

    const prevAction = actions.get(prevState);
    const currAction = actions.get(animationState);
    if (!currAction) return;

    if (prevAction && prevAction !== currAction && prevAction.isRunning()) {
      prevAction.crossFadeTo(currAction, 0.3, false);
      currAction.reset().play();
    } else {
      currAction.reset().fadeIn(0.25).play();
    }
  }, [animationState]);

  useFrame((_, delta) => {
    mixersRef.current.forEach((mixer) => mixer.update(delta));
  });

  useEffect(
    () => () => {
      mixersRef.current.forEach((m) => m.stopAllAction());
    },
    []
  );

  const is = (m: THREE.Group) => m === currentModel;
  // Offset flying kick start point back so it syncs with end of walk backward
  const flyingKickOffset: [number, number, number] = [0, 0, -60];

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={idleModel} visible={is(idleModel)} />
      <primitive object={walkingModel} visible={is(walkingModel)} />
      <primitive object={talkingModel} visible={is(talkingModel)} />
      <primitive object={cheeringModel} visible={is(cheeringModel)} />
      <primitive object={walkBackwardModel} visible={is(walkBackwardModel)} />
      <group position={flyingKickOffset}>
        <primitive object={flyingKickModel} visible={is(flyingKickModel)} />
      </group>
    </group>
  );
}
