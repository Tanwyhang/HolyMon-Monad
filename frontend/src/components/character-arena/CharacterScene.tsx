"use client";

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimationContext } from './AnimationContext';
import { AnimatedNsfwCharacter } from './AnimatedNsfwCharacter';
import { BackgroundSky } from './BackgroundSky';
import { Castle } from './Castle';
import { JesusCharacter } from './JesusCharacter';
import { JesusPreload } from './JesusPreload';
import { MoanadPreload } from './MoanadPreload';
import { NPCCharacter } from './NPCCharacter';
import { NpcPreload } from './NpcPreload';
import { NsfwPreload } from './NsfwPreload';
import { StaticFbxCharacter } from './StaticFbxCharacter';
import { MOANAD_GOD_PATH } from './moanadPaths';
import { NSFW_INDEX } from './nsfwPaths';
import * as THREE from 'three';

/** Scale used for Jesus and NPCs so they match in size */
const CHARACTER_SCALE = 0.04;
/** Spiky glow offset: higher, a bit in front (+Z), and right (+X) */
const MAZE_GLOW_HEIGHT = 6;
const MAZE_GLOW_FRONT = 1.2;
const MAZE_GLOW_RIGHT = 0.15;

/** How long the spike takes to appear (scale + opacity) */
const SPIKE_APPEAR_DURATION = 1.5;

/** Camera offset behind Jesus: height, distance, and look-at tilt. */
const CAMERA_HEIGHT = 12;
const CAMERA_DISTANCE = 25;
/** Slight tilt down: look at this many units below Jesus center. */
const CAMERA_LOOK_DOWN = 2;

/** Keeps the camera behind Jesus (third-person), or in front when cameraInFrontOfJesus is true. */
function CameraFollowJesus() {
  const { camera } = useThree();
  const { jesusPositionRef, jesusRotationYRef, characterPositions, cameraInFrontOfJesus } = useAnimationContext();

  useFrame(() => {
    const pos = jesusPositionRef.current ?? characterPositions.jesus;
    const ry = jesusRotationYRef.current;
    const [jx, jy, jz] = pos;
    const sign = cameraInFrontOfJesus ? 1 : -1;
    const camX = jx + sign * CAMERA_DISTANCE * Math.sin(ry);
    const camY = jy + CAMERA_HEIGHT;
    const camZ = jz + sign * CAMERA_DISTANCE * Math.cos(ry);
    camera.position.set(camX, camY, camZ);
    camera.lookAt(jx, jy - CAMERA_LOOK_DOWN, jz);
  });

  return null;
}

/** Spiky burst above Maze – gradient, spikes only, appears gradually, reactive. */
function MazeGlowEffect({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const spikeRefs = useRef<THREE.Mesh[]>([]);
  const mountTimeRef = useRef<number | null>(null);
  const spikeCount = 64;
  const coneGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.06, 0.9, 6);
    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const lightPurple = new THREE.Color(0xc8a0c8);
    const purple = new THREE.Color(0x800080);
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const t = (y - yMin) / (yMax - yMin || 1);
      const c = new THREE.Color().lerpColors(lightPurple, purple, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    []
  );
  const spikes = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const out: { position: [number, number, number]; quaternion: THREE.Quaternion }[] = [];
    for (let i = 0; i < spikeCount; i++) {
      const u = (i + 0.5) / spikeCount;
      const v = Math.acos(1 - 2 * u);
      const phi = v;
      const theta = Math.PI * 2 * i * 0.618; // golden angle for even sphere
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      const dir = new THREE.Vector3(x, y, z);
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const r = 0.5;
      out.push({ position: [x * r, y * r, z * r], quaternion: q });
    }
    return out;
  }, [spikeCount]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (mountTimeRef.current === null) mountTimeRef.current = t;
    const elapsed = t - mountTimeRef.current;
    const appearProgress = Math.min(1, elapsed / SPIKE_APPEAR_DURATION);

    if (groupRef.current) {
      const pulse = 1 + 0.2 * Math.sin(t * 4);
      groupRef.current.scale.setScalar(pulse * appearProgress);
      groupRef.current.rotation.y = t * 0.5;
      groupRef.current.rotation.x = Math.sin(t * 0.7) * 0.15;
    }
    mat.opacity = 0.9 * appearProgress;
    spikeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const breathe = 1 + 0.25 * Math.sin(t * 5 + i * 0.3);
      mesh.scale.setScalar(breathe);
    });
  });

  return (
    <group
      ref={groupRef}
      position={[position[0] + MAZE_GLOW_RIGHT, position[1] + MAZE_GLOW_HEIGHT, position[2] + MAZE_GLOW_FRONT]}
    >
      {spikes.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) spikeRefs.current[i] = el; }}
          geometry={coneGeo}
          material={mat}
          position={s.position}
          quaternion={s.quaternion}
        />
      ))}
    </group>
  );
}

