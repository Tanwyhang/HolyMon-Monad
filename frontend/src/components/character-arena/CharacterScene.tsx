"use client";

import { useAnimationContext } from './AnimationContext';
import { BackgroundSky } from './BackgroundSky';
import { Castle } from './Castle';
import { JesusCharacter } from './JesusCharacter';
import { JesusPreload } from './JesusPreload';
import { NPCCharacter } from './NPCCharacter';
import { NpcPreload } from './NpcPreload';

export function CharacterScene() {
  const { jesusState, npcs } = useAnimationContext();

  return (
    <group>
      {/* Preload Jesus + NPC models/animations so animation switch and spawn don't refresh scene */}
      <JesusPreload />
      <NpcPreload />
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#836ef9" />
      {/* Top light on castle (middle) */}
      <directionalLight position={[0, 100, -35]} intensity={2.2} castShadow />
      <pointLight position={[0, 60, -35]} intensity={0.7} distance={180} />
      {/* Four directional lights around castle */}
      <directionalLight position={[50, 45, -35]} intensity={1.1} />
      <directionalLight position={[-50, 45, -35]} intensity={1.1} />
      <directionalLight position={[0, 45, -80]} intensity={1.1} />
      <directionalLight position={[0, 45, 10]} intensity={1.1} />

      {/* Background - Dark purple cloud sky */}
      <BackgroundSky />

      {/* Castle - scale 1 (70×22×70), centered behind */}
      <Castle position={[0, 0, -35]} scale={[1, 1, 1]} />

      {/* Jesus Character - Center stage, smaller */}
      <JesusCharacter animationState={jesusState} position={[0, 0, 0]} scale={0.04} />

      {/* NPCs - Spawned dynamically */}
      {npcs.map(npc => (
        <NPCCharacter
          key={npc.id}
          instance={npc}
          position={npc.position}
          scale={0.04}
        />
      ))}
    </group>
  );
}
