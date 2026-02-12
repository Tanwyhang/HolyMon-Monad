import type { AnimationState } from './types';

/** Jesus animation file paths (each FBX contains mesh + animation). */
export const JESUS_ANIMATION_PATHS: Record<AnimationState, string> = {
  idle: '/3d/Jesus - Start Walking.fbx',
  walking: '/3d/Jesus - Start Walking.fbx',
  talking: '/3d/Jesus - Talking.fbx',
  cheering: '/3d/Jesus - Cheering.fbx',
  walkBackward: '/3d/Jesus - Walk Backward.fbx',
  flyingKick: '/3d/Jesus - Flying Kick.fbx',
};

/** Unique Jesus FBX paths for preloading (no duplicates). */
export const ALL_JESUS_FBX_PATHS: string[] = [
  '/3d/Jesus - Start Walking.fbx',
  '/3d/Jesus - Talking.fbx',
  '/3d/Jesus - Cheering.fbx',
  '/3d/Jesus - Walk Backward.fbx',
  '/3d/Jesus - Flying Kick.fbx',
];
