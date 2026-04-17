export type AnimationState =
  | 'idle'           // Initial state
  | 'walking'        // Spawn action / Start Walking
  | 'talking'        // Talk action
  | 'cheering'       // Success action
  | 'walkBackward'   // Fail action phase 1
  | 'flyingKick'     // Fail action phase 2
  | 'deal'           // Deal animation (Jesus + Boss)
  | 'praying'        // Praying animation; Moanad GOD Maze glows
  | 'running'        // Jesus - Running.fbx (second run back)
  | 'failed'         // NPC - Failed 1 on Jesus (full flow)
  | 'walkingLoop'    // Jesus - Walking.fbx (first run toward Moanad, loop after rightTurn)
  | 'rightTurn';     // Jesus - RightTurn.fbx (once after second run)

export type NPCBaseModel = 'unconverted' | 'converted';

export interface NPCInstance {
  id: string;
  baseModelIndex: number;  // 0-3 for Unconverted 1,2,4,5
  position: [number, number, number];
  currentAnimation: AnimationState;
  isConverted: boolean;
  walkAnimationIndex?: number;  // Store which walk animation was assigned
  /** Random walk: lerp from start to end position driven by script (no root motion) */
  randomWalkLerp?: { start: [number, number, number]; end: [number, number, number] } | null;
  /** Duration of random walk in seconds */
  randomWalkDurationSec?: number;
  /** Walk target rotation Y (radians) */
  targetRotationY?: number;
  /** When set and not walking: force rotation Y (e.g. face Jesus when talking). Radians. */
  overrideRotationY?: number;
  /** When cheering: 0=Success 1, 1=Success 2, 2=Success 3. Used for crowd NPCs. */
  successAnimationIndex?: number;
  /** When cheering: 0=normal timeline (spin then Success), 1=converted Idle then Success, 2=Success only (no spin). */
  successStartPhase?: 0 | 1 | 2;
}

export interface ArenaState {
  jesusState: AnimationState;
  npcs: NPCInstance[];
  actionInProgress: boolean;
}
