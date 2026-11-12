/**
 * Earthfall: Beyond the Solar System - Core Gameplay Engine
 */

import {
  BASE_GAME_SPEED,
  CANVAS_VIRTUAL_HEIGHT,
  CANVAS_VIRTUAL_WIDTH,
  DIVE_IMPULSE,
  EARTH_RADIUS,
  GRAVITY,
  HORIZONTAL_POSITION_RATIO,
  JUMP_IMPULSE,
  MAX_FALL_SPEED,
  MAX_GAME_SPEED,
  MAX_HEALTH,
  MAX_RISE_SPEED,
  POWER_UP_CONFIG,
  ZONES,
} from './constants';
import {
  ActivePowerUp,
  ActiveSkill,
  BossEntity,
  ChapterId,
  CheckpointData,
  CosmicEnergyOrb,
  FistPunch,
  FloatingText,
  GameMode,
  GameState,
  HighScoreRecord,
  Npc3D,
  Obstacle,
  ObstacleType,
  Platform3D,
  PlayerStats,
  PowerUpItem,
  PowerUpType,
  SkinItem,
  SkillType,
  Structure3D,
  ThemeId,
  VanguardLaser,
  ZoneId,
} from './types';
import { CHAPTERS } from './constants';
import { soundEngine } from './audio';
import { renderEarth } from './earthRenderer';
import { ParticleSystem } from './particleSystem';
import { SpaceRenderer } from './spaceRenderer';
import { renderCosmicOrb, renderObstacle, renderPowerUp } from './obstacleRenderer';
import { CosmeticsManager } from './cosmetics';
import { DailyMissionsManager } from './dailyMissions';
import { LeaderboardManager } from './leaderboard';
import { crazyGames } from './crazyGamesSdk';
import { StoryProgressionManager } from './storyProgression';
import { PlatformerRenderer } from './platformerRenderer';

