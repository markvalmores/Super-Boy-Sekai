export type WorldTheme = 
  | 'grassland'
  | 'cavern'
  | 'sky'
  | 'volcano'
  | 'astral'
  | 'cyber'
  | 'ice'
  | 'ghost'
  | 'celestial'
  | 'omega';

export interface LevelMetadata {
  levelNumber: number;
  worldNumber: number;
  worldName: string;
  theme: WorldTheme;
  title: string;
  lore: string;
  aiModifier?: string;
  bossName?: string;
  timeLimit: number;
  parScore: number;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Extreme' | 'Godly';
  lengthBlocks: number;
}

export type CostumeId = 'tempest_coat' | 'tokyo_otaku' | 'mii_red' | 'mii_blue' | 'shinobi_souei' | 'akiba_street' | 'celestial_kami';
export type AccessoryId = 'slime_pet' | 'kitsune' | 'dragon_wings' | 'cross' | 'visor' | 'none';
export type SkillId = 'katana_slash' | 'mega_punch' | 'slime_water_blade' | 'fireball' | 'spirit_wave' | 'lightning_dash';

export type WeaponType = 'katana' | 'fists' | 'slime_blade' | 'fire_staff';

export interface Costume {
  id: CostumeId;
  name: string;
  description: string;
  theme: 'mii' | 'tensura' | 'otaku' | 'ninja' | 'divine' | 'street';
  shirtColor?: string;
  coatColor?: string;
  innerColor?: string;
  pantsColor: string;
  glowColor: string;
  unlockedAtLevel: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Demon Lord' | 'Mii Special';
  speedBonus: number;
  jumpBonus: number;
  attackBonus: number;
}

export interface Accessory {
  id: AccessoryId;
  name: string;
  description: string;
  icon: string;
  unlockedAtLevel: number;
  passiveBuff: string;
}

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  cooldown: number;
  damage: number;
  keybind: string;
  energyCost: number;
  actionType: 'melee_slash' | 'melee_punch' | 'projectile' | 'dash';
}

export type PowerUpType = 
  | 'katana_blade'
  | 'slime_orb'
  | 'mega_punch_glove'
  | 'ramen_speed_boost'
  | 'sakura_bento_heal'
  | 'star_invincible';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isJumping: boolean;
  facing: 'left' | 'right';
  health: number;
  maxHealth: number;
  activeWeapon: WeaponType;
  equippedPowerUp?: PowerUpType;
  powerUpTimer: number;
  isAttacking: boolean;
  attackTimer: number;
  attackType: 'slash' | 'punch' | 'skill';
  invincibleTimer: number;
  starTimer: number;
  energy: number;
  maxEnergy: number;
  skillCooldownTimer: number;
  coins: number;
  starCoins: number[];
  score: number;
  lives: number;
  isClimbingFlag: boolean;
  flagSlideProgress: number;
  isDead: boolean;
  deathTimer: number;
}

export interface BlockTile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'brick' | 'question' | 'question_mushroom' | 'question_star' | 'question_katana' | 'question_slime' | 'destructible_crate' | 'pipe' | 'pipe_top' | 'spring' | 'spikes' | 'moving_platform' | 'checkpoint' | 'flagpole' | 'castle';
  hitAnimation?: number;
  isUsed?: boolean; // When used, turns grey empty
  hasCoin?: boolean;
  isDestroyed?: boolean;
  movementOffset?: number;
  movementSpeed?: number;
  movementRange?: number;
}

export type EnemyType = 
  | 'dragon'
  | 'zombie'
  | 'spider'
  | 'lizard'
  | 'alligator'
  | 'alien'
  | 'ufo'
  | 'octopus'
  | 'whale'
  | 'demon'
  | 'devil'
  | 'slime_monster'
  | 'goomba'
  | 'koopa'
  | 'flying_koopa'
  | 'piranha'
  | 'boss_bowser'
  | 'boss_celestial';

export type EnemyBuff = 'shield' | 'frenzy_speed' | 'fire_aura' | 'poison' | 'none';

export interface EnemyEntity {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  buff?: EnemyBuff;
  attackCooldown?: number;
  isDead: boolean;
  deathTimer: number;
  facing: 'left' | 'right';
  patrolLeft: number;
  patrolRight: number;
}

export interface ItemEntity {
  id: string;
  type: 'coin' | 'mushroom' | 'fire_flower' | 'star' | 'star_coin' | '1up' | 'power_katana' | 'power_slime' | 'power_punch' | 'power_ramen' | 'power_bento';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  collected: boolean;
  coinIndex?: number;
}

export interface ProjectileEntity {
  id: string;
  type: 'fireball' | 'spirit_wave' | 'slime_blade' | 'enemy_fire' | 'alien_laser' | 'spider_web';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  lifetime: number;
  isPlayer: boolean;
  damage: number;
}

export interface HitSparkEntity {
  id: string;
  x: number;
  y: number;
  type: 'electric' | 'critical' | 'ko' | 'player_hurt' | 'sword_slash' | 'punch_burst' | 'slime_splash' | 'block_break';
  text?: string;
  life: number;
  maxLife: number;
  scale: number;
  rotation: number;
}

export interface DeviceInfo {
  gpuVendor: string;
  gpuRenderer: string;
  vramEstimatedMB: number;
  cpuCores: number;
  ramGB: number;
  screenRefreshRate: number;
  resolution: string;
  devicePlatform: string;
  browser: string;
  tier: 'Low' | 'Balanced' | 'High' | 'Ultra RTX';
}

export interface GraphicSettings {
  rayTracingEnabled: boolean;
  rayTracingMode?: 'off' | 'gpu' | 'cpu' | 'path_tracing';
  pathTracingSim: boolean;
  aiFrameGeneration: boolean;
  bloomEnabled: boolean;
  celShadingOutlines: boolean;
  shadowQuality: 'off' | 'medium' | 'ultra';
  crtFilter: boolean;
  particleDensity: 'low' | 'medium' | 'high' | 'ultra';
  targetFps: number;
  mobileControlsMode?: 'auto' | 'always' | 'never';
}

export interface LeaderboardRecord {
  id: string;
  playerName: string;
  characterTitle: string;
  level: number;
  score: number;
  timeSeconds: number;
  coins: number;
  starCoins: number;
  equippedCostume: string;
  equippedSkill: string;
  deviceTier: string;
  createdAt: string;
}
