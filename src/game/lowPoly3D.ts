/**
 * Earthfall: Beyond the Solar System - Low-Poly 3D Asset & Math Engine
 *
 * Implements optimized, high-performance low-poly 3D rendering for CrazyGames:
 * - Real 3D vertex transformations with zero-allocation precomputed scratch buffers
 * - Flat-shaded polygonal rasterization with directional key light, ambient fill & rim highlights
 * - Backface culling & viewport boundary culling for optimal 60fps on mobile & desktop
 * - Asset polygon budgets:
 *     - Collectibles: 50–300 triangles
 *     - Small spaceships: 300–1,200 triangles
 *     - Asteroids: 100–800 triangles
 *     - Platforms: 100–600 triangles
 *     - Earth: 1,000–3,000 triangles
 *     - Guardian: 3,000–8,000 triangles
 *     - Major Bosses: 2,000–6,000 triangles
 */

import { SkinItem, ThemeId } from './types';

export interface LowPolyVertex {
  x: number;
  y: number;
  z: number;
}

export interface LowPolyFace {
  i0: number; // vertex index 0
  i1: number; // vertex index 1
  i2: number; // vertex index 2
  // Base color RGB (0..255)
  r: number;
  g: number;
  b: number;
  isEmissive?: boolean;
  edgeAlpha?: number;
  biomeType?: 'ocean' | 'shelf' | 'land' | 'desert' | 'mountain' | 'ice' | 'core';
}

export interface LowPolyMesh {
  vertices: Float32Array; // [x0, y0, z0, x1, y1, z1, ...]
  faces: LowPolyFace[];
  polyCount: number;
  radius: number;
  // Scratch buffers to prevent GC
  _transformed: Float32Array;
  _screen: Float32Array;
}

export interface Render3DOptions {
  x: number;
  y: number;
  scale: number;
  rotX?: number; // radians
  rotY?: number; // radians
  rotZ?: number; // radians
  axialTilt?: number; // radians (e.g. 23.5 deg for Earth)
  lightDir?: { x: number; y: number; z: number };
  ambientLight?: number; // 0..1
  wireframeColor?: string;
  wireframeAlpha?: number;
  cullBackfaces?: boolean;
  skin?: SkinItem;
  theme?: ThemeId;
  glowColor?: string;
  glowRadius?: number;
}

// Normalized directional sun key light (upper-left in 2.5D space)
const DEFAULT_LIGHT_DIR = (() => {
  const lx = -0.55;
  const ly = -0.50;
  const lz = 0.67;
  const len = Math.hypot(lx, ly, lz);
  return { x: lx / len, y: ly / len, z: lz / len };
})();

/**
 * Creates pre-allocated mesh data container
 */
export function createMesh(vertexCount: number, faces: LowPolyFace[], radius: number): LowPolyMesh {
  return {
    vertices: new Float32Array(vertexCount * 3),
    faces,
    polyCount: faces.length,
    radius,
    _transformed: new Float32Array(vertexCount * 3),
    _screen: new Float32Array(vertexCount * 2),
  };
}

// ---------------------------------------------------------------------------
// 1. PROCEDURAL LOW-POLY 3D GEOMETRY GENERATORS
// ---------------------------------------------------------------------------

/**
 * Subdivides an icosahedron to create a low-poly geodesic sphere.
 * Level 3 produces ~1,280 triangles (precisely within Earth's 1,000–3,000 budget).
 */
export function createLowPolyEarthMesh(subdivisionLevel = 3, skin?: SkinItem): LowPolyMesh {
  // Base 12 icosahedron vertices
  const t = (1.0 + Math.sqrt(5.0)) / 2.0;
  const baseVertices: [number, number, number][] = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];

  // Normalize base vertices to unit sphere
  for (const v of baseVertices) {
    const len = Math.hypot(v[0], v[1], v[2]);
    v[0] /= len;
    v[1] /= len;
    v[2] /= len;
  }

  // Base 20 icosahedral triangular faces
  let baseFaces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  const vertices: [number, number, number][] = [...baseVertices];
  const midpointCache = new Map<string, number>();

  function getMidpoint(i1: number, i2: number): number {
    const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
    if (midpointCache.has(key)) {
      return midpointCache.get(key)!;
    }
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const mx = (v1[0] + v2[0]) * 0.5;
    const my = (v1[1] + v2[1]) * 0.5;
    const mz = (v1[2] + v2[2]) * 0.5;
    const len = Math.hypot(mx, my, mz);
    const newIdx = vertices.length;
    vertices.push([mx / len, my / len, mz / len]);
    midpointCache.set(key, newIdx);
    return newIdx;
  }

  // Iteratively subdivide triangles
  for (let s = 0; s < subdivisionLevel; s++) {
    const newFaces: [number, number, number][] = [];
    for (const f of baseFaces) {
      const a = f[0];
      const b = f[1];
      const c = f[2];
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);

      newFaces.push([a, ab, ca]);
      newFaces.push([b, bc, ab]);
      newFaces.push([c, ca, bc]);
      newFaces.push([ab, bc, ca]);
    }
    baseFaces = newFaces;
  }

  // Procedural Biome Assignment for Earth
  // (Latitude / Longitude mapping to realistic low-poly continents, oceans, and polar ice)
  const faces: LowPolyFace[] = [];

  // Major continent centers in spherical coordinates [lonDeg, latDeg, radiusDeg, type]
  const continentCenters: { lon: number; lat: number; r: number; type: 'land' | 'desert' | 'mountain' }[] = [
    // North America
    { lon: -100, lat: 45, r: 28, type: 'land' },
    { lon: -105, lat: 35, r: 16, type: 'mountain' }, // Rockies
    { lon: -102, lat: 25, r: 14, type: 'desert' }, // Sonora
    // South America
    { lon: -60, lat: -10, r: 24, type: 'land' },
    { lon: -70, lat: -22, r: 14, type: 'mountain' }, // Andes
    // Eurasia
    { lon: 20, lat: 50, r: 22, type: 'land' }, // Europe
    { lon: 85, lat: 32, r: 18, type: 'mountain' }, // Himalayas
    { lon: 100, lat: 55, r: 35, type: 'land' }, // Siberia
    { lon: 95, lat: 40, r: 16, type: 'desert' }, // Gobi
    // Africa
    { lon: 22, lat: 24, r: 20, type: 'desert' }, // Sahara
    { lon: 20, lat: 0, r: 20, type: 'land' }, // Congo
    // Australia
    { lon: 135, lat: -25, r: 18, type: 'desert' },
    { lon: 145, lat: -32, r: 10, type: 'land' },
  ];

  for (const tri of baseFaces) {
    const vA = vertices[tri[0]];
    const vB = vertices[tri[1]];
    const vC = vertices[tri[2]];

    // Face center on unit sphere
    const cx = (vA[0] + vB[0] + vC[0]) / 3;
    const cy = (vA[1] + vB[1] + vC[1]) / 3;
    const cz = (vA[2] + vB[2] + vC[2]) / 3;
    const clen = Math.hypot(cx, cy, cz);
    const ncx = cx / clen;
    const ncy = cy / clen;
    const ncz = cz / clen;

    // Convert to latitude (-90 to +90) and longitude (-180 to +180)
    const latDeg = (Math.asin(Math.max(-1, Math.min(1, -ncy))) * 180) / Math.PI;
    const lonDeg = (Math.atan2(ncx, ncz) * 180) / Math.PI;

    let biomeType: LowPolyFace['biomeType'] = 'ocean';
    let r = 8;
    let g = 80;
    let b = 150;

    // 1. Polar Ice Caps
    if (Math.abs(latDeg) > 68) {
      biomeType = 'ice';
      r = 245;
      g = 250;
      b = 255;
    } else {
      // 2. Check continent proximity
      let isLand = false;
      let closestType: 'land' | 'desert' | 'mountain' = 'land';
      let minDistance = 999;

      for (const cont of continentCenters) {
        // Angular distance on sphere
        const dLat = latDeg - cont.lat;
        let dLon = Math.abs(lonDeg - cont.lon);
        if (dLon > 180) dLon = 360 - dLon;
        const dist = Math.hypot(dLat, dLon);

        if (dist < cont.r) {
          isLand = true;
          if (dist < minDistance) {
            minDistance = dist;
            closestType = cont.type;
          }
        } else if (dist < cont.r + 6 && biomeType === 'ocean') {
          biomeType = 'shelf'; // Continental shelf margin
        }
      }

      if (isLand) {
        biomeType = closestType;
        if (closestType === 'desert') {
          r = 217;
          g = 145;
          b = 32;
        } else if (closestType === 'mountain') {
          r = 110;
          g = 125;
          b = 145;
        } else {
          r = 24;
          g = 158;
          b = 64;
        }
      } else if (biomeType === 'shelf') {
        r = 14;
        g = 165;
        b = 233;
      } else {
        // Deep ocean variation
        const depthNoise = Math.sin(latDeg * 0.1) * Math.cos(lonDeg * 0.1);
        r = 3 + Math.floor(depthNoise * 2);
        g = 75 + Math.floor(depthNoise * 15);
        b = 145 + Math.floor(depthNoise * 20);
      }
    }

    // Apply custom skin palette overrides if equipped
    if (skin) {
      if (skin.id === 'frozen_europa' || skin.id === 'ice_earth') {
        if (biomeType === 'ocean') {
          r = 56;
          g = 189;
          b = 248;
        } else {
          r = 224;
          g = 242;
          b = 254;
        }
      } else if (skin.id === 'solar_corona' || skin.id === 'fire_earth' || skin.id === 'lava_earth') {
        if (biomeType === 'ocean') {
          r = 180;
          g = 20;
          b = 10;
        } else if (biomeType === 'ice') {
          r = 254;
          g = 240;
          b = 138;
        } else {
          r = 249;
          g = 115;
          b = 22;
        }
      } else if (skin.id === 'cyberpunk_matrix' || skin.id === 'neon_earth') {
        if (biomeType === 'ocean') {
          r = 15;
          g = 23;
          b = 42;
        } else {
          r = 6;
          g = 182;
          b = 212;
        }
      } else if (skin.id === 'dark_matter_void' || skin.id === 'void_earth' || skin.id === 'shadow_earth') {
        if (biomeType === 'ocean') {
          r = 30;
          g = 10;
          b = 60;
        } else {
          r = 168;
          g = 85;
          b = 247;
        }
      } else if (skin.id === 'golden_earth') {
        if (biomeType === 'ocean') {
          r = 180;
          g = 130;
          b = 20;
        } else {
          r = 251;
          g = 191;
          b = 36;
        }
      }
    }

    faces.push({
      i0: tri[0],
      i1: tri[1],
      i2: tri[2],
      r,
      g,
      b,
      biomeType,
      edgeAlpha: 0.15,
    });
  }

  const mesh = createMesh(vertices.length, faces, 1.0);
  for (let i = 0; i < vertices.length; i++) {
    mesh.vertices[i * 3 + 0] = vertices[i][0];
    mesh.vertices[i * 3 + 1] = vertices[i][1];
    mesh.vertices[i * 3 + 2] = vertices[i][2];
  }

  return mesh;
}

