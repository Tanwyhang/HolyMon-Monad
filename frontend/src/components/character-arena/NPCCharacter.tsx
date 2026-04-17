"use client";

import type { MutableRefObject } from 'react';
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

/** Strip root motion from a clip so position is fully driven by script (lerp). */
function clipWithoutRootMotion(clip: THREE.AnimationClip, rootBoneName: string): THREE.AnimationClip {
  const filtered = clip.tracks.filter((track) => {
    if (!track.name.includes(rootBoneName)) return true;
    const lower = track.name.toLowerCase();
    if (lower.includes('.position') || lower.includes('position')) return false;
    if (lower.includes('.quaternion') || lower.includes('quaternion')) return false;
    return true;
  });
  return new THREE.AnimationClip(clip.name + '_noRoot', clip.duration, filtered);
}

/** Find the root bone name from animation tracks (more reliable than traversing the model) */
function findRootBoneNameFromClip(clip: THREE.AnimationClip): string {
  // Group tracks by the bone they affect
  const boneNames = new Set<string>();
  clip.tracks.forEach((track) => {
    const match = track.name.match(/^([^\.]+)/);
    if (match) boneNames.add(match[1]);
  });

  // The root bone is typically the one with position tracks at the top level
  for (const boneName of boneNames) {
    const hasPosition = clip.tracks.some(track =>
      track.name.startsWith(boneName) &&
      (track.name.includes('.position') || track.name.toLowerCase().includes('position'))
    );
    if (hasPosition) return boneName;
  }

  // Fallback: return first bone name found
  return boneNames.size > 0 ? Array.from(boneNames)[0] : '';
}

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
  /** When this NPC is the meeting NPC and walk progress >= 1, set to true (for arrival-based meeting trigger). */
  npcLerpArrivedRef?: MutableRefObject<boolean>;
  /** Id of NPC currently walking to meeting; only that NPC sets npcLerpArrivedRef. */
  meetingNpcIdRef?: MutableRefObject<string | null>;
  /** Written every frame by the meeting NPC with world position (for distance-based arrival). */
  meetingNpcPositionRef?: MutableRefObject<[number, number, number] | null>;
  /** When set and instance.id matches, snap group to this position then clear. */
  meetingNpcSnapRef?: MutableRefObject<{ id: string; position: [number, number, number] } | null>;
}

// Utility to get animation path based on state and optional stored index
function getAnimationPath(instance: NPCInstance, talkingIdleIndex?: number): string {
  switch (instance.currentAnimation) {
    case 'idle':
      // Spawn / standing: Idle 3 only (no random walk)
      return NPC_ANIMATION_PATHS.idle[2];

    case 'walking':
    case 'walkingLoop':
      const walkIdx = instance.walkAnimationIndex ?? Math.floor(Math.random() * 3);
      return NPC_ANIMATION_PATHS.walk[walkIdx];

    case 'talking':
      const idleIdx = talkingIdleIndex ?? 2;
      return NPC_ANIMATION_PATHS.idle[idleIdx % 3];

    case 'cheering':
      return NPC_ANIMATION_PATHS.success[Math.floor(Math.random() * 3)];

    case 'flyingKick':
    case 'failed':
      return NPC_ANIMATION_PATHS.failed[Math.floor(Math.random() * 2)];

    default:
      return NPC_ANIMATION_PATHS.idle[2]; // Default Idle 3
  }
}

