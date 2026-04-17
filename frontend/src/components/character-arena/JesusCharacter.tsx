"use client";

import type { MutableRefObject } from 'react';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import type { Triple } from '@react-three/fiber';
import type { AnimationState } from './types';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
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
  'running',
  'failed',
  'walkingLoop',
  'rightTurn',
];

const RUNNING_FBX_INDEX = 8;

/** Main model never plays running; running uses a clone of Jesus - Running.fbx so the clip matches the skeleton. */
const MAIN_MODEL_STATES: AnimationState[] = ANIMATION_STATES.filter((s) => s !== 'running');

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

interface JesusCharacterProps {
  animationState: AnimationState;
  position?: Triple;
  scale?: number;
  /** Only inverted after playing NPC - Failed 1 (e.g. in full flow). Default false at start. */
  invertFacing?: boolean;
  /** After right turn: face right (+X) then walk. */
  faceRight?: boolean;
  /** True shortly before switching to running so the running clone can pre-animate (avoids T-pose). */
  preparingRun?: boolean;
  /** First walk toward Moanad: smooth lerp driven in useFrame. */
  firstWalkLerp?: { start: [number, number, number]; end: [number, number, number] } | null;
  /** Duration of first walk in seconds. */
  firstWalkDurationSec?: number;
  /** Run back (z -16 to 18): smooth lerp like first walk. */
  runLerp?: { start: [number, number, number]; end: [number, number, number] } | null;
  /** Duration of run in seconds. */
  runDurationSec?: number;
  /** When set, Jesus faces this point (XZ). Used for face-to-face with NPC. */
  faceToward?: [number, number, number] | null;
  /** Set to true when first-walk lerp reaches progress >= 1 (for arrival-based meeting trigger). */
  jesusLerpArrivedRef?: MutableRefObject<boolean>;
  /** Written every frame with Jesus world position (for distance-based arrival). */
  jesusPositionRef?: MutableRefObject<[number, number, number] | null>;
  /** Written every frame with Jesus rotation Y (for camera follow). */
  jesusRotationYRef?: MutableRefObject<number>;
  /** When set, snap group + lastLerpEnd to this position then clear (fixes snap-back on meet). */
  jesusSnapToRef?: MutableRefObject<[number, number, number] | null>;
}

