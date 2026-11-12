/**
 * Earthfall: Beyond the Solar System - Game Types
 */

export type GameState = 'TITLE' | 'STORY_INTRO' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type ZoneId = 'solar_system' | 'asteroid_belt' | 'dark_nebula' | 'frozen_space' | 'unknown_universe';

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  subtitle: string;
  minDistance: number;
  maxDistance: number;
  bgGradient: [string, string, string]; // Top, Mid, Bottom
  nebulaColors: string[];
  ambientColor: string;
  starColor: string;
  obstacleMultipliers: {
    speed: number;
    density: number;
    hazardVariety: number;
  };
}

export type PowerUpType = 'SHIELD' | 'ENERGY' | 'TIME_CONTROL' | 'COSMIC_BOOST' | 'MAGNET';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  angle: number;
  glowColor: string;
  duration: number; // For active powerups in seconds
}

export interface ActivePowerUp {
  type: PowerUpType;
  durationRemaining: number;
  maxDuration: number;
}

export type ObstacleType = 
  | 'SMALL_ASTEROID'
  | 'GIANT_ASTEROID'
  | 'METEOR_SHOWER'
  | 'COMET'
  | 'SPACE_DEBRIS'
  | 'ENERGY_BARRIER'
  | 'COSMIC_STORM'
  | 'GRAVITATIONAL_ANOMALY'
  | 'SOLAR_FLARE'
  | 'VOID_CRYSTAL'
  | 'PULSAR_STAR'
  | 'ALIEN_MINE'
  | 'COSMIC_LEVIATHAN'
  | 'COLOSSAL_GUARDIAN'
  | 'ANTIMATTER_VORTEX';

export type SkillType = 'EMP_SHOCKWAVE' | 'PHASE_WARP' | 'RETRO_VENT';

export interface ActiveSkill {
  type: SkillType;
  name: string;
  keyLabel: string;
  cooldownRemaining: number;
  maxCooldown: number;
  isActive: boolean;
  activeDurationRemaining: number;
  maxActiveDuration: number;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  health?: number;
  color: string;
  glowColor?: string;
  points?: { x: number; y: number }[]; // For procedural polygon asteroids
  isTelegraphing?: boolean;
  telegraphTimer?: number;
  customData?: any;
}

export interface CosmicEnergyOrb {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  glowColor: string;
  pulseTimer: number;
  baseY: number;
  floatOffset: number;
}

export type GameMode = 'INFINITE_RUN' | 'STORY_MODE';

export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6;

export interface ChapterConfig {
  id: ChapterId;
  title: string;
  subtitle: string;
  element: 'Gravity/Rock' | 'Cryo/Ice' | 'Pyro/Lava' | 'Storm/Lightning' | 'Acid/Bio' | 'Solar/Eclipse';
  themeColor: string;
  accentColor: string;
  bgGradient: [string, string, string];
  platformStyle: 'rock' | 'ice' | 'magma' | 'storm' | 'chitin' | 'solar';
  lengthDistance: number;
  miniBossName: string;
  miniBossDistance: number;
  mainBossName: string;
  mainBossDistance: number;
  loreIntro: string;
  loreOutro: string;
}

export type PlatformType = 'rock' | 'ice' | 'magma' | 'storm' | 'chitin' | 'solar' | 'crumbling' | 'bounce';

export interface Platform3D {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  isMoving?: boolean;
  moveRange?: number;
  moveSpeed?: number;
  baseY?: number;
  isCrumbling?: boolean;
  crumbleTimer?: number;
  isFallen?: boolean;
  hasSpring?: boolean;
}

export type StructureType =
  | 'village_hut'
  | 'energy_windmill'
  | 'star_lantern'
  | 'trading_stall'
  | 'ruin_pillar'
  | 'ruin_arch'
  | 'lore_obelisk'
  | 'checkpoint_beacon';

export interface Structure3D {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isActive?: boolean;
  interactionText?: string;
  customData?: any;
}

export type NpcType = 'oracle' | 'elder' | 'scholar' | 'merchant' | 'villager';

export interface Npc3D {
  id: string;
  name: string;
  title: string;
  type: NpcType;
  x: number;
  y: number;
  dialogue: string[];
  merchantType?: 'star_forger' | 'chrono_architect' | 'aether_healer';
}

export interface BossEntity {
  id: string;
  name: string;
  title: string;
  chapter: ChapterId;
  isMiniBoss: boolean;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  targetY: number;
  width: number;
  height: number;
  element: string;
  state: 'intro' | 'attack' | 'stagger' | 'defeated';
  attackTimer: number;
  attackPattern: number;
  activeAttackName: string;
}

