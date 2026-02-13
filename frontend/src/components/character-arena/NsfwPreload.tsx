"use client";

import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import { ALL_NSFW_FBX_PATHS } from './nsfwPaths';

/** Preloads NSFW Boss, Leng, BossIdle, LengTwerk so they appear without suspend. */
export function NsfwPreload() {
  useLoader(FBXLoader, ALL_NSFW_FBX_PATHS);
  return null;
}