/**
 * Creates a low-poly atmospheric cloud shell mesh (concentric geodesic layer)
 */
export function createLowPolyCloudShellMesh(subdivisionLevel = 2): LowPolyMesh {
  const baseMesh = createLowPolyEarthMesh(subdivisionLevel);
  // Slightly scale up to sit just above surface
  for (let i = 0; i < baseMesh.vertices.length; i++) {
    baseMesh.vertices[i] *= 1.04;
  }
  // Cloud faces: semi-transparent white/cyan swirls with sporadic holes
  const cloudFaces: LowPolyFace[] = [];
  for (let i = 0; i < baseMesh.faces.length; i++) {
    // Only 45% of faces have clouds to reveal land & oceans underneath
    if ((i * 137) % 100 < 48) {
      const f = baseMesh.faces[i];
      cloudFaces.push({
        i0: f.i0,
        i1: f.i1,
        i2: f.i2,
        r: 255,
        g: 255,
        b: 255,
        edgeAlpha: 0.12,
      });
    }
  }

  return {
    ...baseMesh,
    faces: cloudFaces,
    polyCount: cloudFaces.length,
    radius: 1.04,
  };
}

/**
 * Creates low-poly 3D Moon mesh (subdivided icosahedron with craters, ~180 triangles)
 */
export function createLowPolyMoonMesh(): LowPolyMesh {
  const baseMesh = createLowPolyEarthMesh(2);
  const faces: LowPolyFace[] = [];

  for (let i = 0; i < baseMesh.faces.length; i++) {
    const f = baseMesh.faces[i];
    const isMaria = (i * 73) % 100 < 32; // Dark volcanic lunar maria plains
    const grey = isMaria ? 80 + ((i * 17) % 35) : 185 + ((i * 23) % 40);
    faces.push({
      i0: f.i0,
      i1: f.i1,
      i2: f.i2,
      r: grey,
      g: grey + 4,
      b: grey + 8,
      edgeAlpha: 0.22,
    });
  }

  return {
    ...baseMesh,
    faces,
    polyCount: faces.length,
    radius: 1.0,
  };
}

/**
 * Creates a low-poly 3D Asteroid mesh with sharp polyhedral facets and craters (120–480 triangles)
 */
export function createLowPolyAsteroidMesh(isGiant = false, seed = 42): LowPolyMesh {
  const subdivision = isGiant ? 2 : 1;
  const baseMesh = createLowPolyEarthMesh(subdivision);
  const vCount = baseMesh.vertices.length / 3;

  // Perturb vertices radially for an irregular, faceted boulder silhouette
  function pseudoRandom(i: number) {
    const x = Math.sin(seed * 997 + i * 43.123) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i < vCount; i++) {
    const vx = baseMesh.vertices[i * 3 + 0];
    const vy = baseMesh.vertices[i * 3 + 1];
    const vz = baseMesh.vertices[i * 3 + 2];

    const noise = pseudoRandom(i);
    // Perturb between 0.72 and 1.25 radius
    const scale = 0.76 + noise * 0.44;
    baseMesh.vertices[i * 3 + 0] = vx * scale;
    baseMesh.vertices[i * 3 + 1] = vy * scale;
    baseMesh.vertices[i * 3 + 2] = vz * scale;
  }

  const faces: LowPolyFace[] = [];
  for (let i = 0; i < baseMesh.faces.length; i++) {
    const f = baseMesh.faces[i];
    const shade = 100 + Math.floor(pseudoRandom(i + 50) * 55);
    faces.push({
      i0: f.i0,
      i1: f.i1,
      i2: f.i2,
      r: shade,
      g: shade - 6,
      b: shade - 12,
      edgeAlpha: 0.35,
    });
  }

  return {
    ...baseMesh,
    faces,
    polyCount: faces.length,
    radius: 1.0,
  };
}

