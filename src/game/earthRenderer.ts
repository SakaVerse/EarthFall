/**
 * Earthfall: Beyond the Solar System - Photorealistic Earth Canvas Renderer
 * Renders an orbital, scientifically inspired planet Earth:
 * - Rayleigh atmospheric scattering & limb brightening
 * - Deep ocean bathymetry with turquoise continental shelf margins
 * - Realistic continent contours with deserts, rain forests, and snow-capped mountain ridges
 * - Multi-layer dynamic cloud systems with cloud drop-shadows onto terrain
 * - Specular ocean sun glint
 * - Night-side anthropic city lights & dancing polar auroras (Borealis/Australis)
 * - Cratered Moon with lunar maria
 * - Active player skill animations (EMP Shockwave, Phase Warp, Retro-Vent)
 */

import { SkinItem } from './types';
import {
  createLowPolyEarthMesh,
  createLowPolyCloudShellMesh,
  createLowPolyMoonMesh,
  renderLowPolyMesh,
  LowPolyMesh,
} from './lowPoly3D';

// Pre-cached procedural low-poly meshes to guarantee zero garbage-collection in render loop
const earthMeshCache = new Map<string, LowPolyMesh>();
const cloudShellMesh = createLowPolyCloudShellMesh(2);
const moonMesh = createLowPolyMoonMesh();

function getCachedEarthMesh(skin?: SkinItem): LowPolyMesh {
  const key = skin?.id || 'earth_classic';
  if (!earthMeshCache.has(key)) {
    earthMeshCache.set(key, createLowPolyEarthMesh(3, skin));
  }
  return earthMeshCache.get(key)!;
}

interface EarthRenderOptions {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  cloudRotation: number;
  verticalTilt: number;
  health: number; // 0 to 100
  jumpsRemaining?: number; // In-game jumps counter near player (e.g. 7/10 Jumps)
  maxJumps?: number;
  isShielded: boolean;
  isBoosted: boolean;
  isMagnetized: boolean;
  isPhasing: boolean; // From Phase Warp skill
  isHitFlash: boolean;
  time: number;
  skin?: SkinItem;
}

