"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  BloomEffect,
  EffectPass,
} from "postprocessing";
import { AgentConnection, ActiveConnection, AgentNetworkData } from "./types";
import { useForceLayout } from "./physics";

export type { AgentNetworkData };

// =====================================================================
// CUSTOM GLSL SHADERS — CHROMATIC HOLY BLOOM
// =====================================================================

// Uses modelViewMatrix (always correct with Groups) + explicit cameraPos uniform

// --- HOLOGRAPHIC / IRIDESCENT SHADER ---
const holoVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uHighlight;
  uniform vec3 uCameraPos;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

    // Chromatic iridescence
    float hue = fresnel * 2.0 + uTime * 0.3 + vUv.x * 1.5;
    vec3 iridescentColor = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.33, 0.67)));

    vec3 baseColor = mix(uColor1, uColor2, fresnel);
    vec3 finalColor = mix(baseColor, iridescentColor, 0.6 + 0.4 * sin(uTime));

    // Holy edge glow
    float edgeGlow = smoothstep(0.2, 1.0, fresnel) * (2.0 + uHighlight * 3.0);
    finalColor += vec3(0.5, 0.3, 1.0) * edgeGlow;

    float alpha = 0.7 + fresnel * 0.3 + uHighlight * 0.2;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- VOID CRYSTAL SHADER ---
const voidVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const voidFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uHighlight;
  uniform vec3 uCameraPos;

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
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

    vec3 samplePos = vWorldPosition * 2.0 + uTime * 0.2;
    float n1 = noise3d(samplePos);
    float n2 = noise3d(samplePos * 3.0 + uTime * 0.5) * 0.5;
    float nebula = n1 + n2;

    vec3 deepVoid = vec3(0.05, 0.0, 0.15);
    vec3 cosmicPurple = mix(uColor1, vec3(0.5, 0.1, 0.9), 0.5);
    vec3 holyGold = mix(uColor2, vec3(1.0, 0.8, 0.2), 0.5);

    vec3 nebulaColor = mix(deepVoid, cosmicPurple, nebula);
    nebulaColor = mix(nebulaColor, holyGold, pow(nebula, 3.0) * 0.5);

    vec3 edgeColor = vec3(0.6, 0.3, 1.0) * fresnel * (3.0 + uHighlight * 5.0);

    float sparkle = pow(noise3d(vWorldPosition * 20.0 + uTime), 8.0) * (1.0 + uHighlight);
    vec3 sparkleColor = vec3(1.0, 0.9, 1.0) * sparkle * (2.0 + uHighlight * 3.0);

    vec3 finalColor = nebulaColor + edgeColor + sparkleColor;
    float alpha = 0.6 + fresnel * 0.4 + uHighlight * 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- CONNECTION ENERGY SHADER ---
const connectionVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const connectionFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float pulse = sin(vUv.x * 10.0 - uTime * 3.0) * 0.5 + 0.5;
    float edge = abs(vUv.y - 0.5) * 2.0;
    float edgeGlow = pow(1.0 - edge, 2.0);
    float glow = (0.3 + pulse * 0.5) * edgeGlow * uStrength;
    vec3 finalColor = uColor * (1.0 + pulse * 0.3);
    float alpha = glow * 0.6;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// =====================================================================
// TYPES
// =====================================================================

interface ConnectionMesh {
  mesh: THREE.Mesh;
  agent1Id: string;
  agent2Id: string;
}

interface AgentVisualState {
  group: THREE.Group;
  sphere: THREE.Mesh;
  ring: THREE.Mesh;
  sphereUniforms: {
    uTime: { value: number };
    uColor1: { value: THREE.Color };
    uColor2: { value: THREE.Color };
    uHighlight: { value: number };
    uCameraPos: { value: THREE.Vector3 };
  };
  ringMaterial: THREE.MeshBasicMaterial;
  labelElement: HTMLDivElement;
  baseScale: number;
  baseColor: THREE.Color;
}

interface AgentNetwork3DProps {
  data: {
    agents: AgentConnection[];
    connections: ActiveConnection[];
  };
  activeAgents: Set<string>;
}