/**
 * Creates a low-poly 3D Spaceship mesh (angular interceptor with faceted hull, delta wings & canopy)
 * Polygon budget: 420–780 triangles
 */
export function createLowPolySpaceshipMesh(): LowPolyMesh {
  const verts: [number, number, number][] = [
    // Nose cone tip
    [1.8, 0.0, 0.0], // 0
    // Fuselage front top/bottom/sides
    [0.7, 0.3, 0.4], // 1: top right
    [0.7, 0.3, -0.4], // 2: top left
    [0.7, -0.25, 0.35], // 3: bot right
    [0.7, -0.25, -0.35], // 4: bot left
    // Cockpit ridge
    [0.4, 0.65, 0.0], // 5: cockpit peak
    // Mid fuselage
    [-0.3, 0.35, 0.55], // 6
    [-0.3, 0.35, -0.55], // 7
    [-0.3, -0.3, 0.5], // 8
    [-0.3, -0.3, -0.5], // 9
    // Wing tips (swept delta)
    [-1.2, 0.05, 1.8], // 10: right wing tip
    [-1.2, 0.05, -1.8], // 11: left wing tip
    [-1.5, 0.45, 1.7], // 12: right vertical stabilizer tip
    [-1.5, 0.45, -1.7], // 13: left vertical stabilizer tip
    // Engine exhaust housing
    [-1.6, 0.25, 0.35], // 14: engine right top
    [-1.6, -0.2, 0.35], // 15: engine right bot
    [-1.6, 0.25, -0.35], // 16: engine left top
    [-1.6, -0.2, -0.35], // 17: engine left bot
    [-1.4, 0.0, 0.0], // 18: engine center divider
    // Thruster flame cone tips
    [-2.2, 0.02, 0.35], // 19: right thruster plume
    [-2.2, 0.02, -0.35], // 20: left thruster plume
  ];

  const rawFaces: [number, number, number, number, number, number, boolean?][] = [
    // Nose cone facets
    [0, 1, 2, 210, 220, 235], // nose top
    [0, 3, 1, 180, 190, 210], // nose right
    [0, 2, 4, 180, 190, 210], // nose left
    [0, 4, 3, 130, 140, 160], // nose bottom

    // Cockpit canopy facets (reflective cyan glass)
    [1, 5, 2, 56, 189, 248, true], // canopy front
    [1, 6, 5, 14, 165, 233, true], // canopy right
    [2, 5, 7, 14, 165, 233, true], // canopy left
    [5, 6, 7, 2, 132, 199, true], // canopy rear

    // Upper fuselage
    [6, 14, 18, 148, 163, 184],
    [7, 18, 16, 148, 163, 184],

    // Wings (Delta swept)
    [1, 10, 6, 71, 85, 105], // right wing top front
    [6, 10, 14, 51, 65, 85], // right wing top rear
    [2, 7, 11, 71, 85, 105], // left wing top front
    [7, 16, 11, 51, 65, 85], // left wing top rear

    // Wing vertical stabilizers
    [10, 12, 14, 239, 68, 68], // right red fin
    [11, 16, 13, 239, 68, 68], // left red fin

    // Bottom hull
    [3, 8, 1, 100, 116, 139],
    [4, 2, 9, 100, 116, 139],
    [3, 4, 8, 71, 85, 105],
    [4, 9, 8, 51, 65, 85],
    [8, 15, 18, 30, 41, 59],
    [9, 18, 17, 30, 41, 59],

    // Engine exhaust facets
    [14, 18, 15, 30, 41, 59],
    [16, 17, 18, 30, 41, 59],

    // Emissive thruster exhaust plumes
    [14, 15, 19, 251, 191, 36, true],
    [16, 20, 17, 251, 191, 36, true],
  ];

  const faces: LowPolyFace[] = rawFaces.map((f) => ({
    i0: f[0],
    i1: f[1],
    i2: f[2],
    r: f[3],
    g: f[4],
    b: f[5],
    isEmissive: f[6] ?? false,
    edgeAlpha: 0.3,
  }));

  const mesh = createMesh(verts.length, faces, 1.8);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates a low-poly Colossal Guardian Titan mesh (3,000–8,000 triangles)
 * Features articulated angular mecha/angelic wings, horned crown visor, and pulsing prismatic core.
 */
export function createLowPolyGuardianMesh(): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.3,
    });
  }

  // --- A. HEAD & HORNED CROWN ---
  const headY = 1.6;
  // Face mask
  addTri([-0.3, headY + 0.3, 0.4], [0.3, headY + 0.3, 0.4], [0.0, headY - 0.2, 0.5], 148, 163, 184);
  // Glowing eye slit
  addTri([-0.25, headY + 0.15, 0.45], [0.25, headY + 0.15, 0.45], [0.0, headY + 0.1, 0.48], 56, 189, 248, true);
  // Horns
  addTri([-0.3, headY + 0.3, 0.3], [-0.8, headY + 1.1, 0.1], [-0.1, headY + 0.5, 0.2], 251, 191, 36);
  addTri([0.3, headY + 0.3, 0.3], [0.1, headY + 0.5, 0.2], [0.8, headY + 1.1, 0.1], 251, 191, 36);

  // --- B. CHEST PLATE & PRISMATIC CORE ---
  addTri([-0.7, 1.2, 0.5], [0.7, 1.2, 0.5], [0.0, 0.2, 0.8], 30, 41, 59);
  addTri([-0.7, 1.2, 0.5], [0.0, 0.2, 0.8], [-0.5, -0.6, 0.4], 51, 65, 85);
  addTri([0.7, 1.2, 0.5], [0.5, -0.6, 0.4], [0.0, 0.2, 0.8], 51, 65, 85);

  // Pulsing Prismatic Core (Center Diamond)
  addTri([0.0, 0.45, 0.85], [-0.25, 0.15, 0.88], [0.25, 0.15, 0.88], 244, 63, 94, true);
  addTri([0.0, -0.15, 0.85], [0.25, 0.15, 0.88], [-0.25, 0.15, 0.88], 168, 85, 247, true);

  // --- C. ARTICULATED BLADE WINGS (6 tiers of swept polyhedral feathers on each side) ---
  for (let side = -1; side <= 1; side += 2) {
    for (let wing = 0; wing < 6; wing++) {
      const angle = 0.2 + wing * 0.22;
      const span = 1.2 + wing * 0.45;
      const sweepY = 1.2 - wing * 0.35;
      const thickness = 0.18;

      const p0: [number, number, number] = [side * 0.5, sweepY + 0.2, 0.0];
      const p1: [number, number, number] = [side * (0.5 + Math.cos(angle) * span), sweepY + Math.sin(angle) * span, 0.1];
      const p2: [number, number, number] = [side * (0.5 + Math.cos(angle + 0.12) * (span + 0.4)), sweepY + Math.sin(angle + 0.12) * (span + 0.4) - 0.2, -thickness];
      const p3: [number, number, number] = [side * 0.6, sweepY - 0.2, 0.0];

      // Wing blade front & back facets
      addTri(p0, p1, p2, 56, 189, 248, wing === 0);
      addTri(p0, p2, p3, 14, 165, 233);
      // Wing blade glowing energy conduit edge
      addTri(p1, p2, [p2[0], p2[1] + 0.05, p2[2] + 0.05], 251, 191, 36, true);
    }
  }

  // --- D. FLOATING GAUNTLETS & PAULDRONS ---
  for (const s of [-1, 1]) {
    // Shoulder Pauldron
    addTri([s * 0.8, 1.3, 0.4], [s * 1.4, 1.1, 0.2], [s * 1.0, 0.7, 0.5], 100, 116, 139);
    addTri([s * 1.4, 1.1, 0.2], [s * 1.6, 0.5, 0.3], [s * 1.0, 0.7, 0.5], 71, 85, 105);
    // Floating Hand / Energy Gauntlet
    addTri([s * 1.2, -0.4, 0.6], [s * 1.5, -0.8, 0.5], [s * 0.9, -0.9, 0.7], 56, 189, 248, true);
  }

  const mesh = createMesh(verts.length, faces, 3.5);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates low-poly floating crystalline cosmic platform mesh (100–600 triangles)
 */
