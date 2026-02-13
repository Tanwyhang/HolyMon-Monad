/**
 * FBX loader that suppresses the "Vertex has more than 4 skinning weights" warning
 * and serves placeholder textures for missing Moanad-embedded texture URLs to avoid 404s.
 */
import { FBXLoader as ThreeFBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DataTexture, TextureLoader as ThreeTextureLoader, ImageLoader as ThreeImageLoader } from 'three';
import type { Group } from 'three';

// 1x1 gray PNG data URL – no network request
const PLACEHOLDER_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAHRQG/XK4bYwAAAABJRU5ErkJggg==';

// URLs that are embedded in Moanad FBX but not present in public/ – use placeholder instead of 404
function isMissingMoanadTexture(url: string): boolean {
  const u = decodeURIComponent(url);
  return (
    u.includes('Moanad.fbm') ||
    u.includes('character_armor') ||
    u.includes('character_hands') ||
    u.includes('heart_wire') ||
    u.includes('mask_gold') ||
    (u.includes('robe') && u.includes('_robe_')) ||
    u.includes('dagger_dagger') ||
    u.includes('7f3661fc72954e518c51143c9394dfa5') ||
    u.includes('g_Cylinder') ||
    u.includes('Cylinder049') ||
    u.includes('g Cylinder') ||
    (u.includes('/3d/') && /\.(jpg|jpeg|png)(\?|$)/i.test(u)) // any image under /3d/ (no image files there)
  );
}

function createPlaceholderTexture(): DataTexture {
  const data = new Uint8Array([128, 128, 128, 255]);
  const tex = new DataTexture(data, 1, 1);
  tex.needsUpdate = true;
  return tex;
}

const originalTextureLoad = ThreeTextureLoader.prototype.load;
ThreeTextureLoader.prototype.load = function (
  url: string,
  onLoad?: (t: import('three').Texture) => void,
  onProgress?: unknown,
  onError?: unknown
) {
  if (isMissingMoanadTexture(url)) {
    const texture = createPlaceholderTexture();
    onLoad?.(texture);
    return texture;
  }
  return originalTextureLoad.call(this, url, onLoad, onProgress, onError);
};

// Also patch ImageLoader so requests that get path-prepended (e.g. /3d/ + tex\file.jpg) are caught
const originalImageLoad = ThreeImageLoader.prototype.load;
ThreeImageLoader.prototype.load = function (
  url: string,
  onLoad?: (image: HTMLImageElement) => void,
  onProgress?: unknown,
  onError?: unknown
) {
  const path = (this as { path?: string }).path ?? '';
  const resolved = path ? path + url : url;
  if (isMissingMoanadTexture(resolved)) {
    const image = new Image();
    image.onload = () => onLoad?.(image);
    image.src = PLACEHOLDER_IMAGE_DATA_URL;
    return image;
  }
  return originalImageLoad.call(this, url, onLoad, onProgress, onError);
};

export class FBXLoaderSilent extends ThreeFBXLoader {
  load(
    url: string,
    onLoad?: (result: Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void
  ): void {
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Vertex has more than 4 skinning weights')
      ) {
        return;
      }
      origWarn.apply(console, args);
    };
    const wrappedOnLoad = (result: Group) => {
      console.warn = origWarn;
      onLoad?.(result);
    };
    const wrappedOnError = (err: unknown) => {
      console.warn = origWarn;
      onError?.(err);
    };
    super.load(url, wrappedOnLoad, onProgress, wrappedOnError);
  }
}
