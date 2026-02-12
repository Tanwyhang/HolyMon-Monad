"use client";

import { useLoader } from '@react-three/fiber';
import { FBXLoaderSilent } from './fbxLoaderSilent';
import { ALL_JESUS_FBX_PATHS } from './jesusPaths';

/**
 * Preloads all Jesus animation FBX files so that when Jesus switches animations,
 * assets are already cached and the scene won't refresh/flicker.
 * Renders nothing; Suspense waits until all are loaded.
 */
export function JesusPreload() {
  useLoader(FBXLoaderSilent, ALL_JESUS_FBX_PATHS);
  return null;
}