// Detailed continental clusters [lon (-180..180), lat (-90..90), rx, ry, type, rotation]
// Types: 0 = Rainforest/Temperate green, 1 = Desert/Savanna ochre, 2 = Snow/Glacier, 3 = Mountain granite
const DETAILED_LANDMASSES = [
  // NORTH AMERICA
  { lon: -105, lat: 50, rx: 32, ry: 20, type: 0, rot: -0.1 }, // Canada/US
  { lon: -125, lat: 58, rx: 22, ry: 16, type: 0, rot: 0.2 }, // Alaska
  { lon: -115, lat: 42, rx: 12, ry: 26, type: 3, rot: 0.35 }, // Rockies mountain range
  { lon: -82, lat: 36, rx: 22, ry: 20, type: 0, rot: 0 }, // US East
  { lon: -82, lat: 26, rx: 8, ry: 16, type: 0, rot: 0.2 }, // Florida peninsula
  { lon: -102, lat: 25, rx: 14, ry: 22, type: 1, rot: 0.3 }, // Mexico / Sonora desert
  { lon: -88, lat: 15, rx: 8, ry: 10, type: 0, rot: 0.4 }, // Central America
  // GREENLAND
  { lon: -40, lat: 73, rx: 20, ry: 24, type: 2, rot: -0.1 },
  // SOUTH AMERICA
  { lon: -62, lat: -4, rx: 28, ry: 22, type: 0, rot: 0 }, // Amazon basin
  { lon: -72, lat: -18, rx: 10, ry: 38, type: 3, rot: 0.15 }, // Andes mountain spine
  { lon: -50, lat: -15, rx: 22, ry: 24, type: 0, rot: -0.2 }, // Brazil highlands
  { lon: -65, lat: -38, rx: 14, ry: 22, type: 1, rot: 0.05 }, // Pampas / Patagonia
  // EUROPE
  { lon: 12, lat: 52, rx: 18, ry: 14, type: 0, rot: 0 }, // Central Europe
  { lon: -4, lat: 40, rx: 14, ry: 12, type: 1, rot: 0 }, // Iberia
  { lon: -4, lat: 54, rx: 8, ry: 12, type: 0, rot: 0.2 }, // British Isles
  { lon: 15, lat: 62, rx: 14, ry: 20, type: 0, rot: 0.2 }, // Scandinavia
  { lon: 10, lat: 46, rx: 10, ry: 6, type: 3, rot: 0 }, // Alps
  { lon: 13, lat: 42, rx: 6, ry: 14, type: 0, rot: -0.3 }, // Italy
  // AFRICA
  { lon: 18, lat: 24, rx: 32, ry: 18, type: 1, rot: 0 }, // Sahara Desert North
  { lon: 28, lat: 22, rx: 24, ry: 16, type: 1, rot: 0.1 }, // Egyptian desert
  { lon: 20, lat: 4, rx: 26, ry: 20, type: 0, rot: 0 }, // Congo rainforest
  { lon: 36, lat: 8, rx: 14, ry: 16, type: 3, rot: 0.2 }, // Ethiopian highlands
  { lon: 24, lat: -18, rx: 20, ry: 20, type: 1, rot: 0 }, // Kalahari / Southern Africa
  { lon: 47, lat: -19, rx: 6, ry: 14, type: 0, rot: 0.2 }, // Madagascar
  // ASIA & SIBERIA
  { lon: 75, lat: 60, rx: 42, ry: 22, type: 0, rot: 0 }, // West Siberia
  { lon: 110, lat: 62, rx: 38, ry: 20, type: 0, rot: 0.1 }, // East Siberia taiga
  { lon: 60, lat: 55, rx: 8, ry: 28, type: 3, rot: 0.1 }, // Ural mountains
  { lon: 86, lat: 32, rx: 26, ry: 14, type: 3, rot: 0 }, // Himalayas & Tibetan Plateau
  { lon: 78, lat: 20, rx: 20, ry: 22, type: 0, rot: -0.1 }, // India subcontinent
  { lon: 105, lat: 35, rx: 30, ry: 20, type: 0, rot: 0 }, // China mainland
  { lon: 95, lat: 42, rx: 20, ry: 12, type: 1, rot: 0 }, // Gobi desert
  { lon: 45, lat: 24, rx: 18, ry: 16, type: 1, rot: 0.2 }, // Arabian Peninsula
  { lon: 104, lat: 14, rx: 14, ry: 18, type: 0, rot: 0.2 }, // SE Asia / Indochina
  { lon: 138, lat: 36, rx: 6, ry: 14, type: 0, rot: 0.6 }, // Japan archipelago
  { lon: 115, lat: 0, rx: 18, ry: 10, type: 0, rot: 0 }, // Indonesia / Borneo
  // AUSTRALIA & OCEANIA
  { lon: 133, lat: -25, rx: 28, ry: 22, type: 1, rot: 0 }, // Australian Outback
  { lon: 148, lat: -32, rx: 10, ry: 16, type: 0, rot: 0.2 }, // East Coast Australia
  { lon: 174, lat: -41, rx: 6, ry: 12, type: 0, rot: 0.5 }, // New Zealand
  // ANTARCTICA
  { lon: 0, lat: -84, rx: 75, ry: 18, type: 2, rot: 0 },
  { lon: 90, lat: -85, rx: 70, ry: 16, type: 2, rot: 0 },
  { lon: -90, lat: -85, rx: 70, ry: 16, type: 2, rot: 0 },
];