const HIGH_SCORE_KEY = 'earthfall_high_scores_v2';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public state: GameState = 'TITLE';
  public mode: GameMode = 'INFINITE_RUN';
  public currentChapter: ChapterId = 1;

  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (
    stats: PlayerStats,
    health: number,
    activePowerUps: ActivePowerUp[],
    zoneBanner: string | null,
    skills: ActiveSkill[],
    jumpsRemaining: number,
    maxJumps: number,
    isGrounded: boolean,
    isGroundHazardActive: boolean,
    scrapBalance: number,
    shardsBalance?: number,
    currentBoss?: BossEntity | null,
    isFistMode?: boolean
  ) => void;
  public onOpenNpcDialogue?: (npc: Npc3D) => void;
  public onOpenMerchant?: (merchantType: 'star_forger' | 'chrono_architect' | 'aether_healer') => void;

  // Guardian 2.5D Combat State
  public isFistMode = false; // False = carrying Earth in hands; True = Earth on Back Solar Ring, fists ready
  public punch: FistPunch | null = null;
  public punchComboStep: 1 | 2 | 3 = 1;
  public punchTimer = 0;
  public runPhase = 0;

  // 2 mini Vanguard Spaceships auto-fire
  public vanguardLasers: VanguardLaser[] = [];
  public vanguardFireCooldown = 0;

  // 2.5D Multi-Tier Floating Platforms & 3D Structures
  public platforms: Platform3D[] = [];
  public structures: Structure3D[] = [];
  public npcs: Npc3D[] = [];
  public currentBoss: BossEntity | null = null;
  public activeCheckpoint: CheckpointData | null = null;
  public shardsCollectedThisRun = 0;
  private platformSpawnX = 0;

  // Active Skills Map
  public skills: Map<SkillType, ActiveSkill> = new Map();

  // Jump system: 10 limited jumps, refills ONLY on landing on the ground or a 3D platform
  public jumpCount = 0;
  public readonly MAX_JUMPS = 10;
  public get jumpsRemaining(): number {
    return Math.max(0, this.MAX_JUMPS - this.jumpCount);
  }

  // Floating text feedback (+50, +Atmosphere, +1 Scrap)
  public floatingTexts: FloatingText[] = [];

  // Zone Transition 1s white fade flash & alert banner
  public zoneFlashTimer = 0;
  private atmosphereWarningCooldown = 0;
  public scrapCollectedThisRun = 0;

  // Ground anti-cheat (prevents floor sliding cheat)
  public groundContactTimer = 0;
  public isGrounded = false;
  public isGroundHazardActive = false;
  private groundWarningSfxCooldown = 0;

  // Theme & Skin Cache
  public equippedSkin: SkinItem = CosmeticsManager.getEquippedSkin();
  public equippedTheme: ThemeId = CosmeticsManager.getEquippedTheme();

  // Player physics
  public earthX = CANVAS_VIRTUAL_WIDTH * HORIZONTAL_POSITION_RATIO;
  public earthY = CANVAS_VIRTUAL_HEIGHT / 2;
  public earthVy = 0;
  public earthHealth = MAX_HEALTH;
  public earthRotation = 0;
  public earthCloudRotation = 0;

  // Hit flash & invincibility
  private invincibilityTimer = 0;
  private hitstopTimer = 0;
  private isHitFlash = false;

  // Power-ups
  public activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();

  // Spawners & entities
  private obstacles: Obstacle[] = [];
  private orbs: CosmicEnergyOrb[] = [];
  private powerUpItems: PowerUpItem[] = [];

  // Systems
  private particles: ParticleSystem = new ParticleSystem();
  private spaceRenderer: SpaceRenderer = new SpaceRenderer();

  // Progression & Stats
  public stats: PlayerStats = {
    score: 0,
    distance: 0,
    energyCollected: 0,
    obstaclesDodged: 0,
    maxCombo: 0,
    currentCombo: 0,
    zone: 'solar_system',
  };

  private gameSpeed = BASE_GAME_SPEED;
  private timeAlive = 0;
  private obstacleSpawnTimer = 0;
  private orbSpawnTimer = 0;
  private powerUpSpawnTimer = 0;

  // Screen shake
  public shakeTrauma = 0;
  public screenShakeEnabled = true;

  // Zone banner alert
  private zoneBanner: string | null = null;
  private zoneBannerTimer = 0;

  // Animation Loop
  private animFrameId: number | null = null;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_VIRTUAL_WIDTH;
    this.canvas.height = CANVAS_VIRTUAL_HEIGHT;
  }

  public init() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('earthfall_high_scores')) {
        localStorage.removeItem('earthfall_high_scores');
      }
    } catch (e) {}
    this.resetGame();
    this.startLoop();
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundEngine.stopMusic();
  }

  public resetGame() {
    this.earthX = CANVAS_VIRTUAL_WIDTH * HORIZONTAL_POSITION_RATIO;
    this.earthY = CANVAS_VIRTUAL_HEIGHT / 2;
    this.earthVy = 0;
    this.earthHealth = MAX_HEALTH;
    this.jumpCount = 0; // Starts at 10/10 Jumps
    this.floatingTexts = [];
    this.zoneFlashTimer = 0;
    this.atmosphereWarningCooldown = 0;
    this.scrapCollectedThisRun = 0;
    this.groundContactTimer = 0;
    this.isGrounded = false;
    this.isGroundHazardActive = false;
    this.refreshCosmetics();
    this.earthRotation = 0;
    this.earthCloudRotation = 0;
    this.invincibilityTimer = 0;
    this.hitstopTimer = 0;
    this.isHitFlash = false;

    this.activePowerUps.clear();
    this.obstacles = [];
    this.orbs = [];
    this.powerUpItems = [];
    this.particles.clear();

    // 2.5D State Reset
    this.isFistMode = false;
    this.punch = null;
    this.punchComboStep = 1;
    this.punchTimer = 0;
    this.runPhase = 0;
    this.vanguardLasers = [];
    this.vanguardFireCooldown = 0;
    this.platforms = [];
    this.structures = [];
    this.npcs = [];
    this.currentBoss = null;
    this.shardsCollectedThisRun = 0;
    this.platformSpawnX = 0;

    // Initialize 3 Active Skills
    this.skills.clear();
    this.skills.set('EMP_SHOCKWAVE', {
      type: 'EMP_SHOCKWAVE',
      name: 'Geomagnetic EMP',
      keyLabel: 'E',
      cooldownRemaining: 0,
      maxCooldown: 14,
      isActive: false,
      activeDurationRemaining: 0,
      maxActiveDuration: 0.6,
    });
    this.skills.set('PHASE_WARP', {
      type: 'PHASE_WARP',
      name: 'Dimensional Warp',
      keyLabel: 'Q',
      cooldownRemaining: 0,
      maxCooldown: 10,
      isActive: false,
      activeDurationRemaining: 0,
      maxActiveDuration: 1.5,
    });
    this.skills.set('RETRO_VENT', {
      type: 'RETRO_VENT',
      name: 'Plasma Retro-Vent',
      keyLabel: 'F',
      cooldownRemaining: 0,
      maxCooldown: 18,
      isActive: false,
      activeDurationRemaining: 0,
      maxActiveDuration: 2.5,
    });

    this.stats = {
      score: 0,
      distance: 0,
      energyCollected: 0,
      obstaclesDodged: 0,
      maxCombo: 0,
      currentCombo: 0,
      zone: 'solar_system',
    };

    this.gameSpeed = BASE_GAME_SPEED;
    this.timeAlive = 0;
    this.obstacleSpawnTimer = 1.2;
    this.orbSpawnTimer = 0.5;
    this.powerUpSpawnTimer = 10;
    this.shakeTrauma = 0;
    this.zoneBanner = null;
    this.zoneBannerTimer = 0;

    soundEngine.setZoneTheme(0);
  }

  public isPhasingActive(): boolean {
    return this.skills.get('PHASE_WARP')?.isActive ?? false;
  }

  // ACTIVE SKILL 1: GEOMAGNETIC EMP SHOCKWAVE (E / Mobile button)
  public triggerEmpShockwave() {
    if (this.state !== 'PLAYING') return;
    const skill = this.skills.get('EMP_SHOCKWAVE');
    if (!skill || skill.cooldownRemaining > 0) return;

    skill.cooldownRemaining = skill.maxCooldown;
    skill.isActive = true;
    skill.activeDurationRemaining = skill.maxActiveDuration;

    this.particles.emitEmpBlast(this.earthX, this.earthY);
    this.triggerScreenShake(0.65);
    soundEngine.playEmpShockwave();

    // Vaporize all obstacles within 440px and convert into energy orbs!
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const dist = Math.hypot(this.earthX - obs.x, this.earthY - obs.y);
      if (dist < 440) {
        this.particles.emitExplosion(obs.x, obs.y, '#38bdf8', 25);
        this.orbs.push({
          id: `orb_emp_${Date.now()}_${i}`,
          x: obs.x,
          y: obs.y,
          radius: 13,
          value: 150,
          glowColor: '#38bdf8',
          pulseTimer: 0,
          baseY: obs.y,
          floatOffset: 0,
        });
        this.obstacles.splice(i, 1);
        this.stats.score += 250;
        this.stats.obstaclesDodged++;
      }
    }
  }

  // ACTIVE SKILL 2: DIMENSIONAL PHASE WARP (Q / Shift / Mobile button)
  public triggerPhaseWarp() {
    if (this.state !== 'PLAYING') return;
    const skill = this.skills.get('PHASE_WARP');
    if (!skill || skill.cooldownRemaining > 0) return;

    skill.cooldownRemaining = skill.maxCooldown;
    skill.isActive = true;
    skill.activeDurationRemaining = skill.maxActiveDuration;

    this.invincibilityTimer = 1.5;
    this.particles.emitPhaseDust(this.earthX, this.earthY);
    this.triggerScreenShake(0.25);
    soundEngine.playPhaseWarp();

    // Phase jump forward
    this.earthX = Math.min(CANVAS_VIRTUAL_WIDTH * 0.42, this.earthX + 150);
  }

  // ACTIVE SKILL 3: PLASMA RETRO-VENT (F / Mobile button)
  public triggerRetroVent() {
    if (this.state !== 'PLAYING') return;
    const skill = this.skills.get('RETRO_VENT');
    if (!skill || skill.cooldownRemaining > 0) return;

    skill.cooldownRemaining = skill.maxCooldown;
    skill.isActive = true;
    skill.activeDurationRemaining = skill.maxActiveDuration;

    // Upward boost
    this.earthVy = -390;
    this.particles.emitRetroVentFlame(this.earthX, this.earthY);
    this.triggerScreenShake(0.45);
    soundEngine.playRetroVent();

    // Repel incoming obstacles within 360px backward
    for (const obs of this.obstacles) {
      if (obs.x > this.earthX && obs.x < this.earthX + 360) {
        obs.x += 180;
      }
    }
  }

  public startGame(mode: GameMode = 'INFINITE_RUN', fromCheckpoint = false) {
    this.resetGame();
    this.mode = mode;

    if (mode === 'STORY_MODE') {
      if (fromCheckpoint) {
        const saved = StoryProgressionManager.getSavedCheckpoint();
        if (saved) {
          this.currentChapter = saved.chapter;
          this.stats.distance = saved.distance;
          this.earthHealth = Math.max(50, saved.health);
          this.activeCheckpoint = saved;
        } else {
          this.currentChapter = 1;
        }
      } else {
        this.currentChapter = 1;
      }
    }

    this.spawnInitialPlatforms();
    this.incrementGamesPlayed();
    this.state = 'PLAYING';
    soundEngine.startMusic(128);
    crazyGames.gameplayStart();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public startStoryMode(fromCheckpoint = false) {
    this.startGame('STORY_MODE', fromCheckpoint);
  }

  public startInfiniteRun() {
    this.startGame('INFINITE_RUN', false);
  }

  // GUARDIAN COMBAT: TOGGLE SOLAR BACK-HOLDER (C / Combat button)
  public toggleFistMode() {
    if (this.state !== 'PLAYING') return;
    this.isFistMode = !this.isFistMode;
    this.particles.emitJumpRing(this.earthX, this.earthY, this.isFistMode ? '#fbbf24' : '#38bdf8');
    soundEngine.playJump();
    this.addFloatingText(
      this.isFistMode ? 'SOLAR RING LOCKED: FISTS ACTIVE!' : 'HOLDING EARTH IN HANDS',
      this.earthX + 40,
      this.earthY - 60,
      this.isFistMode ? '#fbbf24' : '#38bdf8',
      1.1
    );
  }

  // GUARDIAN COMBAT: 3-HIT FIST PUNCH COMBO (X / Melee button)
  public executePunch() {
    if (this.state !== 'PLAYING') return;
    if (!this.isFistMode) {
      this.isFistMode = true; // Auto-lock Earth on back when punching
    }

    const mult = StoryProgressionManager.getFistDamageMultiplier();
    const baseDamage = 75 * mult;

    // Advance combo step: 1 (Jab) -> 2 (Cross) -> 3 (Slam)
    const step = this.punchComboStep;
    const isHeavySlam = step === 3;
    const damage = isHeavySlam ? baseDamage * 2.2 : baseDamage;
    const radius = isHeavySlam ? 90 : 60;
    const reachX = this.earthX + (isHeavySlam ? 85 : 70);

    this.punch = {
      step,
      timer: 0.28,
      x: reachX,
      y: this.earthY,
      radius,
      damage,
    };

    this.punchComboStep = (step % 3 + 1) as 1 | 2 | 3;
    soundEngine.playJump();
    this.particles.emitContinuousExhaust(reachX, this.earthY, true, this.equippedSkin);

    // Destroy obstacles hit by punch
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const dist = Math.hypot(reachX - obs.x, this.earthY - obs.y);
      if (dist < radius + obs.radius) {
        this.particles.emitExplosion(obs.x, obs.y, '#f59e0b', 20);
        this.obstacles.splice(i, 1);
        this.stats.score += 200;
        this.stats.obstaclesDodged++;
        this.addFloatingText(`PUNCH! +200`, obs.x, obs.y, '#f59e0b');
      }
    }

    // Damage Boss if in range
    if (this.currentBoss && this.currentBoss.state !== 'defeated') {
      const bossDist = Math.hypot(reachX - this.currentBoss.x, this.earthY - this.currentBoss.y);
      if (bossDist < radius + this.currentBoss.width / 2) {
        this.currentBoss.health -= damage;
        this.triggerScreenShake(0.35);
        this.particles.emitExplosion(this.currentBoss.x, this.currentBoss.y, '#ef4444', 24);
        this.addFloatingText(`-${Math.round(damage)}`, this.currentBoss.x, this.currentBoss.y - 40, '#ef4444', 1.2);
        if (this.currentBoss.health <= 0) {
          this.defeatBoss();
        }
      }
    }
  }

  // NPC INTERACTION: Oracle, Elder, Scholars & Merchants (E / Talk button)
  public interactNpc(): boolean {
    if (this.state !== 'PLAYING') return false;
    for (const npc of this.npcs) {
      const dist = Math.hypot(this.earthX - npc.x, this.earthY - npc.y);
      if (dist < 130) {
        if (npc.merchantType && this.onOpenMerchant) {
          this.onOpenMerchant(npc.merchantType);
          return true;
        } else if (this.onOpenNpcDialogue) {
          this.onOpenNpcDialogue(npc);
          return true;
        }
      }
    }
    return false;
  }

  // SPAWN INITIAL 2.5D PLATFORMS
  private spawnInitialPlatforms() {
    this.platforms = [];
    this.structures = [];
    this.npcs = [];
    this.platformSpawnX = 0;

    const style = this.mode === 'STORY_MODE'
      ? CHAPTERS[this.currentChapter]?.platformStyle || 'rock'
      : 'rock';

    // Start with a solid entrance runway
    this.platforms.push({
      id: 'plat_start_0',
      x: 0,
      y: CANVAS_VIRTUAL_HEIGHT - 90,
      width: 480,
      height: 36,
      type: style,
    });
    this.platformSpawnX = 480;

    // Generate upcoming multi-tier platforms ahead
    this.generatePlatformsAhead(CANVAS_VIRTUAL_WIDTH * 2.5);
  }

  private generatePlatformsAhead(targetX: number) {
    const style = this.mode === 'STORY_MODE'
      ? CHAPTERS[this.currentChapter]?.platformStyle || 'rock'
      : 'rock';

    const possibleTiers = [
      CANVAS_VIRTUAL_HEIGHT - 90,  // Low tier
      CANVAS_VIRTUAL_HEIGHT - 210, // Mid tier
      CANVAS_VIRTUAL_HEIGHT - 330, // High tier
    ];

    while (this.platformSpawnX < targetX) {
      const gap = 120 + Math.random() * 110;
      const width = 160 + Math.random() * 180;
      const tierY = possibleTiers[Math.floor(Math.random() * possibleTiers.length)];
      const isMoving = Math.random() < 0.22;
      const isCrumbling = Math.random() < 0.16;
      const hasSpring = Math.random() < 0.14;

      const platX = this.platformSpawnX + gap;
      this.platforms.push({
        id: `plat_${Date.now()}_${Math.random()}`,
        x: platX,
        y: tierY,
        width,
        height: 34,
        type: isCrumbling ? 'crumbling' : hasSpring ? 'bounce' : style,
        isMoving,
        moveRange: 60,
        moveSpeed: 1.2,
        baseY: tierY,
        isCrumbling,
        hasSpring,
      });

      // Periodically spawn Safe Haven Cosmic Villages or Khandhar Ancient Ruins in Story Mode
      if (this.mode === 'STORY_MODE' && Math.random() < 0.28 && width > 220) {
        const structTypes = ['village_hut', 'energy_windmill', 'star_lantern', 'ruin_pillar', 'lore_obelisk'] as const;
        const sType = structTypes[Math.floor(Math.random() * structTypes.length)];
        this.structures.push({
          id: `struct_${Date.now()}_${Math.random()}`,
          type: sType,
          x: platX + width / 2,
          y: tierY - 24,
          width: 60,
          height: 80,
        });

        // Spawn friendly Guide or Merchant NPC in villages / ruins
        if (Math.random() < 0.45 && this.npcs.length < 4) {
          const npcTypes = [
            { type: 'oracle' as const, name: 'Oracle Vael', title: 'Cosmic Seer', dialogue: ['The stars guide your path, Titan.', 'Beware the elemental titan slumbering ahead.'] },
            { type: 'elder' as const, name: 'Elder Solis', title: 'Keeper of the Sun', dialogue: ['Guard Earth with your life, Guardian.', 'Her oceans hold the last embers of life.'] },
            { type: 'scholar' as const, name: 'Scholar Kael', title: 'Ruin Archaeologist', dialogue: ['These Khandhar ruins date back a billion years.', 'Use your energy fists to smash elemental barriers!'] },
            { type: 'merchant' as const, name: 'The Star-Forger', title: 'Armor & Fists Master', dialogue: ['Bring me Cosmic Shards to strengthen your gauntlets!'], merchantType: 'star_forger' as const },
          ];
          const choice = npcTypes[Math.floor(Math.random() * npcTypes.length)];
          this.npcs.push({
            id: `npc_${Date.now()}_${Math.random()}`,
            name: choice.name,
            title: choice.title,
            type: choice.type,
            x: platX + width / 2 + 30,
            y: tierY - 30,
            dialogue: choice.dialogue,
            merchantType: choice.merchantType,
          });
        }
      }

      // Checkpoint Beacon Spawning in Story Mode
      if (this.mode === 'STORY_MODE' && Math.abs(platX - 1400) < 180 && !this.structures.some(s => s.type === 'checkpoint_beacon')) {
        this.structures.push({
          id: `beacon_${Date.now()}`,
          type: 'checkpoint_beacon',
          x: platX + width / 2,
          y: tierY - 45,
          width: 50,
          height: 110,
          isActive: false,
        });
      }

      this.platformSpawnX = platX + width;
    }
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundEngine.stopMusic();
      crazyGames.gameplayStop();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      soundEngine.startMusic(128);
      crazyGames.gameplayStart();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public triggerGameOver() {
    this.state = 'GAME_OVER';
    soundEngine.stopMusic();
    soundEngine.playGameOver();
    crazyGames.gameplayStop();
    this.saveHighScore();
    LeaderboardManager.submitScore(
      this.stats.score,
      ZONES[this.stats.zone].name,
      this.timeAlive,
      this.stats.distance,
      this.equippedSkin.id
    );
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public addFloatingText(text: string, x: number, y: number, color = '#38bdf8', scale = 1.0) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      alpha: 1,
      life: 0,
      maxLife: 0.7, // Rises and fades in 0.7s
      color,
      scale,
    });
  }

  public getGamesPlayedCount(): number {
    try {
      return parseInt(localStorage.getItem('earthfall_games_played') || '0', 10);
    } catch {
      return 0;
    }
  }

  public incrementGamesPlayed(): void {
    try {
      const cur = this.getGamesPlayedCount();
      localStorage.setItem('earthfall_games_played', (cur + 1).toString());
    } catch {}
  }

  public reviveGame() {
    this.earthHealth = 60;
    this.invincibilityTimer = 3.5;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    soundEngine.startMusic(128);
    // Clear obstacles within 400px of Earth to give safe space
    this.obstacles = this.obstacles.filter(
      (obs) => obs.x > this.earthX + 400 || obs.x < this.earthX - 100
    );
    this.particles.emitEmpBlast(this.earthX, this.earthY);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public refreshCosmetics() {
    this.equippedSkin = CosmeticsManager.getEquippedSkin();
    this.equippedTheme = CosmeticsManager.getEquippedTheme();
  }

  // CONTROLS
  public applyJump() {
    if (this.state !== 'PLAYING') return;

    // Roof/Ceiling trap prevention: Disallow jump if already at the ceiling
    const minY = EARTH_RADIUS + 10;
    if (this.earthY <= minY + 6) {
      soundEngine.playCeilingBounce();
      return;
    }

    // 10 limited jumps: allow up to 10 jumps before requiring ground landing
    if (this.jumpCount >= this.MAX_JUMPS) {
      return;
    }

    this.jumpCount++;
    this.earthVy = JUMP_IMPULSE;
    const trailColor = this.equippedSkin?.trailColor || '#38bdf8';

    // Add small ring effect on EACH jump!
    this.particles.emitJumpRing(this.earthX, this.earthY, trailColor);

    this.particles.emitContinuousExhaust(this.earthX, this.earthY, this.hasPowerUp('COSMIC_BOOST'), this.equippedSkin);
    soundEngine.playJump();
  }

  public applyDive() {
    if (this.state !== 'PLAYING') return;
    this.earthVy = DIVE_IMPULSE;
    this.particles.emitContinuousExhaust(this.earthX, this.earthY, this.hasPowerUp('COSMIC_BOOST'), this.equippedSkin);
    soundEngine.playDive();
  }

  public triggerSkill(type: SkillType) {
    if (type === 'EMP_SHOCKWAVE') this.triggerEmpShockwave();
    else if (type === 'PHASE_WARP') this.triggerPhaseWarp();
    else if (type === 'RETRO_VENT') this.triggerRetroVent();
    DailyMissionsManager.recordProgress('skills', 1);
  }

  public getSkills(): ActiveSkill[] {
    return Array.from(this.skills.values());
  }

  private startLoop() {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent frame lag explosion

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    // Background space continues moving even in Title screen for cinematic visuals!
    const bgSpeed = this.state === 'PLAYING' ? this.gameSpeed : BASE_GAME_SPEED * 0.45;
    this.spaceRenderer.update(dt, bgSpeed);
    this.particles.update(dt);

    // Continuous Earth rotations
    this.earthRotation = (this.earthRotation + dt * 25) % 360;
    this.earthCloudRotation = (this.earthCloudRotation + dt * 38) % 360;

    if (this.state !== 'PLAYING') return;

    // Handle hitstop pause on heavy impact
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    this.timeAlive += dt;

    // Decay screen shake
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.2);
    }

    // Zone Banner Timer
    if (this.zoneBannerTimer > 0) {
      this.zoneBannerTimer -= dt;
      if (this.zoneBannerTimer <= 0) {
        this.zoneBanner = null;
      }
    }

    // Update active power-ups
    this.updatePowerUps(dt);

    // Update active skills cooldowns and active durations
    for (const skill of this.skills.values()) {
      if (skill.cooldownRemaining > 0) {
        skill.cooldownRemaining = Math.max(0, skill.cooldownRemaining - dt);
      }
      if (skill.isActive) {
        skill.activeDurationRemaining -= dt;
        if (skill.activeDurationRemaining <= 0) {
          skill.isActive = false;
        }
      }
    }

    // Dynamic speed based on distance, power-ups, and retro-vent time dilation
    const hasSlow = this.hasPowerUp('TIME_CONTROL') || (this.skills.get('RETRO_VENT')?.isActive ?? false);
    const hasBoost = this.hasPowerUp('COSMIC_BOOST');
    const speedMult = hasSlow ? 0.5 : hasBoost ? 1.6 : 1.0;
    this.gameSpeed = Math.min(MAX_GAME_SPEED, (BASE_GAME_SPEED + this.stats.distance * 0.015) * speedMult);

    // Earth continuous thruster exhaust (continuous small blue/white particles, fade in 0.4s + custom skin trails)
    this.particles.emitContinuousExhaust(this.earthX, this.earthY, hasBoost, this.equippedSkin);

    if (hasBoost) {
      this.particles.emitWarpSpeedLines(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
    }

    // Atmosphere Low Audio Warning Check (< 25%)
    if (this.earthHealth < 25) {
      this.atmosphereWarningCooldown -= dt;
      if (this.atmosphereWarningCooldown <= 0) {
        soundEngine.playAtmosphereWarning();
        this.atmosphereWarningCooldown = 1.4;
      }
    }

    // Update Floating Text Feedback (rise and fade in 0.7s)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 48 * dt;
      ft.life += dt;
      ft.alpha = Math.max(0, 1 - Math.pow(ft.life / ft.maxLife, 1.2));
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Zone Flash timer
    if (this.zoneFlashTimer > 0) {
      this.zoneFlashTimer = Math.max(0, this.zoneFlashTimer - dt);
    }

    // Update Player Physics
    this.updatePlayerPhysics(dt);

    // Update Zone Progression
    this.updateZoneProgression();

    // 2.5D Subsystems
    this.update2D5Platformer(dt);
    this.updateVanguard(dt);
    this.updatePunch(dt);
    this.updateBoss(dt);

    // Spawning
    this.updateSpawners(dt);

    // Update Entities
    this.updateObstacles(dt);
    this.updateOrbs(dt);
    this.updatePowerUpPickups(dt);

    // Collisions
    this.checkCollisions();

    // Distance & Score Increment (Story mode distance pauses during Boss fights)
    const isBossEngaged = this.currentBoss && this.currentBoss.state !== 'defeated';
    const scoreMult = hasBoost ? 3 : 1;
    const distDelta = isBossEngaged ? 0 : (this.gameSpeed * dt) / 10;
    this.stats.distance += distDelta;
    this.stats.score += Math.round((isBossEngaged ? 40 : this.gameSpeed) * dt * 0.1 * scoreMult);
    if (!isBossEngaged) {
      DailyMissionsManager.recordProgress('distance', Math.round(distDelta));
    }

    // Inform UI with active skills, jumps remaining, scrap, shards, boss, and fist mode
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        this.stats,
        this.earthHealth,
        Array.from(this.activePowerUps.values()),
        this.zoneBanner,
        Array.from(this.skills.values()),
        this.jumpsRemaining,
        this.MAX_JUMPS,
        this.isGrounded,
        this.isGroundHazardActive,
        CosmeticsManager.getScrapBalance(),
        StoryProgressionManager.getShards(),
        this.currentBoss,
        this.isFistMode
      );
    }
  }

  private updatePlayerPhysics(dt: number) {
    // Gravity pulls Earth down gently
    this.earthVy += GRAVITY * dt;
    this.earthVy = Math.max(MAX_RISE_SPEED, Math.min(MAX_FALL_SPEED, this.earthVy));
    this.earthY += this.earthVy * dt;

    // Solid collision bounds
    const minY = EARTH_RADIUS + 10;
    const maxY = CANVAS_VIRTUAL_HEIGHT - EARTH_RADIUS - 10;

    // ROOF / CEILING TRAP FIX:
    // If player hits the upper ceiling, immediately cancel upward momentum
    // and push downward so they drop smoothly back into the flight corridor!
    if (this.earthY <= minY) {
      this.earthY = minY;
      this.earthVy = 160; // Downward gravity impulse
      this.particles.emitExplosionBurst(this.earthX, minY, this.equippedSkin, '#38bdf8');
    }

    // 2.5D Platform Collision & Landing Detection
    let landedOnPlatform = false;
    for (const p of this.platforms) {
      if (p.isFallen) continue;
      const feetY = this.earthY + EARTH_RADIUS;
      const isOver = this.earthX >= p.x - 25 && this.earthX <= p.x + p.width + 25;
      if (isOver && feetY >= p.y - 8 && feetY <= p.y + 24 && this.earthVy >= 0) {
        this.earthY = p.y - EARTH_RADIUS;
        this.earthVy = 0;
        this.isGrounded = true;
        this.jumpCount = 0; // JUMP REFILL ON PLATFORM LANDING!
        landedOnPlatform = true;

        if (p.hasSpring) {
          this.earthVy = -640;
          soundEngine.playJump();
          this.particles.emitEmpBlast(this.earthX, p.y);
          this.addFloatingText('SPRING BOUNCE!', this.earthX, p.y - 30, '#22c55e');
        }

        if (p.isCrumbling) {
          p.crumbleTimer = (p.crumbleTimer ?? 0.8) - dt;
          if (p.crumbleTimer <= 0) {
            p.isFallen = true;
            this.particles.emitExplosion(p.x + p.width / 2, p.y, '#f59e0b', 20);
          }
        }
        break;
      }
    }

    if (landedOnPlatform) {
      this.groundContactTimer = 0;
      this.isGroundHazardActive = false;
    }

    // GROUND CONTACT & ANTI-CHEATING FLOOR HAZARD:
    const isTouchingFloor = this.earthY >= maxY - 3;
    if (isTouchingFloor) {
      this.isGrounded = true;
      this.earthY = maxY;
      this.earthVy = 0;
      // JUMP COUNTER RESETS ONLY WHEN EARTH LANDS / TOUCHES THE GROUND OR PLATFORMS:
      this.jumpCount = 0;

      // GROUND HUGGING ANTI-CHEAT:
      // If player rides the floor without jumping for > 1.1s, friction burn damages Earth
      this.groundContactTimer += dt;
      if (this.groundContactTimer > 1.1) {
        this.isGroundHazardActive = true;
        this.earthHealth -= 14 * dt;
        this.particles.emitGroundSparks(this.earthX, maxY);

        this.groundWarningSfxCooldown -= dt;
        if (this.groundWarningSfxCooldown <= 0) {
          soundEngine.playGroundWarning();
          this.groundWarningSfxCooldown = 0.45;
        }

        if (this.earthHealth <= 0) {
          this.earthHealth = 0;
          this.triggerGameOver();
        }
      } else {
        this.isGroundHazardActive = false;
      }
    } else if (!landedOnPlatform) {
      // In mid-air, reset ground contact timer and hazard (jumps do NOT refill in air)
      this.isGrounded = false;
      this.groundContactTimer = 0;
      this.isGroundHazardActive = false;
    }

    // Animate running stride when grounded
    if (this.isGrounded) {
      this.runPhase += dt * (this.gameSpeed / 25);
    }

    // Invincibility timer
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
      this.isHitFlash = Math.sin(this.invincibilityTimer * 30) > 0;
    } else {
      this.isHitFlash = false;
    }
  }

  private updateZoneProgression() {
    const dist = this.stats.distance;
    let newZone: ZoneId = 'solar_system';

    if (dist >= ZONES.unknown_universe.minDistance) {
      newZone = 'unknown_universe';
    } else if (dist >= ZONES.frozen_space.minDistance) {
      newZone = 'frozen_space';
    } else if (dist >= ZONES.dark_nebula.minDistance) {
      newZone = 'dark_nebula';
    } else if (dist >= ZONES.asteroid_belt.minDistance) {
      newZone = 'asteroid_belt';
    }

    if (newZone !== this.stats.zone) {
      this.stats.zone = newZone;
      this.zoneFlashTimer = 1.0;
      this.zoneBanner = ZONES[newZone].name;
      this.zoneBannerTimer = 3.5;
      soundEngine.playZoneWarp();
    }
  }

  // ---------------------------------------------------------------------------
  // 2.5D PLATFORMS, STRUCTURES, CHECKPOINTS & BOSS ENCOUNTER LOGIC
  // ---------------------------------------------------------------------------
  private update2D5Platformer(dt: number) {
    const scrollSpeed = (this.currentBoss && this.currentBoss.state !== 'defeated') ? 0 : this.gameSpeed;

    // Scroll platforms & moving platform logic
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.x -= scrollSpeed * dt;

      if (p.isMoving && p.baseY) {
        p.y = p.baseY + Math.sin(this.timeAlive * (p.moveSpeed || 1.5)) * (p.moveRange || 50);
      }

      if (p.x + p.width < -120) {
        this.platforms.splice(i, 1);
      }
    }

    // Scroll structures & check Checkpoint Beacon activation
    for (let i = this.structures.length - 1; i >= 0; i--) {
      const s = this.structures[i];
      s.x -= scrollSpeed * dt;

      if (s.type === 'checkpoint_beacon' && !s.isActive) {
        if (Math.abs(this.earthX - s.x) < 80) {
          s.isActive = true;
          this.activeCheckpoint = {
            chapter: this.currentChapter,
            distance: Math.round(this.stats.distance),
            health: Math.round(this.earthHealth),
            shards: this.shardsCollectedThisRun,
            timestamp: Date.now(),
          };
          StoryProgressionManager.saveCheckpoint(this.activeCheckpoint);
          this.particles.emitEmpBlast(s.x, s.y);
          this.addFloatingText('★ CHECKPOINT ACTIVATED! ★', this.earthX, this.earthY - 65, '#38bdf8', 1.3);
          soundEngine.playRewardClaim();
        }
      }

      if (s.x < -150) {
        this.structures.splice(i, 1);
      }
    }

    // Scroll NPCs
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      npc.x -= scrollSpeed * dt;
      if (npc.x < -150) {
        this.npcs.splice(i, 1);
      }
    }

    // Maintain procedural platforms ahead
    this.platformSpawnX -= scrollSpeed * dt;
    if (this.platformSpawnX < CANVAS_VIRTUAL_WIDTH + 400) {
      this.generatePlatformsAhead(CANVAS_VIRTUAL_WIDTH * 2.2);
    }

    // Story Mode Boss Encounter Trigger
    if (this.mode === 'STORY_MODE' && !this.currentBoss) {
      const chConfig = CHAPTERS[this.currentChapter];
      if (chConfig) {
        if (this.stats.distance >= chConfig.mainBossDistance) {
          this.spawnBoss(this.currentChapter, false);
        } else if (this.stats.distance >= chConfig.miniBossDistance && this.stats.distance < chConfig.miniBossDistance + 200) {
          this.spawnBoss(this.currentChapter, true);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // VANGUARD ESCORT SHIPS (Auto-fire lasers)
  // ---------------------------------------------------------------------------
  private updateVanguard(dt: number) {
    const fireInterval = 0.55 / StoryProgressionManager.getVanguardFireRateMultiplier();
    this.vanguardFireCooldown -= dt;

    if (this.vanguardFireCooldown <= 0) {
      this.vanguardFireCooldown = fireInterval;
      // Spawn two laser bolts from escort ships
      const vX = this.earthX - 10;
      this.vanguardLasers.push({
        id: `las_${Date.now()}_1`,
        x: vX,
        y: this.earthY - 48,
        vx: 1200,
        vy: 0,
        damage: 35,
        life: 1.0,
      });
      this.vanguardLasers.push({
        id: `las_${Date.now()}_2`,
        x: vX - 10,
        y: this.earthY + 38,
        vx: 1200,
        vy: 0,
        damage: 35,
        life: 1.0,
      });
    }

    // Update lasers
    for (let i = this.vanguardLasers.length - 1; i >= 0; i--) {
      const l = this.vanguardLasers[i];
      l.x += l.vx * dt;
      l.life -= dt;

      // Hit Obstacles
      let hit = false;
      for (let j = this.obstacles.length - 1; j >= 0; j--) {
        const obs = this.obstacles[j];
        if (Math.hypot(l.x - obs.x, l.y - obs.y) < obs.radius + 15) {
          this.particles.emitExplosion(obs.x, obs.y, '#38bdf8', 16);
          this.obstacles.splice(j, 1);
          this.stats.score += 150;
          this.stats.obstaclesDodged++;
          hit = true;
          break;
        }
      }

      // Hit Boss
      if (!hit && this.currentBoss && this.currentBoss.state !== 'defeated') {
        const b = this.currentBoss;
        if (Math.hypot(l.x - b.x, l.y - b.y) < b.width / 2 + 10) {
          b.health -= l.damage;
          this.particles.emitExplosion(l.x, l.y, '#38bdf8', 12);
          hit = true;
          if (b.health <= 0) {
            this.defeatBoss();
          }
        }
      }

      if (hit || l.life <= 0 || l.x > CANVAS_VIRTUAL_WIDTH + 60) {
        this.vanguardLasers.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PUNCH TIMER
  // ---------------------------------------------------------------------------
  private updatePunch(dt: number) {
    if (this.punch) {
      this.punch.timer -= dt;
      if (this.punch.timer <= 0) {
        this.punch = null;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ELEMENTAL BOSS BATTLE AI & SPAWNING
  // ---------------------------------------------------------------------------
  public spawnBoss(chapter: ChapterId, isMini: boolean) {
    const ch = CHAPTERS[chapter];
    const name = isMini ? ch.miniBossName : ch.mainBossName;
    const maxHP = isMini ? 450 : 1000;

    this.currentBoss = {
      id: `boss_${chapter}_${isMini ? 'mini' : 'main'}`,
      name,
      title: isMini ? 'Mini-Boss Guardian' : `${ch.element} World Behemoth`,
      chapter,
      isMiniBoss: isMini,
      health: maxHP,
      maxHealth: maxHP,
      x: CANVAS_VIRTUAL_WIDTH - 180,
      y: CANVAS_VIRTUAL_HEIGHT / 2,
      targetY: CANVAS_VIRTUAL_HEIGHT / 2,
      width: isMini ? 120 : 180,
      height: isMini ? 120 : 180,
      element: ch.element,
      state: 'intro',
      attackTimer: 2.0,
      attackPattern: 1,
      activeAttackName: 'Elemental Strike',
    };

    this.triggerScreenShake(0.6);
    this.addFloatingText(`⚠ WARNING: ${name.toUpperCase()} APPROACHES! ⚠`, CANVAS_VIRTUAL_WIDTH / 2, 140, '#ef4444', 1.4);
    soundEngine.playAtmosphereWarning();
  }

  private updateBoss(dt: number) {
    if (!this.currentBoss || this.currentBoss.state === 'defeated') return;
    const b = this.currentBoss;

    // Smooth hover tracking
    b.targetY = this.earthY + Math.sin(this.timeAlive * 2) * 80;
    b.y += (b.targetY - b.y) * 2.0 * dt;
    b.y = Math.max(120, Math.min(CANVAS_VIRTUAL_HEIGHT - 120, b.y));

    // Boss Attack Timer
    b.attackTimer -= dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = b.isMiniBoss ? 2.6 : 2.0;
      b.attackPattern = (b.attackPattern % 3) + 1;

      // Boss fires elemental projectiles
      const pColor = b.chapter === 2 ? '#38bdf8' : b.chapter === 3 ? '#ef4444' : b.chapter === 4 ? '#c084fc' : '#f59e0b';
      this.obstacles.push({
        id: `boss_proj_${Date.now()}`,
        type: 'VOID_CRYSTAL',
        x: b.x - 30,
        y: b.y + (Math.random() - 0.5) * 60,
        width: 32,
        height: 32,
        radius: 16,
        vx: -380,
        vy: (Math.random() - 0.5) * 80,
        rotation: 0,
        rotationSpeed: 3,
        color: pColor,
        glowColor: pColor,
      });

      this.particles.emitEmpBlast(b.x, b.y);
      this.triggerScreenShake(0.25);
    }
  }

  public defeatBoss() {
    if (!this.currentBoss) return;
    const b = this.currentBoss;
    b.state = 'defeated';

    this.particles.emitExplosion(b.x, b.y, '#fbbf24', 60);
    this.triggerScreenShake(0.8);
    soundEngine.playNewBest();

    // Reward Cosmic Shards
    const shardsGained = b.isMiniBoss ? 15 : 30;
    StoryProgressionManager.addShards(shardsGained);
    this.shardsCollectedThisRun += shardsGained;
    this.addFloatingText(`★ ${b.name} DEFEATED! +${shardsGained} SHARDS ★`, CANVAS_VIRTUAL_WIDTH / 2, 160, '#fbbf24', 1.5);

    // If Chapter Boss defeated, advance chapter
    if (!b.isMiniBoss && this.mode === 'STORY_MODE') {
      if (this.currentChapter < 6) {
        this.currentChapter = (this.currentChapter + 1) as ChapterId;
        this.addFloatingText(`UNLOCKED CHAPTER ${this.currentChapter}!`, CANVAS_VIRTUAL_WIDTH / 2, 220, '#38bdf8', 1.4);
      } else {
        this.addFloatingText(`★ CONGRATULATIONS! STORY COMPLETED! ★`, CANVAS_VIRTUAL_WIDTH / 2, 220, '#22c55e', 1.6);
      }
    }

    setTimeout(() => {
      this.currentBoss = null;
    }, 1500);
  }

  private updatePowerUps(dt: number) {
    for (const [type, active] of this.activePowerUps.entries()) {
      active.durationRemaining -= dt;
      if (active.durationRemaining <= 0) {
        this.activePowerUps.delete(type);
      }
    }
  }

  public hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  private updateSpawners(dt: number) {
    const zoneConfig = ZONES[this.stats.zone];
    const mult = zoneConfig.obstacleMultipliers;

    // Obstacle spawner
    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer <= 0) {
      this.spawnObstacle();
      // Next spawn time varies fairly with speed and zone density
      this.obstacleSpawnTimer = (1.4 + Math.random() * 1.2) / mult.density;
    }

    // Energy orb spawner
    this.orbSpawnTimer -= dt;
    if (this.orbSpawnTimer <= 0) {
      this.spawnOrbWave();
      this.orbSpawnTimer = 1.2 + Math.random() * 1.5;
    }

    // Power-up spawner (every 14-22 seconds)
    this.powerUpSpawnTimer -= dt;
    if (this.powerUpSpawnTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 16 + Math.random() * 10;
    }
  }

  private spawnObstacle() {
    const zone = this.stats.zone;
    const varietyPool: ObstacleType[] = ['SMALL_ASTEROID'];

    if (zone === 'solar_system') {
      varietyPool.push('SMALL_ASTEROID', 'SPACE_DEBRIS', 'COMET', 'SOLAR_FLARE');
    } else if (zone === 'asteroid_belt') {
      varietyPool.push('SMALL_ASTEROID', 'GIANT_ASTEROID', 'METEOR_SHOWER', 'SPACE_DEBRIS', 'ALIEN_MINE');
    } else if (zone === 'dark_nebula') {
      varietyPool.push('COSMIC_STORM', 'GIANT_ASTEROID', 'ENERGY_BARRIER', 'METEOR_SHOWER', 'VOID_CRYSTAL', 'COSMIC_LEVIATHAN', 'COLOSSAL_GUARDIAN');
    } else if (zone === 'frozen_space') {
      varietyPool.push('COMET', 'GIANT_ASTEROID', 'ENERGY_BARRIER', 'METEOR_SHOWER', 'VOID_CRYSTAL', 'PULSAR_STAR', 'COLOSSAL_GUARDIAN');
    } else {
      varietyPool.push(
        'GRAVITATIONAL_ANOMALY',
        'COSMIC_STORM',
        'GIANT_ASTEROID',
        'METEOR_SHOWER',
        'PULSAR_STAR',
        'ANTIMATTER_VORTEX',
        'COSMIC_LEVIATHAN',
        'COLOSSAL_GUARDIAN'
      );
    }

    const type = varietyPool[Math.floor(Math.random() * varietyPool.length)];
    const id = `obs_${Date.now()}_${Math.random()}`;

    const spawnX = CANVAS_VIRTUAL_WIDTH + 80;
    const spawnY = 80 + Math.random() * (CANVAS_VIRTUAL_HEIGHT - 160);

    let obs: Obstacle;

    if (type === 'SMALL_ASTEROID') {
      const radius = 18 + Math.random() * 14;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * (1.05 + Math.random() * 0.25)),
        vy: (Math.random() - 0.5) * 60,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3,
        color: '#78716c',
        points: this.generateAsteroidPolygon(radius, 8),
      };
    } else if (type === 'GIANT_ASTEROID') {
      const radius = 55 + Math.random() * 25;
      obs = {
        id,
        type,
        x: spawnX + 40,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.75),
        vy: (Math.random() - 0.5) * 30,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.8,
        color: '#44403c',
        points: this.generateAsteroidPolygon(radius, 12),
      };
    } else if (type === 'METEOR_SHOWER') {
      const radius = 16 + Math.random() * 10;
      obs = {
        id,
        type,
        x: spawnX + 180,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 1.9),
        vy: 0,
        rotation: 0,
        rotationSpeed: 0,
        color: '#ef4444',
        isTelegraphing: true,
        telegraphTimer: 1.0, // 1 sec warning laser
      };
    } else if (type === 'COMET') {
      const radius = 22 + Math.random() * 12;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 1.4),
        vy: (Math.random() - 0.5) * 80,
        rotation: 0,
        rotationSpeed: 0,
        color: '#22d3ee',
      };
    } else if (type === 'SPACE_DEBRIS') {
      const radius = 24 + Math.random() * 14;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.9),
        vy: (Math.random() - 0.5) * 50,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 2,
        color: '#64748b',
      };
    } else if (type === 'ENERGY_BARRIER') {
      const barrierH = 140 + Math.random() * 80;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: 24,
        height: barrierH,
        radius: 20,
        vx: -(this.gameSpeed * 0.85),
        vy: (Math.random() - 0.5) * 40,
        rotation: 0,
        rotationSpeed: 0,
        color: '#38bdf8',
      };
    } else if (type === 'COSMIC_STORM') {
      const radius = 45 + Math.random() * 20;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.95),
        vy: (Math.random() - 0.5) * 70,
        rotation: 0,
        rotationSpeed: 1.5,
        color: '#a855f7',
      };
    } else if (type === 'SOLAR_FLARE') {
      const radius = 38 + Math.random() * 16;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 1.15),
        vy: (Math.random() - 0.5) * 40,
        rotation: 0,
        rotationSpeed: 0.6,
        color: '#f97316',
      };
    } else if (type === 'VOID_CRYSTAL') {
      const radius = 28 + Math.random() * 12;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 1.0),
        vy: (Math.random() - 0.5) * 50,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 2.5,
        color: '#9333ea',
        points: this.generateAsteroidPolygon(radius, 6),
      };
    } else if (type === 'PULSAR_STAR') {
      const radius = 24 + Math.random() * 8;
      obs = {
        id,
        type,
        x: spawnX + 60,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.75),
        vy: (Math.random() - 0.5) * 30,
        rotation: 0,
        rotationSpeed: 0,
        color: '#38bdf8',
        customData: { beamAngle: Math.random() * Math.PI * 2 },
      };
    } else if (type === 'ALIEN_MINE') {
      const radius = 20 + Math.random() * 8;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.85),
        vy: (Math.random() - 0.5) * 25,
        rotation: 0,
        rotationSpeed: 1.2,
        color: '#ef4444',
      };
    } else if (type === 'COSMIC_LEVIATHAN') {
      const radius = 40 + Math.random() * 16;
      obs = {
        id,
        type,
        x: spawnX + 40,
        y: spawnY,
        width: radius * 2.5,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.8),
        vy: (Math.random() - 0.5) * 45,
        rotation: 0,
        rotationSpeed: 0,
        color: '#14b8a6',
      };
    } else if (type === 'COLOSSAL_GUARDIAN') {
      const radius = 48 + Math.random() * 12;
      obs = {
        id,
        type,
        x: spawnX + 60,
        y: spawnY,
        width: radius * 2.8,
        height: radius * 2.6,
        radius,
        vx: -(this.gameSpeed * 0.7),
        vy: (Math.random() - 0.5) * 30,
        rotation: 0,
        rotationSpeed: 0,
        color: '#e2e8f0',
        glowColor: '#38bdf8',
      };
    } else if (type === 'ANTIMATTER_VORTEX') {
      const radius = 36 + Math.random() * 14;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.85),
        vy: (Math.random() - 0.5) * 40,
        rotation: 0,
        rotationSpeed: 2.5,
        color: '#ec4899',
      };
    } else {
      // GRAVITATIONAL_ANOMALY
      const radius = 35 + Math.random() * 15;
      obs = {
        id,
        type,
        x: spawnX,
        y: spawnY,
        width: radius * 2,
        height: radius * 2,
        radius,
        vx: -(this.gameSpeed * 0.8),
        vy: 0,
        rotation: 0,
        rotationSpeed: 2,
        color: '#f43f5e',
      };
    }

    this.obstacles.push(obs);
  }

  private generateAsteroidPolygon(baseRadius: number, numVertices: number) {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numVertices; i++) {
      const angle = (i * Math.PI * 2) / numVertices;
      const variation = 0.75 + Math.random() * 0.45;
      const r = baseRadius * variation;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return points;
  }

  private spawnOrbWave() {
    const count = 3 + Math.floor(Math.random() * 5);
    const startX = CANVAS_VIRTUAL_WIDTH + 60;
    const startY = 120 + Math.random() * (CANVAS_VIRTUAL_HEIGHT - 240);
    const waveType = Math.random() > 0.5 ? 'sine' : 'line';

    for (let i = 0; i < count; i++) {
      const x = startX + i * 45;
      const y = waveType === 'sine' ? startY + Math.sin(i * 0.8) * 60 : startY + (i - count / 2) * 15;

      this.orbs.push({
        id: `orb_${Date.now()}_${i}`,
        x,
        y: Math.max(60, Math.min(CANVAS_VIRTUAL_HEIGHT - 60, y)),
        radius: 12,
        value: 100,
        glowColor: '#38bdf8',
        pulseTimer: i * 0.3,
        baseY: y,
        floatOffset: 0,
      });
    }
  }

  private spawnPowerUp() {
    const types: PowerUpType[] = ['SHIELD', 'ENERGY', 'TIME_CONTROL', 'COSMIC_BOOST', 'MAGNET'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWER_UP_CONFIG[type];

    this.powerUpItems.push({
      id: `pw_${Date.now()}`,
      type,
      x: CANVAS_VIRTUAL_WIDTH + 80,
      y: 120 + Math.random() * (CANVAS_VIRTUAL_HEIGHT - 240),
      radius: 20,
      vx: -(this.gameSpeed * 0.75),
      vy: (Math.random() - 0.5) * 30,
      angle: 0,
      glowColor: config.glowColor,
      duration: config.duration,
    });
  }

  private updateObstacles(dt: number) {
    const timeScale = this.hasPowerUp('TIME_CONTROL') ? 0.55 : 1.0;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Handle telegraph for meteors
      if (obs.isTelegraphing && obs.telegraphTimer !== undefined) {
        obs.telegraphTimer -= dt;
        if (obs.telegraphTimer <= 0) {
          obs.isTelegraphing = false;
        }
        continue;
      }

      obs.x += obs.vx * dt * timeScale;
      obs.y += obs.vy * dt * timeScale;
      obs.rotation += obs.rotationSpeed * dt * timeScale;

      // Comet trail emission
      if (obs.type === 'COMET') {
        this.particles.emitCometTrail(obs.x + obs.radius, obs.y, 0, Math.abs(obs.vx));
      }

      // Pulsar sweeping beam rotation
      if (obs.type === 'PULSAR_STAR') {
        obs.customData = obs.customData || {};
        obs.customData.beamAngle = (obs.customData.beamAngle || 0) + dt * 2.8;
      }

      // Alien Proximity Mine homing acceleration
      if (obs.type === 'ALIEN_MINE') {
        const dx = this.earthX - obs.x;
        const dy = this.earthY - obs.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 280) {
          obs.vx += (dx / dist) * 140 * dt;
          obs.vy += (dy / dist) * 140 * dt;
        }
      }

      // Solar flare turbulence
      if (obs.type === 'SOLAR_FLARE') {
        obs.y += Math.sin(this.timeAlive * 4 + obs.x * 0.02) * 35 * dt;
      }

      // Cosmic Leviathan undulating swim
      if (obs.type === 'COSMIC_LEVIATHAN') {
        obs.y += Math.sin(this.timeAlive * 3 + obs.x * 0.01) * 50 * dt;
      }

      // Gravitational anomaly and Antimatter vortex pull effect on Earth
      if (obs.type === 'GRAVITATIONAL_ANOMALY' || obs.type === 'ANTIMATTER_VORTEX') {
        const dx = obs.x - this.earthX;
        const dy = obs.y - this.earthY;
        const dist = Math.hypot(dx, dy);
        if (dist < 260 && dist > 20) {
          const force = (1 - dist / 260) * (obs.type === 'ANTIMATTER_VORTEX' ? 120 : 160);
          this.earthVy += (dy / dist) * force * dt;
        }
      }

      // Check if dodged past player
      if (obs.x + obs.radius < this.earthX && !obs.customData?.dodged) {
        obs.customData = { ...obs.customData, dodged: true };
        this.stats.obstaclesDodged++;
        this.stats.currentCombo++;
        if (this.stats.currentCombo > this.stats.maxCombo) {
          this.stats.maxCombo = this.stats.currentCombo;
        }
        DailyMissionsManager.recordProgress('dodge', 1);
        DailyMissionsManager.recordProgress('combo', this.stats.currentCombo);
      }

      // Remove off-screen
      if (obs.x < -obs.width - 100) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateOrbs(dt: number) {
    const isMagnetized = this.hasPowerUp('MAGNET');

    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.x -= this.gameSpeed * dt;

      // Constant subtle shimmer/sparkle particles for collectible orbs
      if (Math.random() < 0.35) {
        this.particles.emitCollectibleShimmer(orb.x, orb.y);
      }

      // Magnet attraction
      if (isMagnetized) {
        const dx = this.earthX - orb.x;
        const dy = this.earthY - orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 380) {
          const pullSpeed = 420;
          orb.x += (dx / dist) * pullSpeed * dt;
          orb.y += (dy / dist) * pullSpeed * dt;
        }
      }

      // Collect check
      const distToEarth = Math.hypot(this.earthX - orb.x, this.earthY - orb.y);
      if (distToEarth < EARTH_RADIUS + orb.radius) {
        // Collected!
        this.stats.energyCollected++;
        const mult = this.hasPowerUp('COSMIC_BOOST') ? 3 : 1;
        const pointsEarned = orb.value * mult;
        this.stats.score += pointsEarned;
        DailyMissionsManager.recordProgress('energy', 1);

        // 40% reduced coin drops in gameplay (60% chance to award scrap)
        const scrapGain = Math.random() < 0.6 ? 1 : 0;
        if (scrapGain > 0) {
          CosmeticsManager.addScrap(scrapGain);
          this.scrapCollectedThisRun += scrapGain;
        }

        soundEngine.playEnergyCollect();
        this.particles.emitCollectSparkle(orb.x, orb.y, '#38bdf8', 16);
        this.addFloatingText(`+${pointsEarned}`, orb.x, orb.y - 12, '#38bdf8', 0.7);
        this.orbs.splice(i, 1);
        continue;
      }

      // Remove offscreen
      if (orb.x < -40) {
        this.orbs.splice(i, 1);
      }
    }
  }

  private updatePowerUpPickups(dt: number) {
    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const p = this.powerUpItems[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Collect check
      const dist = Math.hypot(this.earthX - p.x, this.earthY - p.y);
      if (dist < EARTH_RADIUS + p.radius) {
        this.activatePowerUp(p.type, p.duration);
        this.particles.emitCollectSparkle(p.x, p.y, p.glowColor, 20);
        this.powerUpItems.splice(i, 1);
        continue;
      }

      if (p.x < -60) {
        this.powerUpItems.splice(i, 1);
      }
    }
  }

  private activatePowerUp(type: PowerUpType, duration: number) {
    if (type === 'ENERGY') {
      this.earthHealth = Math.min(MAX_HEALTH, this.earthHealth + 30);
      this.addFloatingText('+ ATMOSPHERE', this.earthX, this.earthY - 30, '#4ade80', 1.0);
      soundEngine.playHeal();
      return;
    }

    if (type === 'SHIELD') {
      soundEngine.playShieldActivate();
    } else if (type === 'TIME_CONTROL') {
      soundEngine.playTimeWarp();
    } else if (type === 'COSMIC_BOOST') {
      soundEngine.playCosmicBoost();
    } else if (type === 'MAGNET') {
      soundEngine.playShieldActivate();
    }

    this.activePowerUps.set(type, {
      type,
      durationRemaining: duration,
      maxDuration: duration,
    });
  }

  private checkCollisions() {
    if (this.invincibilityTimer > 0 || this.isPhasingActive()) return;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.isTelegraphing) continue;

      let collided = false;

      if (obs.type === 'ENERGY_BARRIER') {
        // Fair hitbox: Reduced Earth hitbox by 15% and obstacle width/height by 10%
        const withinX = Math.abs(this.earthX - obs.x) < EARTH_RADIUS * 0.72 + 8;
        const withinY = Math.abs(this.earthY - obs.y) < (obs.height / 2) * 0.76 + EARTH_RADIUS * 0.6;
        collided = withinX && withinY;
      } else {
        // Fair hitbox: 15% smaller Earth hitbox (0.72), 10% smaller asteroid hitbox (0.76)
        const dist = Math.hypot(this.earthX - obs.x, this.earthY - obs.y);
        collided = dist < (EARTH_RADIUS * 0.72) + (obs.radius * 0.76);
      }

      if (collided) {
        this.handlePlayerCollision(obs, i);
        break;
      }
    }
  }

  private handlePlayerCollision(obs: Obstacle, obsIndex: number) {
    // 1. If Cosmic Boost is active, smash through obstacle!
    if (this.hasPowerUp('COSMIC_BOOST')) {
      this.particles.emitExplosion(obs.x, obs.y, '#f59e0b', 30);
      soundEngine.playCollision();
      this.obstacles.splice(obsIndex, 1);
      this.stats.score += 350;
      return;
    }

    // 2. If Shield is active, absorb hit completely!
    if (this.hasPowerUp('SHIELD')) {
      this.activePowerUps.delete('SHIELD');
      this.invincibilityTimer = 1.0;
      this.triggerScreenShake(0.4);
      this.particles.emitExplosion(obs.x, obs.y, '#38bdf8', 25);
      soundEngine.playShieldDeflect();
      this.obstacles.splice(obsIndex, 1);
      return;
    }

    // 3. Normal Collision Damage: 25-30 orange/red/white particles burst outward + 0.25s screen shake + brief flash
    const damage = obs.type === 'GIANT_ASTEROID' || obs.type === 'COLOSSAL_GUARDIAN' ? 40 : obs.type === 'ANTIMATTER_VORTEX' || obs.type === 'COSMIC_LEVIATHAN' ? 35 : 25;
    this.earthHealth = Math.max(0, this.earthHealth - damage);
    this.stats.currentCombo = 0; // Reset combo

    this.triggerScreenShake(0.65);
    this.hitstopTimer = 0.04; // 40ms hitstop
    this.invincibilityTimer = 1.4; // 1.4s invincibility frames
    this.particles.emitExplosionBurst(this.earthX, this.earthY, this.equippedSkin, '#ef4444');
    soundEngine.playCollision();

    if (obs.type !== 'GIANT_ASTEROID' && obs.type !== 'ENERGY_BARRIER' && obs.type !== 'COSMIC_LEVIATHAN' && obs.type !== 'COLOSSAL_GUARDIAN') {
      this.obstacles.splice(obsIndex, 1);
    }

    // Check Game Over
    if (this.earthHealth <= 0) {
      this.triggerGameOver();
    }
  }

  public triggerScreenShake(intensity: number) {
    if (!this.screenShakeEnabled) return;
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + intensity);
  }

  private render() {
    this.ctx.save();

    // Screen Shake Transform
    if (this.shakeTrauma > 0 && this.screenShakeEnabled) {
      const shakeAmt = this.shakeTrauma * this.shakeTrauma * 16;
      const ox = (Math.random() - 0.5) * shakeAmt;
      const oy = (Math.random() - 0.5) * shakeAmt;
      this.ctx.translate(ox, oy);
    }

    // Clear
    this.ctx.clearRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

    // 1. Render Background Space, Nebulae & Parallax with Active Theme
    this.spaceRenderer.render(
      this.ctx,
      this.stats.distance,
      this.stats.zone,
      this.timeAlive,
      this.equippedTheme
    );

    // 2. Render Orbs & Power-up Pickups
    for (const orb of this.orbs) {
      renderCosmicOrb(this.ctx, orb, this.timeAlive);
    }
    for (const p of this.powerUpItems) {
      renderPowerUp(this.ctx, p, this.timeAlive);
    }

    // 3. Render Obstacles with Active Theme
    for (const obs of this.obstacles) {
      renderObstacle(this.ctx, obs, this.timeAlive, this.equippedTheme);
    }

    // 4. Render Particle Effects
    this.particles.render(this.ctx);

    // 2.5D Step A: Render Multi-Tier 3D Floating Platforms
    PlatformerRenderer.renderPlatforms(this.ctx, this.platforms);

    // 2.5D Step B: Render 3D Architectural Structures (Villages, Ancient Khandhar Ruins, Beacons)
    PlatformerRenderer.renderStructures(this.ctx, this.structures, this.timeAlive);

    // 2.5D Step C: Render 3D Cosmic NPCs
    PlatformerRenderer.renderNpcs(this.ctx, this.npcs, this.timeAlive, this.earthX);

    // 2.5D Step D: Render Active Elemental Chapter Boss or Mini-Boss
    if (this.currentBoss) {
      PlatformerRenderer.renderBoss(this.ctx, this.currentBoss, this.timeAlive);
    }

    // 2.5D Step E: Render Escort Vanguard Spaceship Lasers
    PlatformerRenderer.renderVanguardLasers(this.ctx, this.vanguardLasers);

    // 2.5D Step F: Render 3D Colossal Mecha-Titan Guardian + Earth (Hands / Solar Back-Holder)
    PlatformerRenderer.renderGuardianAndEarth(
      this.ctx,
      this.earthX,
      this.earthY,
      this.isFistMode,
      !this.isGrounded,
      this.runPhase,
      this.punch,
      this.equippedSkin,
      this.timeAlive,
      this.hasPowerUp('SHIELD')
    );

    // 6. Floor Anti-Cheat / Ground Hazard Warning Line
    const floorY = CANVAS_VIRTUAL_HEIGHT - 6;
    if (this.isGroundHazardActive || this.groundContactTimer > 0.5) {
      this.ctx.save();
      const flash = Math.sin(this.timeAlive * 20) > 0;
      this.ctx.fillStyle = flash ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.15)';
      this.ctx.fillRect(0, floorY - 24, CANVAS_VIRTUAL_WIDTH, 30);

      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, floorY);
      this.ctx.lineTo(CANVAS_VIRTUAL_WIDTH, floorY);
      this.ctx.stroke();

      if (this.isGroundHazardActive) {
        this.ctx.font = 'bold 12px var(--font-mono)';
        this.ctx.fillStyle = '#fca5a5';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠ SURFACE FRICTION CRITICAL - JUMP TO ASCEND! ⚠', CANVAS_VIRTUAL_WIDTH / 2, floorY - 8);
      }
      this.ctx.restore();
    }

    // 7. Time Control / Chrono Warp Screen Filter
    if (this.hasPowerUp('TIME_CONTROL')) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      this.ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
      this.ctx.restore();
    }

    // 8. Render Floating Feedback Texts (+50, + ATMOSPHERE)
    if (this.floatingTexts.length > 0) {
      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      for (const ft of this.floatingTexts) {
        this.ctx.globalAlpha = ft.alpha;
        this.ctx.font = '900 16px var(--font-display, sans-serif)';
        this.ctx.fillStyle = ft.color;
        this.ctx.shadowColor = ft.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(ft.text, ft.x, ft.y);
      }
      this.ctx.restore();
    }

    // 9. Zone Announcement Banner overlay (if active)
    if (this.zoneBanner && this.zoneBannerTimer > 0) {
      this.renderZoneBanner(this.ctx, this.zoneBanner, this.zoneBannerTimer);
    }

    // 10. Zone Transition 1-sec White Flash
    if (this.zoneFlashTimer > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, this.zoneFlashTimer)})`;
      this.ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  private renderZoneBanner(ctx: CanvasRenderingContext2D, bannerText: string, timer: number) {
    ctx.save();
    const alpha = Math.min(1, timer, (3.5 - timer) * 2);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, CANVAS_VIRTUAL_HEIGHT * 0.20, CANVAS_VIRTUAL_WIDTH, 84);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_VIRTUAL_HEIGHT * 0.20);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT * 0.20);
    ctx.moveTo(0, CANVAS_VIRTUAL_HEIGHT * 0.20 + 84);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT * 0.20 + 84);
    ctx.stroke();

    // Main Banner: NEW ZONE - [Zone Name]
    ctx.font = '900 24px var(--font-display, sans-serif)';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`NEW ZONE — ${bannerText.toUpperCase()}`, CANVAS_VIRTUAL_WIDTH / 2, CANVAS_VIRTUAL_HEIGHT * 0.20 + 30);

    // Subtitle: NEW ENEMIES AHEAD
    ctx.font = '700 13px var(--font-mono, monospace)';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('⚡ NEW ENEMIES AHEAD — STAY ALERT ⚡', CANVAS_VIRTUAL_WIDTH / 2, CANVAS_VIRTUAL_HEIGHT * 0.20 + 58);

    ctx.restore();
  }

  // HIGH SCORES & STORAGE
  public getHighScores(): HighScoreRecord[] {
    try {
      const data = localStorage.getItem(HIGH_SCORE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return [];
  }

  public getBestScore(): number {
    const list = this.getHighScores();
    return list.length > 0 ? list[0].score : 0;
  }

  private saveHighScore() {
    try {
      const list = this.getHighScores();
      const currentRecord: HighScoreRecord = {
        score: this.stats.score,
        distance: Math.round(this.stats.distance),
        energy: this.stats.energyCollected,
        zone: ZONES[this.stats.zone].name,
        date: new Date().toLocaleDateString(),
      };

      list.push(currentRecord);
      list.sort((a, b) => b.score - a.score);
      const top5 = list.slice(0, 5);
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(top5));
    } catch (e) {}
  }

  public clearHighScores() {
    try {
      localStorage.removeItem(HIGH_SCORE_KEY);
    } catch (e) {}
  }
}
