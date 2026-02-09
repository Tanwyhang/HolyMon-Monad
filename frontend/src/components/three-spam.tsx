"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  BloomEffect,
  EffectPass,
  ChromaticAberrationEffect,
  VignetteEffect,
} from "postprocessing";

// =====================================================================
// CUSTOM GLSL SHADERS
// =====================================================================

// --- HOLOGRAPHIC / IRIDESCENT SHADER ---
// Fresnel-based iridescence that shifts color based on view angle + time
const holoVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const holoFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

    // Iridescent color shift based on angle + time
    float hue = fresnel * 2.0 + uTime * 0.3 + vUv.x * 1.5;
    vec3 iridescentColor = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.33, 0.67)));

    vec3 baseColor = mix(uColor1, uColor2, fresnel);
    vec3 finalColor = mix(baseColor, iridescentColor, 0.6 + 0.4 * sin(uTime));

    // Hot edge glow
    float edgeGlow = smoothstep(0.2, 1.0, fresnel) * 2.0;
    finalColor += vec3(0.5, 0.3, 1.0) * edgeGlow;

    float alpha = 0.7 + fresnel * 0.3;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- FIRE / LAVA SHADER ---
// Animated noise-based flowing energy with vertex displacement
const fireVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  uniform float uTime;

  vec3 mod289v(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permutev(vec4 x) { return mod289v4(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrtv(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289v(i);
    vec4 p = permutev(permutev(permutev(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 fx = x_ * ns.x + ns.yyyy;
    vec4 fy = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(fx) - abs(fy);
    vec4 b0 = vec4(fx.xy, fy.xy);
    vec4 b1 = vec4(fx.zw, fy.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrtv(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    float noise = snoise(position * 2.0 + uTime * 0.5) * 0.15;
    vec3 displaced = position + normal * noise;
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fireFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3d(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x),
                   mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),
                   mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  void main() {
    vec3 pos = vWorldPosition * 1.5;
    float n1 = noise3d(pos + uTime * 0.8);
    float n2 = noise3d(pos * 2.0 - uTime * 1.2) * 0.5;
    float n3 = noise3d(pos * 4.0 + uTime * 2.0) * 0.25;
    float noise = n1 + n2 + n3;

    vec3 col1 = vec3(0.1, 0.0, 0.0);
    vec3 col2 = vec3(0.8, 0.1, 0.0);
    vec3 col3 = vec3(1.0, 0.5, 0.0);
    vec3 col4 = vec3(1.0, 0.85, 0.2);
    vec3 col5 = vec3(1.0, 1.0, 0.9);

    float t = noise * 0.5 + 0.5;
    vec3 fireColor;
    if (t < 0.25) fireColor = mix(col1, col2, t / 0.25);
    else if (t < 0.5) fireColor = mix(col2, col3, (t - 0.25) / 0.25);
    else if (t < 0.75) fireColor = mix(col3, col4, (t - 0.5) / 0.25);
    else fireColor = mix(col4, col5, (t - 0.75) / 0.25);

    fireColor *= 1.5 + noise * 0.5;
    gl_FragColor = vec4(fireColor, 0.9);
  }
`;

// --- VOID CRYSTAL SHADER ---
// Internal nebula with animated distortion and sparkles
const voidVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const voidFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3d(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x),
                   mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),
                   mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

    vec3 samplePos = vWorldPosition * 2.0 + uTime * 0.2;
    float n1 = noise3d(samplePos);
    float n2 = noise3d(samplePos * 3.0 + uTime * 0.5) * 0.5;
    float nebula = n1 + n2;

    vec3 deepVoid = vec3(0.05, 0.0, 0.15);
    vec3 cosmicPurple = vec3(0.5, 0.1, 0.9);
    vec3 holyGold = vec3(1.0, 0.8, 0.2);

    vec3 nebulaColor = mix(deepVoid, cosmicPurple, nebula);
    nebulaColor = mix(nebulaColor, holyGold, pow(nebula, 3.0) * 0.5);

    vec3 edgeColor = vec3(0.6, 0.3, 1.0) * fresnel * 3.0;

    float sparkle = pow(noise3d(vWorldPosition * 20.0 + uTime), 8.0);
    vec3 sparkleColor = vec3(1.0, 0.9, 1.0) * sparkle * 2.0;

    vec3 finalColor = nebulaColor + edgeColor + sparkleColor;
    float alpha = 0.6 + fresnel * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// =====================================================================
// COMPONENT
// =====================================================================

export function ThreeSpam() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Mouse position normalized to -1..1 (center = 0,0)
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // ---- MOUSE TRACKING ----
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ---- SCENE SETUP ----
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ---- LIGHTING ----
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0x836ef9, 15, 60);
    purpleLight.position.set(-10, -10, 10);
    scene.add(purpleLight);

    const goldLight = new THREE.PointLight(0xffaa00, 10, 50);
    goldLight.position.set(10, 5, -5);
    scene.add(goldLight);

    // ---- SHADER MATERIALS ----
    const clock = new THREE.Clock();
    const shaderUniforms: { uTime: THREE.IUniform }[] = [];

    const createHoloMaterial = (color1: THREE.Color, color2: THREE.Color) => {
      const uniforms = {
        uTime: { value: 0 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
      };
      shaderUniforms.push(uniforms);
      return new THREE.ShaderMaterial({
        vertexShader: holoVertexShader,
        fragmentShader: holoFragmentShader,
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
      });
    };

    const createFireMaterial = () => {
      const uniforms = { uTime: { value: 0 } };
      shaderUniforms.push(uniforms);
      return new THREE.ShaderMaterial({
        vertexShader: fireVertexShader,
        fragmentShader: fireFragmentShader,
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
      });
    };

    const createVoidMaterial = () => {
      const uniforms = { uTime: { value: 0 } };
      shaderUniforms.push(uniforms);
      return new THREE.ShaderMaterial({
        vertexShader: voidVertexShader,
        fragmentShader: voidFragmentShader,
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
      });
    };

    // ---- HOLY OBJECT GENERATORS ----

    const createCross = (mat: THREE.Material) => {
      const group = new THREE.Group();
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 0.6), mat);
      const h = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.6), mat);
      h.position.y = 0.5;
      group.add(v, h);
      return group;
    };

    const createHexagram = (mat: THREE.Material) => {
      const group = new THREE.Group();
      const geo = new THREE.TetrahedronGeometry(1.5, 0);
      const t1 = new THREE.Mesh(geo, mat);
      const t2 = new THREE.Mesh(geo, mat);
      t2.rotation.x = Math.PI;
      t2.rotation.z = Math.PI / 6;
      group.add(t1, t2);
      return group;
    };

    const createOphanim = (mat: THREE.Material) => {
      const group = new THREE.Group();
      const geo = new THREE.TorusGeometry(1.2, 0.15, 8, 40);
      const r1 = new THREE.Mesh(geo, mat);
      const r2 = new THREE.Mesh(geo, mat);
      r2.rotation.x = Math.PI / 2;
      const r3 = new THREE.Mesh(geo, mat);
      r3.rotation.y = Math.PI / 2;
      group.add(r1, r2, r3);
      const eyeGeo = new THREE.IcosahedronGeometry(0.3, 0);
      const eye = new THREE.Mesh(eyeGeo, mat);
      group.add(eye);
      return group;
    };

    // Infinity / Lemniscate shape - figure 8 curve
    const createInfinity = (mat: THREE.Material) => {
      const group = new THREE.Group();
      const points: THREE.Vector3[] = [];
      const segments = 128;
      const scale = 2.5;

      // Parametric lemniscate of Bernoulli
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        points.push(new THREE.Vector3(x, y, 0));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);
      const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.25, 16, true);
      const tube = new THREE.Mesh(tubeGeo, mat);
      group.add(tube);
      return group;
    };

    // ---- OBJECT CREATION ----

    const objects: {
      mesh: THREE.Object3D;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: { x: number; y: number; z: number };
      baseScale: number;
      baseY: number;
      baseX: number;
      depthFactor: number; // how much cursor parallax affects this object
    }[] = [];

    const geometries = [
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusKnotGeometry(1, 0.3, 128, 32),
      new THREE.TetrahedronGeometry(1, 0),
    ];

    for (let i = 0; i < 12; i++) {
      const randShader = Math.random();
      let mat: THREE.Material;
      if (randShader > 0.65) {
        mat = createHoloMaterial(
          new THREE.Color(0x836ef9),
          new THREE.Color(0xffd700),
        );
      } else if (randShader > 0.35) {
        mat = createFireMaterial();
      } else {
        mat = createVoidMaterial();
      }

      const randType = Math.random();
      let obj: THREE.Object3D;
      if (randType > 0.85) {
        obj = createCross(mat);
      } else if (randType > 0.7) {
        obj = createHexagram(mat);
      } else if (randType > 0.55) {
        obj = createOphanim(mat);
      } else if (randType > 0.35) {
        obj = createInfinity(mat);
      } else {
        const geometry =
          geometries[Math.floor(Math.random() * geometries.length)];
        obj = new THREE.Mesh(geometry, mat);
      }

      const px = (Math.random() - 0.5) * 60;
      const py = (Math.random() - 0.5) * 40;
      const pz = (Math.random() - 0.5) * 30 - 5;
      obj.position.set(px, py, pz);

      const scale = Math.random() * 6 + 3;
      obj.scale.set(scale, scale, scale);

      obj.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      obj.userData = { baseScale: scale, id: Math.random() * 100 };

      // Depth factor: objects closer to camera (higher Z) get more parallax
      // Range 0.3 to 2.0 — creates layered depth illusion
      const depthFactor = 0.3 + ((pz + 20) / 45) * 1.7;

      scene.add(obj);

      objects.push({
        mesh: obj,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.008,
        },
        floatSpeed: {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.005,
        },
        baseScale: scale,
        baseX: px,
        baseY: py,
        depthFactor,
      });
    }

    // ---- GUARANTEED BIG INFINITY - Always visible, prominent ----
    {
      const infinityMat = createHoloMaterial(
        new THREE.Color(0x836ef9),
        new THREE.Color(0xffd700),
      );
      const bigInfinity = createInfinity(infinityMat);

      const bigScale = 12; // Much bigger than other objects
      bigInfinity.scale.set(bigScale, bigScale, bigScale);
      bigInfinity.position.set(0, 0, 5); // Center, closer to camera
      bigInfinity.userData = { baseScale: bigScale, id: 999 };

      scene.add(bigInfinity);

      objects.push({
        mesh: bigInfinity,
        rotSpeed: { x: 0.003, y: 0.006, z: 0.002 },
        floatSpeed: { x: 0, y: 0, z: 0 }, // Stays centered
        baseScale: bigScale,
        baseX: 0,
        baseY: 0,
        depthFactor: 2.0, // Max parallax for depth effect
      });
    }

    // ---- POST PROCESSING ----
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new BloomEffect({
      intensity: 3.0,
      luminanceThreshold: 0.1,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    });

    const chromaticAberration = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.002, 0.002),
      radialModulation: true,
      modulationOffset: 0.3,
    });

    const vignette = new VignetteEffect({
      darkness: 0.7,
      offset: 0.3,
    });

    composer.addPass(
      new EffectPass(camera, bloom, chromaticAberration, vignette),
    );

    // ---- ANIMATION ----
    let animationFrameId: number;
    // Smoothed mouse for lerp
    const smoothMouse = { x: 0, y: 0 };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Update shader uniforms
      shaderUniforms.forEach((u) => {
        u.uTime.value = elapsed;
      });

      // Smooth mouse lerp (0.05 = smooth, 0.2 = snappy)
      smoothMouse.x += (mouseRef.current.x - smoothMouse.x) * 0.08;
      smoothMouse.y += (mouseRef.current.y - smoothMouse.y) * 0.08;

      // ---- CURSOR PARALLAX ----
      // Each object shifts opposite to cursor based on its depthFactor
      // Closer objects (higher depthFactor) move MORE = parallax illusion
      objects.forEach((obj) => {
        // Rotate
        obj.mesh.rotation.x += obj.rotSpeed.x;
        obj.mesh.rotation.y += obj.rotSpeed.y;
        obj.mesh.rotation.z += obj.rotSpeed.z;

        // Float drift
        obj.baseX += obj.floatSpeed.x;
        obj.baseY += obj.floatSpeed.y;
        obj.mesh.position.z += obj.floatSpeed.z;

        // Apply cursor-driven parallax offset to base position (inverted direction)
        const parallaxX = -smoothMouse.x * obj.depthFactor * 4;
        const parallaxY = -smoothMouse.y * obj.depthFactor * 4;
        obj.mesh.position.x = obj.baseX + parallaxX;
        obj.mesh.position.y = obj.baseY + parallaxY;

        // Pulse scale
        const pulse = Math.sin(elapsed + obj.mesh.userData.id) * 0.2;
        const s = obj.baseScale + pulse;
        obj.mesh.scale.set(s, s, s);

        // Wrap around (on base position)
        if (obj.baseX > 40) obj.baseX = -40;
        if (obj.baseX < -40) obj.baseX = 40;
        if (obj.baseY > 30) obj.baseY = -30;
        if (obj.baseY < -30) obj.baseY = 30;
      });

      // Camera subtle tilt following mouse
      camera.rotation.z = Math.sin(elapsed * 0.05) * 0.02;
      camera.position.x = smoothMouse.x * 1.5;
      camera.position.y = smoothMouse.y * 1.5;

      // Animated chromatic aberration for glitch feel
      const aberrationStrength = 0.001 + Math.sin(elapsed * 2) * 0.001;
      chromaticAberration.offset.set(aberrationStrength, aberrationStrength);

      composer.render();
    };

    animate();

    // ---- RESIZE ----
    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // ---- CLEANUP ----
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometries.forEach((g) => g.dispose());
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />
  );
}
