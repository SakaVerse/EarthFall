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

interface EarthRenderOptions {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  cloudRotation: number;
  verticalTilt: number;
  health: number; // 0 to 100
  isShielded: boolean;
  isBoosted: boolean;
  isMagnetized: boolean;
  isPhasing: boolean; // From Phase Warp skill
  isHitFlash: boolean;
  time: number;
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
    isShielded,
    isBoosted,
    isMagnetized,
    isPhasing,
    isHitFlash,
    time,
  } = opts;

  ctx.save();
  ctx.translate(x, y);

  // Phase Shift ghostly chromatic aberration if active
  if (isPhasing) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(-14, 0);
    drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, true);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.translate(-7, 0);
    drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, true);
    ctx.restore();
  }

  // Tilt based on vertical ascent/dive velocity
  ctx.rotate(verticalTilt * 0.15);

  // 1. RAYLEIGH ATMOSPHERIC CORONA GLOW (Outer Space)
  drawAtmosphericScattering(ctx, radius, isBoosted);

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
  drawBaseEarth(ctx, radius, rotation, cloudRotation, health, isHitFlash, time, false);

  // 4. ORBITING MOON (In Front of Earth when z > 0)
  if (isMoonFront) {
    drawDetailedMoon(ctx, moonX, moonY, radius * 0.27);
  }

  // 5. ACTIVE STATUS EFFECTS & POWER-UPS
  if (isShielded) {
    drawMagneticForcefield(ctx, radius, time);
  }
  if (isBoosted) {
    drawRelativisticAura(ctx, radius, time);
  }
  if (isMagnetized) {
    drawGravitationalFlux(ctx, radius, time);
  }

  ctx.restore();
}

