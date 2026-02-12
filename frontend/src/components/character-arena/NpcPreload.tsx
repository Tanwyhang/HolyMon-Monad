"use client";

import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import { ALL_NPC_FBX_PATHS } from './npcPaths';

/**
 * Preloads all NPC base models and animation FBX files so that when NPCs spawn or
 * switch animations, assets are already cached and the scene won't refresh/flicker.
 * Renders nothing; Suspense waits until all are loaded.
 */
export function NpcPreload() {
  useLoader(FBXLoader, ALL_NPC_FBX_PATHS);
  return null;
}
