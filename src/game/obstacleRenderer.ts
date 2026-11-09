/**
 * Earthfall: Beyond the Solar System - Obstacle and Collectible Visual Engine
 * Renders procedural asteroids, comets, space debris, lasers, black holes, and powerups.
 */

import { CosmicEnergyOrb, Obstacle, PowerUpItem } from './types';
import { POWER_UP_CONFIG } from './constants';

export function renderObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  time: number
) {
  // If telegraphing warning (e.g. for incoming high-speed meteors/comets)
  if (obs.isTelegraphing) {
    renderTelegraph(ctx, obs, time);
    return;
  }

  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.rotate(obs.rotation);

  switch (obs.type) {
    case 'SMALL_ASTEROID':
      renderSmallAsteroid(ctx, obs);
      break;
    case 'GIANT_ASTEROID':
      renderGiantAsteroid(ctx, obs, time);
      break;
    case 'METEOR_SHOWER':
      renderMeteor(ctx, obs, time);
      break;
    case 'COMET':
      renderComet(ctx, obs, time);
      break;
    case 'SPACE_DEBRIS':
      renderSpaceDebris(ctx, obs, time);
      break;
    case 'ENERGY_BARRIER':
      renderEnergyBarrier(ctx, obs, time);
      break;
    case 'COSMIC_STORM':
      renderCosmicStorm(ctx, obs, time);
      break;
    case 'GRAVITATIONAL_ANOMALY':
      renderGravitationalAnomaly(ctx, obs, time);
      break;
    case 'SOLAR_FLARE':
      renderSolarFlare(ctx, obs, time);
      break;
    case 'VOID_CRYSTAL':
      renderVoidCrystal(ctx, obs, time);
      break;
    case 'PULSAR_STAR':
      renderPulsarStar(ctx, obs, time);
      break;
    case 'ALIEN_MINE':
      renderAlienMine(ctx, obs, time);
      break;
    case 'COSMIC_LEVIATHAN':
      renderCosmicLeviathan(ctx, obs, time);
      break;
    case 'ANTIMATTER_VORTEX':
      renderAntimatterVortex(ctx, obs, time);
      break;
  }

  ctx.restore();
}

function renderTelegraph(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  ctx.save();
  const flash = Math.sin(time * 24) > 0;
  
  // Warning laser lane
  ctx.strokeStyle = flash ? 'rgba(239, 68, 68, 0.75)' : 'rgba(239, 68, 68, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(0, obs.y);
  ctx.lineTo(1280, obs.y);
  ctx.stroke();

  // Warning Icon on right edge
  ctx.fillStyle = flash ? '#ef4444' : '#991b1b';
  ctx.font = 'bold 13px var(--font-mono)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ HIGH-SPEED HAZARD ⚠', 1260, obs.y);

  ctx.restore();
}

