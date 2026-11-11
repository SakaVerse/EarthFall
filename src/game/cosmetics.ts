/**
 * Earthfall: Beyond the Solar System - Cosmetic Economy & Skin System
 */

import { SkinId, SkinItem, SkinTier, ThemeId } from './types';

export const SKINS: Record<SkinId, SkinItem> = {
  // --- ORIGINAL CLASSIC SKINS (Rebalanced 2.5x Price) ---
  earth_classic: {
    id: 'earth_classic',
    name: 'Terra Classic',
    tier: 'common',
    price: 0,
    description: 'The cradle of humanity. Blue oceans, lush green continents, and dynamic clouds.',
    themeId: 'default',
    atmosphereColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    trailColor: '#38bdf8',
    oceanColor: '#1e3a8a',
    continentColor: '#15803d',
    cloudColor: 'rgba(255, 255, 255, 0.85)',
    auroraColor: '#34d399',
    ringStyle: 'none',
    trailType: 'default',
    explosionType: 'default',
    specialRender: 'default',
  },
  mars_terraformed: {
    id: 'mars_terraformed',
    name: 'Mars Terraformed',
    tier: 'common',
    price: 375, // 150 * 2.5
    description: 'The Red Planet brought to life with terraformed turquoise canals and copper highlands.',
    themeId: 'solar',
    atmosphereColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.55)',
    trailColor: '#fb923c',
    oceanColor: '#0e7490',
    continentColor: '#b45309',
    cloudColor: 'rgba(254, 215, 170, 0.8)',
    auroraColor: '#f59e0b',
    ringStyle: 'none',
    trailType: 'default',
    explosionType: 'default',
    specialRender: 'default',
  },
  toxic_venus: {
    id: 'toxic_venus',
    name: 'Toxic Venus',
    tier: 'common',
    price: 550, // 220 * 2.5
    description: 'Dense sulfur-yellow acid cloud spirals over shimmering molten basalt crusts.',
    themeId: 'solar',
    atmosphereColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    trailColor: '#facc15',
    oceanColor: '#854d0e',
    continentColor: '#ca8a04',
    cloudColor: 'rgba(254, 240, 138, 0.85)',
    auroraColor: '#84cc16',
    ringStyle: 'none',
    trailType: 'default',
    explosionType: 'default',
    specialRender: 'default',
  },
  frozen_europa: {
    id: 'frozen_europa',
    name: 'Europa Glacial',
    tier: 'rare',
    price: 1125, // 450 * 2.5
    description: 'Crystalline subterranean ocean covered by fractured turquoise ice sheets and frost geysers.',
    themeId: 'glacial',
    atmosphereColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.65)',
    trailColor: '#38bdf8',
    oceanColor: '#0369a1',
    continentColor: '#bae6fd',
    cloudColor: 'rgba(224, 242, 254, 0.9)',
    auroraColor: '#38bdf8',
    ringStyle: 'saturn',
    trailType: 'sparkle',
    explosionType: 'default',
    specialRender: 'default',
  },
  solar_corona: {
    id: 'solar_corona',
    name: 'Solar Flare Core',
    tier: 'rare',
    price: 1375, // 550 * 2.5
    description: 'A stellar dynamo engulfed in roaring coronal mass ejections and sunspot magnetic arcs.',
    themeId: 'solar',
    atmosphereColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.7)',
    trailColor: '#fb7185',
    oceanColor: '#991b1b',
    continentColor: '#f59e0b',
    cloudColor: 'rgba(254, 205, 211, 0.85)',
    auroraColor: '#f43f5e',
    ringStyle: 'energy',
    trailType: 'ember',
    explosionType: 'default',
    specialRender: 'default',
  },
  bioluminescent_gaia: {
    id: 'bioluminescent_gaia',
    name: 'Bioluminescent Gaia',
    tier: 'rare',
    price: 1625, // 650 * 2.5
    description: 'Deep alien emerald biosphere with glowing bio-spore continents that pulse in the dark.',
    themeId: 'default',
    atmosphereColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    trailColor: '#34d399',
    oceanColor: '#064e3b',
    continentColor: '#059669',
    cloudColor: 'rgba(209, 250, 229, 0.85)',
    auroraColor: '#10b981',
    ringStyle: 'none',
    trailType: 'default',
    explosionType: 'default',
    specialRender: 'default',
  },
  dyson_core: {
    id: 'dyson_core',
    name: 'Dyson Sphere Prototype',
    tier: 'epic',
    price: 3000, // 1200 * 2.5
    description: 'Advanced stellar engineering. Geometric golden superstructure enclosing an artificial star core.',
    themeId: 'cyberpunk',
    atmosphereColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    trailColor: '#f59e0b',
    oceanColor: '#18181b',
    continentColor: '#d97706',
    cloudColor: 'rgba(254, 243, 199, 0.9)',
    auroraColor: '#f59e0b',
    ringStyle: 'energy',
    trailType: 'gold',
    explosionType: 'gold',
    specialRender: 'default',
  },
  dark_matter_void: {
    id: 'dark_matter_void',
    name: 'Dark Matter Singularity',
    tier: 'epic',
    price: 3750, // 1500 * 2.5
    description: 'Pure anti-matter event horizon. Deep purple gravitational vortex bending space and light.',
    themeId: 'void',
    atmosphereColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.85)',
    trailColor: '#c084fc',
    oceanColor: '#3b0764',
    continentColor: '#6b21a8',
    cloudColor: 'rgba(243, 232, 255, 0.85)',
    auroraColor: '#e879f9',
    ringStyle: 'saturn',
    trailType: 'void',
    explosionType: 'implosion',
    specialRender: 'default',
  },
  cyberpunk_matrix: {
    id: 'cyberpunk_matrix',
    name: 'Cyberpunk Synth Grid',
    tier: 'epic',
    price: 4500, // 1800 * 2.5
    description: 'Neon synthwave planetary core with digitized vector wireframes and glowing holographic neon grid.',
    themeId: 'cyberpunk',
    atmosphereColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.85)',
    trailColor: '#f472b6',
    oceanColor: '#0f172a',
    continentColor: '#06b6d4',
    cloudColor: 'rgba(251, 207, 232, 0.85)',
    auroraColor: '#06b6d4',
    ringStyle: 'cyber',
    trailType: 'neon',
    explosionType: 'default',
    specialRender: 'default',
  },

  // --- NEW SKINS (13 DETAILED SKINS ACCORDING TO SPECIFICATIONS) ---
  // COMMON - Simple color change only, no trail effect, small glow
  ice_earth: {
    id: 'ice_earth',
    name: 'Ice Earth',
    tier: 'common',
    price: 500,
    description: 'Light blue planetary crust fractured by ancient crystalline ice sheets and frozen polar fissures.',
    themeId: 'glacial',
    atmosphereColor: '#e0f2fe',
    glowColor: 'rgba(255, 255, 255, 0.65)',
    trailColor: '#bae6fd',
    oceanColor: '#7dd3fc',
    continentColor: '#f8fafc',
    cloudColor: 'rgba(255, 255, 255, 0.95)',
    auroraColor: '#ffffff',
    ringStyle: 'none',
    trailType: 'none',
    explosionType: 'default',
    specialRender: 'ice',
  },
  toxic_earth: {
    id: 'toxic_earth',
    name: 'Toxic Earth',
    tier: 'common',
    price: 600,
    description: 'Noxious biosphere infested with dark green slime pools and bubbling radioactive ooze reservoirs.',
    themeId: 'solar',
    atmosphereColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.65)',
    trailColor: '#16a34a',
    oceanColor: '#14532d',
    continentColor: '#15803d',
    cloudColor: 'rgba(187, 247, 208, 0.7)',
    auroraColor: '#4ade80',
    ringStyle: 'none',
    trailType: 'none',
    explosionType: 'default',
    specialRender: 'slime',
  },

  // RARE - Color + glow + simple trail
  fire_earth: {
    id: 'fire_earth',
    name: 'Fire Earth',
    tier: 'rare',
    price: 1500,
    description: 'A roaring world enveloped in blazing orange mantle fissures and incandescent fire trails.',
    themeId: 'solar',
    atmosphereColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.75)',
    trailColor: '#ea580c',
    oceanColor: '#7c2d12',
    continentColor: '#f97316',
    cloudColor: 'rgba(254, 215, 170, 0.75)',
    auroraColor: '#fb923c',
    ringStyle: 'none',
    trailType: 'fire',
    explosionType: 'default',
    specialRender: 'fire',
  },
  lava_earth: {
    id: 'lava_earth',
    name: 'Lava Earth',
    tier: 'rare',
    price: 1800,
    description: 'Black obsidian tectonic plates split apart by blinding bright yellow molten lava veins and embers.',
    themeId: 'solar',
    atmosphereColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    trailColor: '#dc2626',
    oceanColor: '#450a0a',
    continentColor: '#eab308',
    cloudColor: 'rgba(254, 240, 138, 0.75)',
    auroraColor: '#f87171',
    ringStyle: 'none',
    trailType: 'ember',
    explosionType: 'default',
    specialRender: 'lava',
  },
  ocean_earth: {
    id: 'ocean_earth',
    name: 'Ocean Earth',
    tier: 'rare',
    price: 1600,
    description: 'Entirely submerged planet of deep abyssal trenches, luminescent cyan waves, and bubbling water trails.',
    themeId: 'default',
    atmosphereColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.75)',
    trailColor: '#0284c7',
    oceanColor: '#0c4a6e',
    continentColor: '#0ea5e9',
    cloudColor: 'rgba(224, 242, 254, 0.85)',
    auroraColor: '#38bdf8',
    ringStyle: 'none',
    trailType: 'bubble',
    explosionType: 'default',
    specialRender: 'ocean',
  },

  // EPIC - Color + strong glow + custom trail + small particles
  neon_earth: {
    id: 'neon_earth',
    name: 'Neon Earth',
    tier: 'epic',
    price: 3500,
    description: 'Pulsing electric synth world bordered by hot magenta contours and streaming neon streaks.',
    themeId: 'cyberpunk',
    atmosphereColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.85)',
    trailColor: '#f43f5e',
    oceanColor: '#1e1b4b',
    continentColor: '#a855f7',
    cloudColor: 'rgba(244, 114, 182, 0.8)',
    auroraColor: '#ec4899',
    ringStyle: 'neon_halo',
    trailType: 'neon',
    explosionType: 'default',
    specialRender: 'neon',
  },
  crystal_earth: {
    id: 'crystal_earth',
    name: 'Crystal Earth',
    tier: 'epic',
    price: 4000,
    description: 'Geometric diamond facets refracting starlight into blinding white-blue prisms and diamond sparkles.',
    themeId: 'glacial',
    atmosphereColor: '#e0f2fe',
    glowColor: 'rgba(224, 242, 254, 0.85)',
    trailColor: '#bae6fd',
    oceanColor: '#38bdf8',
    continentColor: '#f8fafc',
    cloudColor: 'rgba(255, 255, 255, 0.95)',
    auroraColor: '#67e8f9',
    ringStyle: 'none',
    trailType: 'sparkle',
    explosionType: 'default',
    specialRender: 'crystal',
  },
  shadow_earth: {
    id: 'shadow_earth',
    name: 'Shadow Earth',
    tier: 'epic',
    price: 3800,
    description: 'A shadowy sphere cloaked in impenetrable void darkness, purple haze, and billows of black smoke.',
    themeId: 'void',
    atmosphereColor: '#a855f7',
    glowColor: 'rgba(147, 51, 234, 0.8)',
    trailColor: '#7e22ce',
    oceanColor: '#09090b',
    continentColor: '#3b0764',
    cloudColor: 'rgba(168, 85, 247, 0.5)',
    auroraColor: '#c084fc',
    ringStyle: 'none',
    trailType: 'smoke',
    explosionType: 'default',
    specialRender: 'shadow',
  },

  // LEGENDARY - Animated glow + animated trail + sparkle particles + unique explosion
  galaxy_earth: {
    id: 'galaxy_earth',
    name: 'Galaxy Earth',
    tier: 'legendary',
    price: 8000,
    description: 'A living spiral galaxy sealed inside an orb. Twinkling stars, violet nebula dust, and starry burst.',
    themeId: 'void',
    atmosphereColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.9)',
    trailColor: '#a78bfa',
    oceanColor: '#1e0836',
    continentColor: '#6d28d9',
    cloudColor: 'rgba(233, 213, 255, 0.7)',
    auroraColor: '#c084fc',
    ringStyle: 'saturn',
    trailType: 'stars',
    explosionType: 'stars',
    specialRender: 'galaxy',
  },
  golden_earth: {
    id: 'golden_earth',
    name: 'Golden Earth',
    tier: 'legendary',
    price: 9000,
    description: 'Solid planetary aurum crowned with celestial majesty, gleaming rays, and sparkling coin trails.',
    themeId: 'cyberpunk',
    atmosphereColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.95)',
    trailColor: '#facc15',
    oceanColor: '#713f12',
    continentColor: '#fde047',
    cloudColor: 'rgba(254, 240, 138, 0.9)',
    auroraColor: '#fbbf24',
    ringStyle: 'crown',
    trailType: 'gold',
    explosionType: 'gold',
    specialRender: 'golden',
  },
  aurora_earth: {
    id: 'aurora_earth',
    name: 'Aurora Earth',
    tier: 'legendary',
    price: 8500,
    description: 'Prismatic geomagnetic storms undulating across continents in an eternal aurora borealis light trail.',
    themeId: 'default',
    atmosphereColor: '#10b981',
    glowColor: 'rgba(52, 211, 153, 0.9)',
    trailColor: '#ec4899',
    oceanColor: '#064e3b',
    continentColor: '#34d399',
    cloudColor: 'rgba(244, 114, 182, 0.8)',
    auroraColor: '#ec4899',
    ringStyle: 'none',
    trailType: 'rainbow',
    explosionType: 'default',
    specialRender: 'aurora',
  },

  // MYTHIC - Full animated effect + unique explosion + special trail + screen effect
  void_earth: {
    id: 'void_earth',
    name: 'Void Earth',
    tier: 'mythic',
    price: 15000,
    description: 'Supermassive black hole singularity tearing reality apart with violet accretion rings and implosion bursts.',
    themeId: 'void',
    atmosphereColor: '#9333ea',
    glowColor: 'rgba(147, 51, 234, 0.95)',
    trailColor: '#581c87',
    oceanColor: '#020205',
    continentColor: '#18022e',
    cloudColor: 'rgba(192, 132, 252, 0.6)',
    auroraColor: '#a855f7',
    ringStyle: 'void_ring',
    trailType: 'void',
    explosionType: 'implosion',
    specialRender: 'void_hole',
  },
  zombie_earth: {
    id: 'zombie_earth',
    name: 'Zombie Earth',
    tier: 'mythic',
    price: 16000,
    description: 'Rotten decaying planetary flesh riddled with bleeding scarlet chasms and watchful alien eyes.',
    themeId: 'solar',
    atmosphereColor: '#84cc16',
    glowColor: 'rgba(132, 204, 22, 0.9)',
    trailColor: '#dc2626',
    oceanColor: '#14532d',
    continentColor: '#991b1b',
    cloudColor: 'rgba(185, 28, 28, 0.7)',
    auroraColor: '#65a30d',
    ringStyle: 'none',
    trailType: 'toxic',
    explosionType: 'toxic',
    specialRender: 'zombie',
  },
};

