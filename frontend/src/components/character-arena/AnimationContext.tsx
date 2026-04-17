"use client";

import type { MutableRefObject, ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { AnimationState, NPCInstance } from './types';

/** Pray sequence: 0 = maze accelerate, 1 = spike visible, 2 = Jesus plays Praying */
export type PrayPhase = -1 | 0 | 1 | 2;

export type CharacterPositionId =
  | 'castle'
  | 'jesus'
  | 'moanad'
  | 'boss'
  | 'leng1'
  | 'leng2'
  | 'leng3';

export const DEFAULT_CHARACTER_POSITIONS: Record<CharacterPositionId, [number, number, number]> = {
  castle: [0, 0, 0],
  jesus: [70, 0, 50],
  moanad: [67.5, 0, -40],
  boss: [-55, 0, 34],
  leng1: [-59, 0, 42],
  leng2: [-55, 0, 42],
  leng3: [-51, 0, 42],
};

/** Distance in XZ plane from (x, z) to (px, pz) */
function distXZ(x: number, z: number, px: number, pz: number): number {
  return Math.hypot(x - px, z - pz);
}

/** Random position in box, at least minDist from each (px, pz) in avoidXZ. */
function randomPositionInBoxAwayFrom(
  boxMinX: number,
  boxMaxX: number,
  boxMinZ: number,
  boxMaxZ: number,
  avoidXZ: [number, number][],
  minDist: number
): [number, number, number] {
  const maxTries = 80;
  for (let i = 0; i < maxTries; i++) {
    const x = boxMinX + Math.random() * (boxMaxX - boxMinX);
    const z = boxMinZ + Math.random() * (boxMaxZ - boxMinZ);
    if (avoidXZ.every(([px, pz]) => distXZ(x, z, px, pz) >= minDist)) {
      return [x, 0, z];
    }
  }
  const corners: [number, number, number][] = [
    [boxMinX, 0, boxMinZ],
    [boxMaxX, 0, boxMinZ],
    [boxMaxX, 0, boxMaxZ],
    [boxMinX, 0, boxMaxZ],
  ];
  for (const p of corners) {
    if (avoidXZ.every(([px, pz]) => distXZ(p[0], p[2], px, pz) >= minDist)) return p;
  }
  const x = boxMinX + 0.5 * (boxMaxX - boxMinX);
  const z = boxMinZ + 0.5 * (boxMaxZ - boxMinZ);
  return [x, 0, z];
}

/** Ensure position is at least minDist from each avoid point in XZ; then clamp to box. */
function pushAwayFromPoints(
  pos: [number, number, number],
  avoidXZ: [number, number][],
  minDist: number,
  boxMinX: number,
  boxMaxX: number,
  boxMinZ: number,
  boxMaxZ: number
): [number, number, number] {
  let [x, y, z] = pos;
  for (const [px, pz] of avoidXZ) {
    const d = distXZ(x, z, px, pz);
    if (d > 0 && d < minDist) {
      const f = minDist / d;
      x = px + (x - px) * f;
      z = pz + (z - pz) * f;
    }
  }
  x = Math.max(boxMinX, Math.min(boxMaxX, x));
  z = Math.max(boxMinZ, Math.min(boxMaxZ, z));
  return [x, y, z];
}

interface AnimationContextType {
  jesusState: AnimationState;
  npcs: NPCInstance[];
  actionInProgress: boolean;
  prayPhase: PrayPhase;
  jesusInvertFacing: boolean;
  /** After right turn, face right (+X) then walk. */
  jesusFaceRight: boolean;
  /** True ~200ms before switching to running so the running clone can pre-animate and avoid T-pose. */
  preparingRun: boolean;
  /** First walk toward Moanad: smooth lerp driven in useFrame (no setState spam). null when not active. */
  firstWalkLerp: { start: [number, number, number]; end: [number, number, number] } | null;
  /** Duration of first walk in seconds (for lerp progress). */
  firstWalkDurationSec: number;
  /** Run back (z -16 to 18): smooth lerp like first walk. null when not active. */
  runLerp: { start: [number, number, number]; end: [number, number, number] } | null;
  /** Duration of run in seconds. */
  runDurationSec: number;
  /** When set, Jesus rotation Y faces this point (XZ). Used for face-to-face with NPC. */
  jesusFaceToward: [number, number, number] | null;
  characterPositions: Record<CharacterPositionId, [number, number, number]>;

  /** Refs for arrival-based meeting trigger: set by Jesus/NPC when lerp progress >= 1. */
  jesusLerpArrivedRef: MutableRefObject<boolean>;
  npcLerpArrivedRef: MutableRefObject<boolean>;
  /** Which NPC is currently walking to meeting (so only that NPC sets npcLerpArrivedRef). */
  meetingNpcIdRef: MutableRefObject<string | null>;
  /** Live position written every frame by Jesus (for distance-based arrival). */
  jesusPositionRef: MutableRefObject<[number, number, number] | null>;
  /** Jesus rotation Y (radians) written every frame for camera follow. */
  jesusRotationYRef: MutableRefObject<number>;
  /** When true, camera is placed in front of Jesus (e.g. for crowd cheer). */
  cameraInFrontOfJesus: boolean;
  /** Live position written every frame by the meeting NPC (for distance-based arrival). */
  meetingNpcPositionRef: MutableRefObject<[number, number, number] | null>;
  /** When set, Jesus snaps group + lastLerpEnd to this position (cleared after applied). */
  jesusSnapToRef: MutableRefObject<[number, number, number] | null>;
  /** When set, the NPC with this id snaps to this position (cleared after applied). */
  meetingNpcSnapRef: MutableRefObject<{ id: string; position: [number, number, number] } | null>;

  setCharacterPosition: (id: CharacterPositionId, position: [number, number, number]) => void;
  setFirstWalkLerp: (lerp: { start: [number, number, number]; end: [number, number, number] } | null) => void;
  setNPCPosition: (npcId: string, position: [number, number, number]) => void;
  setNPCRandomWalk: (npcId: string, lerp: { start: [number, number, number]; end: [number, number, number] } | null, durationSec: number, targetRotationY?: number) => void;

  spawnNPC: () => void;
  triggerTalk: () => void;
  triggerSuccess: () => void;
  triggerFail: () => void;
  triggerDeal: () => void;
  triggerPray: () => void;
  triggerFullFlow: () => void;
  triggerBossMeetTalkDeal: () => void;
  triggerNpcMeetTalkFail: () => void;
  triggerNpcMeetTalkSuccess: () => void;
  triggerCrowdCheer: () => void;
  resetArena: () => void;
}

/** Delay clearing lerp by two frames so position state has committed (avoids teleport). */
function clearLerpNextFrame(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [jesusState, setJesusState] = useState<AnimationState>('idle');
  const [npcs, setNPCs] = useState<NPCInstance[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [prayPhase, setPrayPhase] = useState<PrayPhase>(-1);
  const [characterPositions, setCharacterPositions] = useState<Record<CharacterPositionId, [number, number, number]>>(
    () => ({ ...DEFAULT_CHARACTER_POSITIONS })
  );
  const [jesusInvertFacing, setJesusInvertFacing] = useState(false);
  const [jesusFaceRight, setJesusFaceRight] = useState(false);
  const [preparingRun, setPreparingRun] = useState(false);
  const [firstWalkLerp, setFirstWalkLerp] = useState<{ start: [number, number, number]; end: [number, number, number] } | null>(null);
  const FIRST_WALK_DURATION_MS = 5640;
  const [firstWalkDurationSec, setFirstWalkDurationSec] = useState(FIRST_WALK_DURATION_MS / 1000);
  const [runLerp, setRunLerp] = useState<{ start: [number, number, number]; end: [number, number, number] } | null>(null);
  const [runDurationSec, setRunDurationSec] = useState(4);
  const [jesusFaceToward, setJesusFaceToward] = useState<[number, number, number] | null>(null);
  const npcsRef = useRef<NPCInstance[]>([]);
  const characterPositionsRef = useRef<Record<CharacterPositionId, [number, number, number]>>({ ...DEFAULT_CHARACTER_POSITIONS });
  const jesusLerpArrivedRef = useRef(false);
  const npcLerpArrivedRef = useRef(false);
  const meetingNpcIdRef = useRef<string | null>(null);
  const [cameraInFrontOfJesus, setCameraInFrontOfJesus] = useState(false);
  const meetingArrivedCallbackRef = useRef<(() => void) | null>(null);
  const meetingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Live positions written every frame by Jesus and meeting NPC (for distance-based arrival). */
  const jesusPositionRef = useRef<[number, number, number] | null>(null);
  const jesusRotationYRef = useRef<number>(Math.PI);
  const meetingNpcPositionRef = useRef<[number, number, number] | null>(null);
  const meetingPointRef = useRef<[number, number, number] | null>(null);
  const jesusSnapToRef = useRef<[number, number, number] | null>(null);
  const meetingNpcSnapRef = useRef<{ id: string; position: [number, number, number] } | null>(null);
  /** Guard: only run the full-flow meeting block once (avoids duplicate timeouts from Strict Mode or re-runs). */
  const fullFlowMeetingScheduledRef = useRef(false);
  /** Lock fail/success NPC ids for the current full flow so callbacks always target the correct NPC. */
  const fullFlowFailNpcIdRef = useRef<string | null>(null);
  const fullFlowSuccessNpcIdRef = useRef<string | null>(null);

  /** XZ distance (ignore Y). */
  const distXZ = useCallback((a: [number, number, number] | null, b: [number, number, number] | null) => {
    if (!a || !b) return Infinity;
    return Math.hypot(a[0] - b[0], a[2] - b[2]);
  }, []);

  /** Objective arrival: both within this many units of meeting point (XZ plane). */
  const MEET_ARRIVAL_THRESHOLD = 2.5;

  /** Start polling: trigger when both Jesus and meeting NPC are within MEET_ARRIVAL_THRESHOLD of meetingPoint (or after maxMs). */
  const startMeetingArrivalCheck = useCallback((meetingPoint: [number, number, number], maxMs: number) => {
    if (meetingIntervalRef.current) clearInterval(meetingIntervalRef.current);
    jesusLerpArrivedRef.current = false;
    npcLerpArrivedRef.current = false;
    meetingPointRef.current = [...meetingPoint];
    const start = Date.now();
    meetingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const jesusDist = distXZ(jesusPositionRef.current, meetingPointRef.current);
      const npcDist = distXZ(meetingNpcPositionRef.current, meetingPointRef.current);
      const bothWithinThreshold = jesusDist <= MEET_ARRIVAL_THRESHOLD && npcDist <= MEET_ARRIVAL_THRESHOLD;
      if (bothWithinThreshold || elapsed >= maxMs) {
        if (meetingIntervalRef.current) {
          clearInterval(meetingIntervalRef.current);
          meetingIntervalRef.current = null;
        }
        const snapPoint = meetingPointRef.current ? [...meetingPointRef.current] : null;
        const snapNpcId = meetingNpcIdRef.current;
        meetingPointRef.current = null;
        meetingNpcIdRef.current = null;
        if (snapPoint) {
          jesusSnapToRef.current = snapPoint;
          if (snapNpcId) meetingNpcSnapRef.current = { id: snapNpcId, position: snapPoint };
        }
        meetingArrivedCallbackRef.current?.();
        meetingArrivedCallbackRef.current = null;
      }
    }, 80);
  }, [distXZ]);

  // Keep refs in sync with state
  useEffect(() => {
    npcsRef.current = npcs;
  }, [npcs]);
  useEffect(() => {
    characterPositionsRef.current = characterPositions;
  }, [characterPositions]);

  const setCharacterPosition = useCallback((id: CharacterPositionId, position: [number, number, number]) => {
    setCharacterPositions((prev) => ({ ...prev, [id]: position }));
  }, []);

  const setNPCPosition = useCallback((npcId: string, position: [number, number, number]) => {
    setNPCs((prev) =>
      prev.map((npc) => (npc.id === npcId ? { ...npc, position } : npc))
    );
  }, []);

  const setNPCRandomWalk = useCallback((npcId: string, lerp: { start: [number, number, number]; end: [number, number, number] } | null, durationSec: number, targetRotationY?: number) => {
    setNPCs((prev) =>
      prev.map((npc) => (npc.id === npcId ? {
        ...npc,
        randomWalkLerp: lerp,
        randomWalkDurationSec: durationSec,
        targetRotationY,
        currentAnimation: lerp ? 'walkingLoop' : npc.currentAnimation,
      } : npc))
    );
  }, []);

  const spawnNPC = useCallback(() => {
    if (actionInProgress) return;

    const newNPC: NPCInstance = {
      id: `npc-${Date.now()}-${Math.random()}`,
      baseModelIndex: Math.floor(Math.random() * 4), // Unconverted 1,2,4,5
      position: [
        (Math.random() - 0.5) * 30, // Random X
        0,                           // Ground level
        (Math.random() - 0.5) * 20,  // Random Z
      ],
      currentAnimation: 'idle', // Stay at spawn with Idle 3 only (no random walk)
      isConverted: false,
      walkAnimationIndex: Math.floor(Math.random() * 3),
    };

    setNPCs(prev => [...prev, newNPC]);
  }, [actionInProgress]);

  const triggerTalk = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setJesusState('talking');

    // Set all NPCs to random idle
    setNPCs(prev => prev.map(npc => ({
      ...npc,
      currentAnimation: 'talking',
    })));

    // Reset after animation duration
    setTimeout(() => {
      setActionInProgress(false);
    }, 3000);
  }, [actionInProgress]);

  const triggerSuccess = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);

    // Jesus cheers; NPCs run their own timeline (Idle3+spin → 4s load converted → 4–6s opacity crossfade → 9s Success anim)
    setJesusState('cheering');
    setNPCs(prev => prev.map(npc => ({
      ...npc,
      currentAnimation: 'cheering',
      // isConverted set at 6s when crossfade completes
    })));

    setTimeout(() => {
      setNPCs(prev => prev.map(npc => ({ ...npc, isConverted: true })));
    }, 6000);

    setTimeout(() => {
      setActionInProgress(false);
    }, 12000);
  }, [actionInProgress]);

  const triggerFail = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);

    // Jesus: Walk Backward once (~2.5s), then Flying Kick once
    setJesusState('walkBackward');

    const walkBackwardMs = 1000;
    const flyingKickMs = 1500;
    const npcFailedMs = 2000;

    setTimeout(() => {
      setJesusState('flyingKick');
      setNPCs(prev => prev.map(npc => ({
        ...npc,
        currentAnimation: 'flyingKick', // NPCs play Failed 1 or Failed 2 (position lerp-driven)
      })));
    }, walkBackwardMs);

    setTimeout(() => {
      setJesusState('idle');
    }, walkBackwardMs + flyingKickMs);

    setTimeout(() => {
      setNPCs(prev => prev.map(npc => ({
        ...npc,
        currentAnimation: 'idle', // Stay at spawn with Idle 3 (no random walk)
      })));
    }, walkBackwardMs + npcFailedMs);

    setTimeout(() => {
      setActionInProgress(false);
    }, walkBackwardMs + Math.max(flyingKickMs, npcFailedMs) + 500);
  }, [actionInProgress]);

  const triggerDeal = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setJesusState('deal');

    const dealDurationMs = 4000;
    setTimeout(() => {
      setJesusState('idle');
      setActionInProgress(false);
    }, dealDurationMs);
  }, [actionInProgress]);

  const triggerBossMeetTalkDeal = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setFirstWalkLerp(null);
    setRunLerp(null);
    const bossPos = characterPositionsRef.current.boss;
    const BOSS_MEET_DISTANCE = 5;
    // In front of boss along -Z (boss faces camera; same X, Z toward camera)
    const bossMeetingPoint: [number, number, number] = [
      bossPos[0],
      0,
      bossPos[2] - BOSS_MEET_DISTANCE,
    ];
    setCharacterPositions((p) => ({ ...p, jesus: bossMeetingPoint }));
    jesusSnapToRef.current = [...bossMeetingPoint];
    setJesusFaceToward(bossPos);
    setJesusState('talking');

    const TALK_BEFORE_DEAL_MS = 3000;
    const DEAL_DURATION_MS = 4000;
    setTimeout(() => {
      setJesusState('deal');
      setTimeout(() => {
        setJesusState('idle');
        setJesusFaceToward(null);
        setActionInProgress(false);
      }, DEAL_DURATION_MS);
    }, TALK_BEFORE_DEAL_MS);
  }, [actionInProgress]);

  /** Fixed positions for the two demo NPCs: slightly in from box borders (box X -50..31, Z -16..30). Right turn in full flow is at Z=18. */
  const NPC_MEET_POSITIONS: [number, number, number][] = [
    [4, 0, 17],   // NPC 0 – turning right point side, X shifted right
    [-39, 0, 8],  // NPC 1 – slightly in from left border (good)
  ];

  /** Get NPC at index (0 or 1); ensure at least (index+1) NPCs exist at NPC_MEET_POSITIONS. */
  const getOrCreateNpcForMeet = useCallback((index: 0 | 1): {
    id: string;
    position: [number, number, number];
    toAdd: NPCInstance[];
  } => {
    const list = npcsRef.current;
    const pos0 = NPC_MEET_POSITIONS[0];
    const pos1 = NPC_MEET_POSITIONS[1];
    if (list.length >= 2) {
      const npc = list[index];
      return { id: npc.id, position: npc.position, toAdd: [] };
    }
    if (list.length === 1 && index === 0) {
      return { id: list[0].id, position: list[0].position, toAdd: [] };
    }
    const toAdd: NPCInstance[] = [];
    if (list.length === 0) {
      toAdd.push({
        id: `npc-demo-fail-${Date.now()}`,
        baseModelIndex: 0,
        position: [...pos0],
        currentAnimation: 'idle',
        isConverted: false,
        walkAnimationIndex: 0,
      });
      toAdd.push({
        id: `npc-demo-success-${Date.now() + 1}`,
        baseModelIndex: 1,
        position: [...pos1],
        currentAnimation: 'idle',
        isConverted: false,
        walkAnimationIndex: 0,
      });
    } else {
      // list.length === 1 && index === 1: add second NPC at pos1
      toAdd.push({
        id: `npc-demo-success-${Date.now()}`,
        baseModelIndex: 1,
        position: [...pos1],
        currentAnimation: 'idle',
        isConverted: false,
        walkAnimationIndex: 0,
      });
    }
    const npcForIndex = toAdd[index] ?? toAdd[toAdd.length - 1];
    return { id: npcForIndex.id, position: npcForIndex.position, toAdd };
  }, []);

  const triggerNpcMeetTalkFail = useCallback(() => {
    if (actionInProgress) return;
    const npcInfo = getOrCreateNpcForMeet(0);
    setActionInProgress(true);
    setFirstWalkLerp(null);
    setRunLerp(null);
    const npcPos = npcInfo.position;
    // NPC 0: Jesus in front of NPC (between NPC and camera). Camera is behind Jesus, so put Jesus
    // further from origin than NPC so order is: origin – NPC – Jesus – camera (Jesus in front of NPC).
    const MEET_DISTANCE_IN_FRONT = 8;
    const dist = Math.hypot(npcPos[0], npcPos[2]) || 1;
    const meetingPoint: [number, number, number] = [
      npcPos[0] + (npcPos[0] / dist) * MEET_DISTANCE_IN_FRONT,
      0,
      npcPos[2] + (npcPos[2] / dist) * MEET_DISTANCE_IN_FRONT,
    ];
    const npcFaceJesus = Math.atan2(meetingPoint[0] - npcPos[0], meetingPoint[2] - npcPos[2]);
    // NPC 0: both face camera (point behind Jesus); rotate slight more for both
    const faceDist = Math.hypot(meetingPoint[0], meetingPoint[2]) || 1;
    const faceDx = meetingPoint[0] * (30 / faceDist);
    const faceDz = meetingPoint[2] * (30 / faceDist);
    const rotOffset = 0.12;
    const jesusFace: [number, number, number] = [
      meetingPoint[0] + (Math.cos(rotOffset) * faceDx - Math.sin(rotOffset) * faceDz),
      0,
      meetingPoint[2] + (Math.sin(rotOffset) * faceDx + Math.cos(rotOffset) * faceDz),
    ];
    const npcRotY = Math.atan2(jesusFace[0] - npcPos[0], jesusFace[2] - npcPos[2]) + 0.12;
    setCharacterPositions((p) => ({ ...p, jesus: meetingPoint }));
    jesusSnapToRef.current = [...meetingPoint];
    setJesusFaceToward(jesusFace);
    if (npcInfo.toAdd.length > 0) {
      setNPCs((prev) => {
        const next = [...prev];
        for (const npc of npcInfo.toAdd) {
          next.push(npc.id === npcInfo.id ? { ...npc, currentAnimation: 'talking' as const, overrideRotationY: npcRotY } : npc);
        }
        return next;
      });
    } else {
      setNPCs((prev) =>
        prev.map((n) =>
          n.id === npcInfo.id
            ? { ...n, currentAnimation: 'talking' as const, overrideRotationY: npcRotY }
            : n
        )
      );
    }
    setJesusState('talking');

    const TALK_MS = 3000;
    const walkBackwardMs = 1000;
    const flyingKickMs = 1500;
    const npcFailedMs = 2000;
    setTimeout(() => {
      setJesusState('walkBackward');
      setTimeout(() => {
        setJesusState('flyingKick');
        setNPCs((prev) =>
          prev.map((n) =>
            n.id === npcInfo.id
              ? { ...n, currentAnimation: 'flyingKick' as const, overrideRotationY: undefined }
              : n
          )
        );
      }, walkBackwardMs);
      setTimeout(() => setJesusState('idle'), walkBackwardMs + flyingKickMs);
      setTimeout(() => {
        setNPCs((prev) =>
          prev.map((n) =>
            n.id === npcInfo.id ? { ...n, currentAnimation: 'idle' as const } : n
          )
        );
      }, walkBackwardMs + npcFailedMs);
      setTimeout(() => {
        setJesusFaceToward(null);
        setActionInProgress(false);
      }, walkBackwardMs + Math.max(flyingKickMs, npcFailedMs) + 500);
    }, TALK_MS);
  }, [actionInProgress, getOrCreateNpcForMeet]);

  const triggerNpcMeetTalkSuccess = useCallback(() => {
    if (actionInProgress) return;
    const npcInfo = getOrCreateNpcForMeet(1);
    setActionInProgress(true);
    setFirstWalkLerp(null);
    setRunLerp(null);
    const npcPos = npcInfo.position;
    const MEET_DISTANCE_IN_FRONT = 5;
    const dx = 0 - npcPos[0];
    const dz = 0 - npcPos[2];
    const dist = Math.hypot(dx, dz) || 1;
    const meetingPoint: [number, number, number] = [
      npcPos[0] + (dx / dist) * MEET_DISTANCE_IN_FRONT,
      0,
      npcPos[2] + (dz / dist) * MEET_DISTANCE_IN_FRONT,
    ];
    const npcFaceJesus = Math.atan2(meetingPoint[0] - npcPos[0], meetingPoint[2] - npcPos[2]);
    setCharacterPositions((p) => ({ ...p, jesus: meetingPoint }));
    jesusSnapToRef.current = [...meetingPoint];
    setJesusFaceToward(npcPos);
    if (npcInfo.toAdd.length > 0) {
      setNPCs((prev) => {
        const next = [...prev];
        for (const npc of npcInfo.toAdd) {
          next.push(npc.id === npcInfo.id ? { ...npc, currentAnimation: 'talking' as const, overrideRotationY: npcFaceJesus } : npc);
        }
        return next;
      });
    } else {
      setNPCs((prev) =>
        prev.map((n) =>
          n.id === npcInfo.id
            ? { ...n, currentAnimation: 'talking' as const, overrideRotationY: npcFaceJesus }
            : n
        )
      );
    }
    setJesusState('talking');

    const TALK_MS = 3000;
    setTimeout(() => {
      setJesusState('cheering');
      setNPCs((prev) =>
        prev.map((n) =>
          n.id === npcInfo.id
            ? { ...n, currentAnimation: 'cheering' as const, overrideRotationY: npcFaceJesus }
            : n
        )
      );
      setTimeout(() => {
        setNPCs((prev) =>
          prev.map((n) => (n.id === npcInfo.id ? { ...n, isConverted: true } : n))
        );
      }, 6000);
      setTimeout(() => {
        setJesusState('idle');
        setJesusFaceToward(null);
        setActionInProgress(false);
      }, 12000);
    }, TALK_MS);
  }, [actionInProgress, getOrCreateNpcForMeet]);

  /** Jesus at NPC 1 position/angle, converted NPCs in one row behind him; Jesus Cheering, they play Success 2. Camera in front of Jesus. */
  const triggerCrowdCheer = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setFirstWalkLerp(null);
    setRunLerp(null);
    setCameraInFrontOfJesus(true);
    const npc1Pos: [number, number, number] = [-39, 0, 8];
    const faceOriginY = Math.atan2(0 - npc1Pos[0], 0 - npc1Pos[2]);
    setCharacterPositions((p) => ({ ...p, jesus: npc1Pos }));
    jesusSnapToRef.current = [...npc1Pos];
    setJesusFaceToward([0, 0, 0]);
    setJesusState('cheering');
    const dirNorm = Math.hypot(npc1Pos[0], npc1Pos[2]) || 1;
    const backX = npc1Pos[0] / dirNorm;
    const backZ = npc1Pos[2] / dirNorm;
    const perpX = -backZ;
    const perpZ = backX;
    const behindOffset = 5;
    const rowSpacing = 3;
    const crowdCount = 5;
    const crowdNPCs: NPCInstance[] = [];
    for (let i = 0; i < crowdCount; i++) {
      const t = (i - (crowdCount - 1) / 2) * rowSpacing;
      crowdNPCs.push({
        id: `crowd-${Date.now()}-${i}`,
        baseModelIndex: 0,
        position: [
          npc1Pos[0] + backX * behindOffset + perpX * t,
          0,
          npc1Pos[2] + backZ * behindOffset + perpZ * t,
        ],
        currentAnimation: 'cheering',
        isConverted: true,
        overrideRotationY: faceOriginY,
        successAnimationIndex: 1,
        successStartPhase: 2,
      });
    }
    setNPCs((prev) => [...prev.filter((n) => !n.id.startsWith('crowd-')), ...crowdNPCs]);
    const CHEER_DURATION_MS = 8000;
    setTimeout(() => {
      setJesusState('idle');
      setJesusFaceToward(null);
      setCameraInFrontOfJesus(false);
      setNPCs((prev) => prev.filter((n) => !n.id.startsWith('crowd-')));
      setActionInProgress(false);
    }, CHEER_DURATION_MS);
  }, [actionInProgress]);

  const triggerPray = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setPrayPhase(0); // 1. Maze accelerates first

    const mazeAccelMs = 3000;
    const spikeThenJesusMs = 1500;
    const jesusPrayMs = 5000;

    setTimeout(() => {
      setPrayPhase(1); // 2. Show spike
    }, mazeAccelMs);

    setTimeout(() => {
      setPrayPhase(2);
      setJesusState('praying'); // 3. Jesus plays Praying.fbx
    }, mazeAccelMs + spikeThenJesusMs);

    setTimeout(() => {
      setJesusState('idle');
      setPrayPhase(-1);
      setActionInProgress(false);

      // Spawn two NPCs after praying; stay at spawn with Idle 3, spaced far apart
      const boxMinX = -50;
      const boxMaxX = 31;
      const boxMinZ = -16;
      const boxMaxZ = 30;
      const MIN_DISTANCE_FROM_POINTS = 12;
      const MIN_DISTANCE_BETWEEN_NPCS = 24;
      const avoidXZ = [[0, 0], [21, -21]] as [number, number][];

      const firstPos = randomPositionInBoxAwayFrom(boxMinX, boxMaxX, boxMinZ, boxMaxZ, avoidXZ, MIN_DISTANCE_FROM_POINTS);
      const secondAvoid: [number, number][] = [...avoidXZ, [firstPos[0], firstPos[2]]];
      const secondPos = randomPositionInBoxAwayFrom(boxMinX, boxMaxX, boxMinZ, boxMaxZ, secondAvoid, MIN_DISTANCE_BETWEEN_NPCS);

      const firstNpc: NPCInstance = {
        id: `npc-${Date.now()}-${Math.random()}`,
        baseModelIndex: Math.floor(Math.random() * 4),
        position: firstPos,
        currentAnimation: 'idle',
        isConverted: false,
        walkAnimationIndex: Math.floor(Math.random() * 3),
      };
      const secondNpc: NPCInstance = {
        id: `npc-${Date.now()}-${Math.random()}`,
        baseModelIndex: Math.floor(Math.random() * 4),
        position: secondPos,
        currentAnimation: 'idle',
        isConverted: false,
        walkAnimationIndex: Math.floor(Math.random() * 3),
      };
      setNPCs([firstNpc, secondNpc]);
    }, mazeAccelMs + spikeThenJesusMs + jesusPrayMs);
  }, [actionInProgress]);

  const triggerFullFlow = useCallback(() => {
    if (actionInProgress) return;
    setActionInProgress(true);

    const START_WALKING_MS = 800;
    const TALKING_MS = 3000;
    const mazeAccelMs = 1200;
    const spikeThenJesusMs = 600;
    const jesusPrayMs = 5000;
    const FAILED_MS = 2000;
    const RIGHT_TURN_MS = 1500; // Jesus - RightTurn.fbx once, then switch to Walking

    // 1. Start Walking
    setJesusState('walking');

    // 2. After Start Walking → Walk toward Moanad (~90%) using smooth lerp in useFrame (no setState spam).
    setTimeout(() => {
      setCharacterPositions((prev) => {
        const start = prev.jesus;
        const moanad = prev.moanad;
        const fraction = 0.9;
        const end: [number, number, number] = [
          start[0] + (moanad[0] - start[0]) * fraction,
          start[1] + (moanad[1] - start[1]) * fraction,
          start[2] + (moanad[2] - start[2]) * fraction,
        ];
        setJesusState('walkingLoop');
        setFirstWalkDurationSec(FIRST_WALK_DURATION_MS / 1000);
        setFirstWalkLerp({ start: [...start], end });
        setTimeout(() => {
          setFirstWalkLerp(null);
          setJesusState('talking');
          setCharacterPositions((p) => ({ ...p, jesus: end }));
          setTimeout(() => {
            setPrayPhase(0);
            setTimeout(() => setPrayPhase(1), mazeAccelMs);
            setTimeout(() => {
              setPrayPhase(2);
              setJesusState('praying');
            }, mazeAccelMs + spikeThenJesusMs);
            setTimeout(() => {
              setJesusState('failed');

              // Spawn two NPCs after Jesus praying (full flow); stay at spawn with Idle 3, spaced far apart
              const boxMinX = -50;
              const boxMaxX = 31;
              const boxMinZ = -16;
              const boxMaxZ = 30;
              const MIN_DISTANCE_FROM_POINTS = 12;
              const MIN_DISTANCE_BETWEEN_NPCS = 24;
              const avoidXZ = [[0, 0], [21, -21]] as [number, number][];

              const firstPos = randomPositionInBoxAwayFrom(boxMinX, boxMaxX, boxMinZ, boxMaxZ, avoidXZ, MIN_DISTANCE_FROM_POINTS);
              const secondAvoid: [number, number][] = [...avoidXZ, [firstPos[0], firstPos[2]]];
              const secondPos = randomPositionInBoxAwayFrom(boxMinX, boxMaxX, boxMinZ, boxMaxZ, secondAvoid, MIN_DISTANCE_BETWEEN_NPCS);

              const firstNpc: NPCInstance = {
                id: `npc-${Date.now()}-${Math.random()}`,
                baseModelIndex: Math.floor(Math.random() * 4),
                position: firstPos,
                currentAnimation: 'idle',
                isConverted: false,
                walkAnimationIndex: Math.floor(Math.random() * 3),
              };
              const secondNpc: NPCInstance = {
                id: `npc-${Date.now()}-${Math.random()}`,
                baseModelIndex: Math.floor(Math.random() * 4),
                position: secondPos,
                currentAnimation: 'idle',
                isConverted: false,
                walkAnimationIndex: Math.floor(Math.random() * 3),
              };
              setNPCs([firstNpc, secondNpc]);

              const PRE_RUN_MS = 400;
              setTimeout(() => {
                setPreparingRun(true);
                setJesusInvertFacing(true);
              }, Math.max(0, FAILED_MS - PRE_RUN_MS));
              setTimeout(() => {
                setPreparingRun(false);
                setJesusState('running');
                const [x, y] = characterPositionsRef.current.jesus;
                const runStart: [number, number, number] = [x, y, -16];
                const runEnd: [number, number, number] = [x, y, 18];
                const runDist = 34;
                const JESUS_RUN_SPEED = 10;
                const runDur = Math.max(1, runDist / JESUS_RUN_SPEED);
                setRunDurationSec(runDur);
                setRunLerp({ start: runStart, end: runEnd });
                const RUN_ARRIVAL_BUFFER_MS = 80;
                setTimeout(() => {
                  setCharacterPositions((p) => ({ ...p, jesus: runEnd }));
                  clearLerpNextFrame(() => {
                    setRunLerp(null);
                    setJesusState('rightTurn');
                  });
                  const CROSSFADE_BEFORE_TURN_END_MS = 350;
                  setTimeout(() => {
                          setJesusFaceRight(true);
                          setJesusState('walkingLoop');

                          // Walk straight into box; keep end well inside box so Jesus doesn't get stuck at border
                          const STRAIGHT_WALK_DISTANCE = 12;
                          const JESUS_WALK_SPEED = 5;
                          const boxMinX = -50;
                          const boxMaxX = 31;
                          const boxMinZ = -16;
                          const boxMaxZ = 30;
                          const BOX_MARGIN = 8;
                          const posRef = characterPositionsRef.current;
                          const jesusAfterTurn = posRef.jesus;
                          const rawEndX = jesusAfterTurn[0] + STRAIGHT_WALK_DISTANCE;
                          const clampedEndX = Math.min(boxMaxX - BOX_MARGIN, Math.max(boxMinX + BOX_MARGIN, rawEndX));
                          const straightWalkEnd: [number, number, number] = [
                            clampedEndX,
                            jesusAfterTurn[1],
                            jesusAfterTurn[2],
                          ];
                          const actualStraightDist = Math.hypot(straightWalkEnd[0] - jesusAfterTurn[0], straightWalkEnd[2] - jesusAfterTurn[2]);
                          const straightWalkDurationSec = Math.max(0.5, actualStraightDist / JESUS_WALK_SPEED);
                          const STRAIGHT_ARRIVAL_BUFFER_MS = 80;

                          setFirstWalkDurationSec(straightWalkDurationSec);
                          setFirstWalkLerp({ start: [...jesusAfterTurn], end: straightWalkEnd });

                          setTimeout(() => {
                            setCharacterPositions((p) => ({ ...p, jesus: straightWalkEnd }));
                            setFirstWalkLerp(null);

                            if (fullFlowMeetingScheduledRef.current) return;
                            fullFlowMeetingScheduledRef.current = true;

                            // Now inside the box: walk to random NPC → talk → fail → walk to other NPC → success → Jesus to Boss → deal
                            const TALK_FIRST_MS = 3000;
                            const WALKBACKWARD_MS = 1000;
                            const FLYING_KICK_MS = 1500;
                            const NPC_FAILED_MS = 2000;
                            const FAIL_TOTAL_MS = WALKBACKWARD_MS + Math.max(FLYING_KICK_MS, NPC_FAILED_MS) + 200;
                            // NPC Success timeline: 9s until Success 1/2/3 plays, then let clip finish before walk to boss
                            const SUCCESS_PLAY_ANIM_AT_MS = 9000;
                            const NPC_SUCCESS_CLIP_DURATION_MS = 3500; // NPC - Success 1.fbx play to finish
                            const SUCCESS_TO_WALK_MS = SUCCESS_PLAY_ANIM_AT_MS + NPC_SUCCESS_CLIP_DURATION_MS;
                            const DEAL_DURATION_MS = 4000;

                            const npcList = npcsRef.current;
                            if (npcList.length < 2) {
                              fullFlowMeetingScheduledRef.current = false;
                              setTimeout(() => setActionInProgress(false), 500);
                              return;
                            }
                            const failIndex = Math.random() < 0.5 ? 0 : 1;
                            const successIndex = 1 - failIndex;
                            const failNpcId = npcList[failIndex].id;
                            const successNpcId = npcList[successIndex].id;
                            fullFlowFailNpcIdRef.current = failNpcId;
                            fullFlowSuccessNpcIdRef.current = successNpcId;
                            const failNpcPos = npcList[failIndex].position;
                            const jesusStart = straightWalkEnd;
                            // Jesus approaches; NPC stays still. Meeting point = in front of NPC (face each other).
                            const dx = jesusStart[0] - failNpcPos[0];
                            const dz = jesusStart[2] - failNpcPos[2];
                            const distToNpc = Math.hypot(dx, dz) || 1;
                            const MEET_DISTANCE_IN_FRONT = 5; // face to face but stay apart (NPCs + boss)
                            const meetingPoint: [number, number, number] = [
                              failNpcPos[0] + (dx / distToNpc) * MEET_DISTANCE_IN_FRONT,
                              0,
                              failNpcPos[2] + (dz / distToNpc) * MEET_DISTANCE_IN_FRONT,
                            ];
                            const distJesusToMeeting = Math.hypot(meetingPoint[0] - jesusStart[0], meetingPoint[2] - jesusStart[2]);
                            const walk1JesusSec = Math.max(0.5, distJesusToMeeting / JESUS_WALK_SPEED);
                            const npcFaceJesus = Math.atan2(meetingPoint[0] - failNpcPos[0], meetingPoint[2] - failNpcPos[2]);

                            setFirstWalkDurationSec(walk1JesusSec);
                            setFirstWalkLerp({ start: [...jesusStart], end: meetingPoint });
                            const onFirstMeetingArrived = () => {
                              const failId = fullFlowFailNpcIdRef.current;
                              const successId = fullFlowSuccessNpcIdRef.current;
                              if (!failId || !successId) return;
                              setCharacterPositions((p) => ({ ...p, jesus: meetingPoint }));
                              setNPCs((prev) =>
                                prev.map((n) =>
                                  n.id === failId
                                    ? {
                                        ...n,
                                        position: failNpcPos,
                                        currentAnimation: 'talking' as const,
                                        overrideRotationY: npcFaceJesus,
                                      }
                                    : n
                                )
                              );
                              setFirstWalkLerp(null);
                              setJesusFaceToward(failNpcPos);
                              setJesusState('talking');

                              setTimeout(() => {
                                setJesusFaceToward(null);
                                setJesusState('walkBackward');
                                setNPCs((prev) =>
                                  prev.map((n) =>
                                    n.id === failId ? { ...n, currentAnimation: 'failed' as const, overrideRotationY: undefined } : n
                                  )
                                );
                                setTimeout(() => setJesusState('flyingKick'), WALKBACKWARD_MS);
                                setTimeout(() => {
                                  setJesusState('idle');
                                  setNPCs((prev) =>
                                    prev.map((n) => (n.id === failId ? { ...n, currentAnimation: 'idle' as const } : n))
                                  );

                                  const successNpc = npcsRef.current.find((n) => n.id === successId);
                                  const successNpcPos = successNpc?.position ?? meetingPoint;
                                  const jesusAfterFail = meetingPoint;
                                  const dx2 = jesusAfterFail[0] - successNpcPos[0];
                                  const dz2 = jesusAfterFail[2] - successNpcPos[2];
                                  const distToNpc2 = Math.hypot(dx2, dz2) || 1;
                                  const meetingPoint2: [number, number, number] = [
                                    successNpcPos[0] + (dx2 / distToNpc2) * MEET_DISTANCE_IN_FRONT,
                                    0,
                                    successNpcPos[2] + (dz2 / distToNpc2) * MEET_DISTANCE_IN_FRONT,
                                  ];
                                  const distJesusToMeeting2 = Math.hypot(meetingPoint2[0] - jesusAfterFail[0], meetingPoint2[2] - jesusAfterFail[2]);
                                  const walk2JesusSec = Math.max(0.5, distJesusToMeeting2 / JESUS_WALK_SPEED);
                                  const successNpcFaceJesus = Math.atan2(meetingPoint2[0] - successNpcPos[0], meetingPoint2[2] - successNpcPos[2]);

                                  setFirstWalkDurationSec(walk2JesusSec);
                                  setFirstWalkLerp({ start: [...jesusAfterFail], end: meetingPoint2 });
                                  const onSecondMeetingArrived = () => {
                                    const successIdNow = fullFlowSuccessNpcIdRef.current;
                                    if (!successIdNow) return;
                                    setCharacterPositions((p) => ({ ...p, jesus: meetingPoint2 }));
                                    setNPCs((prev) =>
                                      prev.map((n) =>
                                        n.id === successIdNow
                                          ? {
                                              ...n,
                                              position: successNpcPos,
                                              currentAnimation: 'talking' as const,
                                              overrideRotationY: successNpcFaceJesus,
                                            }
                                          : n
                                      )
                                    );
                                    setFirstWalkLerp(null);
                                    setJesusFaceToward(successNpcPos);
                                    setJesusState('talking');

                                    // Second NPC: talk first, then success
                                    const TALK_SECOND_MS = 3000;
                                    setTimeout(() => {
                                      setNPCs((prev) =>
                                        prev.map((n) =>
                                          n.id === successIdNow
                                            ? { ...n, currentAnimation: 'cheering' as const, overrideRotationY: successNpcFaceJesus }
                                            : n
                                        )
                                      );
                                      setJesusState('cheering');

                                      setTimeout(() => {
                                        setJesusFaceToward(null);
                                        const bossPos = characterPositionsRef.current.boss;

                                        const BOSS_MEET_DISTANCE = 5;
                                        const dxBoss = meetingPoint2[0] - bossPos[0];
                                        const dzBoss = meetingPoint2[2] - bossPos[2];
                                        const distToBoss = Math.hypot(dxBoss, dzBoss) || 1;
                                        const bossMeetingPoint: [number, number, number] = [
                                          bossPos[0] + (dxBoss / distToBoss) * BOSS_MEET_DISTANCE,
                                          0,
                                          bossPos[2] + (dzBoss / distToBoss) * BOSS_MEET_DISTANCE,
                                        ];

                                        const distJesusToBossMeeting = Math.hypot(bossMeetingPoint[0] - meetingPoint2[0], bossMeetingPoint[2] - meetingPoint2[2]);
                                        const walkBossJesusSecActual = Math.max(1, distJesusToBossMeeting / JESUS_WALK_SPEED);

                                        setFirstWalkDurationSec(walkBossJesusSecActual);
                                        setFirstWalkLerp({ start: [...meetingPoint2], end: bossMeetingPoint });
                                        // NPC does not follow Jesus after converted; stays at meeting spot

                                        const BOSS_ARRIVAL_BUFFER_MS = 120;
                                        const TALK_BEFORE_DEAL_MS = 3000;
                                        setTimeout(() => {
                                          jesusSnapToRef.current = [...bossMeetingPoint];
                                          setCharacterPositions((p) => ({ ...p, jesus: bossMeetingPoint }));
                                          setJesusFaceToward(bossPos);
                                          setNPCs((prev) =>
                                            prev.map((n) =>
                                              n.id === successIdNow
                                                ? {
                                                    ...n,
                                                    currentAnimation: 'idle' as const,
                                                    isConverted: true,
                                                    overrideRotationY: undefined,
                                                  }
                                                : n
                                            )
                                          );
                                          clearLerpNextFrame(() => {
                                            setFirstWalkLerp(null);
                                            setJesusState('talking');
                                          });
                                          setTimeout(() => {
                                            setJesusState('deal');
                                            setTimeout(() => {
                                              setJesusState('idle');
                                              setJesusFaceToward(null);
                                              setActionInProgress(false);
                                            }, DEAL_DURATION_MS);
                                          }, TALK_BEFORE_DEAL_MS);
                                        }, walkBossJesusSecActual * 1000 + BOSS_ARRIVAL_BUFFER_MS);
                                      }, SUCCESS_TO_WALK_MS);
                                    }, TALK_SECOND_MS);
                                  };
                                  setTimeout(() => {
                                    jesusSnapToRef.current = meetingPoint2;
                                    onSecondMeetingArrived();
                                  }, walk2JesusSec * 1000 + 200);
                                }, FAIL_TOTAL_MS);
                              }, TALK_FIRST_MS);
                            };
                            setTimeout(() => {
                              jesusSnapToRef.current = meetingPoint;
                              onFirstMeetingArrived();
                            }, walk1JesusSec * 1000 + 200);
                          }, straightWalkDurationSec * 1000 + STRAIGHT_ARRIVAL_BUFFER_MS);
                        }, RIGHT_TURN_MS - CROSSFADE_BEFORE_TURN_END_MS);
                }, runDur * 1000 + RUN_ARRIVAL_BUFFER_MS);
              }, FAILED_MS);
            }, mazeAccelMs + spikeThenJesusMs + jesusPrayMs);
          }, TALKING_MS);
        }, FIRST_WALK_DURATION_MS);
        return prev;
      });
    }, START_WALKING_MS);
  }, [actionInProgress]);

  const resetArena = useCallback(() => {
    if (meetingIntervalRef.current) {
      clearInterval(meetingIntervalRef.current);
      meetingIntervalRef.current = null;
    }
    meetingNpcIdRef.current = null;
    meetingPointRef.current = null;
    jesusSnapToRef.current = null;
    meetingNpcSnapRef.current = null;
    meetingArrivedCallbackRef.current = null;
    fullFlowMeetingScheduledRef.current = false;
    fullFlowFailNpcIdRef.current = null;
    fullFlowSuccessNpcIdRef.current = null;
    setJesusState('idle');
    setPreparingRun(false);
    setFirstWalkLerp(null);
    setRunLerp(null);
    setJesusFaceToward(null);
    setNPCs([]);
    setActionInProgress(false);
    setPrayPhase(-1);
    setJesusInvertFacing(false);
    setJesusFaceRight(false);
    setCharacterPositions(() => ({ ...DEFAULT_CHARACTER_POSITIONS }));
  }, []);

  return (
    <AnimationContext.Provider value={{
      jesusState,
      npcs,
      actionInProgress,
      prayPhase,
      jesusInvertFacing,
      jesusFaceRight,
      preparingRun,
      firstWalkLerp,
      firstWalkDurationSec,
      runLerp,
      runDurationSec,
      jesusFaceToward,
      characterPositions,
      jesusLerpArrivedRef,
      npcLerpArrivedRef,
      meetingNpcIdRef,
      jesusPositionRef,
      jesusRotationYRef,
      cameraInFrontOfJesus,
      meetingNpcPositionRef,
      jesusSnapToRef,
      meetingNpcSnapRef,
      setCharacterPosition,
      setFirstWalkLerp,
      setNPCPosition,
      setNPCRandomWalk,
      spawnNPC,
      triggerTalk,
      triggerSuccess,
      triggerFail,
      triggerDeal,
      triggerPray,
      triggerFullFlow,
      triggerBossMeetTalkDeal,
      triggerNpcMeetTalkFail,
      triggerNpcMeetTalkSuccess,
      triggerCrowdCheer,
      resetArena,
    }}>
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return context;
};