export function JesusCharacter({ animationState, position = [0, 0, 0], scale = 1, invertFacing = false, faceRight = false, preparingRun = false, firstWalkLerp = null, firstWalkDurationSec = 5.64, runLerp = null, runDurationSec = 4, faceToward = null, jesusLerpArrivedRef, jesusPositionRef, jesusRotationYRef, jesusSnapToRef }: JesusCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<AnimationState, THREE.AnimationAction>>(new Map());
  const prevStateRef = useRef<AnimationState>(animationState);
  const runningMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const runningActionRef = useRef<THREE.AnimationAction | null>(null);
  const wasInRunStateRef = useRef(false);
  const firstWalkStartTimeRef = useRef<number | null>(null);
  const runLerpStartTimeRef = useRef<number | null>(null);
  /** When a lerp completes, store end so we can use it for one frame after lerp is cleared (avoids teleport if prop is stale) */
  const lastLerpEndRef = useRef<[number, number, number] | null>(null);
  /** Current lerp position; only set when lerp starts, then useFrame writes to group directly so position is fresh every frame */
  const [lerpPosition, setLerpPosition] = useState<[number, number, number]>([0, 0, 0]);

  const loaded = useLoader(FBXLoaderSilent, ALL_JESUS_FBX_PATHS) as THREE.Group[];
  const model = loaded[0] ?? null;
  const runningFbx = loaded[RUNNING_FBX_INDEX] ?? null;

  /** Clone of Jesus - Running.fbx: same skeleton as the run clip, so no T-pose. Kept mounted and pre-animated when preparingRun. */
  const runningClone = useMemo(
    () => (runningFbx ? (SkeletonUtils.clone(runningFbx as THREE.Object3D) as THREE.Group) : null),
    [runningFbx]
  );

  const runningClipRaw = useMemo(
    () => (runningFbx?.animations?.length ? runningFbx.animations[0] : null),
    [runningFbx]
  );

  /** Running clip for the clone (strip root so position is driven by our lerp). */
  const runningClipForClone = useMemo(() => {
    if (!runningClipRaw) return null;
    // Use animation tracks to find root bone name (more reliable than traversing model)
    const rootName = findRootBoneNameFromClip(runningClipRaw);
    if (!rootName) return runningClipRaw;
    return clipWithoutRootMotion(runningClipRaw, rootName);
  }, [runningClipRaw]);

  const clipsByState = useMemo(() => {
    const map = new Map<AnimationState, THREE.AnimationClip>();
    MAIN_MODEL_STATES.forEach((state) => {
      const idx = JESUS_ANIMATION_INDEX[state];
      const fbx = loaded[idx];
      const clip = fbx?.animations?.[0];
      if (clip) {
        // Keep root motion for Fail, Success, Talk, Deal (and walkBackward, flyingKick); strip for walk/idle/run
        const keepRootMotion =
          state === 'failed' ||
          state === 'walkBackward' ||
          state === 'flyingKick' ||
          state === 'talking' ||
          state === 'cheering' ||
          state === 'deal';
        if (keepRootMotion) {
          map.set(state, clip);
        } else {
          const rootName = findRootBoneNameFromClip(clip);
          map.set(state, rootName ? clipWithoutRootMotion(clip, rootName) : clip);
        }
      }
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
      if (state === 'walkBackward' || state === 'flyingKick' || state === 'deal' || state === 'praying' || state === 'failed' || state === 'rightTurn') {
        action.setLoop(THREE.LoopOnce, 0);
      }
      if (state === 'running' || state === 'walkingLoop') {
        action.setLoop(THREE.LoopRepeat, Infinity);
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
    if (animationState === 'running') return;
    const prevState = prevStateRef.current;
    prevStateRef.current = animationState;
    const currAction = actionsRef.current.get(animationState);
    const prevAction = actionsRef.current.get(prevState);
    if (!currAction) return;

    if (prevAction && prevAction !== currAction && prevAction.isRunning()) {
      prevAction.crossFadeTo(currAction, 0.2, false);
      currAction.reset().play();
    } else {
      currAction.reset().fadeIn(0.2).play();
    }
  }, [animationState]);

  useEffect(() => {
    if (!runningClone || !runningClipForClone) return;
    runningMixerRef.current = new THREE.AnimationMixer(runningClone);
    const action = runningMixerRef.current.clipAction(runningClipForClone);
    action.setLoop(THREE.LoopRepeat, Infinity);
    runningActionRef.current = action;
    return () => {
      runningMixerRef.current?.stopAllAction();
      runningMixerRef.current = null;
      runningActionRef.current = null;
    };
  }, [runningClone, runningClipForClone]);

  useEffect(() => {
    const run = preparingRun || animationState === 'running';
    const action = runningActionRef.current;
    if (!action) return;
    if (run) {
      const wasRun = wasInRunStateRef.current;
      wasInRunStateRef.current = true;
      // Only reset when entering run from idle (preparingRun phase); when already showing running, never reset to avoid T-pose
      if (animationState === 'running') {
        if (!action.isRunning()) action.play(); // resume from current time if an intermediate render stopped it
      } else if (!wasRun) {
        action.reset().play();
      }
    } else {
      wasInRunStateRef.current = false;
      action.stop();
    }
  }, [preparingRun, animationState]);

  useEffect(() => {
    if (firstWalkLerp) {
      setLerpPosition(firstWalkLerp.start);
      firstWalkStartTimeRef.current = null;
      lastLerpEndRef.current = [...firstWalkLerp.end];
    } else {
      firstWalkStartTimeRef.current = null;
    }
  }, [firstWalkLerp]);

  useEffect(() => {
    if (runLerp) {
      setLerpPosition(runLerp.start);
      runLerpStartTimeRef.current = null;
      lastLerpEndRef.current = [...runLerp.end];
    } else {
      runLerpStartTimeRef.current = null;
    }
  }, [runLerp]);

  useFrame((state, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
    if ((preparingRun || animationState === 'running') && runningMixerRef.current) {
      runningMixerRef.current.update(delta);
    }
    const group = groupRef.current;
    // When meeting snap is pending, apply it first and skip lerp so we don't overwrite with lerp and glitch
    if (jesusSnapToRef?.current && group) {
      const [x, y, z] = jesusSnapToRef.current;
      group.position.set(x, y, z);
      lastLerpEndRef.current = [x, y, z];
      jesusSnapToRef.current = null;
      firstWalkStartTimeRef.current = null;
    } else {
    // First-walk lerp: write position directly to group every frame (no setState) so lerp is always fresh
    if (firstWalkLerp && firstWalkDurationSec > 0) {
      if (firstWalkStartTimeRef.current === null) {
        firstWalkStartTimeRef.current = state.clock.getElapsedTime();
      }
      const elapsed = state.clock.getElapsedTime() - firstWalkStartTimeRef.current;
      const progress = Math.min(1, elapsed / firstWalkDurationSec);
      const [sx, sy, sz] = firstWalkLerp.start;
      const [ex, ey, ez] = firstWalkLerp.end;
      const x = sx + (ex - sx) * progress;
      const y = sy + (ey - sy) * progress;
      const z = sz + (ez - sz) * progress;
      if (group) group.position.set(x, y, z);
      if (progress >= 1) {
        firstWalkStartTimeRef.current = null;
        lastLerpEndRef.current = [x, y, z];
        if (jesusLerpArrivedRef) jesusLerpArrivedRef.current = true;
      }
    }
    // Run lerp: same – write directly to group every frame
    else if (runLerp && runDurationSec > 0) {
      if (runLerpStartTimeRef.current === null) {
        runLerpStartTimeRef.current = state.clock.getElapsedTime();
      }
      const elapsed = state.clock.getElapsedTime() - runLerpStartTimeRef.current;
      const progress = Math.min(1, elapsed / runDurationSec);
      const [sx, sy, sz] = runLerp.start;
      const [ex, ey, ez] = runLerp.end;
      const x = sx + (ex - sx) * progress;
      const y = sy + (ey - sy) * progress;
      const z = sz + (ez - sz) * progress;
      if (group) group.position.set(x, y, z);
      if (progress >= 1) {
        runLerpStartTimeRef.current = null;
        lastLerpEndRef.current = [x, y, z];
      }
    }
    }
    if (group) {
      const p = group.position;
      if (jesusPositionRef) jesusPositionRef.current = [p.x, p.y, p.z];
      if (jesusRotationYRef) {
        const ry =
          faceToward != null
            ? Math.atan2(faceToward[0] - p.x, faceToward[2] - p.z)
            : faceRight
              ? -Math.PI / 2
              : invertFacing
                ? 0
                : Math.PI;
        jesusRotationYRef.current = ry;
      }
    }
  });

  if (!model) return null;

  const showRunningClone = animationState === 'running';

  // When a snap is pending (meeting arrival), use it for position/rotation immediately so we don't show one frame at wrong place
  const snapPosition = jesusSnapToRef?.current ?? null;
  const groupPosition = runLerp
    ? lerpPosition
    : firstWalkLerp
      ? lerpPosition
      : lastLerpEndRef.current != null
        ? lastLerpEndRef.current
        : position;
  const inLerp = Boolean(runLerp || firstWalkLerp);
  const displayPosition = snapPosition ?? (inLerp ? lerpPosition : groupPosition);
  const rotationY =
    faceToward != null
      ? Math.atan2(faceToward[0] - displayPosition[0], faceToward[2] - displayPosition[2])
      : faceRight
        ? -Math.PI / 2
        : invertFacing
          ? 0
          : Math.PI;
  return (
    <group ref={groupRef} position={inLerp && !snapPosition ? undefined : displayPosition} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={model} visible={!showRunningClone} />
      {runningClone && <primitive object={runningClone} visible={showRunningClone} />}
    </group>
  );
}