const SCRAP_STORAGE_KEY = 'earthfall_scrap_balance';
const UNLOCKED_SKINS_KEY = 'earthfall_unlocked_skins';
const EQUIPPED_SKIN_KEY = 'earthfall_equipped_skin';

export class CosmeticsManager {
  public static getScrapBalance(): number {
    try {
      const val = localStorage.getItem(SCRAP_STORAGE_KEY);
      if (val === null) {
        // Welcome bonus for the player
        localStorage.setItem(SCRAP_STORAGE_KEY, '100');
        return 100;
      }
      return parseInt(val, 10) || 0;
    } catch (e) {
      return 100;
    }
  }

  public static addScrap(amount: number): number {
    const current = this.getScrapBalance();
    const updated = Math.max(0, current + amount);
    try {
      localStorage.setItem(SCRAP_STORAGE_KEY, updated.toString());
    } catch (e) {}
    return updated;
  }

  public static setScrapBalance(amount: number): number {
    const updated = Math.max(0, Math.round(amount));
    try {
      localStorage.setItem(SCRAP_STORAGE_KEY, updated.toString());
    } catch (e) {}
    return updated;
  }

  public static syncUnlockedSkins(skinIds: SkinId[]): void {
    if (!Array.isArray(skinIds)) return;
    const current = new Set(this.getUnlockedSkins());
    for (const id of skinIds) {
      if (SKINS[id]) {
        current.add(id);
      }
    }
    try {
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(Array.from(current)));
    } catch (e) {}
  }

  public static spendScrap(amount: number): boolean {
    const current = this.getScrapBalance();
    if (current < amount) return false;
    this.addScrap(-amount);
    return true;
  }

  public static getUnlockedSkins(): SkinId[] {
    try {
      const stored = localStorage.getItem(UNLOCKED_SKINS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes('earth_classic')) {
          return parsed;
        }
      }
    } catch (e) {}
    const defaults: SkinId[] = ['earth_classic'];
    try {
      localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(defaults));
    } catch (e) {}
    return defaults;
  }

  public static isSkinUnlocked(skinId: SkinId): boolean {
    if (skinId === 'earth_classic') return true;
    const unlocked = this.getUnlockedSkins();
    return unlocked.includes(skinId);
  }

  public static buySkin(skinId: SkinId): { success: boolean; message: string } {
    const skin = SKINS[skinId];
    if (!skin) return { success: false, message: 'Skin not found' };

    const unlocked = this.getUnlockedSkins();
    if (unlocked.includes(skinId)) {
      return { success: true, message: 'Already purchased' };
    }

    if (this.spendScrap(skin.price)) {
      unlocked.push(skinId);
      try {
        localStorage.setItem(UNLOCKED_SKINS_KEY, JSON.stringify(unlocked));
      } catch (e) {}
      // Automatically equip newly purchased skin for seamless enjoyment
      this.equipSkin(skinId);
      return { success: true, message: `Purchased and equipped ${skin.name}!` };
    } else {
      return { success: false, message: 'Insufficient Space Scrap!' };
    }
  }

  public static getEquippedSkinId(): SkinId {
    try {
      const equipped = localStorage.getItem(EQUIPPED_SKIN_KEY) as SkinId;
      if (equipped && SKINS[equipped]) {
        return equipped;
      }
    } catch (e) {}
    return 'earth_classic';
  }

  public static getEquippedSkin(): SkinItem {
    const id = this.getEquippedSkinId();
    return SKINS[id] || SKINS.earth_classic;
  }

  public static getSkin(skinId: SkinId): SkinItem {
    return SKINS[skinId] || SKINS.earth_classic;
  }

  public static equipSkin(skinId: SkinId): boolean {
    if (!this.isSkinUnlocked(skinId)) return false;
    try {
      localStorage.setItem(EQUIPPED_SKIN_KEY, skinId);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static getEquippedTheme(): ThemeId {
    const skin = this.getEquippedSkin();
    return skin.themeId || 'default';
  }

  public static getTierRank(tier: SkinTier): number {
    switch (tier) {
      case 'common': return 1;
      case 'rare': return 2;
      case 'epic': return 3;
      case 'legendary': return 4;
      case 'mythic': return 5;
      default: return 99;
    }
  }

  public static getAllSkinsSorted(): SkinItem[] {
    const list = Object.values(SKINS);
    return list.sort((a, b) => {
      const diff = this.getTierRank(a.tier) - this.getTierRank(b.tier);
      if (diff !== 0) return diff;
      return a.price - b.price;
    });
  }
}
