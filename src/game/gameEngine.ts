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
  CosmicEnergyOrb,
  GameState,
  HighScoreRecord,
  Obstacle,
  ObstacleType,
  PlayerStats,
  PowerUpItem,
  PowerUpType,
  SkillType,
  ZoneId,
} from './types';
import { soundEngine } from './audio';
import { renderEarth } from './earthRenderer';
import { ParticleSystem } from './particleSystem';
import { SpaceRenderer } from './spaceRenderer';
import { renderCosmicOrb, renderObstacle, renderPowerUp } from './obstacleRenderer';

const HIGH_SCORE_KEY = 'earthfall_high_scores';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public state: GameState = 'TITLE';
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (
    stats: PlayerStats,
    health: number,
    activePowerUps: ActivePowerUp[],
    zoneBanner: string | null,
    skills: ActiveSkill[]
  ) => void;

  // Active Skills Map
  public skills: Map<SkillType, ActiveSkill> = new Map();

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

  public startGame() {
    this.resetGame();
    this.state = 'PLAYING';
    soundEngine.startMusic(128);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundEngine.stopMusic();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      soundEngine.startMusic(128);
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  public triggerGameOver() {
    this.state = 'GAME_OVER';
    soundEngine.stopMusic();
    soundEngine.playGameOver();
    this.saveHighScore();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  // CONTROLS
  public applyJump() {
    if (this.state !== 'PLAYING') return;
    this.earthVy = JUMP_IMPULSE;
    this.particles.emitThrusterWake(this.earthX, this.earthY, this.hasPowerUp('COSMIC_BOOST'));
    soundEngine.playJump();
  }

  public applyDive() {
    if (this.state !== 'PLAYING') return;
    this.earthVy = DIVE_IMPULSE;
    this.particles.emitThrusterWake(this.earthX, this.earthY, this.hasPowerUp('COSMIC_BOOST'));
    soundEngine.playDive();
  }

  public triggerSkill(type: SkillType) {
    if (type === 'EMP_SHOCKWAVE') this.triggerEmpShockwave();
    else if (type === 'PHASE_WARP') this.triggerPhaseWarp();
    else if (type === 'RETRO_VENT') this.triggerRetroVent();
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

    // Earth continuous thruster wake
    this.particles.emitThrusterWake(this.earthX, this.earthY, hasBoost);

    if (hasBoost) {
      this.particles.emitWarpSpeedLines(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
    }

    // Update Player Physics
    this.updatePlayerPhysics(dt);

    // Update Zone Progression
    this.updateZoneProgression();

    // Spawning
    this.updateSpawners(dt);

    // Update Entities
    this.updateObstacles(dt);
    this.updateOrbs(dt);
    this.updatePowerUpPickups(dt);

    // Collisions
    this.checkCollisions();

    // Distance & Score Increment
    const scoreMult = hasBoost ? 3 : 1;
    this.stats.distance += (this.gameSpeed * dt) / 10;
    this.stats.score += Math.round(this.gameSpeed * dt * 0.1 * scoreMult);

    // Inform UI with active skills
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        this.stats,
        this.earthHealth,
        Array.from(this.activePowerUps.values()),
        this.zoneBanner,
        Array.from(this.skills.values())
      );
    }
  }

  private updatePlayerPhysics(dt: number) {
    // Gravity pulls Earth down gently
    this.earthVy += GRAVITY * dt;
    this.earthVy = Math.max(MAX_RISE_SPEED, Math.min(MAX_FALL_SPEED, this.earthVy));
    this.earthY += this.earthVy * dt;

    // Keep within bounds with bouncy dampening
    const minY = EARTH_RADIUS + 10;
    const maxY = CANVAS_VIRTUAL_HEIGHT - EARTH_RADIUS - 10;

    if (this.earthY < minY) {
      this.earthY = minY;
      this.earthVy = 0;
    } else if (this.earthY > maxY) {
      this.earthY = maxY;
      this.earthVy = -this.earthVy * 0.3; // Soft bounce off bottom
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
      const zoneConf = ZONES[newZone];
      this.zoneBanner = zoneConf.name;
      this.zoneBannerTimer = 3.5;
      soundEngine.playZoneWarp();

      const zoneIndices: Record<ZoneId, number> = {
        solar_system: 0,
        asteroid_belt: 1,
        dark_nebula: 2,
        frozen_space: 3,
        unknown_universe: 4,
      };
      soundEngine.setZoneTheme(zoneIndices[newZone]);
    }
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
      varietyPool.push('COSMIC_STORM', 'GIANT_ASTEROID', 'ENERGY_BARRIER', 'METEOR_SHOWER', 'VOID_CRYSTAL', 'COSMIC_LEVIATHAN');
    } else if (zone === 'frozen_space') {
      varietyPool.push('COMET', 'GIANT_ASTEROID', 'ENERGY_BARRIER', 'METEOR_SHOWER', 'VOID_CRYSTAL', 'PULSAR_STAR');
    } else {
      varietyPool.push(
        'GRAVITATIONAL_ANOMALY',
        'COSMIC_STORM',
        'GIANT_ASTEROID',
        'METEOR_SHOWER',
        'PULSAR_STAR',
        'ANTIMATTER_VORTEX',
        'COSMIC_LEVIATHAN'
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
        this.stats.score += orb.value * mult;
        soundEngine.playEnergyCollect();
        this.particles.emitCollectSparkle(orb.x, orb.y, '#38bdf8', 14);
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
        // Capsule / box collision
        const withinX = Math.abs(this.earthX - obs.x) < EARTH_RADIUS + 10;
        const withinY = Math.abs(this.earthY - obs.y) < obs.height / 2 + EARTH_RADIUS * 0.7;
        collided = withinX && withinY;
      } else {
        // Circle collision
        const dist = Math.hypot(this.earthX - obs.x, this.earthY - obs.y);
        collided = dist < (EARTH_RADIUS * 0.85) + (obs.radius * 0.85);
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

    // 3. Normal Collision Damage
    const damage = obs.type === 'GIANT_ASTEROID' ? 40 : obs.type === 'ANTIMATTER_VORTEX' || obs.type === 'COSMIC_LEVIATHAN' ? 35 : 25;
    this.earthHealth = Math.max(0, this.earthHealth - damage);
    this.stats.currentCombo = 0; // Reset combo

    this.triggerScreenShake(0.7);
    this.hitstopTimer = 0.04; // 40ms hitstop
    this.invincibilityTimer = 1.4; // 1.4s invincibility frames
    this.particles.emitExplosion(this.earthX, this.earthY, '#ef4444', 35);
    soundEngine.playCollision();

    if (obs.type !== 'GIANT_ASTEROID' && obs.type !== 'ENERGY_BARRIER' && obs.type !== 'COSMIC_LEVIATHAN') {
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

    // 1. Render Background Space, Nebulae & Parallax
    this.spaceRenderer.render(
      this.ctx,
      this.stats.distance,
      this.stats.zone,
      this.timeAlive
    );

    // 2. Render Orbs & Power-up Pickups
    for (const orb of this.orbs) {
      renderCosmicOrb(this.ctx, orb, this.timeAlive);
    }
    for (const p of this.powerUpItems) {
      renderPowerUp(this.ctx, p, this.timeAlive);
    }

    // 3. Render Obstacles
    for (const obs of this.obstacles) {
      renderObstacle(this.ctx, obs, this.timeAlive);
    }

    // 4. Render Particle Effects
    this.particles.render(this.ctx);

    // 5. Render Planet Earth (Player)
    renderEarth(this.ctx, {
      x: this.earthX,
      y: this.earthY,
      radius: EARTH_RADIUS,
      rotation: this.earthRotation,
      cloudRotation: this.earthCloudRotation,
      verticalTilt: this.earthVy / 300,
      health: this.earthHealth,
      isShielded: this.hasPowerUp('SHIELD'),
      isBoosted: this.hasPowerUp('COSMIC_BOOST'),
      isMagnetized: this.hasPowerUp('MAGNET'),
      isPhasing: this.isPhasingActive(),
      isHitFlash: this.isHitFlash,
      time: this.timeAlive,
    });

    // 6. Time Control / Chrono Warp Screen Filter
    if (this.hasPowerUp('TIME_CONTROL')) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      this.ctx.fillRect(0, 0, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);
      this.ctx.restore();
    }

    // 7. Zone Announcement Banner overlay (if active)
    if (this.zoneBanner && this.zoneBannerTimer > 0) {
      this.renderZoneBanner(this.ctx, this.zoneBanner, this.zoneBannerTimer);
    }

    this.ctx.restore();
  }

  private renderZoneBanner(ctx: CanvasRenderingContext2D, bannerText: string, timer: number) {
    ctx.save();
    const alpha = Math.min(1, timer, (3.5 - timer) * 2);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(0, CANVAS_VIRTUAL_HEIGHT * 0.22, CANVAS_VIRTUAL_WIDTH, 70);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_VIRTUAL_HEIGHT * 0.22);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT * 0.22);
    ctx.moveTo(0, CANVAS_VIRTUAL_HEIGHT * 0.22 + 70);
    ctx.lineTo(CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT * 0.22 + 70);
    ctx.stroke();

    ctx.font = '800 24px var(--font-display)';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bannerText.toUpperCase(), CANVAS_VIRTUAL_WIDTH / 2, CANVAS_VIRTUAL_HEIGHT * 0.22 + 35);

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
