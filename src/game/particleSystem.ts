/**
 * Earthfall: Beyond the Solar System - Ultra High-Performance Pooled Particle System
 * Features:
 * - Object pooling for zero-garbage collection lag on mobile devices
 * - Continuous engine exhaust trails behind Earth fading in 0.4s (with custom skin variations)
 * - 25-30 particle collision explosion bursts + shock rings + unique skin explosion types
 * - Collectible shimmering sparkles for stars and coins
 * - Small ring effects on 2nd and 3rd jumps
 */

import { SkinItem } from './types';

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
  shape?: 'circle' | 'spark' | 'ring' | 'streak' | 'diamond' | 'bubble';
  length?: number;
  glow?: boolean;
  active: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxActiveParticles = 450;

  constructor() {
    // Pre-populate pool with 450 reusable particles
    for (let i = 0; i < this.maxActiveParticles; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.4,
        active: false,
      });
    }
  }

  private obtain(): Particle | null {
    if (this.pool.length > 0) {
      const p = this.pool.pop()!;
      p.active = true;
      this.particles.push(p);
      return p;
    }
    return null;
  }

  private recycle(index: number) {
    const p = this.particles[index];
    p.active = false;
    this.particles.splice(index, 1);
    this.pool.push(p);
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Smooth decay curve
      p.alpha = Math.max(0, 1 - Math.pow(p.life / p.maxLife, 1.2));

      if (p.life >= p.maxLife) {
        this.recycle(i);
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
        ctx.rotate(p.life * 7);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.shape === 'ring') {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const r = p.size * (1 + (p.life / p.maxLife) * 2.5);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'bubble') {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Glowing circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.glow) {
          ctx.globalAlpha = p.alpha * 0.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Continuous small blue/white exhaust particles behind Earth while moving, fading in 0.4s.
   * Also respects skin trail type (fire, ember, bubble, neon, sparkle, smoke, stars, gold, rainbow, void, toxic).
   */
  public emitContinuousExhaust(
    earthX: number,
    earthY: number,
    isBoosting: boolean,
    skin?: SkinItem
  ) {
    const trailType = skin?.trailType || 'default';
    if (trailType === 'none') return;

    const count = isBoosting ? 4 : 2;

    for (let i = 0; i < count; i++) {
      const p = this.obtain();
      if (!p) break;

      const angle = Math.PI + (Math.random() - 0.5) * 0.45;
      const speed = isBoosting ? 260 + Math.random() * 200 : 130 + Math.random() * 90;

      p.x = earthX - 32 + (Math.random() - 0.5) * 6;
      p.y = earthY + (Math.random() - 0.5) * 14;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2.2 + Math.random() * 2.2;
      p.alpha = 0.95;
      p.life = 0;
      p.maxLife = 0.4; // Fades in 0.4s as requested!
      p.glow = true;

      // Color and shape customization per skin trail
      if (trailType === 'fire') {
        p.color = Math.random() > 0.5 ? '#f97316' : '#ef4444';
        p.shape = 'spark';
      } else if (trailType === 'ember') {
        p.color = Math.random() > 0.4 ? '#dc2626' : '#facc15';
        p.shape = 'spark';
      } else if (trailType === 'bubble') {
        p.color = '#38bdf8';
        p.shape = 'bubble';
        p.vy -= 25; // Floats slightly up
      } else if (trailType === 'neon') {
        p.color = Math.random() > 0.5 ? '#ec4899' : '#a855f7';
        p.shape = 'spark';
        p.size = 3;
      } else if (trailType === 'sparkle') {
        p.color = Math.random() > 0.4 ? '#ffffff' : '#bae6fd';
        p.shape = 'diamond';
      } else if (trailType === 'smoke') {
        p.color = Math.random() > 0.5 ? 'rgba(88, 28, 135, 0.7)' : 'rgba(24, 24, 27, 0.8)';
        p.shape = 'circle';
        p.size = 4;
      } else if (trailType === 'stars') {
        p.color = Math.random() > 0.5 ? '#c084fc' : '#fdf4ff';
        p.shape = 'diamond';
        p.size = 3;
      } else if (trailType === 'gold') {
        p.color = Math.random() > 0.5 ? '#fbbf24' : '#f59e0b';
        p.shape = 'diamond';
      } else if (trailType === 'rainbow') {
        const rainbowColors = ['#10b981', '#06b6d4', '#ec4899', '#f59e0b'];
        p.color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        p.shape = 'circle';
      } else if (trailType === 'void') {
        p.color = Math.random() > 0.5 ? '#9333ea' : '#3b0764';
        p.shape = 'diamond';
        p.vx = -p.vx * 0.4; // Void pulls particles inward
      } else if (trailType === 'toxic') {
        p.color = Math.random() > 0.5 ? '#84cc16' : '#dc2626';
        p.shape = 'circle';
      } else {
        // Default standard small blue/white particles
        p.color = Math.random() > 0.4 ? '#38bdf8' : '#ffffff';
        p.shape = 'circle';
      }
    }
  }

  /**
   * Collision explosion burst: 25-30 orange/red/white particles outward
   * Plus shock ring and skin explosion variations!
   */
  public emitExplosionBurst(
    x: number,
    y: number,
    skin?: SkinItem,
    customColor?: string
  ) {
    const explosionType = skin?.explosionType || 'default';
    const count = 28; // 25-30 particles

    let baseColor = customColor || '#f97316';
    let altColor = '#ef4444';

    if (explosionType === 'stars') {
      baseColor = '#c084fc';
      altColor = '#f3e8ff';
    } else if (explosionType === 'gold') {
      baseColor = '#fbbf24';
      altColor = '#fef08a';
    } else if (explosionType === 'toxic') {
      baseColor = '#84cc16';
      altColor = '#dc2626';
    } else if (explosionType === 'implosion') {
      baseColor = '#9333ea';
      altColor = '#3b0764';
    }

    for (let i = 0; i < count; i++) {
      const p = this.obtain();
      if (!p) break;

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = explosionType === 'implosion'
        ? -(120 + Math.random() * 220) // Inward pull
        : 90 + Math.random() * 280;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2.5 + Math.random() * 3.5;
      p.color = Math.random() > 0.6 ? '#ffffff' : Math.random() > 0.3 ? baseColor : altColor;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.25;
      p.shape = Math.random() > 0.4 ? 'spark' : 'circle';
      p.glow = true;
    }

    // Shockwave ring
    const ring = this.obtain();
    if (ring) {
      ring.x = x;
      ring.y = y;
      ring.vx = 0;
      ring.vy = 0;
      ring.size = 18;
      ring.color = baseColor;
      ring.alpha = 1;
      ring.life = 0;
      ring.maxLife = 0.3;
      ring.shape = 'ring';
    }
  }

  public emitExplosion(x: number, y: number, color = '#f97316', count = 25) {
    for (let i = 0; i < count; i++) {
      const p = this.obtain();
      if (!p) break;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 70 + Math.random() * 220;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2.5 + Math.random() * 3;
      p.color = Math.random() > 0.5 ? '#ffffff' : color;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.25;
      p.shape = 'spark';
      p.glow = true;
    }
  }

  /**
   * Shimmering effect for collectibles: stars/coins have constant sparkle particles
   */
  public emitCollectibleShimmer(x: number, y: number, color = '#38bdf8') {
    if (Math.random() > 0.55) return; // Gentle rate
    const p = this.obtain();
    if (!p) return;

    p.x = x + (Math.random() - 0.5) * 22;
    p.y = y + (Math.random() - 0.5) * 22;
    p.vx = (Math.random() - 0.5) * 25;
    p.vy = (Math.random() - 0.5) * 25 - 15;
    p.size = 1.8 + Math.random() * 2.2;
    p.color = Math.random() > 0.4 ? color : '#ffffff';
    p.alpha = 0.9;
    p.life = 0;
    p.maxLife = 0.35;
    p.shape = 'diamond';
    p.glow = true;
  }

  /**
   * Small shockwave ring effect on 2nd and 3rd jumps
   */
  public emitJumpRing(x: number, y: number, ringColor = '#38bdf8') {
    const p = this.obtain();
    if (p) {
      p.x = x;
      p.y = y + 16;
      p.vx = -60;
      p.vy = 0;
      p.size = 14;
      p.color = ringColor;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.32;
      p.shape = 'ring';
    }
  }

  public emitCollectSparkle(x: number, y: number, color = '#38bdf8', count = 18) {
    for (let i = 0; i < count; i++) {
      const p = this.obtain();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2 + Math.random() * 3;
      p.color = Math.random() > 0.3 ? color : '#ffffff';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.2;
      p.shape = 'spark';
      p.glow = true;
    }
  }

  public emitGroundSparks(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const p = this.obtain();
      if (!p) break;

      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.2;
      const speed = 120 + Math.random() * 180;

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + 26;
      p.vx = Math.cos(angle) * speed - 150;
      p.vy = Math.sin(angle) * speed;
      p.size = 2 + Math.random() * 2.5;
      p.color = Math.random() > 0.5 ? '#f97316' : '#fde047';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.3;
      p.shape = 'spark';
      p.glow = true;
    }
  }

  public emitEmpBlast(x: number, y: number) {
    for (let ring = 0; ring < 3; ring++) {
      const p = this.obtain();
      if (!p) break;
      p.x = x;
      p.y = y;
      p.vx = 0;
      p.vy = 0;
      p.size = 28 + ring * 24;
      p.color = ring % 2 === 0 ? '#38bdf8' : '#818cf8';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.45 + ring * 0.12;
      p.shape = 'ring';
    }

    for (let i = 0; i < 35; i++) {
      const p = this.obtain();
      if (!p) break;
      const angle = (i * Math.PI * 2) / 35;
      const speed = 240 + Math.random() * 300;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2.5 + Math.random() * 3;
      p.color = Math.random() > 0.4 ? '#38bdf8' : '#ffffff';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.42;
      p.shape = 'spark';
      p.glow = true;
    }
  }

  public emitPhaseDust(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      const p = this.obtain();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 140;
      p.x = x + (Math.random() - 0.5) * 28;
      p.y = y + (Math.random() - 0.5) * 28;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2.5 + Math.random() * 3;
      p.color = Math.random() > 0.5 ? '#c084fc' : '#e879f9';
      p.alpha = 0.95;
      p.life = 0;
      p.maxLife = 0.35;
      p.shape = 'diamond';
      p.glow = true;
    }
  }

  public emitRetroVentFlame(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const p = this.obtain();
      if (!p) break;
      const angle = Math.PI + (Math.random() - 0.5) * 0.75;
      const speed = 360 + Math.random() * 380;
      p.x = x - 26;
      p.y = y + (Math.random() - 0.5) * 20;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 3 + Math.random() * 4;
      p.color = Math.random() > 0.6 ? '#f97316' : Math.random() > 0.3 ? '#fef08a' : '#ef4444';
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.28;
      p.shape = 'spark';
      p.glow = true;
    }
  }

  public emitCometTrail(x: number, y: number, tailAngle: number, speed: number) {
    for (let i = 0; i < 2; i++) {
      const p = this.obtain();
      if (!p) break;
      const angle = tailAngle + (Math.random() - 0.5) * 0.35;
      const spd = speed * (0.35 + Math.random() * 0.45);
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.size = 2 + Math.random() * 2.5;
      p.color = Math.random() > 0.5 ? '#22d3ee' : '#a5f3fc';
      p.alpha = 0.8;
      p.life = 0;
      p.maxLife = 0.28;
      p.shape = 'circle';
      p.glow = true;
    }
  }

  public emitWarpSpeedLines(width: number, height: number) {
    for (let i = 0; i < 3; i++) {
      const p = this.obtain();
      if (!p) break;
      p.x = width + 25;
      p.y = Math.random() * height;
      p.vx = -(950 + Math.random() * 550);
      p.vy = 0;
      p.size = 2 + Math.random() * 2;
      p.length = 60 + Math.random() * 100;
      p.color = Math.random() > 0.4 ? '#fde047' : '#38bdf8';
      p.alpha = 0.7;
      p.life = 0;
      p.maxLife = 0.55;
      p.shape = 'streak';
    }
  }

  public clear() {
    while (this.particles.length > 0) {
      const p = this.particles.pop()!;
      p.active = false;
      this.pool.push(p);
    }
  }
}
