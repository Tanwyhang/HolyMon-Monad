export type AnimationState =
  | 'idle'           // Initial state
  | 'walking'        // Spawn action
  | 'talking'        // Talk action
  | 'cheering'       // Success action
  | 'walkBackward'   // Fail action phase 1
  | 'flyingKick'     // Fail action phase 2
  | 'deal'           // Deal animation (Jesus + Boss)
  | 'praying';       // Praying animation; Moanad GOD Maze glows

export type NPCBaseModel = 'unconverted' | 'converted';

export interface NPCInstance {
  id: string;
  baseModelIndex: number;  // 0-3 for Unconverted 1,2,4,5
  position: [number, number, number];
  currentAnimation: AnimationState;
  isConverted: boolean;
  walkAnimationIndex?: number;  // Store which walk animation was assigned
}

export interface ArenaState {
  jesusState: AnimationState;
  npcs: NPCInstance[];
  actionInProgress: boolean;
}