// Major city light cluster coordinates for night-side illumination [lon, lat, size, intensity]
const CITY_LIGHTS = [
  { lon: -74, lat: 40, size: 4, intensity: 0.9 }, // New York / US East
  { lon: -87, lat: 41, size: 3.5, intensity: 0.8 }, // Chicago
  { lon: -118, lat: 34, size: 4, intensity: 0.85 }, // Los Angeles
  { lon: 2, lat: 48, size: 4.5, intensity: 0.9 }, // Paris / West Europe
  { lon: 0, lat: 51, size: 4, intensity: 0.9 }, // London
  { lon: 37, lat: 55, size: 3.5, intensity: 0.75 }, // Moscow
  { lon: 116, lat: 40, size: 5, intensity: 0.95 }, // Beijing
  { lon: 121, lat: 31, size: 4.5, intensity: 0.95 }, // Shanghai
  { lon: 139, lat: 35, size: 5, intensity: 1.0 }, // Tokyo
  { lon: 77, lat: 28, size: 4.5, intensity: 0.85 }, // New Delhi
  { lon: 72, lat: 19, size: 4, intensity: 0.85 }, // Mumbai
  { lon: 151, lat: -33, size: 3, intensity: 0.75 }, // Sydney
  { lon: -46, lat: -23, size: 4, intensity: 0.8 }, // Sao Paulo
  { lon: 31, lat: 30, size: 3.5, intensity: 0.8 }, // Cairo / Nile
];

export function renderEarth(ctx: CanvasRenderingContext2D, opts: EarthRenderOptions) {
  const {
    x,
    y,
    radius,
    rotation,
    cloudRotation,
    verticalTilt,
    health,
    jumpsRemaining,
    maxJumps,
    isShielded,
    isBoosted,
    isMagnetized,
    isPhasing,
    isHitFlash,
    time,
    skin,
  } = opts;

  ctx.save();
  ctx.translate(x, y);

  // Phase Shift ghostly chromatic aberration if active
  if (isPhasing) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(-14, 0);
    drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, true, skin);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.translate(-7, 0);
    drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, true, skin);
    ctx.restore();
  }

  // Slight tilt / squash-and-stretch when moving
  const tilt = Math.max(-1.4, Math.min(1.4, verticalTilt));
  const stretchY = 1 + Math.abs(tilt) * 0.08;
  const squashX = 1 / Math.sqrt(stretchY);
  ctx.rotate(tilt * 0.16);
  ctx.scale(squashX, stretchY);

  // Crown / Golden majesty on top if golden skin
  if (skin && skin.ringStyle === 'crown') {
    drawGoldenCrown(ctx, radius, time);
  }

  // Planetary Ring (Back Half)
  if (skin && skin.ringStyle && skin.ringStyle !== 'none' && skin.ringStyle !== 'crown') {
    drawPlanetaryRingBack(ctx, radius, skin);
  }

  // 1. PERMANENT OUTER GLOW (Pops against dark cosmic background, stars and planets)
  drawPermanentOuterGlow(ctx, radius, isBoosted, skin);

  // 2. ORBITING MOON (Behind Earth when z < 0)
  const moonOrbitRx = radius * 2.1;
  const moonOrbitRy = radius * 0.7;
  const moonAngle = time * 0.75;
  const moonX = Math.cos(moonAngle) * moonOrbitRx;
  const moonY = Math.sin(moonAngle) * moonOrbitRy;
  const isMoonFront = Math.sin(moonAngle) > 0;

  if (!isMoonFront) {
    drawDetailedMoon(ctx, moonX, moonY, radius * 0.27);
  }

  // 3. EARTH PLANETARY SPHERE
  drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, false, skin);

  // Planetary Ring (Front Half)
  if (skin && skin.ringStyle && skin.ringStyle !== 'none' && skin.ringStyle !== 'crown') {
    drawPlanetaryRingFront(ctx, radius, skin);
  }

  // 4. PERMANENT CRISP WHITE/BLUE GLOW RING (Always pops against dark space)
  drawPermanentSilhouetteRing(ctx, radius, skin);

  // 5. ORBITING MOON (In Front of Earth when z > 0)
  if (isMoonFront) {
    drawDetailedMoon(ctx, moonX, moonY, radius * 0.27);
  }

  // 6. ACTIVE STATUS EFFECTS & POWER-UPS
  if (isShielded) {
    drawMagneticForcefield(ctx, radius, time);
  }
  if (isBoosted) {
    drawRelativisticAura(ctx, radius, time);
  }
  if (isMagnetized) {
    drawGravitationalFlux(ctx, radius, time);
  }

  // 7. IN-GAME CLEAR JUMPS COUNTER NEAR PLAYER (e.g. 7/10 Jumps)
  if (typeof jumpsRemaining === 'number') {
    drawNearPlayerJumpsCounter(ctx, radius, jumpsRemaining, maxJumps ?? 10, time);
  }

  ctx.restore();
}

