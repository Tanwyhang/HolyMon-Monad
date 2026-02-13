"use client";

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import type { Triple } from '@react-three/fiber';
import type { NPCInstance } from './types';
import {
  NPC_ANIMATION_PATHS,
  ALL_NPC_FBX_PATHS,
  NPC_FBX_BASE_COUNT,
  getNpcAnimationIndex,
} from './npcPaths';

// Success timeline (no clone): 0–4s unconverted Idle3 + spin; 4s switch to converted Idle3 + spin; 6s pulse effect; 9s Success 1/2/3, face front
const SUCCESS_SPIN_ACCEL_END = 4;
const SUCCESS_SWITCH_EFFECT_AT = 4;   // scale pulse at 4s (switch frame)
const SUCCESS_SWITCH_EFFECT_DURATION = 0.4;
const SUCCESS_SWITCH_EFFECT_PEAK_SCALE = 1.11;
const SUCCESS_PLAY_ANIM_AT = 9;
const SUCCESS_MAX_SPIN_SPEED = 6;
const SUCCESS_FACE_FRONT_LERP = 5;   // lerp speed for snapping rotation to front when spin stops

interface NPCCharacterProps {
  instance: NPCInstance;
  position?: Triple;
  scale?: number;
}

// Utility to get animation path based on state and optional stored index
function getAnimationPath(instance: NPCInstance, talkingIdleIndex?: number): string {
  switch (instance.currentAnimation) {
    case 'walking':
      // Use stored walk animation index if available, otherwise random
      const walkIdx = instance.walkAnimationIndex ?? Math.floor(Math.random() * 3);
      return NPC_ANIMATION_PATHS.walk[walkIdx];

    case 'talking':
      // Default Idle 3 (index 2); in between play Idle 1 or 2 (index 0 or 1) once then back to 3
      const idleIdx = talkingIdleIndex ?? 2;
      return NPC_ANIMATION_PATHS.idle[idleIdx % 3];

    case 'cheering':
      // Random success
      return NPC_ANIMATION_PATHS.success[Math.floor(Math.random() * 3)];

    case 'flyingKick':
      // Random failed
      return NPC_ANIMATION_PATHS.failed[Math.floor(Math.random() * 2)];

    default:
      return NPC_ANIMATION_PATHS.idle[2]; // Default Idle 3
  }
}