function renderSmallAsteroid(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  ctx.save();

  // Draw irregular polygon
  if (obs.points && obs.points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(obs.points[0].x, obs.points[0].y);
    for (let i = 1; i < obs.points.length; i++) {
      ctx.lineTo(obs.points[i].x, obs.points[i].y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    grad.addColorStop(0, '#a8a29e');
    grad.addColorStop(0.6, '#78716c');
    grad.addColorStop(1, '#292524');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Minor craters
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.15, r * 0.2, 0, Math.PI * 2);
    ctx.arc(r * 0.2, r * 0.25, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderGiantAsteroid(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  if (obs.points && obs.points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(obs.points[0].x, obs.points[0].y);
    for (let i = 1; i < obs.points.length; i++) {
      ctx.lineTo(obs.points[i].x, obs.points[i].y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 5, 0, 0, r);
    grad.addColorStop(0, '#78716c');
    grad.addColorStop(0.5, '#44403c');
    grad.addColorStop(1, '#1c1917');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing magma/crystal fissure cracks
    ctx.save();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(-r * 0.1, 0);
    ctx.lineTo(r * 0.3, -r * 0.3);
    ctx.lineTo(r * 0.5, r * 0.1);
    ctx.stroke();
    ctx.restore();

    // Craters
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(-r * 0.2, r * 0.3, r * 0.22, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.arc(-r * 0.4, -r * 0.3, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderMeteor(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Long burning flame tail
  const tailLength = r * 4.5;
  const flameGrad = ctx.createLinearGradient(0, 0, tailLength, 0);
  flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
  flameGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.7)');
  flameGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.lineTo(tailLength, 0);
  ctx.lineTo(0, r * 0.8);
  ctx.closePath();
  ctx.fill();

  // White-hot meteor core
  const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#fef08a');
  coreGrad.addColorStop(0.7, '#f97316');
  coreGrad.addColorStop(1, '#dc2626');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderComet(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Dual Tails: Curved dust tail + straight cyan ion tail
  const tailLen = r * 5;

  // Ion gas tail
  const ionGrad = ctx.createLinearGradient(0, 0, tailLen, 0);
  ionGrad.addColorStop(0, 'rgba(34, 211, 238, 0.85)');
  ionGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
  ionGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

  ctx.fillStyle = ionGrad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(tailLen, -r * 0.2);
  ctx.lineTo(0, r * 0.6);
  ctx.closePath();
  ctx.fill();

  // Glacial nucleus
  const nucGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
  nucGrad.addColorStop(0, '#ffffff');
  nucGrad.addColorStop(0.4, '#a5f3fc');
  nucGrad.addColorStop(0.8, '#0891b2');
  nucGrad.addColorStop(1, '#0e7490');

  ctx.fillStyle = nucGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Frost halo
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function renderSpaceDebris(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Metallic central chassis
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);

  // Gold thermal insulation foil
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);

  // Solar panel wings
  ctx.fillStyle = '#1e3a8a';
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1;

  // Left wing
  ctx.fillRect(-r * 1.6, -r * 0.35, r * 0.9, r * 0.7);
  ctx.strokeRect(-r * 1.6, -r * 0.35, r * 0.9, r * 0.7);

  // Right wing
  ctx.fillRect(r * 0.7, -r * 0.35, r * 0.9, r * 0.7);
  ctx.strokeRect(r * 0.7, -r * 0.35, r * 0.9, r * 0.7);

  // Flashing red emergency beacon
  const beaconOn = Math.sin(time * 10) > 0;
  ctx.fillStyle = beaconOn ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, -r * 0.6, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderEnergyBarrier(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const halfH = obs.height / 2;
  ctx.save();

  // Upper & lower emitter pylons
  ctx.fillStyle = '#334155';
  ctx.fillRect(-12, -halfH, 24, 20);
  ctx.fillRect(-12, halfH - 20, 24, 20);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-6, -halfH + 6, 12, 8);
  ctx.fillRect(-6, halfH - 14, 12, 8);

  // Crackling plasma beam between pylons
  const beamGrad = ctx.createLinearGradient(-10, 0, 10, 0);
  beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.85)');
  beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

  ctx.fillStyle = beamGrad;
  ctx.fillRect(-10, -halfH + 20, 20, obs.height - 40);

  // Center electric jitter line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -halfH + 20);

  const segments = 12;
  const segH = (obs.height - 40) / segments;
  for (let i = 1; i < segments; i++) {
    const jitterX = (Math.random() - 0.5) * 8;
    ctx.lineTo(jitterX, -halfH + 20 + i * segH);
  }
  ctx.lineTo(0, halfH - 20);
  ctx.stroke();

  ctx.restore();
}

function renderCosmicStorm(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Swirling plasma vortex
  ctx.rotate(time * 2);
  const stormGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
  stormGrad.addColorStop(0, '#ffffff');
  stormGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.7)');
  stormGrad.addColorStop(0.8, 'rgba(79, 70, 229, 0.3)');
  stormGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = stormGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Lightning arcs
  ctx.strokeStyle = '#e0e7ff';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.5 + (Math.random() - 0.5) * 8, Math.sin(a) * r * 0.5);
    ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
    ctx.stroke();
  }

  ctx.restore();
}

function renderGravitationalAnomaly(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Bright gravitational accretion disk (outer glow)
  ctx.rotate(time * 1.5);
  const accGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.4);
  accGrad.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
  accGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.45)');
  accGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = accGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Spacetime distortion rings
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
  ctx.stroke();

  // Singularity (Event Horizon - pitch black center)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Photon sphere rim
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function renderSolarFlare(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Boiling Coronal Arch
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, Math.PI * 0.15, Math.PI * 0.95);
  ctx.stroke();

  // Inner superheated core
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, Math.PI * 0.2, Math.PI * 0.9);
  ctx.stroke();

  // Plasma bubbles / granules
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * 0.3 + i * 0.2 + Math.sin(time * 8 + i) * 0.05;
    const px = Math.cos(a) * r * 0.85;
    const py = Math.sin(a) * r * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Coronal prominence burst
  const burstGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.6);
  burstGrad.addColorStop(0, '#ffffff');
  burstGrad.addColorStop(0.3, '#f59e0b');
  burstGrad.addColorStop(0.8, '#dc2626');
  burstGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = burstGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderVoidCrystal(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Multifaceted geometric crystal
  if (obs.points && obs.points.length > 0) {
    // Outer void aura
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.moveTo(obs.points[0].x, obs.points[0].y);
    for (let i = 1; i < obs.points.length; i++) {
      ctx.lineTo(obs.points[i].x, obs.points[i].y);
    }
    ctx.closePath();

    // Dark obsidian gradient
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#3b0764');
    grad.addColorStop(0.5, '#1e0538');
    grad.addColorStop(1, '#0f021c');

    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing crystalline edges
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner facet lines
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < obs.points.length; i += 2) {
      ctx.moveTo(0, 0);
      ctx.lineTo(obs.points[i].x, obs.points[i].y);
    }
    ctx.stroke();
  }

  // Crackling center nucleus
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderPulsarStar(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Sweeping collimated gamma-ray beam
  const beamAngle = obs.customData?.beamAngle ?? (time * 2.8);
  const beamLength = r * 3.8;

  ctx.save();
  ctx.rotate(beamAngle);

  // Dual opposing emission beams
  const beamGrad = ctx.createLinearGradient(0, 0, beamLength, 0);
  beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  beamGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.7)');
  beamGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.35)');
  beamGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

  ctx.fillStyle = beamGrad;

  // Beam 1 (Right)
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(beamLength, -16);
  ctx.lineTo(beamLength, 16);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  // Beam 2 (Left opposing)
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-beamLength, -16);
  ctx.lineTo(-beamLength, 16);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Magnetic field loops
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.3, r * 0.65, beamAngle + Math.PI / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Hyper-dense Neutron Star Core
  const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.55);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#7dd3fc');
  coreGrad.addColorStop(1, '#0284c7');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderAlienMine(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Armored spherical sentinel chassis
  const hullGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
  hullGrad.addColorStop(0, '#64748b');
  hullGrad.addColorStop(0.6, '#334155');
  hullGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // 6 Metallic Sensor Spikes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    ctx.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
    ctx.stroke();

    // Red proximity diodes on spike tips
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scanning Target Lock Reticle (Rotates slowly)
  ctx.save();
  ctx.rotate(time * 3);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Pulsing central optical eye
  const eyeFlash = Math.sin(time * 12) > 0;
  ctx.fillStyle = eyeFlash ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderCosmicLeviathan(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // 4 Undulating Bioluminescent Tentacles (Trailing behind to the right)
  for (let tIdx = 0; tIdx < 4; tIdx++) {
    const yOff = (tIdx - 1.5) * (r * 0.35);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 3 - tIdx * 0.4;
    ctx.beginPath();
    ctx.moveTo(r * 0.4, yOff);

    const tentacleLen = r * 3;
    const segs = 10;
    const segW = tentacleLen / segs;
    for (let s = 1; s <= segs; s++) {
      const tx = r * 0.4 + s * segW;
      const wave = Math.sin(time * 6 + s * 0.6 + tIdx) * (s * 2.2);
      ctx.lineTo(tx, yOff + wave);
    }
    ctx.stroke();
  }

  // Streamlined Cephalopod Mantle Body
  const mantleGrad = ctx.createRadialGradient(-r * 0.3, 0, 2, 0, 0, r);
  mantleGrad.addColorStop(0, '#14b8a6');
  mantleGrad.addColorStop(0.4, '#0f766e');
  mantleGrad.addColorStop(0.8, '#134e4a');
  mantleGrad.addColorStop(1, '#042f2e');

  ctx.fillStyle = mantleGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bioluminescent sensory nodes
  ctx.fillStyle = '#5eead4';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
  ctx.arc(-r * 0.3, r * 0.2, 3, 0, Math.PI * 2);
  ctx.arc(-r * 0.5, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderAntimatterVortex(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  const r = obs.radius;
  ctx.save();

  // Dual Spiral Arms: One Matter (Cyan), One Antimatter (Magenta)
  ctx.rotate(time * 3);

  // Cyan spiral arm
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.2) {
    const dist = (a / (Math.PI * 2)) * r;
    ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
  }
  ctx.stroke();

  // Magenta opposing spiral arm
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.2) {
    const dist = (a / (Math.PI * 2)) * r;
    ctx.lineTo(Math.cos(a + Math.PI) * dist, Math.sin(a + Math.PI) * dist);
  }
  ctx.stroke();

  // Annihilation Core (High-energy quantum collision center)
  const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.4);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#c084fc');
  coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}


