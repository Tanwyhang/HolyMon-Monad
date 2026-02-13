"use client";

import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import type { Triple } from '@react-three/fiber';
import * as THREE from 'three';
import { FBXLoaderSilent } from './fbxLoaderSilent';

export interface RecolorMesh {
  /** Mesh (object) names to recolor (exact match). */
  names: string[];
  /** Hex color, e.g. 0x800080 for purple. */
  color: number;
}

/** When active, scale and glow these meshes (e.g. Moanad "Maze" during Pray). */
export interface HighlightMesh {
  /** Mesh names to scale and glow (case-insensitive match). */
  names: string[];
  /** Scale multiplier when active (e.g. 1.5 = bigger). */
  scaleWhenActive?: number;
  /** Emissive intensity when active (0–1+, makes it glow). */
  glowIntensityWhenActive?: number;
  /** Emissive color when active (hex). */
  glowColorWhenActive?: number;
}

interface StaticFbxCharacterProps {
  url: string;
  position?: Triple;
  scale?: number;
  /** Optional: recolor specific meshes by name. */
  recolor?: RecolorMesh;
  /** Optional: mesh names to spin (e.g. a sphere). Radians per second. */
  spinMeshNames?: string[];
  /** Spin speed in radians per second (default 1). */
  spinSpeed?: number;
  /** Optional: brighten materials so model isn't black (adds emissive). */
  brightenMaterials?: boolean;
  /** When true, meshes in highlightMesh are scaled up and given emissive glow. */
  highlightActive?: boolean;
  /** Which meshes to scale/glow when highlightActive (e.g. { names: ['Maze'], scaleWhenActive: 1.5, glowIntensityWhenActive: 1 }). */
  highlightMesh?: HighlightMesh;
}

const DEFAULT_HIGHLIGHT_SCALE = 1.5;
const DEFAULT_GLOW_INTENSITY = 1;
const DEFAULT_GLOW_COLOR = 0x800080;

export function StaticFbxCharacter({
  url,
  position = [0, 0, 0],
  scale = 1,
  recolor,
  spinMeshNames,
  spinSpeed = 1,
  brightenMaterials = false,
  highlightActive = false,
  highlightMesh,
}: StaticFbxCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const highlightOriginalScalesRef = useRef<Map<THREE.Mesh, THREE.Vector3>>(new Map());
  const raw = useLoader(FBXLoaderSilent, url);
  const model = useMemo(() => {
    const clone = raw.clone();
    clone.scale.set(scale, scale, scale);
    if (recolor?.names?.length && recolor.color != null) {
      const color = new THREE.Color(recolor.color);
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh && recolor.names.some((n) => child.name.toLowerCase() === n.toLowerCase())) {
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const cloned = materials.map((m) => {
              const mat = m.clone() as THREE.Material & { color?: THREE.Color };
              if (mat.color) mat.color.copy(color);
              return mat;
            });
            child.material = cloned.length === 1 ? cloned[0] : cloned;
          }
        }
      });
    }
    if (brightenMaterials) {
      const emissiveColor = new THREE.Color(0.4, 0.4, 0.45);
      const fallbackColor = new THREE.Color(0.45, 0.45, 0.5);
      const placeholderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      const placeholderMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
        emissive: 0x333333,
        emissiveIntensity: 0.3,
      });
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const noGeometry =
            !child.geometry ||
            !child.geometry.attributes?.position ||
            child.geometry.attributes.position.count === 0;
          if (noGeometry) {
            child.geometry = placeholderGeometry.clone();
            child.material = placeholderMaterial.clone();
          } else if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const cloned = materials.map((m) => {
            const mat = m.clone() as THREE.Material & {
              emissive?: THREE.Color;
              emissiveIntensity?: number;
              color?: THREE.Color;
              map?: THREE.Texture | null;
              normalMap?: THREE.Texture | null;
              roughnessMap?: THREE.Texture | null;
              metalnessMap?: THREE.Texture | null;
              aoMap?: THREE.Texture | null;
            };
            // Remove texture maps so missing 404 textures don't leave material black
            if (mat.map) mat.map = null;
            if (mat.normalMap) mat.normalMap = null;
            if (mat.roughnessMap) mat.roughnessMap = null;
            if (mat.metalnessMap) mat.metalnessMap = null;
            if (mat.aoMap) mat.aoMap = null;
            if (mat.color) {
              if (mat.color.getHex() === 0x000000) mat.color.copy(fallbackColor);
            } else if ('color' in mat) (mat as THREE.Material & { color: THREE.Color }).color = fallbackColor.clone();
            if ('emissive' in mat && mat.emissive) {
              mat.emissive.copy(emissiveColor);
              if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.5;
            }
            return mat;
          });
          child.material = cloned.length === 1 ? cloned[0] : cloned;
          }
        }
      });
      // Add placeholder mesh to groups that represent Cylinder049 / 7f3661fc but have no mesh
      const cylinderPlaceholderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      const cylinderPlaceholderMat = new THREE.MeshLambertMaterial({
        color: 0x666666,
        emissive: 0x333333,
        emissiveIntensity: 0.3,
      });
      const nameMatchesCylinder = (n: string) =>
        /Cylinder049|7f3661fc|g\s*Cylinder/i.test(n.replace(/_/g, ' '));
      clone.traverse((child) => {
        if (child instanceof THREE.Group || (child as THREE.Object3D).isObject3D) {
          const name = child.name || '';
          if (!nameMatchesCylinder(name)) return;
          const hasMesh = child.children.some(
            (c) => c instanceof THREE.Mesh && (c as THREE.Mesh).geometry?.attributes?.position?.count
          );
          if (!hasMesh) {
            const placeholder = new THREE.Mesh(cylinderPlaceholderGeo.clone(), cylinderPlaceholderMat.clone());
            child.add(placeholder);
          }
        }
      });
    }
    return clone;
  }, [raw, scale, recolor?.names?.join(','), recolor?.color, brightenMaterials]);

  useFrame((_, delta) => {
    const root = groupRef.current?.children[0] as THREE.Object3D | undefined;
    if (!root) return;

    if (spinMeshNames?.length) {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh && spinMeshNames.some((n) => child.name.toLowerCase() === n.toLowerCase())) {
          child.rotation.y += delta * spinSpeed;
        }
      });
    }

    // When praying: only restore scale when turning off. Do not scale when turning on – scaling the Maze mesh makes it disappear (likely hierarchy/rig).
    if (highlightMesh?.names?.length) {
      const names = highlightMesh.names.map((n) => n.toLowerCase());
      const originalScales = highlightOriginalScalesRef.current;

      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const match = names.some((n) => child.name.toLowerCase() === n);
        if (!match) return;

        if (highlightActive) {
          // Skip scale when active – it was making the Maze disappear. Glow is done via point light in CharacterScene.
        } else {
          const saved = originalScales.get(child);
          if (saved) {
            child.scale.copy(saved);
            originalScales.delete(child);
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={position} scale={1}>
      <primitive object={model} />
    </group>
  );
}