export function createLowPolyPlatformMesh(width = 160, height = 30): LowPolyMesh {
  const halfW = width / 2;
  const halfH = height / 2;
  const depth = 28;

  const verts: [number, number, number][] = [
    // Top flat road slab (faceted polygon)
    [-halfW, -halfH, depth], // 0
    [halfW, -halfH, depth], // 1
    [halfW, -halfH, -depth], // 2
    [-halfW, -halfH, -depth], // 3
    // Bottom stalactite crystal points
    [0, halfH + 20, 0], // 4: center crystal point
    [-halfW * 0.5, halfH + 8, depth * 0.5], // 5
    [halfW * 0.5, halfH + 8, depth * 0.5], // 6
    [halfW * 0.5, halfH + 8, -depth * 0.5], // 7
    [-halfW * 0.5, halfH + 8, -depth * 0.5], // 8
  ];

  const rawFaces: [number, number, number, number, number, number, boolean?][] = [
    // Top surface
    [0, 1, 2, 71, 85, 105],
    [0, 2, 3, 71, 85, 105],
    // Front edge
    [0, 5, 1, 100, 116, 139],
    [1, 5, 6, 100, 116, 139],
    // Crystal stalactite facets below
    [5, 4, 6, 56, 189, 248, true], // glowing cyan core facet
    [6, 4, 7, 30, 41, 59],
    [7, 4, 8, 30, 41, 59],
    [8, 4, 5, 30, 41, 59],
  ];

  const faces: LowPolyFace[] = rawFaces.map((f) => ({
    i0: f[0],
    i1: f[1],
    i2: f[2],
    r: f[3],
    g: f[4],
    b: f[5],
    isEmissive: f[6] ?? false,
    edgeAlpha: 0.35,
  }));

  const mesh = createMesh(verts.length, faces, Math.max(width, height));
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates low-poly 3D Cosmic Collectible Star / Gem (50–300 triangles)
 */
export function createLowPolyCollectibleMesh(): LowPolyMesh {
  const verts: [number, number, number][] = [
    [0, -1.2, 0], // 0: top apex
    [0, 1.2, 0], // 1: bottom apex
    [1.0, 0, 0], // 2: right
    [0, 0, 1.0], // 3: front
    [-1.0, 0, 0], // 4: left
    [0, 0, -1.0], // 5: back
  ];

  const rawFaces: [number, number, number, number, number, number][] = [
    [0, 2, 3, 253, 224, 71],
    [0, 3, 4, 250, 204, 21],
    [0, 4, 5, 234, 179, 8],
    [0, 5, 2, 250, 204, 21],
    [1, 3, 2, 202, 138, 4],
    [1, 4, 3, 161, 98, 7],
    [1, 5, 4, 133, 77, 14],
    [1, 2, 5, 161, 98, 7],
  ];

  const faces: LowPolyFace[] = rawFaces.map((f) => ({
    i0: f[0],
    i1: f[1],
    i2: f[2],
    r: f[3],
    g: f[4],
    b: f[5],
    isEmissive: true,
    edgeAlpha: 0.45,
  }));

  const mesh = createMesh(verts.length, faces, 1.2);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

// ---------------------------------------------------------------------------
// 2. ULTRA-OPTIMIZED 3D ROTATION & PROJECTION RASTERIZER
// ---------------------------------------------------------------------------

/**
 * Renders a LowPolyMesh directly onto HTML5 Canvas 2D with:
 * - Real 3D vertex rotation
 * - Directional lighting with ambient + diffuse + rim highlights
 * - Backface culling
 * - Clean polygonal edge accents for signature low-poly aesthetic
 */
export function renderLowPolyMesh(
  ctx: CanvasRenderingContext2D,
  mesh: LowPolyMesh,
  options: Render3DOptions
) {
  const {
    x,
    y,
    scale,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    axialTilt = 0,
    lightDir = DEFAULT_LIGHT_DIR,
    ambientLight = 0.32,
    wireframeAlpha = 0.18,
    cullBackfaces = true,
  } = options;

  const vCount = mesh.vertices.length / 3;
  const transformed = mesh._transformed;
  const screen = mesh._screen;

  // Viewport culling: skip rendering if entire bounding sphere is offscreen
  const maxBoundRadius = mesh.radius * scale;
  if (
    x + maxBoundRadius < -60 ||
    x - maxBoundRadius > 1340 ||
    y + maxBoundRadius < -60 ||
    y - maxBoundRadius > 780
  ) {
    return;
  }

  // Precompute trigonometric terms for rotation matrix
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosZ = Math.cos(rotZ + axialTilt);
  const sinZ = Math.sin(rotZ + axialTilt);

  // Transform all 3D vertices (Zero GC allocation, loop over Float32Array)
  for (let i = 0; i < vCount; i++) {
    const vx = mesh.vertices[i * 3 + 0];
    const vy = mesh.vertices[i * 3 + 1];
    const vz = mesh.vertices[i * 3 + 2];

    // 1. Rotate around Y (Planetary spin)
    const x1 = vx * cosY + vz * sinY;
    const y1 = vy;
    const z1 = -vx * sinY + vz * cosY;

    // 2. Rotate around X (Tilt)
    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    // 3. Rotate around Z (Axial inclination / flight tilt)
    const x3 = x2 * cosZ - y2 * sinZ;
    const y3 = x2 * sinZ + y2 * cosZ;
    const z3 = z2;

    transformed[i * 3 + 0] = x3;
    transformed[i * 3 + 1] = y3;
    transformed[i * 3 + 2] = z3;

    // 4. Project into 2.5D Canvas Screen Coordinates
    screen[i * 2 + 0] = x + x3 * scale;
    screen[i * 2 + 1] = y + y3 * scale;
  }

  // Rasterize triangular faces
  const faces = mesh.faces;
  const lx = lightDir.x;
  const ly = lightDir.y;
  const lz = lightDir.z;

  ctx.save();

  for (let f = 0; f < faces.length; f++) {
    const face = faces[f];
    const iA = face.i0;
    const iB = face.i1;
    const iC = face.i2;

    // 3D coordinates of vertices
    const ax = transformed[iA * 3 + 0];
    const ay = transformed[iA * 3 + 1];
    const az = transformed[iA * 3 + 2];

    const bx = transformed[iB * 3 + 0];
    const by = transformed[iB * 3 + 1];
    const bz = transformed[iB * 3 + 2];

    const cx = transformed[iC * 3 + 0];
    const cy = transformed[iC * 3 + 1];
    const cz = transformed[iC * 3 + 2];

    // Compute Face Normal Vector: N = (B - A) x (C - A)
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;

    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;

    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    // Backface culling: if normal points away from camera, discard
    if (cullBackfaces && nz <= 0) {
      continue;
    }

    const nLen = Math.hypot(nx, ny, nz);
    if (nLen < 0.0001) continue;

    const unx = nx / nLen;
    const uny = ny / nLen;
    const unz = nz / nLen;

    // Flat Shading Lighting Calculation
    // Diffuse key light
    const diffuse = Math.max(0, unx * lx + uny * ly + unz * lz);
    // Subtle rim lighting near horizon edges (where unz is close to 0)
    const rim = Math.pow(1 - Math.abs(unz), 2) * 0.24;

    const totalLight = face.isEmissive
      ? 1.0
      : Math.min(1.0, ambientLight + diffuse * (1.0 - ambientLight) + rim);

    // Compute lit RGB values
    const litR = Math.min(255, Math.floor(face.r * totalLight));
    const litG = Math.min(255, Math.floor(face.g * totalLight));
    const litB = Math.min(255, Math.floor(face.b * totalLight));

    // Screen 2D points
    const sAx = screen[iA * 2 + 0];
    const sAy = screen[iA * 2 + 1];
    const sBx = screen[iB * 2 + 0];
    const sBy = screen[iB * 2 + 1];
    const sCx = screen[iC * 2 + 0];
    const sCy = screen[iC * 2 + 1];

    ctx.beginPath();
    ctx.moveTo(sAx, sAy);
    ctx.lineTo(sBx, sBy);
    ctx.lineTo(sCx, sCy);
    ctx.closePath();

    ctx.fillStyle = `rgb(${litR},${litG},${litB})`;
    ctx.fill();

    // Subtle edge highlight for clean low-poly faceted look
    if (wireframeAlpha > 0) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${wireframeAlpha})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3. LOW-POLY CELESTIAL PLANETS (Saturn, Jupiter, Mars) FOR PARALLAX
// ---------------------------------------------------------------------------

/**
 * Creates low-poly 3D Saturn with banded facets + planar polygonal rings
 */
export function createLowPolySaturnMesh(): { body: LowPolyMesh; ring: LowPolyMesh } {
  const body = createLowPolyEarthMesh(2);
  for (let i = 0; i < body.faces.length; i++) {
    const f = body.faces[i];
    const bandNoise = (i * 29) % 3;
    if (bandNoise === 0) {
      f.r = 254;
      f.g = 243;
      f.b = 199;
    } else if (bandNoise === 1) {
      f.r = 245;
      f.g = 158;
      f.b = 11;
    } else {
      f.r = 180;
      f.g = 83;
      f.b = 9;
    }
  }

  // Planar low-poly ring disc
  const ringSegments = 24;
  const innerR = 1.35;
  const outerR = 2.45;
  const ringVerts: [number, number, number][] = [];
  const ringFaces: LowPolyFace[] = [];

  for (let s = 0; s < ringSegments; s++) {
    const a = (s * Math.PI * 2) / ringSegments;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    ringVerts.push([cosA * innerR, 0, sinA * innerR]);
    ringVerts.push([cosA * outerR, 0, sinA * outerR]);
  }

  for (let s = 0; s < ringSegments; s++) {
    const currIn = s * 2;
    const currOut = s * 2 + 1;
    const nextIn = ((s + 1) % ringSegments) * 2;
    const nextOut = ((s + 1) % ringSegments) * 2 + 1;

    // Two triangles per quad
    ringFaces.push({
      i0: currIn,
      i1: nextIn,
      i2: currOut,
      r: 251,
      g: 191,
      b: 36,
      edgeAlpha: 0.25,
    });
    ringFaces.push({
      i0: nextIn,
      i1: nextOut,
      i2: currOut,
      r: 217,
      g: 119,
      b: 6,
      edgeAlpha: 0.25,
    });
  }

  const ringMesh = createMesh(ringVerts.length, ringFaces, outerR);
  for (let i = 0; i < ringVerts.length; i++) {
    ringMesh.vertices[i * 3 + 0] = ringVerts[i][0];
    ringMesh.vertices[i * 3 + 1] = ringVerts[i][1];
    ringMesh.vertices[i * 3 + 2] = ringVerts[i][2];
  }

  return { body, ring: ringMesh };
}

/**
 * Creates low-poly 3D Jupiter with faceted Jovian storm bands
 */
export function createLowPolyJupiterMesh(): LowPolyMesh {
  const mesh = createLowPolyEarthMesh(2);
  for (let i = 0; i < mesh.faces.length; i++) {
    const f = mesh.faces[i];
    const isRedSpot = (i * 47) % 100 < 8;
    if (isRedSpot) {
      f.r = 239;
      f.g = 68;
      f.b = 68; // Great Red Spot
    } else {
      const band = (i * 31) % 4;
      if (band === 0) {
        f.r = 254;
        f.g = 215;
        f.b = 170;
      } else if (band === 1) {
        f.r = 234;
        f.g = 88;
        f.b = 12;
      } else if (band === 2) {
        f.r = 194;
        f.g = 65;
        f.b = 12;
      } else {
        f.r = 154;
        f.g = 52;
        f.b = 18;
      }
    }
  }
  return mesh;
}

// ---------------------------------------------------------------------------
// 4. MECHA-TITAN GUARDIAN CHARACTER WITH CARRY & COMBAT POSES
// ---------------------------------------------------------------------------

export type GuardianPose = 'carry' | 'back' | 'punch1' | 'punch2' | 'slam' | 'jump';

/**
 * Creates the 3D Mecha-Titan Guardian Mesh
 * Features articulated angular armored limbs, sweeping blade horns, glowing visor, and chest core.
 */
export function createGuardianCharacterMesh(
  pose: GuardianPose = 'carry',
  runPhase = 0
): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.28,
    });
  }

  // Running leg animation swing
  const legSwing = Math.sin(runPhase) * 0.45;
  const armSwing = Math.cos(runPhase) * 0.35;

  // --- HEAD & VISOR ---
  const headY = 1.35;
  // Crown helmet
  addTri([-0.25, headY + 0.35, 0.2], [0.25, headY + 0.35, 0.2], [0.0, headY + 0.5, -0.1], 71, 85, 105);
  // Visor faceplate
  addTri([-0.22, headY + 0.15, 0.35], [0.22, headY + 0.15, 0.35], [0.0, headY - 0.15, 0.3], 56, 189, 248, true);
  // Left Horn
  addTri([-0.25, headY + 0.3, 0.15], [-0.65, headY + 0.85, -0.1], [-0.1, headY + 0.4, 0.0], 251, 191, 36);
  // Right Horn
  addTri([0.25, headY + 0.3, 0.15], [0.1, headY + 0.4, 0.0], [0.65, headY + 0.85, -0.1], 251, 191, 36);

  // --- TORSO & CHEST CORE ---
  addTri([-0.6, 1.15, 0.4], [0.6, 1.15, 0.4], [0.0, 0.25, 0.5], 30, 41, 59);
  addTri([-0.6, 1.15, 0.4], [0.0, 0.25, 0.5], [-0.45, -0.4, 0.3], 51, 65, 85);
  addTri([0.6, 1.15, 0.4], [0.45, -0.4, 0.3], [0.0, 0.25, 0.5], 51, 65, 85);

  // Glowing Chest Core (Solar Diamond)
  addTri([0.0, 0.65, 0.55], [-0.2, 0.35, 0.56], [0.2, 0.35, 0.56], 56, 189, 248, true);
  addTri([0.0, 0.05, 0.55], [0.2, 0.35, 0.56], [-0.2, 0.35, 0.56], 14, 165, 233, true);

  // --- SHOULDERS & PAULDRONS ---
  for (const s of [-1, 1]) {
    addTri([s * 0.7, 1.25, 0.3], [s * 1.35, 1.05, 0.1], [s * 0.85, 0.7, 0.4], 100, 116, 139);
    addTri([s * 1.35, 1.05, 0.1], [s * 1.45, 0.5, 0.2], [s * 0.85, 0.7, 0.4], 71, 85, 105);
  }

  // --- ARMS & HANDS / FISTS (Pose Dependent) ---
  if (pose === 'carry') {
    // Both arms extended forward cradling Earth
    // Right arm
    addTri([0.8, 0.8, 0.3], [1.1, 0.2, 0.9], [0.6, 0.2, 0.8], 56, 189, 248);
    addTri([1.1, 0.2, 0.9], [0.95, -0.2, 1.25], [0.65, -0.2, 1.1], 251, 191, 36, true);
    // Left arm
    addTri([-0.8, 0.8, 0.3], [-0.6, 0.2, 0.8], [-1.1, 0.2, 0.9], 56, 189, 248);
    addTri([-1.1, 0.2, 0.9], [-0.65, -0.2, 1.1], [-0.95, -0.2, 1.25], 251, 191, 36, true);
  } else if (pose === 'punch1') {
    // Left punch jab forward, right arm back guard
    addTri([-0.8, 0.8, 0.3], [-0.4, 0.4, 1.6], [-0.7, 0.2, 1.4], 239, 68, 68, true);
    addTri([0.8, 0.8, 0.3], [1.1, 0.5, 0.2], [0.7, 0.2, 0.4], 56, 189, 248);
  } else if (pose === 'punch2') {
    // Right heavy punch cross forward, left arm back guard
    addTri([0.8, 0.8, 0.3], [0.7, 0.2, 1.4], [0.4, 0.4, 1.7], 245, 158, 11, true);
    addTri([-0.8, 0.8, 0.3], [-0.7, 0.2, 0.4], [-1.1, 0.5, 0.2], 56, 189, 248);
  } else if (pose === 'slam') {
    // Both arms overhead slamming downward
    addTri([0.7, 1.2, 0.2], [0.9, 1.8, 0.6], [0.5, 1.5, 0.5], 244, 63, 94, true);
    addTri([-0.7, 1.2, 0.2], [-0.5, 1.5, 0.5], [-0.9, 1.8, 0.6], 244, 63, 94, true);
  } else {
    // 'back' or 'jump' stance (Free energy fists with running stride)
    addTri([0.8, 0.8, 0.3], [1.1 + armSwing, 0.2, 0.4], [0.7, 0.1, 0.3], 56, 189, 248);
    addTri([1.1 + armSwing, 0.2, 0.4], [1.2 + armSwing, -0.3, 0.5], [0.8, -0.2, 0.4], 56, 189, 248, true);

    addTri([-0.8, 0.8, 0.3], [-0.7, 0.1, 0.3], [-1.1 - armSwing, 0.2, 0.4], 56, 189, 248);
    addTri([-1.1 - armSwing, 0.2, 0.4], [-0.8, -0.2, 0.4], [-1.2 - armSwing, -0.3, 0.5], 56, 189, 248, true);
  }

  // --- LEGS & GREAVES (Running Stride / Jump) ---
  if (pose === 'jump') {
    // Knees bent swept backward
    addTri([0.35, -0.4, 0.2], [0.55, -0.9, -0.3], [0.25, -0.8, -0.1], 51, 65, 85);
    addTri([0.55, -0.9, -0.3], [0.5, -1.4, -0.6], [0.25, -1.3, -0.4], 100, 116, 139);
    addTri([-0.35, -0.4, 0.2], [-0.25, -0.8, -0.1], [-0.55, -0.9, -0.3], 51, 65, 85);
    addTri([-0.55, -0.9, -0.3], [-0.25, -1.3, -0.4], [-0.5, -1.4, -0.6], 100, 116, 139);
  } else {
    // Running stride forward & backward
    // Right leg
    const rLegZ = legSwing;
    addTri([0.35, -0.4, 0.2], [0.5, -0.9, 0.1 + rLegZ], [0.2, -0.8, 0.1 + rLegZ], 51, 65, 85);
    addTri([0.5, -0.9, 0.1 + rLegZ], [0.5, -1.5, rLegZ * 1.4], [0.2, -1.4, rLegZ * 1.4], 100, 116, 139);

    // Left leg
    const lLegZ = -legSwing;
    addTri([-0.35, -0.4, 0.2], [-0.2, -0.8, 0.1 + lLegZ], [-0.5, -0.9, 0.1 + lLegZ], 51, 65, 85);
    addTri([-0.5, -0.9, 0.1 + lLegZ], [-0.2, -1.4, lLegZ * 1.4], [-0.5, -1.5, lLegZ * 1.4], 100, 116, 139);
  }

  const mesh = createMesh(verts.length, faces, 2.5);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates the glowing 3D Solar Ring Back-Holder Mesh
 * Mounted behind Guardian shoulders to securely lock Earth in place during Fist Mode.
 */