// Agents whose symbol contains "VOID" get the void shader, everyone else gets holo
function isVoidAgent(symbol: string) {
  return symbol.toUpperCase().includes("VOID");
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export default function AgentNetwork3D({
  data,
  activeAgents,
}: AgentNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);

  // Scene infrastructure (created once)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animFrameRef = useRef<number>(0);
  const mountedRef = useRef(false);

  // Content refs
  const agentVisualsRef = useRef<Map<string, AgentVisualState>>(new Map());
  const connectionMeshesRef = useRef<ConnectionMesh[]>([]);
  const connectionUniformsRef = useRef<
    { uTime: { value: number } }[]
  >([]);
  const labelElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Keep latest props in refs so the animation loop never reads stale closures
  const activeAgentsRef = useRef(activeAgents);
  activeAgentsRef.current = activeAgents;

  // Physics
  const physicsLayout = useMemo(
    () => useForceLayout(data.agents, data.connections),
    [data.agents],
  );
  const physicsLayoutRef = useRef(physicsLayout);
  useEffect(() => {
    physicsLayoutRef.current = physicsLayout;
  }, [physicsLayout]);

  // ----------------------------------------------------------------
  // Cleanup helpers
  // ----------------------------------------------------------------
  const cleanupAgents = useCallback(() => {
    const scene = sceneRef.current;
    const labelsContainer = labelsContainerRef.current;

    agentVisualsRef.current.forEach((state) => {
      if (scene && state.group) {
        scene.remove(state.group);
        state.group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
            else (m.material as THREE.Material)?.dispose();
          }
        });
      }
      if (labelsContainer && state.labelElement && labelsContainer.contains(state.labelElement)) {
        labelsContainer.removeChild(state.labelElement);
      }
    });
    agentVisualsRef.current.clear();
    labelElementsRef.current.clear();
  }, []);

  const cleanupConnections = useCallback(() => {
    const scene = sceneRef.current;
    connectionMeshesRef.current.forEach((conn) => {
      if (scene) scene.remove(conn.mesh);
      conn.mesh.geometry?.dispose();
      (conn.mesh.material as THREE.Material)?.dispose();
    });
    connectionMeshesRef.current = [];
    connectionUniformsRef.current = [];
  }, []);

  // ----------------------------------------------------------------
  // Build agent visuals (with holy shaders)
  // ----------------------------------------------------------------
  const buildAgents = useCallback(
    (agents: AgentConnection[]) => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const labelsContainer = labelsContainerRef.current;
      if (!scene || !camera || !labelsContainer) return;

      cleanupAgents();

      agents.forEach((agent) => {
        const group = new THREE.Group();
        const color1 = new THREE.Color(agent.color);
        // Second color: a brighter / shifted variant for the shader gradient
        const color2 = new THREE.Color(agent.color).offsetHSL(0.1, 0.1, 0.15);
        const size = 1.5;

        // --- Sphere uniforms (shared between holo & void) ---
        const sphereUniforms = {
          uTime: { value: 0 },
          uColor1: { value: color1 },
          uColor2: { value: color2 },
          uHighlight: { value: 0 },
          uCameraPos: { value: camera.position.clone() },
        };

        // Pick shader variant
        const useVoid = isVoidAgent(agent.symbol);

        const sphereMat = new THREE.ShaderMaterial({
          vertexShader: useVoid ? voidVertexShader : holoVertexShader,
          fragmentShader: useVoid ? voidFragmentShader : holoFragmentShader,
          uniforms: sphereUniforms,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        const sphere = new THREE.Mesh(
          new THREE.IcosahedronGeometry(size, 2),
          sphereMat,
        );
        group.add(sphere);

        // --- Torus ring (additive glow) ---
        const ringMat = new THREE.MeshBasicMaterial({
          color: color1,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(size * 1.3, 0.08, 16, 48),
          ringMat,
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // --- HTML label ---
        const labelElement = document.createElement("div");
        labelElement.className = "absolute pointer-events-none transition-all duration-300";
        labelElement.style.cssText = `
          font-size: 14px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: ${agent.color};
          text-shadow: 0 0 10px ${agent.color}, 0 0 4px rgba(0,0,0,0.9);
          background: rgba(0, 0, 0, 0.65);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1.5px solid ${agent.color};
          white-space: nowrap;
          transform: translate(-50%, -100%);
          letter-spacing: 1.5px;
        `;
        labelElement.textContent = agent.symbol;
        labelsContainer.appendChild(labelElement);

        group.position.set(0, 5, 0);
        scene.add(group);

        agentVisualsRef.current.set(agent.id, {
          group,
          sphere,
          ring,
          sphereUniforms,
          ringMaterial: ringMat,
          labelElement,
          baseScale: size,
          baseColor: color1,
        });
        labelElementsRef.current.set(agent.id, labelElement);
      });
    },
    [cleanupAgents],
  );

  // ----------------------------------------------------------------
  // Build connection visuals
  // ----------------------------------------------------------------
  const buildConnections = useCallback(
    (connections: ActiveConnection[]) => {
      const scene = sceneRef.current;
      if (!scene) return;
      cleanupConnections();

      const meshes: ConnectionMesh[] = [];

      connections.forEach((conn) => {
        const uniforms = {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#836EF9") },
          uStrength: { value: conn.strength },
        };
        connectionUniformsRef.current.push(uniforms);

        const mat = new THREE.ShaderMaterial({
          vertexShader: connectionVertexShader,
          fragmentShader: connectionFragmentShader,
          uniforms,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 1, 8, 1, true),
          mat,
        );
        scene.add(tube);
        meshes.push({ mesh: tube, agent1Id: conn.agent1Id, agent2Id: conn.agent2Id });
      });

      connectionMeshesRef.current = meshes;
    },
    [cleanupConnections],
  );

  // ----------------------------------------------------------------
  // Effect: Scene setup + animation loop (runs once)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (mountedRef.current) return;
    if (!containerRef.current || !labelsContainerRef.current) return;

    const container = containerRef.current;
    mountedRef.current = true;

    // --- Scene ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Camera ---
    const aspect = container.clientWidth / container.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 5, 35);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting (ambient only — shaders are self-lit) ---
    scene.add(new THREE.AmbientLight(0x404040, 0.4));

    const purpleLight = new THREE.PointLight(0x836ef9, 1, 60);
    purpleLight.position.set(10, 10, 10);
    scene.add(purpleLight);

    const goldLight = new THREE.PointLight(0xffd700, 0.5, 50);
    goldLight.position.set(-10, -10, -10);
    scene.add(goldLight);

    const whiteLight = new THREE.PointLight(0xffffff, 0.5, 40);
    whiteLight.position.set(0, 0, 20);
    scene.add(whiteLight);

    // --- Clock ---
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // --- Post-processing: BLOOM ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new BloomEffect({
      intensity: 3.0,
      luminanceThreshold: 0.1,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    });
    composer.addPass(new EffectPass(camera, bloom));
    composerRef.current = composer;

    // --- Reusable math objects ---
    const tmpVec = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();
    const tmpUp = new THREE.Vector3(0, 1, 0);
    const tmpQuat = new THREE.Quaternion();

    // --- Animation loop ---
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const layout = physicsLayoutRef.current;
      layout.update();

      const currentActiveAgents = activeAgentsRef.current;

      // Tick connection uniforms
      connectionUniformsRef.current.forEach((u) => {
        u.uTime.value = elapsed;
      });

      // Tick agent visuals
      agentVisualsRef.current.forEach((state, agentId) => {
        const targetPos = layout.positions.get(agentId);
        if (targetPos) {
          state.group.position.lerp(targetPos, 0.05);
        }

        const isTalking = currentActiveAgents.has(agentId);

        // Update sphere shader uniforms
        state.sphereUniforms.uTime.value = elapsed;
        state.sphereUniforms.uHighlight.value = isTalking ? 1.0 : 0.0;
        state.sphereUniforms.uCameraPos.value.copy(camera.position);

        // Gentle pulse
        const pulse = 1.0 + Math.sin(elapsed * 1.5) * 0.04;
        state.sphere.scale.setScalar(pulse);

        // Slow rotation for iridescence movement
        state.sphere.rotation.y = elapsed * 0.3;
        state.sphere.rotation.x = Math.sin(elapsed * 0.2) * 0.1;

        // Scale group for highlight
        const targetScale = isTalking ? state.baseScale * 1.3 : state.baseScale;
        const curScale = state.group.scale.x;
        state.group.scale.setScalar(THREE.MathUtils.lerp(curScale, targetScale, 0.1));

        // Ring spin + glow
        state.ring.rotation.z = elapsed * 0.5;
        state.ringMaterial.opacity = isTalking ? 0.6 : 0.3;

        // Label glow
        if (isTalking) {
          state.labelElement.style.borderWidth = "2px";
          state.labelElement.style.textShadow = `0 0 14px ${state.labelElement.style.color}, 0 0 6px rgba(0,0,0,0.9)`;
        } else {
          state.labelElement.style.borderWidth = "1.5px";
          state.labelElement.style.textShadow = `0 0 10px ${state.labelElement.style.color}, 0 0 4px rgba(0,0,0,0.9)`;
        }
      });

      // Tick connections
      connectionMeshesRef.current.forEach((conn) => {
        const pos1 = layout.positions.get(conn.agent1Id);
        const pos2 = layout.positions.get(conn.agent2Id);
        if (!pos1 || !pos2) return;

        tmpVec.addVectors(pos1, pos2).multiplyScalar(0.5);
        conn.mesh.position.copy(tmpVec);

        tmpDir.subVectors(pos2, pos1);
        const dist = tmpDir.length();
        conn.mesh.scale.set(1, dist, 1);

        tmpDir.normalize();
        tmpQuat.setFromUnitVectors(tmpUp, tmpDir);
        conn.mesh.setRotationFromQuaternion(tmpQuat);
      });

      // Position HTML labels
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      labelElementsRef.current.forEach((labelEl, agentId) => {
        const vis = agentVisualsRef.current.get(agentId);
        if (!vis) return;

        tmpVec.copy(vis.group.position).project(camera);
        const x = (tmpVec.x * 0.5 + 0.5) * cw;
        const y = (-tmpVec.y * 0.5 + 0.5) * ch;

        labelEl.style.left = `${x}px`;
        labelEl.style.top = `${y - 35}px`;
        labelEl.style.opacity = tmpVec.z > 1 ? "0" : "1";
      });

      composer.render();
    };

    animate();

    // --- Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
      mountedRef.current = false;

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
          else (m.material as THREE.Material)?.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  // ----------------------------------------------------------------
  // Effect: Rebuild content when data changes
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!sceneRef.current) return;
    buildAgents(data.agents);
    buildConnections(data.connections);

    return () => {
      cleanupAgents();
      cleanupConnections();
    };
  }, [data.agents, data.connections, buildAgents, buildConnections, cleanupAgents, cleanupConnections]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div
        ref={labelsContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      />
    </div>
  );
}