export function NPCCharacter({ instance, position = [0, 0, 0], scale = 1, npcLerpArrivedRef, meetingNpcIdRef, meetingNpcPositionRef, meetingNpcSnapRef }: NPCCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const effectScaleGroupRef = useRef<THREE.Group>(null); // inner group for 6s pulse scale
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const mixerBaseRef = useRef<THREE.Group | THREE.Object3D | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  // Success timeline: use cached models only (no clone). Phase 0 = unconverted Idle3, 1 = converted Idle3, 2 = converted Success. Crowd NPCs use successStartPhase 2.
  const [successPhase, setSuccessPhase] = useState<0 | 1 | 2>(() => (instance.successStartPhase ?? 0));
  const successStartTimeRef = useRef<number | null>(null);
  const successMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const successMixerBaseRef = useRef<THREE.Object3D | null>(null);
  const successAnimationIndexRef = useRef(instance.successAnimationIndex ?? 0);
  const successIndexPickedRef = useRef(Boolean(instance.successStartPhase === 2));

  // Random walk: lerp state for position during script-driven movement
  const randomWalkStartTimeRef = useRef<number | null>(null);
  const randomWalkCompleteRef = useRef(false);
  const currentRotationYRef = useRef(0);
  const lastWalkEndRef = useRef<[number, number, number] | null>(null);

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

  // Success: which model and clip to use; clone so each NPC has its own copy during cheering. Crowd (successStartPhase 2) uses converted from start.
  const successBaseScene = instance.currentAnimation === 'cheering'
    ? (instance.successStartPhase === 2 ? allFbxs[4] : (successPhase === 0 ? allFbxs[instance.baseModelIndex] : allFbxs[4])) ?? allFbxs[0]
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
      successAnimationIndexRef.current = instance.successAnimationIndex ?? Math.floor(Math.random() * 3);
      successIndexPickedRef.current = true;
    }
    if (instance.successStartPhase === 2) {
      successAnimationIndexRef.current = instance.successAnimationIndex ?? 1;
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

  // Extract animation clips from FBX; keep root motion for Fail, Success, Talk (Idle), strip for Walk only
  const animClips = useMemo(() => {
    const clips = animFbx?.animations ?? [];
    if (!clips.length) return [];

    const clip = clips[0];
    const keepRootMotion =
      animationPath.includes('Failed') ||
      animationPath.includes('Success') ||
      animationPath.includes('Idle');
    if (keepRootMotion) return [clip];
    const rootName = findRootBoneNameFromClip(clip);
    if (rootName) {
      return [clipWithoutRootMotion(clip, rootName)];
    }
    return [clip];
  }, [animFbx, animationPath]);

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

  // Update mixer on each frame; when cheering run success timeline (spin, switch at 4s, pulse at 6s, Success + face front at 9s). Skip spin for crowd (successStartPhase 2).
  useFrame((state, delta) => {
    if (instance.currentAnimation === 'cheering') {
      if (instance.successStartPhase === 2) {
        if (successMixerRef.current) successMixerRef.current.update(delta);
        if (groupRef.current && instance.overrideRotationY !== undefined) {
          groupRef.current.rotation.y = instance.overrideRotationY;
        }
        return;
      }
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
        // When spin stops (9s+), lerp rotation.y to face Jesus (overrideRotationY) or front if not set
        if (t >= SUCCESS_PLAY_ANIM_AT) {
          let ry = groupRef.current.rotation.y;
          const twoPi = 2 * Math.PI;
          ry = ((ry % twoPi) + twoPi) % twoPi;
          if (ry > Math.PI) ry -= twoPi; // wrap to [-PI, PI]
          const target = instance.overrideRotationY ?? 0;
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

    // Random walk: write position directly to group every frame so lerp is always fresh (no setState)
    if (instance.randomWalkLerp && instance.randomWalkDurationSec && instance.randomWalkDurationSec > 0) {
      if (randomWalkStartTimeRef.current === null) {
        randomWalkStartTimeRef.current = state.clock.getElapsedTime();
        randomWalkCompleteRef.current = false;
      }
      const elapsed = state.clock.getElapsedTime() - randomWalkStartTimeRef.current;
      const progress = Math.min(1, elapsed / instance.randomWalkDurationSec);
      const [sx, sy, sz] = instance.randomWalkLerp.start;
      const [ex, ey, ez] = instance.randomWalkLerp.end;
      const x = sx + (ex - sx) * progress;
      const y = sy + (ey - sy) * progress;
      const z = sz + (ez - sz) * progress;
      if (groupRef.current) groupRef.current.position.set(x, y, z);

      // Smoothly face movement direction (lerp rotation, shortest path)
      if (groupRef.current && instance.targetRotationY !== undefined) {
        const target = instance.targetRotationY;
        let current = currentRotationYRef.current;
        let diff = target - current;
        const twoPi = 2 * Math.PI;
        if (diff > Math.PI) diff -= twoPi;
        if (diff < -Math.PI) diff += twoPi;
        const turnSpeed = 4 * delta;
        currentRotationYRef.current = current + diff * Math.min(1, turnSpeed);
        groupRef.current.rotation.y = currentRotationYRef.current;
      }

      if (progress >= 1 && !randomWalkCompleteRef.current) {
        randomWalkCompleteRef.current = true;
        randomWalkStartTimeRef.current = null;
        if (npcLerpArrivedRef && meetingNpcIdRef?.current === instance.id) npcLerpArrivedRef.current = true;
      }
      if (meetingNpcPositionRef && meetingNpcIdRef?.current === instance.id && groupRef.current) {
        const p = groupRef.current.position;
        meetingNpcPositionRef.current = [p.x, p.y, p.z];
      }
    } else {
      // Not in random walk: clear lerp timers so next walk starts fresh; apply override rotation when talking
      randomWalkStartTimeRef.current = null;
      randomWalkCompleteRef.current = false;
      if (instance.overrideRotationY !== undefined && groupRef.current != null) {
        groupRef.current.rotation.y = instance.overrideRotationY;
        currentRotationYRef.current = instance.overrideRotationY;
      }
    }
    // Apply meeting snap so we don't loop at wrong position when arrival triggers before progress>=1
    if (meetingNpcSnapRef?.current && meetingNpcSnapRef.current.id === instance.id && groupRef.current) {
      const [x, y, z] = meetingNpcSnapRef.current.position;
      groupRef.current.position.set(x, y, z);
      lastWalkEndRef.current = [x, y, z];
      meetingNpcSnapRef.current = null;
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

  const displayScene = instance.currentAnimation === 'cheering' && successBaseSceneClone && (instance.successStartPhase === 2 || successPhase >= 1) ? successBaseSceneClone : baseClone;

  const inWalk = Boolean(instance.randomWalkLerp && instance.randomWalkDurationSec && instance.randomWalkDurationSec > 0);
  if (inWalk && instance.randomWalkLerp) lastWalkEndRef.current = [...instance.randomWalkLerp.end];
  // When a meeting snap is pending, use it so we don't show one frame at wrong position
  const snapPosition = meetingNpcSnapRef?.current && meetingNpcSnapRef.current.id === instance.id
    ? meetingNpcSnapRef.current.position
    : null;
  const displayPosition = snapPosition ?? (inWalk ? undefined : (lastWalkEndRef.current ?? position));

  return (
    <group ref={groupRef} position={displayPosition} scale={scale}>
      <group ref={effectScaleGroupRef}>
        {displayScene && <primitive object={displayScene} />}
      </group>
    </group>
  );
}