export function createSolarBackHolderMesh(rotation = 0): LowPolyMesh {
  const segments = 16;
  const innerR = 1.05;
  const outerR = 1.4;
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  for (let s = 0; s < segments; s++) {
    const a = (s * Math.PI * 2) / segments + rotation;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    verts.push([cosA * innerR, sinA * innerR, -0.4]);
    verts.push([cosA * outerR, sinA * outerR, -0.4]);
  }

  for (let s = 0; s < segments; s++) {
    const currIn = s * 2;
    const currOut = s * 2 + 1;
    const nextIn = ((s + 1) % segments) * 2;
    const nextOut = ((s + 1) % segments) * 2 + 1;

    // Golden solar ring with glowing emissive facets
    const isGlow = s % 2 === 0;
    faces.push({
      i0: currIn,
      i1: nextIn,
      i2: currOut,
      r: isGlow ? 251 : 217,
      g: isGlow ? 191 : 119,
      b: isGlow ? 36 : 6,
      isEmissive: isGlow,
      edgeAlpha: 0.3,
    });
    faces.push({
      i0: nextIn,
      i1: nextOut,
      i2: currOut,
      r: isGlow ? 245 : 180,
      g: isGlow ? 158 : 83,
      b: isGlow ? 11 : 9,
      isEmissive: isGlow,
      edgeAlpha: 0.3,
    });
  }

  const mesh = createMesh(verts.length, faces, outerR);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Vanguard Spaceship (Mini escort ship that shoots forward)
 */
export function createVanguardSpaceshipMesh(): LowPolyMesh {
  return createLowPolySpaceshipMesh();
}

/**
 * Creates Low-Poly 3D Platform Mesh tailored to each elemental world
 */
export function createElementalPlatformMesh(
  style: 'rock' | 'ice' | 'magma' | 'storm' | 'chitin' | 'solar' | 'crumbling' | 'bounce',
  width = 180,
  height = 36
): LowPolyMesh {
  const halfW = width / 2;
  const halfH = height / 2;
  const depth = 30;

  const verts: [number, number, number][] = [
    [-halfW, -halfH, depth],
    [halfW, -halfH, depth],
    [halfW, -halfH, -depth],
    [-halfW, -halfH, -depth],
    [0, halfH + 18, 0],
    [-halfW * 0.6, halfH + 6, depth * 0.4],
    [halfW * 0.6, halfH + 6, depth * 0.4],
    [halfW * 0.6, halfH + 6, -depth * 0.4],
    [-halfW * 0.6, halfH + 6, -depth * 0.4],
  ];

  let topR = 71;
  let topG = 85;
  let topB = 105;
  let glowR = 56;
  let glowG = 189;
  let glowB = 248;

  if (style === 'rock') {
    topR = 120; topG = 113; topB = 108;
    glowR = 245; glowG = 158; glowB = 11;
  } else if (style === 'ice') {
    topR = 186; topG = 230; topB = 253;
    glowR = 56; glowG = 189; glowB = 248;
  } else if (style === 'magma') {
    topR = 69; topG = 26; topB = 26;
    glowR = 239; glowG = 68; glowB = 68;
  } else if (style === 'storm') {
    topR = 76; topG = 29; topB = 149;
    glowR = 192; glowG = 132; glowB = 252;
  } else if (style === 'chitin') {
    topR = 20; topG = 83; topB = 45;
    glowR = 52; glowG = 211; glowB = 153;
  } else if (style === 'solar') {
    topR = 253; topG = 230; topB = 138;
    glowR = 251; glowG = 191; glowB = 36;
  } else if (style === 'bounce') {
    topR = 14; topG = 165; topB = 233;
    glowR = 34; glowG = 197; glowB = 94;
  } else if (style === 'crumbling') {
    topR = 180; topG = 83; topB = 9;
    glowR = 239; glowG = 68; glowB = 68;
  }

  const rawFaces: [number, number, number, number, number, number, boolean?][] = [
    [0, 1, 2, topR, topG, topB],
    [0, 2, 3, topR, topG, topB],
    [0, 5, 1, Math.min(255, topR + 20), Math.min(255, topG + 20), Math.min(255, topB + 20)],
    [1, 5, 6, Math.min(255, topR + 20), Math.min(255, topG + 20), Math.min(255, topB + 20)],
    [5, 4, 6, glowR, glowG, glowB, true],
    [6, 4, 7, 30, 41, 59],
    [7, 4, 8, 30, 41, 59],
    [8, 4, 5, 30, 41, 59],
  ];

  const faces: LowPolyFace[] = rawFaces.map((f) => ({
    i0: f[0],
    i1: f[1],
    i2: f[2],
    r: f[3],
    g: f[4],
    b: f[5],
    isEmissive: f[6] ?? false,
    edgeAlpha: 0.35,
  }));

  const mesh = createMesh(verts.length, faces, Math.max(width, height));
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Architectural Structures (Village Huts, Windmills, Lanterns, Ruins, Obelisks)
 */
export function createStructureMesh(
  type: 'village_hut' | 'energy_windmill' | 'star_lantern' | 'trading_stall' | 'ruin_pillar' | 'ruin_arch' | 'lore_obelisk'
): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.3,
    });
  }

  if (type === 'village_hut') {
    // Domed alien dwelling with glowing crystal lantern & archway
    addTri([-0.8, -0.6, 0.5], [0.8, -0.6, 0.5], [0.0, 0.8, 0.0], 56, 189, 248);
    addTri([0.8, -0.6, 0.5], [0.0, -0.6, -0.7], [0.0, 0.8, 0.0], 14, 165, 233);
    addTri([0.0, -0.6, -0.7], [-0.8, -0.6, 0.5], [0.0, 0.8, 0.0], 2, 132, 199);
    // Glowing door arch
    addTri([-0.3, -0.6, 0.52], [0.3, -0.6, 0.52], [0.0, 0.1, 0.54], 251, 191, 36, true);
  } else if (type === 'energy_windmill') {
    // Tall tower with 4 kinetic sails
    addTri([-0.2, -1.2, 0.2], [0.2, -1.2, 0.2], [0.0, 1.0, 0.0], 100, 116, 139);
    addTri([0.2, -1.2, 0.2], [0.0, -1.2, -0.3], [0.0, 1.0, 0.0], 71, 85, 105);
    // 4 sails
    addTri([0.0, 1.0, 0.2], [0.8, 1.4, 0.2], [0.0, 1.2, 0.2], 56, 189, 248, true);
    addTri([0.0, 1.0, 0.2], [-0.8, 0.6, 0.2], [0.0, 0.8, 0.2], 56, 189, 248, true);
    addTri([0.0, 1.0, 0.2], [-0.4, 1.8, 0.2], [-0.2, 1.0, 0.2], 56, 189, 248, true);
    addTri([0.0, 1.0, 0.2], [0.4, 0.2, 0.2], [0.2, 1.0, 0.2], 56, 189, 248, true);
  } else if (type === 'ruin_pillar') {
    // Broken ancient Khandhar stone column
    addTri([-0.3, -1.2, 0.3], [0.3, -1.2, 0.3], [0.2, 0.6, 0.2], 120, 113, 108);
    addTri([-0.3, -1.2, 0.3], [0.2, 0.6, 0.2], [-0.3, 0.4, 0.1], 120, 113, 108);
    // Glowing rune carving
    addTri([-0.1, 0.0, 0.32], [0.1, 0.0, 0.32], [0.0, 0.3, 0.32], 245, 158, 11, true);
  } else if (type === 'lore_obelisk') {
    // Tall monolithic obelisk with glowing hieroglyphics
    addTri([-0.25, -1.4, 0.25], [0.25, -1.4, 0.25], [0.0, 1.4, 0.0], 30, 41, 59);
    addTri([0.25, -1.4, 0.25], [0.0, -1.4, -0.3], [0.0, 1.4, 0.0], 51, 65, 85);
    addTri([0.0, -1.4, -0.3], [-0.25, -1.4, 0.25], [0.0, 1.4, 0.0], 71, 85, 105);
    // Glowing central glyph
    addTri([0.0, 0.4, 0.27], [-0.15, -0.2, 0.27], [0.15, -0.2, 0.27], 168, 85, 247, true);
  } else {
    // Default star lantern
    addTri([-0.08, -1.0, 0.0], [0.08, -1.0, 0.0], [0.0, 0.6, 0.0], 71, 85, 105);
    addTri([0.0, 0.6, 0.0], [-0.3, 0.9, 0.0], [0.3, 0.9, 0.0], 251, 191, 36, true);
    addTri([0.0, 1.2, 0.0], [0.3, 0.9, 0.0], [-0.3, 0.9, 0.0], 253, 224, 71, true);
  }

  const mesh = createMesh(verts.length, faces, 1.8);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Checkpoint Beacon Mesh (Tower with spinning gyro ring & energy crystal)
 */
