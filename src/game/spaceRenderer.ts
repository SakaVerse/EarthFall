/**
 * Earthfall: Beyond the Solar System - Ultra High-Fidelity Parallax Cosmos Engine
 * Features:
 * - Procedurally generated distant nebula cloud complexes with organic lobes, dust rifts & star nurseries
 * - Seamless subtle color & gradient transitions between cosmic zones based on player distance
 * - 4-layer parallax starfield with James Webb / Hubble telescope diffraction spikes on primary stars
 * - Interstellar speed streaks and cosmic radiation wind particles
 * - Detailed celestial landmarks (Saturn with Cassini division, Jupiter storm bands, accretion disks)
 * - Dynamic theme backdrops (Cyberpunk Neon Void, Solar Flare Inferno, Abyssal Singularity, Glacial Auroras)
 */

import { ZONES } from './constants';
import { ThemeId, ZoneId } from './types';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  layer: number; // 0 = micro-deep, 1 = mid field, 2 = bright primary, 3 = foreground dust
  color: string;
  hasSpikes?: boolean;
}

interface StardustMote {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  color: string;
}

interface CelestialObject {
  x: number;
  y: number;
  type: 'saturn' | 'jupiter' | 'mars' | 'nebula' | 'ice_planet' | 'quantum_rift';
  size: number;
  speedRatio: number;
  angle: number;
}

interface NebulaLobe {
  offsetX: number;
  offsetY: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  colorIndex: number; // 0, 1, 2 index in the blended palette
  alpha: number;
  phase: number;
  pulseSpeed: number;
}

interface DustRift {
  points: { x: number; y: number }[];
  thickness: number;
  alpha: number;
}

interface ProtostarCore {
  ox: number;
  oy: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

interface ProceduralNebula {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speedRatio: number; // ultra-deep parallax (0.015 - 0.045)
  baseAlpha: number;
  lobes: NebulaLobe[];
  dustRifts: DustRift[];
  starCores: ProtostarCore[];
  seed: number;
}

interface ZoneTransitionState {
  currentZone: ZoneId;
  incomingZone: ZoneId | null;
  blendFactor: number; // 0 (pure currentZone) to 1 (pure incomingZone)
}

// Color utility helpers for smooth subtle zone blending
interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColorToRgba(colorStr: string): RGBA {
  const str = colorStr.trim().toLowerCase();

  // Hex format #rrggbb or #rgb
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const intVal = parseInt(hex, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255,
      a: 1.0,
    };
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const match = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (match) {
    return {
      r: parseFloat(match[1]),
      g: parseFloat(match[2]),
      b: parseFloat(match[3]),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1.0,
    };
  }

  return { r: 255, g: 255, b: 255, a: 1.0 };
}

function lerpColor(c1: string, c2: string, t: number): string {
  if (t <= 0) return c1;
  if (t >= 1) return c2;

  const a = parseColorToRgba(c1);
  const b = parseColorToRgba(c2);

  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  const alpha = a.a + (b.a - a.a) * t;

  return `rgba(${r}, ${g}, ${bl}, ${alpha.toFixed(3)})`;
}

function lerpPalette(pal1: string[], pal2: string[], t: number): string[] {
  const maxLen = Math.max(pal1.length, pal2.length);
  const result: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const c1 = pal1[i % pal1.length];
    const c2 = pal2[i % pal2.length];
    result.push(lerpColor(c1, c2, t));
  }

  return result;
}

export class SpaceRenderer {
  private stars: Star[] = [];
  private dustMotes: StardustMote[] = [];
  private celestialObjects: CelestialObject[] = [];
  private proceduralNebulae: ProceduralNebula[] = [];
  private width = 1280;
  private height = 720;
  private nextNebulaId = 1;

