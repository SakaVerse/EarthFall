/**
 * Earthfall: Beyond the Solar System - Cosmetic Economy & Skin System
 */

import { SkinId, SkinItem, ThemeId } from './types';

export const SKINS: Record<SkinId, SkinItem> = {
  earth_classic: {
    id: 'earth_classic',
    name: 'Terra Classic',
    tier: 'common',
    price: 0,
    description: 'The cradle of humanity. Blue oceans, lush green continents, and dynamic clouds.',
    themeId: 'default',
    atmosphereColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    trailColor: '#38bdf8',
    oceanColor: '#1e3a8a',
    continentColor: '#15803d',
    cloudColor: 'rgba(255, 255, 255, 0.85)',
    auroraColor: '#34d399',
    ringStyle: 'none',
  },
  mars_terraformed: {
    id: 'mars_terraformed',
    name: 'Mars Terraformed',
    tier: 'common',
    price: 150,
    description: 'The Red Planet brought to life with terraformed turquoise canals and copper highlands.',
    themeId: 'solar',
    atmosphereColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    trailColor: '#fb923c',
    oceanColor: '#0e7490',
    continentColor: '#b45309',
    cloudColor: 'rgba(254, 215, 170, 0.8)',
    auroraColor: '#f59e0b',
    ringStyle: 'none',
  },
  toxic_venus: {
    id: 'toxic_venus',
    name: 'Toxic Venus',
    tier: 'common',
    price: 220,
    description: 'Dense sulfur-yellow acid cloud spirals over shimmering molten basalt crusts.',
    themeId: 'solar',
    atmosphereColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    trailColor: '#facc15',
    oceanColor: '#854d0e',
    continentColor: '#ca8a04',
    cloudColor: 'rgba(254, 240, 138, 0.85)',
    auroraColor: '#84cc16',
    ringStyle: 'none',
  },
  frozen_europa: {
    id: 'frozen_europa',
    name: 'Europa Glacial',
    tier: 'rare',
    price: 450,
    description: 'Crystalline subterranean ocean covered by fractured turquoise ice sheets and frost geysers.',
    themeId: 'glacial',
    atmosphereColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.55)',
    trailColor: '#38bdf8',
    oceanColor: '#0369a1',
    continentColor: '#bae6fd',
    cloudColor: 'rgba(224, 242, 254, 0.9)',
    auroraColor: '#38bdf8',
    ringStyle: 'saturn',
  },
  solar_corona: {
    id: 'solar_corona',
    name: 'Solar Flare Core',
    tier: 'rare',
    price: 550,
    description: 'A stellar dynamo engulfed in roaring coronal mass ejections and sunspot magnetic arcs.',
    themeId: 'solar',
    atmosphereColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.6)',
    trailColor: '#fb7185',
    oceanColor: '#991b1b',
    continentColor: '#f59e0b',
    cloudColor: 'rgba(254, 205, 211, 0.85)',
    auroraColor: '#f43f5e',
    ringStyle: 'energy',
  },
  bioluminescent_gaia: {
    id: 'bioluminescent_gaia',
    name: 'Bioluminescent Gaia',
    tier: 'rare',
    price: 650,
    description: 'Deep alien emerald biosphere with glowing bio-spore continents that pulse in the dark.',
    themeId: 'default',
    atmosphereColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    trailColor: '#34d399',
    oceanColor: '#064e3b',
    continentColor: '#059669',
    cloudColor: 'rgba(209, 250, 229, 0.85)',
    auroraColor: '#10b981',
    ringStyle: 'none',
  },
  dyson_core: {
    id: 'dyson_core',
    name: 'Dyson Sphere Prototype',
    tier: 'legendary',
    price: 1200,
    description: 'Advanced stellar engineering. Geometric golden superstructure enclosing an artificial star core.',
    themeId: 'cyberpunk',
    atmosphereColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    trailColor: '#f59e0b',
    oceanColor: '#18181b',
    continentColor: '#d97706',
    cloudColor: 'rgba(254, 243, 199, 0.9)',
    auroraColor: '#f59e0b',
    ringStyle: 'energy',
  },
  dark_matter_void: {
    id: 'dark_matter_void',
    name: 'Dark Matter Singularity',
    tier: 'legendary',
    price: 1500,
    description: 'Pure anti-matter event horizon. Deep purple gravitational vortex bending space and light.',
    themeId: 'void',
    atmosphereColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    trailColor: '#c084fc',
    oceanColor: '#3b0764',
    continentColor: '#6b21a8',
    cloudColor: 'rgba(243, 232, 255, 0.85)',
    auroraColor: '#e879f9',
    ringStyle: 'saturn',
  },
  cyberpunk_matrix: {
    id: 'cyberpunk_matrix',
    name: 'Cyberpunk Synth Grid',
    tier: 'legendary',
    price: 1800,
    description: 'Neon synthwave planetary core with digitized vector wireframes and glowing holographic neon grid.',
    themeId: 'cyberpunk',
    atmosphereColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.75)',
    trailColor: '#f472b6',
    oceanColor: '#0f172a',
    continentColor: '#06b6d4',
    cloudColor: 'rgba(251, 207, 232, 0.85)',
    auroraColor: '#06b6d4',
    ringStyle: 'cyber',
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
}