export interface CheckpointData {
  chapter: ChapterId;
  distance: number;
  health: number;
  shards: number;
  timestamp: number;
}

export interface UpgradeStats {
  fistDamageLevel: number;
  elementalResistLevel: number;
  abilityCooldownLevel: number;
  earthHullLevel: number;
  aegisDurationLevel: number;
  vanguardFireRateLevel: number;
}

export interface VanguardLaser {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
}

export interface FistPunch {
  step: 1 | 2 | 3;
  timer: number;
  x: number;
  y: number;
  radius: number;
  damage: number;
}

export interface PlayerStats {
  score: number;
  distance: number;
  energyCollected: number;
  obstaclesDodged: number;
  maxCombo: number;
  currentCombo: number;
  zone: ZoneId;
  scrapCollected?: number;
  shardsCollected?: number;
  mode?: GameMode;
  chapter?: ChapterId;
}

export type ThemeId = 'default' | 'solar' | 'cyberpunk' | 'void' | 'glacial';

export type SkinTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type SkinId =
  | 'earth_classic'
  | 'mars_terraformed'
  | 'toxic_venus'
  | 'frozen_europa'
  | 'solar_corona'
  | 'bioluminescent_gaia'
  | 'dyson_core'
  | 'dark_matter_void'
  | 'cyberpunk_matrix'
  | 'ice_earth'
  | 'toxic_earth'
  | 'fire_earth'
  | 'lava_earth'
  | 'ocean_earth'
  | 'neon_earth'
  | 'crystal_earth'
  | 'shadow_earth'
  | 'galaxy_earth'
  | 'golden_earth'
  | 'aurora_earth'
  | 'void_earth'
  | 'zombie_earth';

export type SkinTrailType =
  | 'none'
  | 'fire'
  | 'ember'
  | 'bubble'
  | 'neon'
  | 'sparkle'
  | 'smoke'
  | 'stars'
  | 'gold'
  | 'rainbow'
  | 'void'
  | 'toxic'
  | 'default';

export type SkinExplosionType =
  | 'default'
  | 'stars'
  | 'gold'
  | 'implosion'
  | 'toxic';

export type SpecialRenderType =
  | 'default'
  | 'ice'
  | 'slime'
  | 'fire'
  | 'lava'
  | 'ocean'
  | 'neon'
  | 'crystal'
  | 'shadow'
  | 'galaxy'
  | 'golden'
  | 'aurora'
  | 'void_hole'
  | 'zombie';

export interface SkinItem {
  id: SkinId;
  name: string;
  tier: SkinTier;
  price: number;
  description: string;
  themeId: ThemeId;
  atmosphereColor: string;
  glowColor: string;
  trailColor: string;
  oceanColor: string;
  continentColor: string;
  cloudColor: string;
  auroraColor: string;
  ringStyle?: 'none' | 'saturn' | 'cyber' | 'energy' | 'void_ring' | 'crown' | 'neon_halo';
  trailType?: SkinTrailType;
  explosionType?: SkinExplosionType;
  specialRender?: SpecialRenderType;
}

export type CosmicAvatarId =
  | 'earth'
  | 'mars'
  | 'europa'
  | 'titan'
  | 'solar'
  | 'cyber'
  | 'void'
  | 'phoenix';

export interface LeaderboardEntry {
  rank?: number;
  username: string;
  score: number;
  zone: string;
  date: string;
  avatar?: string;
  country?: string;
  distance?: number;
  survivalTime?: number;
  uid?: string;
  isCurrentPlayer?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  scale?: number;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export type DeviceType = 'mobile' | 'pc';
export type ControlMode = 'auto' | 'mobile' | 'pc';

export interface GameSettings {
  screenShake: boolean;
  highQualityParticles: boolean;
  controlMode: ControlMode;
  touchControlsVisible: boolean;
  sound: AudioSettings;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetType: 'distance' | 'energy' | 'dodge' | 'combo' | 'skills' | 'games';
  targetCount: number;
  currentCount: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyStreakDay {
  day: number;
  reward: number;
  isCompleted: boolean;
  isToday: boolean;
  isMilestone: boolean;
}

export interface DailyStreakData {
  currentStreak: number;
  bestStreak: number;
  claimedToday: boolean;
  todayReward: number;
  days: DailyStreakDay[];
  canClaim: boolean;
}

export interface HighScoreRecord {
  score: number;
  distance: number;
  energy: number;
  zone: string;
  date: string;
}

