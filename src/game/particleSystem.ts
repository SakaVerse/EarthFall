/**
 * Earthfall: Beyond the Solar System - High-Performance Particle Engine
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
  shape?: 'circle' | 'spark' | 'ring' | 'streak';
  length?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 450;

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Decay alpha
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'streak') {
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.length || 20), p.y);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'ring') {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const r = p.size * (1 + (p.life / p.maxLife) * 2);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public emitThrusterWake(x: number, y: number, isBoosting: boolean) {
    if (this.particles.length >= this.maxParticles) return;

    const count = isBoosting ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 0.45;
      const speed = isBoosting ? 260 + Math.random() * 200 : 120 + Math.random() * 100;

      this.particles.push({
        x: x - 25 + Math.random() * 8,
        y: y + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isBoosting ? 3.5 + Math.random() * 3 : 2 + Math.random() * 2.5,
        color: isBoosting
          ? Math.random() > 0.5
            ? '#fbbf24'
            : '#f59e0b'
          : Math.random() > 0.4
          ? '#38bdf8'
          : '#e0f2fe',
        alpha: 0.85,
        life: 0,
        maxLife: isBoosting ? 0.35 : 0.25,
        shape: 'circle',
      });
    }
  }

  public emitExplosion(x: number, y: number, color = '#f97316', count = 28) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 260;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? color : '#fef08a',
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.35,
        shape: Math.random() > 0.5 ? 'spark' : 'circle',
      });
    }

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 14,
      color,
      alpha: 0.9,
      life: 0,
      maxLife: 0.3,
      shape: 'ring',
    });
  }

  public emitCollectSparkle(x: number, y: number, color = '#38bdf8', count = 16) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        shape: 'spark',
      });
    }
  }

  public emitCometTrail(x: number, y: number, tailAngle: number, speed: number) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 2; i++) {
      const angle = tailAngle + (Math.random() - 0.5) * 0.3;
      const spd = speed * (0.3 + Math.random() * 0.4);

      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#22d3ee' : '#a5f3fc',
        alpha: 0.75,
        life: 0,
        maxLife: 0.3,
        shape: 'circle',
      });
    }
  }

  public emitWarpSpeedLines(width: number, height: number) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: width + 20,
        y: Math.random() * height,
        vx: -(900 + Math.random() * 500),
        vy: 0,
        size: 1.5 + Math.random() * 2,
        length: 50 + Math.random() * 90,
        color: '#fde047',
        alpha: 0.6,
        life: 0,
        maxLife: 0.7,
        shape: 'streak',
      });
    }
  }

  public emitEmpBlast(x: number, y: number) {
    // Concentric expanding shockwave rings
    for (let ring = 0; ring < 3; ring++) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 30 + ring * 25,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: 0.5 + ring * 0.15,
        shape: 'ring',
      });
    }

    // High velocity EMP sparks radiating 360 deg
    for (let i = 0; i < 45; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (i * Math.PI * 2) / 45;
      const speed = 250 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
        alpha: 1,
        life: 0,
        maxLife: 0.45,
        shape: 'spark',
      });
    }
  }

  public emitPhaseDust(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 140;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#c084fc' : '#e879f9',
        alpha: 0.9,
        life: 0,
        maxLife: 0.35,
        shape: 'circle',
      });
    }
  }

  public emitRetroVentFlame(x: number, y: number) {
    // Searing cone of backwards flame
    for (let i = 0; i < 28; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.PI + (Math.random() - 0.5) * 0.8;
      const speed = 350 + Math.random() * 380;
      this.particles.push({
        x: x - 25,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.6 ? '#f97316' : Math.random() > 0.3 ? '#fef08a' : '#ef4444',
        alpha: 1,
        life: 0,
        maxLife: 0.3,
        shape: 'spark',
      });
    }
  }

  public clear() {
    this.particles = [];
  }
}
