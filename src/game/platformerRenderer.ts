/**
 * Earthfall: Beyond the Solar System - 2.5D Platformer Renderer
 * Renders 100% 3D low-poly procedural assets in true 2.5D side-scrolling perspective.
 */

import {
  Platform3D,
  Structure3D,
  Npc3D,
  BossEntity,
  VanguardLaser,
  FistPunch,
  SkinItem,
} from './types';
import {
  createElementalPlatformMesh,
  createStructureMesh,
  createCheckpointBeaconMesh,
  createNpcMesh,
  createBossMesh,
  createGuardianCharacterMesh,
  createSolarBackHolderMesh,
  createVanguardSpaceshipMesh,
  createAegisShieldMesh,
  createLowPolyEarthMesh,
  createLowPolyCloudShellMesh,
  renderLowPolyMesh,
  LowPolyMesh,
} from './lowPoly3D';

export class PlatformerRenderer {
  // Pre-cached meshes
  private static cachedPlatforms: Map<string, LowPolyMesh> = new Map();
  private static cachedStructures: Map<string, LowPolyMesh> = new Map();
  private static cachedNpcs: Map<string, LowPolyMesh> = new Map();
  private static cachedBosses: Map<string, LowPolyMesh> = new Map();
  private static solarHolderMesh = createSolarBackHolderMesh();
  private static vanguardMesh = createVanguardSpaceshipMesh();
  private static aegisMesh = createAegisShieldMesh();
  private static earthMesh = createLowPolyEarthMesh(3);
  private static cloudMesh = createLowPolyCloudShellMesh(2);

  public static getPlatformMesh(type: any, width: number, height: number): LowPolyMesh {
    const key = `${type}_${Math.round(width)}_${Math.round(height)}`;
    if (!this.cachedPlatforms.has(key)) {
      this.cachedPlatforms.set(key, createElementalPlatformMesh(type, width, height));
    }
    return this.cachedPlatforms.get(key)!;
  }

  public static getStructureMesh(type: any): LowPolyMesh {
    if (!this.cachedStructures.has(type)) {
      this.cachedStructures.set(type, createStructureMesh(type));
    }
    return this.cachedStructures.get(type)!;
  }

  public static getNpcMesh(type: any): LowPolyMesh {
    if (!this.cachedNpcs.has(type)) {
      this.cachedNpcs.set(type, createNpcMesh(type));
    }
    return this.cachedNpcs.get(type)!;
  }

  public static getBossMesh(chapter: number, isMini: boolean): LowPolyMesh {
    const key = `${chapter}_${isMini}`;
    if (!this.cachedBosses.has(key)) {
      this.cachedBosses.set(key, createBossMesh(chapter, isMini));
    }
    return this.cachedBosses.get(key)!;
  }