function drawGoldenCrown(ctx: CanvasRenderingContext2D, radius: number, time: number) {
  ctx.save();
  const crownY = -radius - 8;
  const shimmer = Math.sin(time * 5) * 2;

  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(-16, crownY + 8);
  ctx.lineTo(-18, crownY - 10 + shimmer);
  ctx.lineTo(-8, crownY);
  ctx.lineTo(0, crownY - 16 + shimmer);
  ctx.lineTo(8, crownY);
  ctx.lineTo(18, crownY - 10 + shimmer);
  ctx.lineTo(16, crownY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jewels
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, crownY - 12 + shimmer, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(-14, crownY - 7 + shimmer, 2, 0, Math.PI * 2);
  ctx.arc(14, crownY - 7 + shimmer, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNearPlayerJumpsCounter(
  ctx: CanvasRenderingContext2D,
  radius: number,
  jumpsRemaining: number,
  maxJumps: number,
  time: number
) {
  ctx.save();
  const isLow = jumpsRemaining <= 3;
  const badgeY = radius + 14;
  const text = `${jumpsRemaining}/${maxJumps} Jumps`;

  ctx.font = 'bold 11px var(--font-mono), monospace';
  const textMetrics = ctx.measureText(text);
  const textW = textMetrics.width;
  const badgeW = Math.max(textW + 16, 68);
  const badgeH = 18;
  const badgeX = -badgeW / 2;

  // Background and border
  if (isLow) {
    const pulse = Math.sin(time * 14) * 0.35 + 0.65; // Warning flash
    ctx.fillStyle = `rgba(159, 18, 57, ${0.85 * pulse})`;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12 * pulse;
  } else {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
  }

  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  // Text inside badge
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLow ? '#ffe4e6' : '#e0f2fe';
  ctx.fillText(text, 0, badgeY + badgeH / 2);

  // Jump indicator pip dots below the counter
  const pipCount = maxJumps;
  const pipSpacing = 5.2;
  const pipW = 3.2;
  const totalPipsW = pipCount * pipSpacing;
  const pipsStartX = -totalPipsW / 2 + (pipSpacing - pipW) / 2;
  const pipsY = badgeY + badgeH + 3.5;

  for (let i = 0; i < pipCount; i++) {
    const px = pipsStartX + i * pipSpacing;
    const hasJump = i < jumpsRemaining;
    ctx.fillStyle = hasJump
      ? (isLow ? '#f43f5e' : '#38bdf8')
      : 'rgba(51, 65, 85, 0.6)';
    ctx.fillRect(px, pipsY, pipW, 2.5);
  }

  ctx.restore();
}

function drawPlanetaryRingBack(ctx: CanvasRenderingContext2D, radius: number, skin: SkinItem) {
  ctx.save();
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.85, radius * 0.45, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = skin.glowColor || 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawPlanetaryRingFront(ctx: CanvasRenderingContext2D, radius: number, skin: SkinItem) {
  ctx.save();
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.85, radius * 0.45, 0, 0, Math.PI);
  ctx.strokeStyle = skin.glowColor || 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawPermanentSilhouetteRing(ctx: CanvasRenderingContext2D, radius: number, skin?: SkinItem) {
  ctx.save();
  // Inner crisp bright white ring
  ctx.shadowColor = skin?.glowColor || 'rgba(56, 189, 248, 0.9)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Outer vibrant cyan/blue neon halo ring
  ctx.shadowBlur = 18;
  ctx.strokeStyle = skin?.atmosphereColor || 'rgba(56, 189, 248, 0.95)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPermanentOuterGlow(
  ctx: CanvasRenderingContext2D,
  radius: number,
  isBoosted: boolean,
  skin?: SkinItem
) {
  const outerR = radius * 1.6;
  const grad = ctx.createRadialGradient(0, 0, radius * 0.85, 0, 0, outerR);

  if (isBoosted) {
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  } else if (skin) {
    grad.addColorStop(0, skin.glowColor || 'rgba(255, 255, 255, 0.55)');
    grad.addColorStop(0.35, skin.atmosphereColor ? `${skin.atmosphereColor}77` : 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  } else {
    // Beautiful permanent white + azure glow
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.65, 'rgba(37, 99, 235, 0.18)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.fill();
}

function drawBaseEarth(
  ctx: CanvasRenderingContext2D,
  radius: number,
  rotation: number,
  cloudRotation: number,
  health: number,
  isHitFlash: boolean,
  time: number,
  isGhost: boolean,
  skin?: SkinItem
) {
  const earthMesh = getCachedEarthMesh(skin);
  const rotYRad = (rotation * Math.PI) / 180;
  const cloudRotYRad = (cloudRotation * Math.PI) / 180;
  const axialTiltRad = 0.41; // 23.5° realistic axial tilt

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip(); // Horizon circular clipping for smooth silhouette

  // 1. RENDER LOW-POLY 3D GEODESIC EARTH MESH
  // Flat-shaded directional sun key light + ambient fill + rim lighting
  renderLowPolyMesh(ctx, earthMesh, {
    x: 0,
    y: 0,
    scale: radius,
    rotY: rotYRad,
    axialTilt: axialTiltRad,
    ambientLight: 0.36,
    wireframeAlpha: 0.2,
    cullBackfaces: true,
  });

  // 2. RENDER LOW-POLY 3D CLOUD SHELL
  // Independent cloud rotation with translucent atmospheric facets
  ctx.save();
  ctx.globalAlpha = 0.42;
  renderLowPolyMesh(ctx, cloudShellMesh, {
    x: 0,
    y: 0,
    scale: radius * 1.02,
    rotY: cloudRotYRad,
    axialTilt: axialTiltRad,
    ambientLight: 0.55,
    wireframeAlpha: 0.1,
    cullBackfaces: true,
  });
  ctx.restore();

  // 3. NIGHT-SIDE ANTHROPIC CITY LIGHTS & POLAR AURORAS
  drawCityLightsAndAuroras(ctx, radius, rotYRad, time);

  // 4. DAMAGE DISTRESS / RED HIT FLASH
  if (isHitFlash) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. BIOSPHERE DEPLETION TONE (< 40% Health)
  if (health < 40) {
    const dangerAlpha = ((40 - health) / 40) * 0.35;
    ctx.fillStyle = `rgba(220, 38, 38, ${dangerAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. SPECIAL SKIN PROCEDURAL HIGHLIGHTS
  drawSpecialSkinFeatures(ctx, radius, rotation, time, skin);

  ctx.restore(); // End clipping

  // 7. ATMOSPHERIC LIMB CRESCENT
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isGhost ? '#818cf8' : 'rgba(186, 230, 253, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSpecialSkinFeatures(
  ctx: CanvasRenderingContext2D,
  radius: number,
  rotation: number,
  time: number,
  skin?: SkinItem
) {
  if (!skin || !skin.specialRender || skin.specialRender === 'default') return;

  const sr = skin.specialRender;
  ctx.save();

  if (sr === 'ice') {
    // Light blue + white frozen cracks
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#bae6fd';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, -radius * 0.3);
    ctx.lineTo(-radius * 0.2, -radius * 0.1);
    ctx.lineTo(radius * 0.3, -radius * 0.4);
    ctx.lineTo(radius * 0.6, 0);
    ctx.moveTo(-radius * 0.2, -radius * 0.1);
    ctx.lineTo(-radius * 0.1, radius * 0.5);
    ctx.lineTo(radius * 0.4, radius * 0.6);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + (rotation * Math.PI) / 180;
      const r = radius * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.cos(a) * r - 2, Math.sin(a) * r - 2, 4, 4);
    }
  } else if (sr === 'slime') {
    // Green + dark green slime spots
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.28, 0, Math.PI * 2);
    ctx.arc(radius * 0.25, radius * 0.35, radius * 0.24, 0, Math.PI * 2);
    ctx.arc(radius * 0.4, -radius * 0.3, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    const wobble = Math.sin(time * 6) * 2;
    ctx.beginPath();
    ctx.arc(-radius * 0.3 + wobble, -radius * 0.2, radius * 0.12, 0, Math.PI * 2);
    ctx.arc(radius * 0.25 - wobble, radius * 0.35, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (sr === 'fire') {
    // Orange + red lava cracks
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, radius * 0.2);
    ctx.lineTo(-radius * 0.1, 0);
    ctx.lineTo(radius * 0.4, -radius * 0.4);
    ctx.moveTo(-radius * 0.1, 0);
    ctx.lineTo(radius * 0.3, radius * 0.5);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  } else if (sr === 'lava') {
    // Dark red + bright yellow lava veins
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -radius * 0.2);
    ctx.lineTo(-radius * 0.3, radius * 0.2);
    ctx.lineTo(radius * 0.1, -radius * 0.3);
    ctx.lineTo(radius * 0.7, radius * 0.1);
    ctx.moveTo(-radius * 0.3, radius * 0.2);
    ctx.lineTo(-radius * 0.1, radius * 0.7);
    ctx.stroke();
  } else if (sr === 'ocean') {
    // Deep blue + cyan waves
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
    ctx.lineWidth = 2;
    for (let r = 0.25; r <= 0.85; r += 0.2) {
      const waveR = radius * r + Math.sin(time * 3 + r * 10) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, waveR, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (sr === 'neon') {
    // Pink + purple neon outline & pulsing grid
    const pulse = 0.7 + Math.sin(time * 8) * 0.3;
    ctx.strokeStyle = `rgba(236, 72, 153, ${pulse})`;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, 0);
    ctx.lineTo(radius * 0.75, 0);
    ctx.moveTo(0, -radius * 0.75);
    ctx.lineTo(0, radius * 0.75);
    ctx.stroke();
  } else if (sr === 'crystal') {
    // Transparent diamond look + white sparkle facets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a1 = (i * Math.PI) / 3;
      const a2 = ((i + 1) * Math.PI) / 3;
      ctx.moveTo(Math.cos(a1) * radius * 0.8, Math.sin(a1) * radius * 0.8);
      ctx.lineTo(Math.cos(a2) * radius * 0.8, Math.sin(a2) * radius * 0.8);
      ctx.lineTo(0, 0);
    }
    ctx.stroke();

    const glintTime = time * 4;
    const gx = Math.cos(glintTime) * radius * 0.45;
    const gy = Math.sin(glintTime) * radius * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(gx, gy, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (sr === 'shadow') {
    // Black + purple smoke
    ctx.fillStyle = 'rgba(24, 24, 27, 0.75)';
    ctx.beginPath();
    ctx.arc(Math.sin(time * 2) * 8, Math.cos(time * 2) * 8, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.75, time * 2, time * 2 + Math.PI);
    ctx.stroke();
  } else if (sr === 'galaxy') {
    // Purple galaxy with stars inside, animated star twinkle
    ctx.fillStyle = '#1e0836';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let theta = 0; theta < Math.PI * 3; theta += 0.1) {
      const r = (theta / (Math.PI * 3)) * radius * 0.85;
      const x = Math.cos(theta + time * 1.5) * r;
      const y = Math.sin(theta + time * 1.5) * r;
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996;
      const dist = (((i * 17) % 70) / 100) * radius * 0.85;
      const sx = Math.cos(a) * dist;
      const sy = Math.sin(a) * dist;
      const tw = 0.5 + Math.sin(time * 8 + i) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${tw})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  } else if (sr === 'golden') {
    // Full gold sheen & luster
    const goldGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    goldGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
    goldGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
    goldGrad.addColorStop(1, 'rgba(161, 98, 7, 0.5)');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(time * 0.8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, 0);
    ctx.lineTo(radius * 0.9, 0);
    ctx.moveTo(0, -radius * 0.9);
    ctx.lineTo(0, radius * 0.9);
    ctx.stroke();
    ctx.restore();
  } else if (sr === 'aurora') {
    // Green + pink shifting aurora lights moving on surface
    const aTime = time * 2.5;
    const auroraGrad = ctx.createLinearGradient(-radius, Math.sin(aTime) * 20, radius, -Math.sin(aTime) * 20);
    auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
    auroraGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.55)');
    auroraGrad.addColorStop(1, 'rgba(6, 182, 212, 0.55)');
    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.ellipse(0, Math.sin(aTime) * 8, radius * 0.9, radius * 0.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (sr === 'void_hole') {
    // Black hole center + purple ring
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.72, radius * 0.32, -0.2 + Math.sin(time) * 0.1, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sr === 'zombie') {
    // Rotten flesh + blood red cracks + eyes
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.4);
    ctx.lineTo(-radius * 0.2, 0);
    ctx.lineTo(-radius * 0.5, radius * 0.5);
    ctx.moveTo(radius * 0.2, -radius * 0.5);
    ctx.lineTo(radius * 0.5, 0);
    ctx.stroke();

    const eyePositions = [
      { x: -radius * 0.2, y: -radius * 0.2 },
      { x: radius * 0.3, y: -radius * 0.1 },
      { x: 0, y: radius * 0.35 },
    ];
    for (const eye of eyePositions) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, 6, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(eye.x + Math.sin(time * 3) * 1.5, eye.y, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRealisticClouds(
  ctx: CanvasRenderingContext2D,
  radius: number,
  cloudRotRad: number,
  time: number
) {
  // Weather systems: [lon, lat, size, isCyclone]
  const CLOUD_SYSTEMS = [
    { lon: -110, lat: 28, size: 36, isCyclone: true }, // Pacific Hurricane with eye
    { lon: 40, lat: -25, size: 32, isCyclone: false },
    { lon: 135, lat: 35, size: 40, isCyclone: true }, // East Asia Typhoon
    { lon: -60, lat: 50, size: 35, isCyclone: false }, // North Atlantic front
    { lon: 15, lat: -45, size: 38, isCyclone: false }, // Southern ocean swirl
    { lon: 85, lat: 15, size: 34, isCyclone: false }, // Monsoon cloud bank
    { lon: -20, lat: 5, size: 45, isCyclone: false }, // ITCZ equatorial belt
  ];

  for (const c of CLOUD_SYSTEMS) {
    const cLonRad = ((c.lon % 360) * Math.PI) / 180 + cloudRotRad;
    const cLatRad = (c.lat * Math.PI) / 180;

    const cnx = Math.cos(cLatRad) * Math.sin(cLonRad);
    const cny = -Math.sin(cLatRad);
    const cnz = Math.cos(cLatRad) * Math.cos(cLonRad);

    if (cnz > 0.02) {
      const cx = cnx * radius;
      const cy = cny * radius;
      const scaleX = Math.max(0.2, cnz);
      const cr = (c.size / 100) * radius * scaleX;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Cloud Drop Shadow onto terrain (casts 3D shadow 2px down-right)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(3, 3, cr * 1.15, cr * 0.75, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Pure White Cloud Body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.beginPath();
      ctx.ellipse(0, 0, cr * 1.15, cr * 0.75, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Secondary puff
      ctx.beginPath();
      ctx.arc(cr * 0.35, -cr * 0.2, cr * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // If Cyclone/Typhoon: render spiral arm and central eye!
      if (c.isCyclone) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, cr * 0.65, 0, Math.PI * 1.4);
        ctx.stroke();

        // Eye of the storm
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, cr * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Intertropical Convergence Zone (ITCZ) equatorial cloud ribbon
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.95, radius * 0.08, 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCityLightsAndAuroras(
  ctx: CanvasRenderingContext2D,
  radius: number,
  rotRad: number,
  time: number
) {
  // A. Night-Side City Lights (Twinkling gold clusters on shaded side)
  for (const city of CITY_LIGHTS) {
    const lonRad = ((city.lon % 360) * Math.PI) / 180 + rotRad;
    const latRad = (city.lat * Math.PI) / 180;

    const nx = Math.cos(latRad) * Math.sin(lonRad);
    const ny = -Math.sin(latRad);
    const nz = Math.cos(latRad) * Math.cos(lonRad);

    // Visible on front AND located on the night/shadow side of the terminator (nx > 0.1)
    if (nz > 0.05 && nx > 0.15) {
      const px = nx * radius;
      const py = ny * radius;
      const flicker = 0.75 + Math.sin(time * 6 + city.lon) * 0.25;

      ctx.save();
      ctx.fillStyle = `rgba(251, 191, 36, ${city.intensity * flicker * 0.85})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.arc(px, py, (city.size / 100) * radius, 0, Math.PI * 2);
      ctx.fill();

      // Cluster satellite spark
      ctx.beginPath();
      ctx.arc(px + 2, py - 2, (city.size / 140) * radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // B. Polar Aurora Borealis (Dancing geomagnetic curtains)
  ctx.save();
  const auroraWiggle = Math.sin(time * 3) * 3;
  const auroraGrad = ctx.createLinearGradient(0, -radius, 0, -radius * 0.6);
  auroraGrad.addColorStop(0, 'rgba(74, 222, 128, 0.45)'); // Emerald geomagnetic ribbon
  auroraGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)'); // Violet nitrogen curtain
  auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.strokeStyle = auroraGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(auroraWiggle, -radius * 0.82, radius * 0.45, radius * 0.12, 0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Aurora Australis (South Pole)
  const australisGrad = ctx.createLinearGradient(0, radius, 0, radius * 0.65);
  australisGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
  australisGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.strokeStyle = australisGrad;
  ctx.beginPath();
  ctx.ellipse(-auroraWiggle, radius * 0.84, radius * 0.42, radius * 0.1, -0.1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawDetailedMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();

  // 1. Soft lunar halo
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.8);
  glow.addColorStop(0, 'rgba(226, 232, 240, 0.35)');
  glow.addColorStop(1, 'rgba(226, 232, 240, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Render Low-Poly 3D Moon Mesh
  renderLowPolyMesh(ctx, moonMesh, {
    x,
    y,
    scale: r,
    rotY: x * 0.05,
    rotX: 0.18,
    ambientLight: 0.3,
    wireframeAlpha: 0.22,
    cullBackfaces: true,
  });

  ctx.restore();
}

function drawMagneticForcefield(ctx: CanvasRenderingContext2D, baseR: number, time: number) {
  const shieldR = baseR * 1.48 + Math.sin(time * 8) * 3;
  ctx.save();

  // Radiant forcefield glow
  const sGrad = ctx.createRadialGradient(0, 0, baseR, 0, 0, shieldR * 1.2);
  sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
  sGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.28)');
  sGrad.addColorStop(1, 'rgba(125, 211, 252, 0.65)');

  ctx.fillStyle = sGrad;
  ctx.beginPath();
  ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
  ctx.fill();

  // Concentric magnetic flux rings
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([14, 8]);
  ctx.lineDashOffset = -time * 35;

  ctx.beginPath();
  ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner shimmer ring
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 12]);
  ctx.lineDashOffset = time * 24;

  ctx.beginPath();
  ctx.arc(0, 0, shieldR * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawRelativisticAura(ctx: CanvasRenderingContext2D, baseR: number, time: number) {
  ctx.save();
  const auraR = baseR * 1.55;

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
  ctx.lineWidth = 3;

  for (let i = 0; i < 4; i++) {
    const angle = time * 7 + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(0, 0, auraR + Math.sin(time * 12 + i) * 4, angle, angle + Math.PI * 0.35);
    ctx.stroke();
  }

  // Trailing golden warp streaks
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(-baseR * 0.6, 0, baseR * 0.85, baseR * 1.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawGravitationalFlux(ctx: CanvasRenderingContext2D, baseR: number, time: number) {
  ctx.save();
  const pulseR = baseR * 1.2 + ((time * 1.6) % 1) * baseR * 0.95;
  const alpha = 1 - ((time * 1.6) % 1);

  ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.75})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);

  ctx.beginPath();
  ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