// ----------------------------------------------------
// COLLECTIBLES & POWER-UPS
// ----------------------------------------------------

export function renderCosmicOrb(
  ctx: CanvasRenderingContext2D,
  orb: CosmicEnergyOrb,
  time: number
) {
  ctx.save();
  const floatY = orb.y + Math.sin(time * 4 + orb.pulseTimer) * 6;
  ctx.translate(orb.x, floatY);

  const pulse = 1 + Math.sin(time * 6 + orb.pulseTimer) * 0.15;
  const r = orb.radius * pulse;

  // Luminous aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.5);
  aura.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
  aura.addColorStop(0.5, 'rgba(14, 165, 233, 0.3)');
  aura.addColorStop(1, 'rgba(14, 165, 233, 0)');

  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Brilliant core
  const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, '#7dd3fc');
  coreGrad.addColorStop(1, '#0284c7');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Sparkling star flare
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1, -r * 1.5, 2, r * 3);
  ctx.fillRect(-r * 1.5, -1, r * 3, 2);

  ctx.restore();
}

export function renderPowerUp(
  ctx: CanvasRenderingContext2D,
  p: PowerUpItem,
  time: number
) {
  ctx.save();
  ctx.translate(p.x, p.y + Math.sin(time * 3 + p.angle) * 5);

  const conf = POWER_UP_CONFIG[p.type];
  const r = p.radius;

  // Outer radiant ring
  ctx.save();
  ctx.rotate(time * 2);
  ctx.strokeStyle = conf.color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner hexagonal capsule
  ctx.save();
  ctx.rotate(-time * 1.2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = conf.color;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Center Symbol
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(conf.symbol, 0, 0);

  ctx.restore();
}
