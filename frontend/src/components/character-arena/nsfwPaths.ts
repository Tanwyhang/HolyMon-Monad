/**
 * NSFW Boss and Leng FBX paths – models and default animations.
 */
export const NSFW_BOSS_MODEL = '/3d/NSFW - Boss.fbx';
export const NSFW_LENG_MODEL = '/3d/NSFW - Leng.fbx';
export const NSFW_BOSS_IDLE_ANIM = '/3d/NSFW - BossIdle.fbx';
export const NSFW_LENG_TWERK_ANIM = '/3d/NSFW - LengTwerk.fbx';
export const DEAL_ANIM = '/3d/Deal.fbx';

/** Order: Boss model, Leng model, BossIdle anim, LengTwerk anim, Deal anim */
export const ALL_NSFW_FBX_PATHS: string[] = [
  NSFW_BOSS_MODEL,
  NSFW_LENG_MODEL,
  NSFW_BOSS_IDLE_ANIM,
  NSFW_LENG_TWERK_ANIM,
  DEAL_ANIM,
];

export const NSFW_INDEX = {
  modelBoss: 0,
  modelLeng: 1,
  animBossIdle: 2,
  animLengTwerk: 3,
  animDeal: 4,
} as const;
