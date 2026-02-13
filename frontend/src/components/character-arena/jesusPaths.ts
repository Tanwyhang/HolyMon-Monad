import type { AnimationState } from './types';

/** Single Jesus model (mesh + rig, no animation). */
export const JESUS_MODEL = '/3d/Jesus.fbx';

/** Animation source FBXs (each contains a clip we apply to JESUS_MODEL). */
export const JESUS_ANIMATION_PATHS: Record<AnimationState, string> = {
  idle: '/3d/Jesus - Start Walking.fbx',
  walking: '/3d/Jesus - Start Walking.fbx',
  talking: '/3d/Jesus - Talking.fbx',
  cheering: '/3d/Jesus - Cheering.fbx',
  walkBackward: '/3d/Jesus - Walk Backward.fbx',
  flyingKick: '/3d/Jesus - Flying Kick.fbx',
  deal: '/3d/Deal.fbx',
  praying: '/3d/Praying.fbx',
};

/** Order: model first, then one FBX per animation. */
export const ALL_JESUS_FBX_PATHS: string[] = [
  JESUS_MODEL,
  '/3d/Jesus - Start Walking.fbx',
  '/3d/Jesus - Talking.fbx',
  '/3d/Jesus - Cheering.fbx',
  '/3d/Jesus - Walk Backward.fbx',
  '/3d/Jesus - Flying Kick.fbx',
  '/3d/Deal.fbx',
  '/3d/Praying.fbx',
];

/** Index into ALL_JESUS_FBX_PATHS for the animation clip (1 = idle/walking, 2 = talking, ...). */
export const JESUS_ANIMATION_INDEX: Record<AnimationState, number> = {
  idle: 1,
  walking: 1,
  talking: 2,
  cheering: 3,
  walkBackward: 4,
  flyingKick: 5,
  deal: 6,
  praying: 7,
};