  constructor() {
    this.initStars(280);
    this.initDustMotes(45);
    this.initCelestials();
    this.initProceduralNebulae(6);
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  private initStars(count: number) {
    this.stars = [];
    const colors = ['#ffffff', '#f8fafc', '#bae6fd', '#7dd3fc', '#fef08a', '#fbcfe8', '#fed7aa'];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      // 0 = 55% micro, 1 = 30% mid, 2 = 12% bright, 3 = 3% primary with diffraction spikes
      const layer = rand < 0.55 ? 0 : rand < 0.85 ? 1 : rand < 0.96 ? 2 : 3;
      const size = layer === 0 ? 0.75 : layer === 1 ? 1.4 : layer === 2 ? 2.2 : 3.4;
      const hasSpikes = layer === 3;

      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size,
        brightness: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 0.8 + Math.random() * 2.5,
        layer,
        color: colors[Math.floor(Math.random() * colors.length)],
        hasSpikes,
      });
    }
  }

  private initDustMotes(count: number) {
    this.dustMotes = [];
    for (let i = 0; i < count; i++) {
      this.dustMotes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 1.2 + Math.random() * 2.2,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.45,
        color: Math.random() > 0.5 ? '#7dd3fc' : '#bae6fd',
      });
    }
  }

  private initCelestials() {
    this.celestialObjects = [
      { x: 380, y: 150, type: 'saturn', size: 58, speedRatio: 0.05, angle: 0 },
      { x: 980, y: 490, type: 'mars', size: 36, speedRatio: 0.08, angle: 0 },
      { x: 1650, y: 210, type: 'jupiter', size: 76, speedRatio: 0.04, angle: 0 },
      { x: 2400, y: 360, type: 'nebula', size: 210, speedRatio: 0.12, angle: 0 },
      { x: 3300, y: 170, type: 'ice_planet', size: 54, speedRatio: 0.07, angle: 0 },
      { x: 4400, y: 310, type: 'quantum_rift', size: 100, speedRatio: 0.06, angle: 0 },
    ];
  }

  /**
   * Initialize a diverse fleet of procedurally generated distant nebulae
   * positioned across the panoramic cosmic vista.
   */
  private initProceduralNebulae(count: number) {
    this.proceduralNebulae = [];
    const spreadSpacing = (this.width + 1200) / count;

    for (let i = 0; i < count; i++) {
      const initialX = -200 + i * spreadSpacing + (Math.random() * 180 - 90);
      const initialY = 80 + Math.random() * (this.height - 180);
      this.proceduralNebulae.push(this.createProceduralNebula(initialX, initialY));
    }
  }

  /**
   * Procedural generator for an organic distant nebula cloud complex
   */
  private createProceduralNebula(spawnX: number, spawnY: number): ProceduralNebula {
    const seed = Math.random();
    const width = 420 + Math.random() * 380;
    const height = 240 + Math.random() * 260;
    const speedRatio = 0.018 + Math.random() * 0.032; // Deep cosmic parallax speed

    // Generate 4-7 overlapping organic lobes that form the gaseous cloud body
    const lobeCount = 4 + Math.floor(Math.random() * 4);
    const lobes: NebulaLobe[] = [];

    for (let l = 0; l < lobeCount; l++) {
      const angle = (l / lobeCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
      const distFromCenter = (Math.random() * 0.45) * Math.min(width, height);
      const offsetX = Math.cos(angle) * distFromCenter + (Math.random() * 60 - 30);
      const offsetY = Math.sin(angle) * (distFromCenter * 0.6) + (Math.random() * 40 - 20);
      const radiusX = (width * 0.28) + Math.random() * (width * 0.24);
      const radiusY = (height * 0.3) + Math.random() * (height * 0.28);

      lobes.push({
        offsetX,
        offsetY,
        radiusX,
        radiusY,
        rotation: Math.random() * Math.PI,
        colorIndex: l % 3,
        alpha: 0.32 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.3 + Math.random() * 0.6,
      });
    }

    // Generate 1-2 dark cosmic dust rifts / absorption filaments cutting across the nebula
    const dustRifts: DustRift[] = [];
    const riftCount = 1 + (Math.random() > 0.4 ? 1 : 0);

    for (let r = 0; r < riftCount; r++) {
      const startAngle = Math.random() * Math.PI * 2;
      const startX = Math.cos(startAngle) * (width * 0.42);
      const startY = Math.sin(startAngle) * (height * 0.35);

      const midX = (Math.random() - 0.5) * (width * 0.3);
      const midY = (Math.random() - 0.5) * (height * 0.25);

      const endAngle = startAngle + Math.PI + (Math.random() * 0.8 - 0.4);
      const endX = Math.cos(endAngle) * (width * 0.45);
      const endY = Math.sin(endAngle) * (height * 0.38);

      dustRifts.push({
        points: [
          { x: startX, y: startY },
          { x: midX, y: midY },
          { x: endX, y: endY },
        ],
        thickness: 16 + Math.random() * 26,
        alpha: 0.18 + Math.random() * 0.25,
      });
    }

    // Generate 2-5 embedded protostars within the ionization zone
    const starCores: ProtostarCore[] = [];
    const starCount = 2 + Math.floor(Math.random() * 4);

    for (let s = 0; s < starCount; s++) {
      starCores.push({
        ox: (Math.random() - 0.5) * (width * 0.6),
        oy: (Math.random() - 0.5) * (height * 0.5),
        size: 1.2 + Math.random() * 2.2,
        brightness: 0.5 + Math.random() * 0.5,
        twinkleSpeed: 1.2 + Math.random() * 2.8,
      });
    }

    return {
      id: this.nextNebulaId++,
      x: spawnX,
      y: spawnY,
      width,
      height,
      speedRatio,
      baseAlpha: 0.55 + Math.random() * 0.35,
      lobes,
      dustRifts,
      starCores,
      seed,
    };
  }

  /**
   * Reseeds an existing nebula with fresh randomized morphology when it wraps around
   */
  private reseedNebula(neb: ProceduralNebula) {
    const fresh = this.createProceduralNebula(neb.x, 80 + Math.random() * (this.height - 180));
    neb.width = fresh.width;
    neb.height = fresh.height;
    neb.speedRatio = fresh.speedRatio;
    neb.baseAlpha = fresh.baseAlpha;
    neb.lobes = fresh.lobes;
    neb.dustRifts = fresh.dustRifts;
    neb.starCores = fresh.starCores;
    neb.y = fresh.y;
    neb.seed = fresh.seed;
  }

  public update(dt: number, gameSpeed: number) {
    // Parallax update for multi-layer stars
    for (const star of this.stars) {
      const layerMult = star.layer === 0 ? 0.08 : star.layer === 1 ? 0.22 : star.layer === 2 ? 0.55 : 0.85;
      star.x -= gameSpeed * layerMult * dt;
      if (star.x < -15) {
        star.x = this.width + 10 + Math.random() * 20;
        star.y = Math.random() * this.height;
      }
    }

    // Interstellar dust motes with velocity streaks
    for (const mote of this.dustMotes) {
      mote.x -= gameSpeed * mote.speed * dt;
      if (mote.x < -20) {
        mote.x = this.width + Math.random() * 50;
        mote.y = Math.random() * this.height;
      }
    }

    // Parallax update for procedural distant nebulae
    for (const neb of this.proceduralNebulae) {
      neb.x -= gameSpeed * neb.speedRatio * dt;
      if (neb.x < -neb.width - 250) {
        neb.x = this.width + 150 + Math.random() * 500;
        this.reseedNebula(neb);
      }
    }

    // Parallax update for distant celestial landmarks
    for (const obj of this.celestialObjects) {
      obj.x -= gameSpeed * obj.speedRatio * dt;
      if (obj.x < -obj.size * 3) {
        obj.x = this.width + 500 + Math.random() * 900;
        obj.y = 70 + Math.random() * (this.height - 160);
      }
    }
  }

  /**
   * Computes the continuous subtle zone transition state based on player distance.
   * Transition windows begin several hundred light-years before each boundary
   * and complete seamlessly at the boundary using smoothstep interpolation.
   */
  public getZoneTransitionState(distance: number): ZoneTransitionState {
    // Zone boundaries:
    // solar_system -> asteroid_belt at 2500 (window: 1700 to 2500, span: 800 LY)
    // asteroid_belt -> dark_nebula at 6000 (window: 4900 to 6000, span: 1100 LY)
    // dark_nebula -> frozen_space at 11000 (window: 9600 to 11000, span: 1400 LY)
    // frozen_space -> unknown_universe at 17500 (window: 15800 to 17500, span: 1700 LY)

    const boundaries: { current: ZoneId; next: ZoneId; startDist: number; endDist: number }[] = [
      { current: 'solar_system', next: 'asteroid_belt', startDist: 1700, endDist: 2500 },
      { current: 'asteroid_belt', next: 'dark_nebula', startDist: 4900, endDist: 6000 },
      { current: 'dark_nebula', next: 'frozen_space', startDist: 9600, endDist: 11000 },
      { current: 'frozen_space', next: 'unknown_universe', startDist: 15800, endDist: 17500 },
    ];

    for (const b of boundaries) {
      if (distance >= b.startDist && distance < b.endDist) {
        const u = (distance - b.startDist) / (b.endDist - b.startDist);
        // Smoothstep interpolation for organic, non-linear ease-in / ease-out transition
        const blendFactor = u * u * (3 - 2 * u);
        return {
          currentZone: b.current,
          incomingZone: b.next,
          blendFactor,
        };
      }
    }

    // Determine current stable zone
    let stableZone: ZoneId = 'solar_system';
    if (distance >= 17500) {
      stableZone = 'unknown_universe';
    } else if (distance >= 11000) {
      stableZone = 'frozen_space';
    } else if (distance >= 6000) {
      stableZone = 'dark_nebula';
    } else if (distance >= 2500) {
      stableZone = 'asteroid_belt';
    }

    return {
      currentZone: stableZone,
      incomingZone: null,
      blendFactor: 0,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    distance: number,
    currentZone: ZoneId,
    time: number,
    theme?: ThemeId
  ) {
    // 1. COMPUTE SUBTLE ZONE TRANSITION PALETTE
    const transition = this.getZoneTransitionState(distance);
    const activeZoneConfig = ZONES[transition.currentZone || currentZone];
    const incomingZoneConfig = transition.incomingZone ? ZONES[transition.incomingZone] : null;

    let bgGradStops: [string, string, string];
    let nebPalette: string[];
    let ambientCosmicColor: string;
    let starGlowColor: string;

    if (theme === 'cyberpunk') {
      bgGradStops = ['#0a0118', '#16042b', '#05000a'];
      nebPalette = ['rgba(236, 72, 153, 0.32)', 'rgba(6, 182, 212, 0.28)', 'rgba(168, 85, 247, 0.24)'];
      ambientCosmicColor = '#ec4899';
      starGlowColor = '#fbcfe8';
    } else if (theme === 'solar') {
      bgGradStops = ['#1c0302', '#2d0803', '#0a0100'];
      nebPalette = ['rgba(239, 68, 68, 0.35)', 'rgba(245, 158, 11, 0.28)', 'rgba(220, 38, 38, 0.2)'];
      ambientCosmicColor = '#f59e0b';
      starGlowColor = '#fed7aa';
    } else if (theme === 'void') {
      bgGradStops = ['#06000c', '#110022', '#020005'];
      nebPalette = ['rgba(147, 51, 234, 0.36)', 'rgba(79, 70, 229, 0.26)', 'rgba(192, 132, 252, 0.18)'];
      ambientCosmicColor = '#a855f7';
      starGlowColor = '#e9d5ff';
    } else if (theme === 'glacial') {
      bgGradStops = ['#01111c', '#022438', '#000910'];
      nebPalette = ['rgba(34, 211, 238, 0.32)', 'rgba(56, 189, 248, 0.25)', 'rgba(14, 165, 233, 0.18)'];
      ambientCosmicColor = '#38bdf8';
      starGlowColor = '#bae6fd';
    } else {
      // Procedural Subtle Cosmic Zone Blending
      if (incomingZoneConfig && transition.blendFactor > 0) {
        const t = transition.blendFactor;
        bgGradStops = [
          lerpColor(activeZoneConfig.bgGradient[0], incomingZoneConfig.bgGradient[0], t),
          lerpColor(activeZoneConfig.bgGradient[1], incomingZoneConfig.bgGradient[1], t),
          lerpColor(activeZoneConfig.bgGradient[2], incomingZoneConfig.bgGradient[2], t),
        ];
        nebPalette = lerpPalette(activeZoneConfig.nebulaColors, incomingZoneConfig.nebulaColors, t);
        ambientCosmicColor = lerpColor(activeZoneConfig.ambientColor, incomingZoneConfig.ambientColor, t);
        starGlowColor = lerpColor(activeZoneConfig.starColor, incomingZoneConfig.starColor, t);
      } else {
        bgGradStops = [activeZoneConfig.bgGradient[0], activeZoneConfig.bgGradient[1], activeZoneConfig.bgGradient[2]];
        nebPalette = activeZoneConfig.nebulaColors;
        ambientCosmicColor = activeZoneConfig.ambientColor;
        starGlowColor = activeZoneConfig.starColor;
      }
    }

    // 2. DEEP SPACE COSMIC BACKDROP GRADIENT
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, bgGradStops[0]);
    bgGrad.addColorStop(0.48, bgGradStops[1]);
    bgGrad.addColorStop(1, bgGradStops[2]);

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3. PROCEDURALLY GENERATED DISTANT NEBULA CLOUDS (Volumetric Multi-Lobed Formations)
    this.renderProceduralNebulae(ctx, nebPalette, time);

    // 4. COSMIC GAS SWEEPS (Organic undulating harmonic filaments)
    this.renderCosmicGasSweeps(ctx, nebPalette, distance, time);

    // 5. THEMATIC BACKDROP EFFECTS
    if (theme === 'cyberpunk') {
      this.renderCyberGrid(ctx, time);
    } else if (theme === 'solar') {
      this.renderSolarFlares(ctx, time);
    } else if (theme === 'void') {
      this.renderVoidSingularity(ctx, time);
    } else if (theme === 'glacial') {
      this.renderGlacialAuroras(ctx, time);
    } else {
      this.renderCosmicRadiationRibbon(ctx, ambientCosmicColor, time);
    }

    // 6. DISTANT CELESTIAL LANDMARKS
    for (const obj of this.celestialObjects) {
      if (obj.x > -obj.size * 3 && obj.x < this.width + obj.size * 3) {
        this.renderCelestialObject(ctx, obj, currentZone, time);
      }
    }

    // 7. PARALLAX STARFIELD WITH DIFFRACTION SPIKES
    ctx.save();
    for (const star of this.stars) {
      const alphaPulse = Math.sin(time * star.twinkleSpeed + star.x * 0.05);
      const alpha = Math.max(0.2, Math.min(1, star.brightness + alphaPulse * 0.25));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.layer >= 2 ? starGlowColor : star.color;

      // Draw Star Core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Glow on Near & Primary Stars
      if (star.layer >= 2) {
        ctx.fillStyle = starGlowColor;
        ctx.globalAlpha = alpha * 0.28;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Optical 4-Point Diffraction Cross on Primary Stars (JWST / Hubble look)
      if (star.hasSpikes) {
        ctx.strokeStyle = starGlowColor;
        ctx.lineWidth = 0.9;
        ctx.globalAlpha = alpha * 0.6;
        const spikeLen = star.size * 4.2;

        ctx.beginPath();
        // Horizontal spike
        ctx.moveTo(star.x - spikeLen, star.y);
        ctx.lineTo(star.x + spikeLen, star.y);
        // Vertical spike
        ctx.moveTo(star.x, star.y - spikeLen);
        ctx.lineTo(star.x, star.y + spikeLen);
        ctx.stroke();
      }
    }

    // 8. INTERSTELLAR DUST MOTES (High-speed foreground particles)
    ctx.globalCompositeOperation = 'screen';
    for (const mote of this.dustMotes) {
      ctx.globalAlpha = mote.alpha;
      ctx.fillStyle = mote.color;
      ctx.strokeStyle = mote.color;
      ctx.lineWidth = mote.size;

      ctx.beginPath();
      ctx.moveTo(mote.x, mote.y);
      ctx.lineTo(mote.x - mote.size * 8, mote.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders procedurally generated distant nebulae with organic volumetric gas lobes,
   * subtle pulsating ionization cores, and silhouetted cosmic dust lanes.
   */
  private renderProceduralNebulae(ctx: CanvasRenderingContext2D, palette: string[], time: number) {
    ctx.save();

    for (const neb of this.proceduralNebulae) {
      // Viewport culling with generous margin
      if (neb.x + neb.width < -100 || neb.x - neb.width > this.width + 100) {
        continue;
      }

      ctx.save();
      ctx.translate(neb.x, neb.y);

      // A. Deep diffuse backdrop gas cloud (soft radial glow)
      const primaryColor = palette[0] || 'rgba(56, 189, 248, 0.25)';
      const deepGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, neb.width * 0.55);
      deepGrad.addColorStop(0, primaryColor);
      deepGrad.addColorStop(0.5, primaryColor.replace(/[\d.]+\)$/g, '0.08)'));
      deepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = neb.baseAlpha * 0.7;
      ctx.fillStyle = deepGrad;
      ctx.beginPath();
      ctx.arc(0, 0, neb.width * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // B. Multi-lobed glowing emission nebulae
      for (const lobe of neb.lobes) {
        const pulse = 1 + Math.sin(time * lobe.pulseSpeed + lobe.phase) * 0.08;
        const color = palette[lobe.colorIndex % palette.length] || primaryColor;
        const rx = lobe.radiusX * pulse;
        const ry = lobe.radiusY * pulse;

        ctx.save();
        ctx.translate(lobe.offsetX, lobe.offsetY);
        ctx.rotate(lobe.rotation);
        ctx.scale(1, ry / rx);

        const lobeGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, rx);
        lobeGrad.addColorStop(0, color);
        lobeGrad.addColorStop(0.45, color.replace(/[\d.]+\)$/g, '0.14)'));
        lobeGrad.addColorStop(0.85, color.replace(/[\d.]+\)$/g, '0.03)'));
        lobeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalAlpha = neb.baseAlpha * lobe.alpha;
        ctx.fillStyle = lobeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // C. Cosmic Absorption Dust Lanes / Dark Silhouetted Rifts
      ctx.globalCompositeOperation = 'source-over';
      for (const rift of neb.dustRifts) {
        if (rift.points.length < 3) continue;
        ctx.save();
        ctx.strokeStyle = 'rgba(5, 2, 10, 0.35)';
        ctx.lineWidth = rift.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = rift.alpha;

        ctx.beginPath();
        ctx.moveTo(rift.points[0].x, rift.points[0].y);
        ctx.quadraticCurveTo(
          rift.points[1].x,
          rift.points[1].y,
          rift.points[2].x,
          rift.points[2].y
        );
        ctx.stroke();
        ctx.restore();
      }

      // D. Embedded Protostar Nurseries
      ctx.globalCompositeOperation = 'screen';
      for (const star of neb.starCores) {
        const twinkle = 0.5 + Math.sin(time * star.twinkleSpeed + star.ox) * 0.5;
        const starAlpha = star.brightness * twinkle;

        ctx.save();
        ctx.globalAlpha = starAlpha * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.ox, star.oy, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft halo around baby stars inside nebula gas
        const secondaryColor = palette[1] || primaryColor;
        ctx.fillStyle = secondaryColor;
        ctx.globalAlpha = starAlpha * 0.35;
        ctx.beginPath();
        ctx.arc(star.ox, star.oy, star.size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Procedural cosmic gas sweeps: soft harmonic undulating ribbons of interstellar gas
   * that shift and evolve continuously as the player navigates space.
   */
  private renderCosmicGasSweeps(
    ctx: CanvasRenderingContext2D,
    palette: string[],
    distance: number,
    time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 2 organic sweeping filament ribbons
    for (let layer = 0; layer < 2; layer++) {
      const color = palette[layer % palette.length] || 'rgba(56, 189, 248, 0.15)';
      const baseY = this.height * (0.32 + layer * 0.38);
      const amp1 = 45 + layer * 18;
      const amp2 = 22 + layer * 12;
      const freq1 = 0.0032;
      const freq2 = 0.0075;
      const speedOffset = (distance * 0.04) + time * (0.4 + layer * 0.2);

      ctx.strokeStyle = color.replace(/[\d.]+\)$/g, '0.12)');
      ctx.lineWidth = 38 + layer * 20;
      ctx.beginPath();

      for (let x = -40; x <= this.width + 40; x += 35) {
        const waveX = x + speedOffset * 60;
        const y = baseY + Math.sin(waveX * freq1 + layer) * amp1 + Math.cos(waveX * freq2) * amp2;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  private renderCosmicRadiationRibbon(ctx: CanvasRenderingContext2D, color: string, time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = lerpColor(color, 'rgba(255, 255, 255, 0.1)', 0.4);
    ctx.lineWidth = 16;
    ctx.beginPath();

    for (let x = 0; x <= this.width; x += 40) {
      const y = 90 + Math.sin(x * 0.004 + time * 0.5) * 50 + Math.cos(x * 0.008 + time * 0.3) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderCyberGrid(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.18)';
    ctx.lineWidth = 1;
    const horizon = this.height * 0.74;

    // Horizon glowing line
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(this.width, horizon);
    ctx.stroke();

    // Perspective floor lines
    ctx.shadowBlur = 0;
    for (let y = horizon; y <= this.height; y += (y - horizon + 12) * 0.32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Vanishing perspective lines
    const vpX = this.width * 0.5;
    const scroll = (time * 90) % 90;
    for (let x = -this.width * 0.5; x <= this.width * 1.5; x += 90) {
      ctx.beginPath();
      ctx.moveTo(vpX, horizon);
      ctx.lineTo(x - scroll, this.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderSolarFlares(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const flareX = this.width * 0.88;
    const flareY = this.height * 0.18;

    // Corona flare burst
    const corona = ctx.createRadialGradient(flareX, flareY, 30, flareX, flareY, 360);
    corona.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    corona.addColorStop(0.35, 'rgba(245, 158, 11, 0.25)');
    corona.addColorStop(0.7, 'rgba(239, 68, 68, 0.12)');
    corona.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(flareX, flareY, 360, 0, Math.PI * 2);
    ctx.fill();

    // Plasma arc
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const arcRadius = 160 + Math.sin(time * 2) * 15;
    ctx.arc(flareX, flareY, arcRadius, Math.PI * 0.8, Math.PI * 1.6);
    ctx.stroke();

    ctx.restore();
  }

  private renderVoidSingularity(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    const centerX = this.width * 0.8;
    const centerY = this.height * 0.32;

    // Gravitational lensing glow
    ctx.globalCompositeOperation = 'screen';
    const lensGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 240);
    lensGrad.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
    lensGrad.addColorStop(0.4, 'rgba(147, 51, 234, 0.25)');
    lensGrad.addColorStop(0.8, 'rgba(79, 70, 229, 0.1)');
    lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 240, 0, Math.PI * 2);
    ctx.fill();

    // Accretion disk
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.8);
    ctx.scale(1, 0.28);

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.65)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Black Hole Event Horizon
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
    ctx.fill();

    // Photon ring
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 43, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderGlacialAuroras(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
    ctx.lineWidth = 32;
    ctx.beginPath();

    for (let x = 0; x <= this.width; x += 30) {
      const y = 85 + Math.sin(x * 0.005 + time * 0.8) * 45 + Math.cos(x * 0.009 + time * 0.4) * 25;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderCelestialObject(
    ctx: CanvasRenderingContext2D,
    obj: CelestialObject,
    _zone: ZoneId,
    time: number
  ) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.type === 'saturn') {
      // Saturn planet sphere
      const pGrad = ctx.createRadialGradient(-obj.size * 0.35, -obj.size * 0.35, 6, 0, 0, obj.size);
      pGrad.addColorStop(0, '#fef3c7');
      pGrad.addColorStop(0.4, '#f59e0b');
      pGrad.addColorStop(0.8, '#b45309');
      pGrad.addColorStop(1, '#451a03');

      // Back half of planetary rings (Cassini division)
      ctx.save();
      ctx.rotate(0.38);
      ctx.scale(1, 0.28);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 2.1, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Cassini Division dark gap
      ctx.strokeStyle = 'rgba(10, 1, 24, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 2.05, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Planet body
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Cloud bands
      ctx.fillStyle = 'rgba(120, 53, 15, 0.28)';
      ctx.fillRect(-obj.size, -obj.size * 0.25, obj.size * 2, obj.size * 0.18);
      ctx.fillRect(-obj.size, obj.size * 0.1, obj.size * 2, obj.size * 0.2);

      // Front half of planetary rings
      ctx.save();
      ctx.rotate(0.38);
      ctx.scale(1, 0.28);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 2.1, 0, Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(10, 1, 24, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 2.05, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    } else if (obj.type === 'mars') {
      const mGrad = ctx.createRadialGradient(-obj.size * 0.35, -obj.size * 0.35, 4, 0, 0, obj.size);
      mGrad.addColorStop(0, '#fca5a5');
      mGrad.addColorStop(0.55, '#dc2626');
      mGrad.addColorStop(0.9, '#7f1d1d');
      mGrad.addColorStop(1, '#250505');

      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Valles Marineris canyon feature
      ctx.strokeStyle = 'rgba(69, 10, 10, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-obj.size * 0.5, 0);
      ctx.lineTo(obj.size * 0.35, obj.size * 0.1);
      ctx.stroke();

      // Polar ice cap
      ctx.fillStyle = 'rgba(254, 242, 242, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -obj.size * 0.84, obj.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'jupiter') {
      const jGrad = ctx.createRadialGradient(-obj.size * 0.35, -obj.size * 0.35, 8, 0, 0, obj.size);
      jGrad.addColorStop(0, '#fed7aa');
      jGrad.addColorStop(0.45, '#ea580c');
      jGrad.addColorStop(0.85, '#7c2d12');
      jGrad.addColorStop(1, '#250702');

      ctx.fillStyle = jGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Jupiter cloud bands
      ctx.fillStyle = 'rgba(67, 20, 7, 0.4)';
      ctx.fillRect(-obj.size, -obj.size * 0.45, obj.size * 2, obj.size * 0.16);
      ctx.fillRect(-obj.size, -obj.size * 0.1, obj.size * 2, obj.size * 0.22);
      ctx.fillRect(-obj.size, obj.size * 0.3, obj.size * 2, obj.size * 0.18);

      // Great Red Spot
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(obj.size * 0.38, obj.size * 0.22, obj.size * 0.26, obj.size * 0.17, 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'ice_planet') {
      const iGrad = ctx.createRadialGradient(-obj.size * 0.35, -obj.size * 0.35, 6, 0, 0, obj.size);
      iGrad.addColorStop(0, '#e0f2fe');
      iGrad.addColorStop(0.5, '#0284c7');
      iGrad.addColorStop(0.85, '#0c4a6e');
      iGrad.addColorStop(1, '#031c2c');

      ctx.fillStyle = iGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Crystalline frost corona
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 1.15, 0, Math.PI * 2);
      ctx.stroke();
    } else if (obj.type === 'quantum_rift') {
      // Swirling portal galaxy
      ctx.save();
      ctx.rotate(time * 0.6);
      const spiralR = obj.size * 1.5;
      const riftGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, spiralR);
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.25, '#ec4899');
      riftGrad.addColorStop(0.65, '#8b5cf6');
      riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.arc(0, 0, spiralR, 0, Math.PI * 2);
      ctx.fill();

      // Quantum accretion arms
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
      ctx.lineWidth = 3.5;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.18) {
          const r = (a / (Math.PI * 2)) * spiralR;
          const theta = a + (arm * Math.PI * 2) / 3;
          const px = Math.cos(theta) * r;
          const py = Math.sin(theta) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