function drawAtmosphericScattering(ctx: CanvasRenderingContext2D, radius: number, isBoosted: boolean) {
  const outerR = radius * 1.55;
  const grad = ctx.createRadialGradient(
    -radius * 0.35,
    -radius * 0.35,
    radius * 0.9,
    -radius * 0.2,
    -radius * 0.2,
    outerR
  );

  if (isBoosted) {
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  } else {
    // Beautiful Rayleigh azure scattering
    grad.addColorStop(0, 'rgba(125, 211, 252, 0.55)');
    grad.addColorStop(0.35, 'rgba(56, 189, 248, 0.3)');
    grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.12)');
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
  isGhost: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip(); // Spherical Horizon Clipping

  // --- OCEAN BASE & BATHYMETRY ---
  const oceanGrad = ctx.createRadialGradient(
    -radius * 0.4,
    -radius * 0.4,
    radius * 0.05,
    radius * 0.2,
    radius * 0.2,
    radius * 1.05
  );
  // Specular sunlit azure to deep oceanic trenches
  oceanGrad.addColorStop(0, '#0284c7'); // Sunlit tropical blue
  oceanGrad.addColorStop(0.35, '#0369a1'); // Mid oceanic basin
  oceanGrad.addColorStop(0.7, '#075985'); // Abyssal plain
  oceanGrad.addColorStop(1, '#082f49'); // Deep sea trench

  ctx.fillStyle = oceanGrad;
  ctx.fill();

  // --- CONTINENTS & SHALLOW REEF SHELVES ---
  const rotRad = (rotation * Math.PI) / 180;

  for (const land of DETAILED_LANDMASSES) {
    const lonRad = ((land.lon % 360) * Math.PI) / 180 + rotRad;
    const latRad = (land.lat * Math.PI) / 180;

    const nx = Math.cos(latRad) * Math.sin(lonRad);
    const ny = -Math.sin(latRad);
    const nz = Math.cos(latRad) * Math.cos(lonRad);

    if (nz > -0.15) {
      const px = nx * radius;
      const py = ny * radius;
      const scaleX = Math.max(0.18, nz);
      const rx = (land.rx / 100) * radius * scaleX;
      const ry = (land.ry / 100) * radius;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(land.rot);

      // A. Turquoise Continental Shelf Margin (Coastal Reefs)
      if (land.type !== 2 && nz > 0.1) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 1.35, ry * 1.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. Landmass Core Palette
      if (land.type === 2) {
        // Polar Ice Cap
        ctx.fillStyle = '#f8fafc';
      } else if (land.type === 1) {
        // Desert Ochre / Sahara / Outback
        ctx.fillStyle = '#ca8a04';
      } else if (land.type === 3) {
        // Mountain Granite
        ctx.fillStyle = '#64748b';
      } else {
        // Lush Vegetation & Rainforest
        ctx.fillStyle = '#15803d';
      }

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // C. Internal Biome & Topography Variation
      if (land.type === 0 && nz > 0.3) {
        // Deep rainforest heart
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.ellipse(-rx * 0.15, -ry * 0.15, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (land.type === 3 && nz > 0.25) {
        // Mountain snow-capped ridges
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.ellipse(-rx * 0.1, -ry * 0.2, rx * 0.35, ry * 0.4, 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (land.type === 1 && nz > 0.3) {
        // Sand dune crest
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(rx * 0.1, ry * 0.1, rx * 0.5, ry * 0.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- DYNAMIC CLOUDS & CLOUD SHADOWS ---
  const cloudRotRad = (cloudRotation * Math.PI) / 180;
  drawRealisticClouds(ctx, radius, cloudRotRad, time);

  // --- DAY/NIGHT TERMINATOR SHADOW ---
  // Sunlight originates from the upper-left (sun direction).
  const shadowGrad = ctx.createRadialGradient(
    radius * 0.5,
    radius * 0.45,
    radius * 0.15,
    0,
    0,
    radius
  );
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(0.45, 'rgba(2, 6, 23, 0.25)');
  shadowGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.65)');
  shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.94)'); // Pitch black night vacuum

  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // --- NIGHT-SIDE ANTHROPIC CITY LIGHTS & AURORAS ---
  drawCityLightsAndAuroras(ctx, radius, rotRad, time);

  // --- SPECULAR OCEAN SUN GLINT ---
  const sunGlint = ctx.createRadialGradient(
    -radius * 0.45,
    -radius * 0.45,
    1,
    -radius * 0.42,
    -radius * 0.42,
    radius * 0.45
  );
  sunGlint.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
  sunGlint.addColorStop(0.3, 'rgba(186, 230, 253, 0.25)');
  sunGlint.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = sunGlint;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Damage Distress / Red Flash
  if (isHitFlash) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Biosphere Depletion Tone
  if (health < 40) {
    const dangerAlpha = ((40 - health) / 40) * 0.35;
    ctx.fillStyle = `rgba(220, 38, 38, ${dangerAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // End clipping

  // --- ATMOSPHERIC LIMB CRESCENT ---
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isGhost ? '#818cf8' : 'rgba(186, 230, 253, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
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
  ctx.translate(x, y);

  // Soft lunar halo
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
  glow.addColorStop(0, 'rgba(226, 232, 240, 0.35)');
  glow.addColorStop(1, 'rgba(226, 232, 240, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Moon base with spherical lighting
  const moonGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
  moonGrad.addColorStop(0, '#f8fafc');
  moonGrad.addColorStop(0.5, '#cbd5e1');
  moonGrad.addColorStop(0.9, '#475569');
  moonGrad.addColorStop(1, '#1e293b');

  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Lunar Maria (Dark basaltic plains)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.15, r * 0.3, r * 0.22, 0.2, 0, Math.PI * 2); // Sea of Tranquility
  ctx.ellipse(r * 0.25, r * 0.2, r * 0.25, r * 0.18, -0.3, 0, Math.PI * 2); // Oceanus Procellarum
  ctx.ellipse(-r * 0.1, r * 0.35, r * 0.18, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ray crater Tycho
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.arc(-r * 0.2, -r * 0.1, r * 0.1, 0, Math.PI * 2);
  ctx.fill();

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
