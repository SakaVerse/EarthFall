/**
 * Earthfall: Beyond the Solar System - Infinite Parallax Space Renderer
 * Renders multiple deep space parallax layers, nebulae, distant planets,
 * and smooth transitions between all 5 cosmic zones.
 */

import { ZONES } from './constants';
import { ZoneId } from './types';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
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
  private celestialObjects: CelestialObject[] = [];
  private width = 1280;
  private height = 720;

  constructor() {
    this.initStars(180);
    this.initCelestials();
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  private initStars(count: number) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : 2;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: layer === 0 ? 1 : layer === 1 ? 1.6 : 2.5,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
        layer,
        color: Math.random() > 0.85 ? '#93c5fd' : Math.random() > 0.7 ? '#fef08a' : '#ffffff',
      });
    }
  }

  private initCelestials() {
    this.celestialObjects = [
      { x: 400, y: 160, type: 'saturn', size: 55, speedRatio: 0.08, angle: 0 },
      { x: 950, y: 480, type: 'mars', size: 38, speedRatio: 0.12, angle: 0 },
      { x: 1500, y: 220, type: 'jupiter', size: 70, speedRatio: 0.06, angle: 0 },
      { x: 2200, y: 350, type: 'nebula', size: 180, speedRatio: 0.15, angle: 0 },
      { x: 3100, y: 180, type: 'ice_planet', size: 52, speedRatio: 0.1, angle: 0 },
      { x: 4200, y: 300, type: 'quantum_rift', size: 90, speedRatio: 0.09, angle: 0 },
    ];
  }

  public update(dt: number, gameSpeed: number) {
    // Parallax update for stars
    for (const star of this.stars) {
      const speed = (star.layer === 0 ? 0.15 : star.layer === 1 ? 0.4 : 0.8) * gameSpeed;
      star.x -= speed * dt;
      if (star.x < -10) {
        star.x = this.width + Math.random() * 20;
        star.y = Math.random() * this.height;
      }
    }

    // Parallax update for distant celestial landmarks
    for (const obj of this.celestialObjects) {
      obj.x -= gameSpeed * obj.speedRatio * dt;
      if (obj.x < -obj.size * 2) {
        obj.x = this.width + 400 + Math.random() * 800;
        obj.y = 80 + Math.random() * (this.height - 180);
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    distance: number,
    currentZone: ZoneId,
    time: number
  ) {
    const zoneConfig = ZONES[currentZone];

    // 1. SKY GRADIENT
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, zoneConfig.bgGradient[0]);
    bgGrad.addColorStop(0.5, zoneConfig.bgGradient[1]);
    bgGrad.addColorStop(1, zoneConfig.bgGradient[2]);

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. PROCEDURAL NEBULA CLOUDS (Subtle glowing gaseous layers)
    this.renderNebulaClouds(ctx, zoneConfig.nebulaColors, time);

    // 3. DISTANT PLANETS & CELESTIALS
    for (const obj of this.celestialObjects) {
      if (obj.x > -obj.size * 2 && obj.x < this.width + obj.size * 2) {
        this.renderCelestialObject(ctx, obj, currentZone, time);
      }
    }

    // 4. PARALLAX STARS
    ctx.save();
    for (const star of this.stars) {
      const alpha =
        0.35 +
        Math.sin(time * star.twinkleSpeed + star.x) * 0.25 +
        (star.layer === 2 ? 0.3 : 0.1);

      ctx.globalAlpha = Math.max(0.15, Math.min(1, alpha));
      ctx.fillStyle = star.color;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow on brightest near stars
      if (star.layer === 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderNebulaClouds(ctx: CanvasRenderingContext2D, colors: string[], time: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    colors.forEach((color, idx) => {
      const offset = (time * 8 * (idx + 1)) % (this.width * 2);
      const grad = ctx.createRadialGradient(
        (this.width * 0.4 + idx * 300 - offset) % (this.width + 400),
        this.height * (0.3 + idx * 0.3),
        20,
        (this.width * 0.4 + idx * 300 - offset) % (this.width + 400),
        this.height * (0.3 + idx * 0.3),
        320
      );
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(
        (this.width * 0.4 + idx * 300 - offset) % (this.width + 400),
        this.height * (0.3 + idx * 0.3),
        320,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    ctx.restore();
  }

  private renderCelestialObject(
    ctx: CanvasRenderingContext2D,
    obj: CelestialObject,
    zone: ZoneId,
    time: number
  ) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.type === 'saturn') {
      // Saturn planet sphere
      const pGrad = ctx.createRadialGradient(-obj.size * 0.3, -obj.size * 0.3, 5, 0, 0, obj.size);
      pGrad.addColorStop(0, '#fef3c7');
      pGrad.addColorStop(0.5, '#d97706');
      pGrad.addColorStop(1, '#78350f');

      // Back half of planetary rings
      ctx.save();
      ctx.rotate(0.35);
      ctx.scale(1, 0.3);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 1.9, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Planet body
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Cloud bands
      ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
      ctx.fillRect(-obj.size, -obj.size * 0.2, obj.size * 2, obj.size * 0.35);

      // Front half of planetary rings
      ctx.save();
      ctx.rotate(0.35);
      ctx.scale(1, 0.3);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 1.9, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    } else if (obj.type === 'mars') {
      const mGrad = ctx.createRadialGradient(-obj.size * 0.3, -obj.size * 0.3, 4, 0, 0, obj.size);
      mGrad.addColorStop(0, '#fca5a5');
      mGrad.addColorStop(0.6, '#dc2626');
      mGrad.addColorStop(1, '#450a0a');

      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Polar ice cap
      ctx.fillStyle = 'rgba(254, 242, 242, 0.7)';
      ctx.beginPath();
      ctx.arc(0, -obj.size * 0.82, obj.size * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'jupiter') {
      const jGrad = ctx.createRadialGradient(-obj.size * 0.3, -obj.size * 0.3, 8, 0, 0, obj.size);
      jGrad.addColorStop(0, '#fed7aa');
      jGrad.addColorStop(0.5, '#ea580c');
      jGrad.addColorStop(1, '#431407');

      ctx.fillStyle = jGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Great Red Spot
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(obj.size * 0.35, obj.size * 0.25, obj.size * 0.25, obj.size * 0.16, 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'ice_planet') {
      const iGrad = ctx.createRadialGradient(-obj.size * 0.3, -obj.size * 0.3, 5, 0, 0, obj.size);
      iGrad.addColorStop(0, '#e0f2fe');
      iGrad.addColorStop(0.5, '#0284c7');
      iGrad.addColorStop(1, '#082f49');

      ctx.fillStyle = iGrad;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
      ctx.fill();

      // Crystalline frost corona
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, obj.size * 1.15, 0, Math.PI * 2);
      ctx.stroke();
    } else if (obj.type === 'quantum_rift') {
      // Swirling portal galaxy
      ctx.save();
      ctx.rotate(time * 0.5);
      const spiralR = obj.size * 1.4;
      const riftGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, spiralR);
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.3, '#ec4899');
      riftGrad.addColorStop(0.7, '#8b5cf6');
      riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.arc(0, 0, spiralR, 0, Math.PI * 2);
      ctx.fill();

      // Quantum accretion arms
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
      ctx.lineWidth = 3;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
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