  /**
   * Renders all active 3D floating platforms
   */
  public static renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform3D[]): void {
    for (const p of platforms) {
      if (p.isFallen) continue;
      const mesh = this.getPlatformMesh(p.type, p.width, p.height);
      const isCrumbleWarning = p.isCrumbling && p.crumbleTimer && p.crumbleTimer < 0.6;
      const shakeOffset = isCrumbleWarning ? (Math.random() - 0.5) * 6 : 0;

      renderLowPolyMesh(ctx, mesh, {
        x: p.x + p.width / 2,
        y: p.y + p.height / 2 + shakeOffset,
        scale: 1.0,
        rotX: 0.18, // Slight 2.5D top-tilt
        rotY: 0,
        rotZ: 0,
      });

      // Spring pad highlight
      if (p.hasSpring) {
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
        ctx.fillRect(p.x + p.width / 2 - 16, p.y - 6, 32, 6);
        ctx.restore();
      }
    }
  }

  /**
   * Renders 3D Architectural Structures (Cosmic Villages, Khandhar Ruins, Beacons)
   */
  public static renderStructures(
    ctx: CanvasRenderingContext2D,
    structures: Structure3D[],
    time: number
  ): void {
    for (const s of structures) {
      if (s.type === 'checkpoint_beacon') {
        const beaconMesh = createCheckpointBeaconMesh(s.isActive, time * 2);
        renderLowPolyMesh(ctx, beaconMesh, {
          x: s.x,
          y: s.y,
          scale: 32,
          rotX: 0.15,
          rotY: time * 0.5,
          rotZ: 0,
        });

        // Skyward light beam pillar if active
        if (s.isActive) {
          ctx.save();
          const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y - 600);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
          grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(s.x - 20, s.y - 600, 40, 600);

          // Pulsing beacon ring
          ctx.beginPath();
          ctx.arc(s.x, s.y - 35, 28 + Math.sin(time * 6) * 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }
      } else {
        const mesh = this.getStructureMesh(s.type);
        renderLowPolyMesh(ctx, mesh, {
          x: s.x,
          y: s.y,
          scale: 35,
          rotX: 0.15,
          rotY: s.rotation || 0,
          rotZ: 0,
        });
      }
    }
  }

  /**
   * Renders 3D Cosmic NPCs with prompt
   */
  public static renderNpcs(
    ctx: CanvasRenderingContext2D,
    npcs: Npc3D[],
    time: number,
    playerX: number
  ): void {
    for (const npc of npcs) {
      const mesh = this.getNpcMesh(npc.type);
      const floatY = Math.sin(time * 3 + npc.x * 0.01) * 6;

      renderLowPolyMesh(ctx, mesh, {
        x: npc.x,
        y: npc.y + floatY,
        scale: 30,
        rotX: 0.12,
        rotY: time * 1.2,
        rotZ: 0,
      });

      // Name & title plate above NPC
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(npc.name, npc.x, npc.y - 54 + floatY);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(npc.title, npc.x, npc.y - 42 + floatY);

      // Proximity interaction hint
      const dist = Math.abs(playerX - npc.x);
      if (dist < 120) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('[E] TALK / TAP', npc.x, npc.y - 70 + floatY);
      }
      ctx.restore();
    }
  }

  /**
   * Renders Active 3D Boss with Health Bar & attacks
   */
  public static renderBoss(
    ctx: CanvasRenderingContext2D,
    boss: BossEntity,
    time: number
  ): void {
    if (boss.state === 'defeated') return;

    const mesh = this.getBossMesh(boss.chapter, boss.isMiniBoss);
    const floatY = Math.sin(time * 2.5) * 12;

    // Boss 3D Mesh
    renderLowPolyMesh(ctx, mesh, {
      x: boss.x,
      y: boss.y + floatY,
      scale: boss.isMiniBoss ? 35 : 48,
      rotX: 0.15,
      rotY: Math.sin(time) * 0.4,
      rotZ: Math.sin(time * 1.5) * 0.08,
    });

    // Boss Aura Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(boss.x, boss.y + floatY, boss.width * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fill();

    // In-world Boss Health Bar
    const barW = 160;
    const barH = 10;
    const barX = boss.x - barW / 2;
    const barY = boss.y - 95 + floatY;
    const pct = Math.max(0, boss.health / boss.maxHealth);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(`${boss.name} [${boss.element}]`, boss.x, barY - 6);
    ctx.restore();
  }

  /**
   * Renders the 3D Mecha-Titan Guardian, Earth, Solar Ring, and Vanguard spaceships
   */
  public static renderGuardianAndEarth(
    ctx: CanvasRenderingContext2D,
    guardianX: number,
    guardianY: number,
    isFistMode: boolean,
    isJumping: boolean,
    runPhase: number,
    punch: FistPunch | null,
    skin: SkinItem,
    time: number,
    hasAegis: boolean
  ): void {
    // Determine Guardian Pose
    let pose: 'carry' | 'back' | 'punch1' | 'punch2' | 'slam' | 'jump' = 'carry';
    if (punch) {
      if (punch.step === 1) pose = 'punch1';
      else if (punch.step === 2) pose = 'punch2';
      else pose = 'slam';
    } else if (isJumping) {
      pose = 'jump';
    } else if (isFistMode) {
      pose = 'back';
    } else {
      pose = 'carry';
    }

    const guardianMesh = createGuardianCharacterMesh(pose, runPhase);

    // 1. If in Fist Mode, render Solar Back-Holder Ring behind Guardian
    if (isFistMode) {
      renderLowPolyMesh(ctx, this.solarHolderMesh, {
        x: guardianX - 8,
        y: guardianY - 8,
        scale: 44,
        rotX: 0.15,
        rotY: 0,
        rotZ: time * 2, // Continuously spinning solar ring
      });

      // Earth is safely seated inside the Solar Back-Holder ring on Guardian's back
      renderLowPolyMesh(ctx, this.earthMesh, {
        x: guardianX - 8,
        y: guardianY - 8,
        scale: 32,
        rotX: 0.15,
        rotY: time * 0.8,
        rotZ: 0.41,
        axialTilt: 0.41,
        skin,
      });

      renderLowPolyMesh(ctx, this.cloudMesh, {
        x: guardianX - 8,
        y: guardianY - 8,
        scale: 33,
        rotX: 0.15,
        rotY: time * 1.1,
        rotZ: 0.41,
        axialTilt: 0.41,
      });
    }

    // 2. Render 3D Colossal Mecha-Titan Guardian
    renderLowPolyMesh(ctx, guardianMesh, {
      x: guardianX,
      y: guardianY,
      scale: 36,
      rotX: 0.15,
      rotY: 0.1,
      rotZ: 0,
    });

    // 3. If in Carry Mode (Normal Platforming), render Earth in front between Guardian's hands!
    if (!isFistMode) {
      const earthHoldX = guardianX + 38;
      const earthHoldY = guardianY - 4;

      renderLowPolyMesh(ctx, this.earthMesh, {
        x: earthHoldX,
        y: earthHoldY,
        scale: 36,
        rotX: 0.15,
        rotY: time * 0.8,
        rotZ: 0.41,
        axialTilt: 0.41,
        skin,
      });

      renderLowPolyMesh(ctx, this.cloudMesh, {
        x: earthHoldX,
        y: earthHoldY,
        scale: 37,
        rotX: 0.15,
        rotY: time * 1.1,
        rotZ: 0.41,
        axialTilt: 0.41,
      });

      // Radiant energy aura connecting Guardian hands to Earth
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthHoldX, earthHoldY, 44, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render 2 3D Mini Vanguard Spaceships (Escorts hovering near Guardian)
    const v1Y = guardianY - 48 + Math.sin(time * 4) * 8;
    const v2Y = guardianY + 38 + Math.cos(time * 4) * 8;
    const vX = guardianX - 32;

    renderLowPolyMesh(ctx, this.vanguardMesh, {
      x: vX,
      y: v1Y,
      scale: 14,
      rotX: 0.1,
      rotY: 0,
      rotZ: 0,
    });

    renderLowPolyMesh(ctx, this.vanguardMesh, {
      x: vX - 12,
      y: v2Y,
      scale: 14,
      rotX: 0.1,
      rotY: 0,
      rotZ: 0,
    });

    // 5. Aegis Planetary Shield (3D geodesic dome)
    if (hasAegis) {
      renderLowPolyMesh(ctx, this.aegisMesh, {
        x: guardianX + (isFistMode ? 0 : 25),
        y: guardianY,
        scale: 75,
        rotX: time * 0.5,
        rotY: time * 0.8,
        rotZ: time * 0.3,
        cullBackfaces: false,
      });
    }

    // 6. Punch visual effects
    if (punch) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(punch.x, punch.y, punch.radius, 0, Math.PI * 2);
      ctx.fillStyle = punch.step === 3 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.35)';
      ctx.fill();
      ctx.strokeStyle = punch.step === 3 ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Renders Vanguard Lasers
   */
  public static renderVanguardLasers(ctx: CanvasRenderingContext2D, lasers: VanguardLaser[]): void {
    ctx.save();
    for (const l of lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - 24, l.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.restore();
  }
}