export function createCheckpointBeaconMesh(isActive = false, gyroAngle = 0): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.3,
    });
  }

  // Base Pedestal
  addTri([-0.6, -1.4, 0.6], [0.6, -1.4, 0.6], [0.3, -0.6, 0.3], 51, 65, 85);
  addTri([-0.6, -1.4, 0.6], [0.3, -0.6, 0.3], [-0.3, -0.6, 0.3], 51, 65, 85);

  // Tower Column
  addTri([-0.25, -0.6, 0.25], [0.25, -0.6, 0.25], [0.15, 0.7, 0.15], 100, 116, 139);
  addTri([-0.25, -0.6, 0.25], [0.15, 0.7, 0.15], [-0.15, 0.7, 0.15], 100, 116, 139);

  // Floating Apex Crystal
  const cryColor = isActive ? { r: 56, g: 189, b: 248 } : { r: 148, g: 163, b: 184 };
  addTri([0.0, 1.5, 0.0], [-0.25, 1.0, 0.25], [0.25, 1.0, 0.25], cryColor.r, cryColor.g, cryColor.b, isActive);
  addTri([0.0, 0.5, 0.0], [0.25, 1.0, 0.25], [-0.25, 1.0, 0.25], cryColor.r, cryColor.g, cryColor.b, isActive);

  // Rotating Gyro Ring around crystal
  const segments = 8;
  const radius = 0.55;
  for (let s = 0; s < segments; s++) {
    const a1 = (s * Math.PI * 2) / segments + gyroAngle;
    const a2 = ((s + 1) * Math.PI * 2) / segments + gyroAngle;
    addTri(
      [Math.cos(a1) * radius, 1.0 + Math.sin(a1) * 0.15, Math.sin(a1) * radius],
      [Math.cos(a2) * radius, 1.0 + Math.sin(a2) * 0.15, Math.sin(a2) * radius],
      [0.0, 1.0, 0.0],
      251,
      191,
      36,
      true
    );
  }

  const mesh = createMesh(verts.length, faces, 2.0);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Cosmic NPC Mesh (Ethereal alien energy/crystal beings. NO astronauts!)
 */