export function NPCCharacter({ instance, position = [0, 0, 0], scale = 1 }: NPCCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const effectScaleGroupRef = useRef<THREE.Group>(null); // inner group for 6s pulse scale
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const mixerBaseRef = useRef<THREE.Group | THREE.Object3D | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  // Success timeline: use cached models only (no clone). Phase 0 = unconverted Idle3, 1 = converted Idle3, 2 = converted Success
  const [successPhase, setSuccessPhase] = useState<0 | 1 | 2>(0);
  const successStartTimeRef = useRef<number | null>(null);
  const successMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const successMixerBaseRef = useRef<THREE.Object3D | null>(null);
  const successAnimationIndexRef = useRef(0);
  const successIndexPickedRef = useRef(false);

  // Use preloaded FBX cache (same as NpcPreload) so spawn never suspends or flickers
  const allFbxs = useLoader(FBXLoader, ALL_NPC_FBX_PATHS);
  const baseIndex = instance.isConverted ? 4 : instance.baseModelIndex; // 0–3 unconverted, 4 converted
  const baseScene = allFbxs[baseIndex] ?? allFbxs[0];

  // Clone base model per instance so multiple NPCs can show the same model (e.g. many converted).
  // Use SkeletonUtils.clone() so skinned meshes keep correct skeleton/bones and animations run.
  const baseClone = useMemo(
    () => (baseScene ? SkeletonUtils.clone(baseScene as THREE.Object3D) : null),
    [baseScene]
  );

  // Success: which model and clip to use; clone so each NPC has its own copy during cheering
  const successBaseScene = instance.currentAnimation === 'cheering'
    ? (successPhase === 0 ? allFbxs[instance.baseModelIndex] : allFbxs[4]) ?? allFbxs[0]
    : null;
  const successBaseSceneClone = useMemo(
    () => (successBaseScene ? SkeletonUtils.clone(successBaseScene as THREE.Object3D) : null),
    [successBaseScene]
  );
  const idle3Path = NPC_ANIMATION_PATHS.idle[2];
  const idle3Index = NPC_FBX_BASE_COUNT + getNpcAnimationIndex(idle3Path);

  useEffect(() => {
    if (instance.currentAnimation !== 'cheering' || !successBaseScene || !allFbxs.length) {
      if (instance.currentAnimation !== 'cheering') {
        setSuccessPhase(0);
        successStartTimeRef.current = null;
        successIndexPickedRef.current = false;
        if (successMixerRef.current) {
          successMixerRef.current.stopAllAction();
          successMixerRef.current = null;
          successMixerBaseRef.current = null;
        }
      }
      return;
    }
    if (successPhase === 0 && !successIndexPickedRef.current) {
      successAnimationIndexRef.current = Math.floor(Math.random() * 3);
      successIndexPickedRef.current = true;
    }
    const clipFbx = successPhase === 2
      ? allFbxs[NPC_FBX_BASE_COUNT + getNpcAnimationIndex(NPC_ANIMATION_PATHS.success[successAnimationIndexRef.current])]
      : allFbxs[idle3Index];
    if (!clipFbx?.animations?.length) return;

    if (!successMixerRef.current || successMixerBaseRef.current !== successBaseSceneClone) {
      if (successMixerRef.current) successMixerRef.current.stopAllAction();
      if (!successBaseSceneClone) return;
      successMixerRef.current = new THREE.AnimationMixer(successBaseSceneClone);
      successMixerBaseRef.current = successBaseSceneClone;
    }
    successMixerRef.current.clipAction(clipFbx.animations[0]).reset().play();
  }, [instance.currentAnimation, instance.baseModelIndex, successPhase, successBaseScene, successBaseSceneClone, allFbxs, idle3Index]);

  // When talking: default Idle 3 (index 2); every 6s play Idle 1 (4.2s) or Idle 2 (1.9s) once then back to Idle 3
  const [talkingIdleIndex, setTalkingIdleIndex] = useState(2);
  const variantTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (instance.currentAnimation !== 'talking') return;
    const interval = setInterval(() => {
      if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
      const variant = Math.random() < 0.5 ? 0 : 1; // Idle 1 or 2
      setTalkingIdleIndex(variant);
      const durationMs = variant === 0 ? 4200 : 1900; // Idle 1: 4.2s, Idle 2: 1.9s
      variantTimeoutRef.current = setTimeout(() => {
        setTalkingIdleIndex(2); // Back to Idle 3
        variantTimeoutRef.current = null;
      }, durationMs);
    }, 6000);
    return () => {
      clearInterval(interval);
      if (variantTimeoutRef.current) clearTimeout(variantTimeoutRef.current);
    };
  }, [instance.currentAnimation]);

  // Get animation path (uses talkingIdleIndex when talking)
  const animationPath = useMemo(
    () => getAnimationPath(instance, talkingIdleIndex),
    [instance, talkingIdleIndex]
  );

  // Animation FBX from same preloaded array (indices NPC_FBX_BASE_COUNT+)
  const animFbx = allFbxs[NPC_FBX_BASE_COUNT + getNpcAnimationIndex(animationPath)] ?? allFbxs[NPC_FBX_BASE_COUNT];

  // Extract animation clips from FBX
  const animClips = useMemo(() => {
    return animFbx?.animations ?? [];
  }, [animFbx]);

  // Apply animation when it changes – crossfade to avoid T-pose gap between idles (skip when in success timeline)
  useEffect(() => {
    if (instance.currentAnimation === 'cheering') return;
    if (!baseClone || !animClips.length) return;

    // Recreate mixer if base clone changed (e.g. after conversion)
    if (!mixerRef.current || mixerBaseRef.current !== baseClone) {
      if (mixerRef.current) mixerRef.current.stopAllAction();
      mixerRef.current = new THREE.AnimationMixer(baseClone);
      mixerBaseRef.current = baseClone;
    }

    const clip = animClips[0];
    const newAction = mixerRef.current.clipAction(clip);
    if (animationPath.includes('Failed')) {
      newAction.setLoop(THREE.LoopOnce, 0);
      newAction.clampWhenFinished = true; // Hold last pose when Failed ends so no T-pose gap before Walk
    }
    if (animationPath.includes('Idle 1') || animationPath.includes('Idle 2')) {
      newAction.setLoop(THREE.LoopOnce, 0);
      newAction.clampWhenFinished = true; // Play once then hold last pose until we switch back to Idle 3
    }
    const prevAction = currentActionRef.current;

    if (prevAction && prevAction !== newAction) {
      // Always crossfade so new animation continues from last pose (no gap Failed → Walk)
      prevAction.crossFadeTo(newAction, 0.35, false);
      newAction.reset().play();
    } else {
      newAction.reset().fadeIn(0.3).play();
    }
    currentActionRef.current = newAction;

    return () => {
      if (currentActionRef.current) {
        currentActionRef.current.stop();
      }
    };
  }, [animationPath, baseClone, animClips]);

  // Update mixer on each frame; when cheering run success timeline (spin, switch at 4s, pulse at 6s, Success + face front at 9s)
  useFrame((state, delta) => {
    if (instance.currentAnimation === 'cheering') {
      const clock = state.clock.getElapsedTime();
      if (successStartTimeRef.current == null) successStartTimeRef.current = clock;
      const t = clock - successStartTimeRef.current;

      const spinSpeed =
        t < SUCCESS_SPIN_ACCEL_END
          ? (t / SUCCESS_SPIN_ACCEL_END) * SUCCESS_MAX_SPIN_SPEED
          : t < SUCCESS_PLAY_ANIM_AT
            ? SUCCESS_MAX_SPIN_SPEED
            : 0;
      if (groupRef.current) {
        groupRef.current.rotation.y += spinSpeed * delta;
        // When spin stops (9s+), lerp rotation.y to 0 so character faces front (shortest path)
        if (t >= SUCCESS_PLAY_ANIM_AT) {
          let ry = groupRef.current.rotation.y;
          const twoPi = 2 * Math.PI;
          ry = ((ry % twoPi) + twoPi) % twoPi;
          if (ry > Math.PI) ry -= twoPi; // wrap to [-PI, PI]
          const target = 0;
          groupRef.current.rotation.y = ry + (target - ry) * Math.min(1, delta * SUCCESS_FACE_FRONT_LERP);
        }
      }

      // At 6s (switching/converted fully visible): scale pulse effect
      if (effectScaleGroupRef.current) {
        if (t >= SUCCESS_SWITCH_EFFECT_AT && t < SUCCESS_SWITCH_EFFECT_AT + SUCCESS_SWITCH_EFFECT_DURATION) {
          const u = (t - SUCCESS_SWITCH_EFFECT_AT) / SUCCESS_SWITCH_EFFECT_DURATION;
          const pulseScale = 1 + (SUCCESS_SWITCH_EFFECT_PEAK_SCALE - 1) * Math.sin(u * Math.PI); // 1 -> peak -> 1
          effectScaleGroupRef.current.scale.setScalar(pulseScale);
        } else {
          effectScaleGroupRef.current.scale.setScalar(1);
        }
      }

      if (t >= SUCCESS_PLAY_ANIM_AT && successPhase === 1) setSuccessPhase(2);
      else if (t >= SUCCESS_SPIN_ACCEL_END && successPhase === 0) setSuccessPhase(1);

      if (successMixerRef.current) successMixerRef.current.update(delta);
      return;
    }
    if (effectScaleGroupRef.current) effectScaleGroupRef.current.scale.setScalar(1);
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  // Cleanup mixer on unmount
  useEffect(() => {
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);

  const displayScene = instance.currentAnimation === 'cheering' && successBaseSceneClone ? successBaseSceneClone : baseClone;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <group ref={effectScaleGroupRef}>
        {displayScene && <primitive object={displayScene} />}
      </group>
    </group>
  );
}
