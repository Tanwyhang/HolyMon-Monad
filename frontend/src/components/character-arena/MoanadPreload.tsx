"use client";

import { useLoader } from '@react-three/fiber';
import { FBXLoaderSilent } from './fbxLoaderSilent';
import { ALL_MOANAD_FBX_PATHS } from './moanadPaths';

/** Preloads Moanad GOD and Follower FBX so they appear without suspend. */
export function MoanadPreload() {
  useLoader(FBXLoaderSilent, ALL_MOANAD_FBX_PATHS);
  return null;
}
