/**
 * All NPC FBX paths - used for preloading so the scene doesn't refresh when switching animations or spawning NPCs.
 */
export const NPC_BASE_PATHS = {
  unconverted: [
    '/3d/NPC - Unconverted 1.fbx',
    '/3d/NPC - Unconverted 2.fbx',
    '/3d/NPC - Unconverted 4.fbx',
    '/3d/NPC - Unconverted 5.fbx',
  ],
  converted: '/3d/NPC - Converted.fbx',
} as const;

export const NPC_ANIMATION_PATHS = {
  walk: [
    '/3d/NPC - Walk 1.fbx',
    '/3d/NPC - Walk 2.fbx',
    '/3d/NPC - Walk 3.fbx',
  ],
  idle: [
    '/3d/NPC - Idle 1.fbx',
    '/3d/NPC - Idle 2.fbx',
    '/3d/NPC - Idle 3.fbx',
  ],
  success: [
    '/3d/NPC - Success 1.fbx',
    '/3d/NPC - Success 2.fbx',
    '/3d/NPC - Success 3.fbx',
  ],
  failed: [
    '/3d/NPC - Failed 1.fbx',
    '/3d/NPC - Failed 2.fbx',
  ],
} as const;

/** Flat list of all NPC animation paths (fixed order) – use with useLoader to avoid suspend on path change */
export const ALL_NPC_ANIMATION_PATHS: string[] = [
  ...NPC_ANIMATION_PATHS.walk,
  ...NPC_ANIMATION_PATHS.idle,
  ...NPC_ANIMATION_PATHS.success,
  ...NPC_ANIMATION_PATHS.failed,
];

export function getNpcAnimationIndex(path: string): number {
  const i = ALL_NPC_ANIMATION_PATHS.indexOf(path);
  return i >= 0 ? i : 0;
}

export const ALL_NPC_FBX_PATHS: string[] = [
  ...NPC_BASE_PATHS.unconverted,
  NPC_BASE_PATHS.converted,
  ...ALL_NPC_ANIMATION_PATHS,
];

/** Number of base models in ALL_NPC_FBX_PATHS (indices 0–4); animations start at this index */
export const NPC_FBX_BASE_COUNT = 5;
