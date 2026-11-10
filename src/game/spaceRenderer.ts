/**
 * Earthfall: Beyond the Solar System - Ultra High-Fidelity Parallax Cosmos Engine
 * Features:
 * - 4-layer parallax starfield with James Webb / Hubble telescope diffraction spikes on primary stars
 * - Volumetric multi-pass nebulae with screen-blended cosmic dust filaments
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

export class SpaceRenderer {
  private stars: Star[] = [];
  private dustMotes: StardustMote[] = [];
  private celestialObjects: CelestialObject[] = [];
  private width = 1280;
  private height = 720;

  constructor() {
    this.initStars(280);
    this.initDustMotes(45);
    this.initCelestials();
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

    // Parallax update for distant celestial landmarks
    for (const obj of this.celestialObjects) {
      obj.x -= gameSpeed * obj.speedRatio * dt;
      if (obj.x < -obj.size * 3) {
        obj.x = this.width + 500 + Math.random() * 900;
        obj.y = 70 + Math.random() * (this.height - 160);
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    _distance: number,
    currentZone: ZoneId,
    time: number,
    theme?: ThemeId
  ) {
    const zoneConfig = ZONES[currentZone];

    // 1. DEEP SPACE COSMIC BACKDROP GRADIENT
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (theme === 'cyberpunk') {
      bgGrad.addColorStop(0, '#0a0118');
      bgGrad.addColorStop(0.35, '#16042b');
      bgGrad.addColorStop(0.75, '#0d011a');
      bgGrad.addColorStop(1, '#05000a');
    } else if (theme === 'solar') {
      bgGrad.addColorStop(0, '#1c0302');
      bgGrad.addColorStop(0.4, '#2d0803');
      bgGrad.addColorStop(0.8, '#180301');
      bgGrad.addColorStop(1, '#0a0100');
    } else if (theme === 'void') {
      bgGrad.addColorStop(0, '#06000c');
      bgGrad.addColorStop(0.45, '#110022');
      bgGrad.addColorStop(0.85, '#05000a');
      bgGrad.addColorStop(1, '#020005');
    } else if (theme === 'glacial') {
      bgGrad.addColorStop(0, '#01111c');
      bgGrad.addColorStop(0.4, '#022438');
      bgGrad.addColorStop(0.8, '#011522');
      bgGrad.addColorStop(1, '#000910');
    } else {
      bgGrad.addColorStop(0, zoneConfig.bgGradient[0]);
      bgGrad.addColorStop(0.45, zoneConfig.bgGradient[1]);
      bgGrad.addColorStop(1, zoneConfig.bgGradient[2]);
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. VOLUMETRIC MULTI-PASS NEBULA FILAMENTS
    let nebColors = zoneConfig.nebulaColors;
    if (theme === 'cyberpunk') {
      nebColors = ['rgba(236, 72, 153, 0.28)', 'rgba(6, 182, 212, 0.25)', 'rgba(168, 85, 247, 0.2)'];
    } else if (theme === 'solar') {
      nebColors = ['rgba(239, 68, 68, 0.3)', 'rgba(245, 158, 11, 0.25)', 'rgba(220, 38, 38, 0.18)'];
    } else if (theme === 'void') {
      nebColors = ['rgba(147, 51, 234, 0.32)', 'rgba(79, 70, 229, 0.22)', 'rgba(192, 132, 252, 0.15)'];
    } else if (theme === 'glacial') {
      nebColors = ['rgba(34, 211, 238, 0.28)', 'rgba(56, 189, 248, 0.22)', 'rgba(14, 165, 233, 0.16)'];
    }
    this.renderVolumetricNebulae(ctx, nebColors, time);

    // 3. THEMATIC EFFECTS (Synthwave grid, Solar wind ribbons, Gravitational vortex, Aurora waves)
    if (theme === 'cyberpunk') {
      this.renderCyberGrid(ctx, time);
    } else if (theme === 'solar') {
      this.renderSolarFlares(ctx, time);
    } else if (theme === 'void') {
      this.renderVoidSingularity(ctx, time);
    } else if (theme === 'glacial') {
      this.renderGlacialAuroras(ctx, time);
    } else {
      this.renderCosmicRadiationRibbon(ctx, time);
    }

    // 4. DISTANT CELESTIAL LANDMARKS (Saturn, Mars, Jupiter, Wormholes)
    for (const obj of this.celestialObjects) {
      if (obj.x > -obj.size * 3 && obj.x < this.width + obj.size * 3) {
        this.renderCelestialObject(ctx, obj, currentZone, time);
      }
    }

    // 5. PARALLAX STARFIELD WITH DIFFRACTION SPIKES
    ctx.save();
    for (const star of this.stars) {
      const alphaPulse = Math.sin(time * star.twinkleSpeed + star.x * 0.05);
      const alpha = Math.max(0.2, Math.min(1, star.brightness + alphaPulse * 0.25));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;

      // Draw Star Core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Glow on Near & Primary Stars
      if (star.layer >= 2) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha * 0.28;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Optical 4-Point Diffraction Cross on Primary Stars (JWST / Hubble look)
      if (star.hasSpikes) {
        ctx.strokeStyle = star.color;
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

    // 6. INTERSTELLAR DUST MOTES (High-speed foreground particles)
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

  private renderVolumetricNebulae(ctx: CanvasRenderingContext2D, colors: string[], time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    colors.forEach((color, idx) => {
      const speed = 12 + idx * 8;
      const xBase = (this.width * 0.35 + idx * 420 - ((time * speed) % (this.width * 2))) % (this.width + 600);
      const yBase = this.height * (0.28 + idx * 0.26) + Math.sin(time * 0.4 + idx) * 35;
      const radius = 340 + idx * 60;

      const grad = ctx.createRadialGradient(xBase, yBase, 15, xBase, yBase, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(0.5, color.replace(/[\d.]+\)$/g, '0.12)'));
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(xBase, yBase, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderCosmicRadiationRibbon(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 18;
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
