/**
 * Earthfall: Beyond the Solar System - Ultra High-Fidelity Particle FX Engine
 * Features:
 * - Dual-cone ion exhaust with Mach diamond shock rings
 * - Atmospheric entry bow-shock plasma when diving at high speeds
 * - Glowing molten sparks and debris fragments on asteroid impacts
 * - EMP electric shockwave rings and chromatic discharge
 * - Ground friction hazard sparks and incinerating heat plumes
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'ring' | 'streak' | 'diamond';
  length?: number;
  glow?: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 650;

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Smooth decay curve
      p.alpha = Math.max(0, 1 - Math.pow(p.life / p.maxLife, 1.4));

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'streak') {
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.length || 24), p.y);
        ctx.stroke();
      } else if (p.shape === 'spark' || p.shape === 'diamond') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 6);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.shape === 'ring') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        const r = p.size * (1 + (p.life / p.maxLife) * 2.8);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Glowing circle with soft corona
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.glow) {
          ctx.globalAlpha = p.alpha * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  public emitThrusterWake(x: number, y: number, isBoosting: boolean, customColor?: string) {
    if (this.particles.length >= this.maxParticles) return;

    const count = isBoosting ? 6 : 3;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 0.35;
      const speed = isBoosting ? 280 + Math.random() * 260 : 140 + Math.random() * 120;

      // Mach Diamond Shock Core
      this.particles.push({
        x: x - 26 + Math.random() * 6,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isBoosting ? 4 + Math.random() * 3.5 : 2.5 + Math.random() * 2.5,
        color: customColor
          ? customColor
          : isBoosting
          ? Math.random() > 0.5
            ? '#fbbf24'
            : '#f59e0b'
          : Math.random() > 0.4
          ? '#38bdf8'
          : '#e0f2fe',
        alpha: 0.95,
        life: 0,
        maxLife: isBoosting ? 0.38 : 0.28,
        shape: Math.random() > 0.6 ? 'diamond' : 'circle',
        glow: true,
      });

      // Outer hot ion plume
      if (Math.random() > 0.5) {
        this.particles.push({
          x: x - 30,
          y: y + (Math.random() - 0.5) * 22,
          vx: Math.cos(angle) * (speed * 0.7),
          vy: Math.sin(angle) * (speed * 0.7),
          size: 1.5 + Math.random() * 2,
          color: customColor ? customColor : '#bae6fd',
          alpha: 0.6,
          life: 0,
          maxLife: 0.22,
          shape: 'circle',
        });
      }
    }
  }

  public emitGroundSparks(x: number, y: number) {
    if (this.particles.length >= this.maxParticles) return;

    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      const speed = 120 + Math.random() * 220;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + 26,
        vx: Math.cos(angle) * speed - 150,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#f97316' : '#fde047',
        alpha: 1,
        life: 0,
        maxLife: 0.35,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitExplosion(x: number, y: number, color = '#f97316', count = 35) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 320;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4.5,
        color: Math.random() > 0.4 ? color : Math.random() > 0.5 ? '#fef08a' : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.4,
        shape: Math.random() > 0.4 ? 'spark' : 'circle',
        glow: true,
      });
    }

    // Expanding high-intensity shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 18,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.35,
      shape: 'ring',
    });
  }

  public emitCollectSparkle(x: number, y: number, color = '#38bdf8', count = 20) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 190;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.25,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitCometTrail(x: number, y: number, tailAngle: number, speed: number) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 3; i++) {
      const angle = tailAngle + (Math.random() - 0.5) * 0.35;
      const spd = speed * (0.35 + Math.random() * 0.45);

      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2.2 + Math.random() * 2.8,
        color: Math.random() > 0.5 ? '#22d3ee' : '#a5f3fc',
        alpha: 0.8,
        life: 0,
        maxLife: 0.32,
        shape: 'circle',
        glow: true,
      });
    }
  }

  public emitWarpSpeedLines(width: number, height: number) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: width + 30,
        y: Math.random() * height,
        vx: -(1000 + Math.random() * 600),
        vy: 0,
        size: 2 + Math.random() * 2.5,
        length: 70 + Math.random() * 120,
        color: Math.random() > 0.4 ? '#fde047' : '#38bdf8',
        alpha: 0.75,
        life: 0,
        maxLife: 0.65,
        shape: 'streak',
      });
    }
  }

  public emitEmpBlast(x: number, y: number) {
    // Concentric expanding shockwave rings
    for (let ring = 0; ring < 4; ring++) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 32 + ring * 28,
        color: ring % 2 === 0 ? '#38bdf8' : '#818cf8',
        alpha: 1,
        life: 0,
        maxLife: 0.55 + ring * 0.15,
        shape: 'ring',
      });
    }

    // High velocity EMP sparks radiating 360 deg
    for (let i = 0; i < 55; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (i * Math.PI * 2) / 55;
      const speed = 260 + Math.random() * 360;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        alpha: 1,
        life: 0,
        maxLife: 0.48,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitPhaseDust(x: number, y: number) {
    for (let i = 0; i < 22; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 32,
        y: y + (Math.random() - 0.5) * 32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.5 ? '#c084fc' : '#e879f9',
        alpha: 0.95,
        life: 0,
        maxLife: 0.4,
        shape: 'diamond',
        glow: true,
      });
    }
  }

  public emitRetroVentFlame(x: number, y: number) {
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.PI + (Math.random() - 0.5) * 0.75;
      const speed = 380 + Math.random() * 420;
      this.particles.push({
        x: x - 26,
        y: y + (Math.random() - 0.5) * 22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 4.5,
        color: Math.random() > 0.6 ? '#f97316' : Math.random() > 0.3 ? '#fef08a' : '#ef4444',
        alpha: 1,
        life: 0,
        maxLife: 0.32,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public clear() {
    this.particles = [];
  }
}
