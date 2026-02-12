/**
 * FBX loader that suppresses the "Vertex has more than 4 skinning weights" warning.
 * WebGL supports max 4 bone weights per vertex; FBX from some DCC tools can have more,
 * and Three.js truncates them. This loader filters that specific console.warn during parse.
 */
import { FBXLoader as ThreeFBXLoader } from 'three/addons/loaders/FBXLoader.js';
import type { Group } from 'three';

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