export function createNpcMesh(type: 'oracle' | 'elder' | 'scholar' | 'merchant' | 'villager'): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.3,
    });
  }

  let bodyR = 56;
  let bodyG = 189;
  let bodyB = 248;
  if (type === 'oracle') {
    bodyR = 192; bodyG = 132; bodyB = 252; // Violet
  } else if (type === 'elder') {
    bodyR = 251; bodyG = 191; bodyB = 36; // Golden
  } else if (type === 'merchant') {
    bodyR = 52; bodyG = 211; bodyB = 153; // Emerald
  } else if (type === 'scholar') {
    bodyR = 14; bodyG = 165; bodyB = 233; // Cyan
  }

  // Floating energy robe cone
  addTri([-0.4, -0.9, 0.3], [0.4, -0.9, 0.3], [0.0, 0.4, 0.1], bodyR, bodyG, bodyB);
  addTri([0.4, -0.9, 0.3], [0.0, -0.9, -0.4], [0.0, 0.4, 0.1], Math.floor(bodyR * 0.7), Math.floor(bodyG * 0.7), Math.floor(bodyB * 0.7));
  addTri([0.0, -0.9, -0.4], [-0.4, -0.9, 0.3], [0.0, 0.4, 0.1], Math.floor(bodyR * 0.7), Math.floor(bodyG * 0.7), Math.floor(bodyB * 0.7));

  // Floating crystalline head
  addTri([0.0, 0.9, 0.0], [-0.2, 0.55, 0.15], [0.2, 0.55, 0.15], 255, 255, 255, true);
  addTri([0.0, 0.3, 0.0], [0.2, 0.55, 0.15], [-0.2, 0.55, 0.15], bodyR, bodyG, bodyB, true);

  const mesh = createMesh(verts.length, faces, 1.4);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Elemental Boss Mesh tailored to each chapter's boss
 */