export function CharacterScene() {
  const { jesusState, npcs, prayPhase, characterPositions, jesusInvertFacing, jesusFaceRight, preparingRun, firstWalkLerp, firstWalkDurationSec, runLerp, runDurationSec, jesusFaceToward, jesusLerpArrivedRef, npcLerpArrivedRef, meetingNpcIdRef, jesusPositionRef, jesusRotationYRef, meetingNpcPositionRef, jesusSnapToRef, meetingNpcSnapRef } = useAnimationContext();
  const spikeVisible = prayPhase >= 1;
  /** Maze spins fast for the whole pray sequence (phase 0 = accelerate, phase 1+2 = keep same speed) */
  const mazeSpinSpeed = prayPhase >= 0 ? 10 : 1;
  const castlePos = characterPositions.castle;
  const moanadPos = characterPositions.moanad;
  const lengPositions = [characterPositions.leng1, characterPositions.leng2, characterPositions.leng3];

  return (
    <group>
      <CameraFollowJesus />
      {/* Preload Jesus + NPC + Moanad + NSFW models so animation switch and spawn don't refresh scene */}
      <JesusPreload />
      <NpcPreload />
      <MoanadPreload />
      <NsfwPreload />
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#836ef9" />
      {/* Top light on castle (middle) */}
      <directionalLight position={[castlePos[0], 100, castlePos[2]]} intensity={2.2} castShadow />
      <pointLight position={[castlePos[0], 60, castlePos[2]]} intensity={0.7} distance={180} />
      {/* Four directional lights around castle */}
      <directionalLight position={[castlePos[0] + 50, 45, castlePos[2]]} intensity={1.1} />
      <directionalLight position={[castlePos[0] - 50, 45, castlePos[2]]} intensity={1.1} />
      <directionalLight position={[castlePos[0], 45, castlePos[2] - 45]} intensity={1.1} />
      <directionalLight position={[castlePos[0], 45, castlePos[2] + 45]} intensity={1.1} />

      {/* Background - Dark purple cloud sky */}
      <BackgroundSky />

      {/* Castle - scaled up, centered behind */}
      <Castle position={castlePos} scale={[4, 4, 4]} />

      {/* Jesus Character - Center stage, same scale as NPCs */}
      <JesusCharacter animationState={jesusState} position={characterPositions.jesus} scale={CHARACTER_SCALE} invertFacing={jesusInvertFacing} faceRight={jesusFaceRight} preparingRun={preparingRun} firstWalkLerp={firstWalkLerp} firstWalkDurationSec={firstWalkDurationSec} runLerp={runLerp} runDurationSec={runDurationSec} faceToward={jesusFaceToward} jesusLerpArrivedRef={jesusLerpArrivedRef} jesusPositionRef={jesusPositionRef} jesusRotationYRef={jesusRotationYRef} jesusSnapToRef={jesusSnapToRef} />

      {/* Moanad GOD - Left; Maze spins; phase 0 = accelerate, then normal */}
      <StaticFbxCharacter
        url={MOANAD_GOD_PATH}
        position={moanadPos}
        scale={0.01}
        recolor={{ names: ['Mask', 'Maze', 'Mash'], color: 0x800080 }}
        spinMeshNames={['Maze']}
        spinSpeed={mazeSpinSpeed}
        highlightActive={false}
        highlightMesh={{
          names: ['Maze'],
          scaleWhenActive: 1.5,
        }}
      />
      {/* Phase 1+: spike + point light; Jesus plays Praying in phase 2 */}
      {spikeVisible && (
        <>
          <pointLight position={moanadPos} color={0x800080} intensity={1.2} distance={6} />
          <MazeGlowEffect position={moanadPos} color={0x800080} />
        </>
      )}

      {/* NSFW Boss - BossIdle by default; Deal when deal triggered (same as Jesus) */}
      <AnimatedNsfwCharacter
        modelIndex={NSFW_INDEX.modelBoss}
        animationIndex={jesusState === 'deal' ? NSFW_INDEX.animDeal : NSFW_INDEX.animBossIdle}
        position={characterPositions.boss}
        scale={CHARACTER_SCALE}
        invertFacing
      />
      {/* 3 Leng behind the Boss - default LengTwerk */}
      {lengPositions.map((pos, i) => (
        <AnimatedNsfwCharacter
          key={i}
          modelIndex={NSFW_INDEX.modelLeng}
          animationIndex={NSFW_INDEX.animLengTwerk}
          position={pos}
          scale={CHARACTER_SCALE}
          invertFacing
        />
      ))}

      {/* NPCs - Spawned dynamically, same scale as Jesus */}
      {npcs.map(npc => (
        <NPCCharacter
          key={npc.id}
          instance={npc}
          position={npc.position}
          scale={CHARACTER_SCALE}
          npcLerpArrivedRef={npcLerpArrivedRef}
          meetingNpcIdRef={meetingNpcIdRef}
          meetingNpcPositionRef={meetingNpcPositionRef}
          meetingNpcSnapRef={meetingNpcSnapRef}
        />
      ))}
    </group>
  );
}
