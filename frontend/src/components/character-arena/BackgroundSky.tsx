"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const skyVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simple noise function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    // Dark purple base colors
    vec3 darkPurple = vec3(0.15, 0.05, 0.25);
    vec3 deepPurple = vec3(0.25, 0.1, 0.4);
    vec3 accentPurple = vec3(0.35, 0.15, 0.5);

    // Animated cloud layers using FBM noise
    float n1 = fbm(vUv * 3.0 + uTime * 0.05);
    float n2 = fbm(vUv * 6.0 - uTime * 0.03 + vec2(1.7, 3.2)) * 0.5;
    float n3 = fbm(vUv * 10.0 + uTime * 0.02 + vec2(5.3, 1.8)) * 0.25;

    float clouds = n1 + n2 + n3;

    // Normalize clouds to 0-1 range approximately
    clouds = clouds * 0.5 + 0.5;

    // Gradient (lighter at horizon)
    float horizon = 1.0 - abs(vUv.y - 0.5) * 2.0;

    // Mix colors based on cloud density and horizon
    vec3 skyColor = mix(darkPurple, deepPurple, clouds * 0.7);
    skyColor = mix(skyColor, accentPurple, clouds * horizon * 0.5);

    // Add subtle purple glow at top
    float topGlow = 1.0 - vUv.y;
    skyColor += vec3(0.1, 0.05, 0.2) * topGlow * 0.5;

    // Add bottom shadow
    float bottomShadow = vUv.y;
    skyColor *= (0.7 + bottomShadow * 0.3);

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export function BackgroundSky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[100, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