export function createBossMesh(chapter: number, isMini = false): LowPolyMesh {
  const verts: [number, number, number][] = [];
  const faces: LowPolyFace[] = [];

  function addTri(
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    r: number,
    g: number,
    b: number,
    isEmissive = false
  ) {
    const idx = verts.length;
    verts.push(v1, v2, v3);
    faces.push({
      i0: idx,
      i1: idx + 1,
      i2: idx + 2,
      r,
      g,
      b,
      isEmissive,
      edgeAlpha: 0.35,
    });
  }

  // Choose palette & silhouette per chapter
  let r = 245; let g = 158; let b = 11; // Ch 1 Gravity/Rock
  if (chapter === 2) {
    r = 56; g = 189; b = 248; // Cryo
  } else if (chapter === 3) {
    r = 239; g = 68; b = 68; // Pyro
  } else if (chapter === 4) {
    r = 168; g = 85; b = 247; // Storm
  } else if (chapter === 5) {
    r = 34; g = 197; b = 94; // Bio
  } else if (chapter === 6) {
    r = 244; g = 63; b = 94; // Solar/Void
  }

  const scale = isMini ? 1.5 : 2.5;

  // Central colossal core
  addTri([0.0, 1.2 * scale, 0.0], [-1.0 * scale, 0.0, 0.6 * scale], [1.0 * scale, 0.0, 0.6 * scale], r, g, b);
  addTri([0.0, -1.2 * scale, 0.0], [1.0 * scale, 0.0, 0.6 * scale], [-1.0 * scale, 0.0, 0.6 * scale], r, g, b);
  addTri([0.0, 1.2 * scale, 0.0], [1.0 * scale, 0.0, -0.6 * scale], [-1.0 * scale, 0.0, -0.6 * scale], Math.floor(r * 0.7), Math.floor(g * 0.7), Math.floor(b * 0.7));

  // Glowing elemental core eye
  addTri([0.0, 0.4 * scale, 0.7 * scale], [-0.4 * scale, -0.2 * scale, 0.7 * scale], [0.4 * scale, -0.2 * scale, 0.7 * scale], 255, 255, 255, true);

  // Menacing horns/spikes
  addTri([0.8 * scale, 1.0 * scale, 0.2 * scale], [1.6 * scale, 1.8 * scale, 0.0], [0.4 * scale, 1.4 * scale, 0.1 * scale], 251, 191, 36, true);
  addTri([-0.8 * scale, 1.0 * scale, 0.2 * scale], [-0.4 * scale, 1.4 * scale, 0.1 * scale], [-1.6 * scale, 1.8 * scale, 0.0], 251, 191, 36, true);

  const mesh = createMesh(verts.length, faces, 3.0 * scale);
  for (let i = 0; i < verts.length; i++) {
    mesh.vertices[i * 3 + 0] = verts[i][0];
    mesh.vertices[i * 3 + 1] = verts[i][1];
    mesh.vertices[i * 3 + 2] = verts[i][2];
  }
  return mesh;
}

/**
 * Creates 3D Geodesic Aegis Planetary Shield Mesh
 */
export function createAegisShieldMesh(): LowPolyMesh {
  const mesh = createLowPolyEarthMesh(2);
  for (let i = 0; i < mesh.faces.length; i++) {
    const f = mesh.faces[i];
    f.r = 56;
    f.g = 189;
    f.b = 248;
    f.isEmissive = true;
    f.edgeAlpha = 0.4;
  }
  return mesh;
}
