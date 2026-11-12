/**
 * Earthfall: Beyond the Solar System - Story Progression & Checkpoints
 * Manages Checkpoint auto-saves, persistent upgrades via Cosmic Shards, and NPC interactions.
 */

import { CheckpointData, ChapterId, UpgradeStats } from './types';
import { CHAPTERS, DEFAULT_UPGRADES, UPGRADE_TIER_COSTS } from './constants';

const CHECKPOINT_STORAGE_KEY = 'earthfall_checkpoint_v3';
const UPGRADES_STORAGE_KEY = 'earthfall_upgrades_v3';
const SHARDS_STORAGE_KEY = 'earthfall_cosmic_shards_v3';

export class StoryProgressionManager {
  /**
   * Saves activated Checkpoint to localStorage
   */
  public static saveCheckpoint(data: CheckpointData): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('[StoryProgression] Failed to save checkpoint:', e);
    }
  }

  /**
   * Retrieves saved checkpoint if one exists
   */
  public static getSavedCheckpoint(): CheckpointData | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.chapter === 'number' && parsed.chapter >= 1 && parsed.chapter <= 6) {
            return parsed as CheckpointData;
          }
        }
      }
    } catch (e) {
      console.warn('[StoryProgression] Failed to parse checkpoint:', e);
    }
    return null;
  }

  /**
   * Clears saved checkpoint (e.g., when completing Chapter 6 or starting fresh)
   */
  public static clearCheckpoint(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
      }
    } catch (e) {}
  }

  /**
   * Retrieves player's Cosmic Shards balance
   */
  public static getShards(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(SHARDS_STORAGE_KEY);
        if (raw) {
          const num = parseInt(raw, 10);
          if (!isNaN(num) && num >= 0) return num;
        }
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Adds Cosmic Shards
   */
  public static addShards(amount: number): number {
    const current = this.getShards();
    const updated = current + amount;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SHARDS_STORAGE_KEY, updated.toString());
      }
    } catch (e) {}
    return updated;
  }

  /**
   * Deducts Cosmic Shards
   */
  public static deductShards(amount: number): boolean {
    const current = this.getShards();
    if (current < amount) return false;
    const updated = current - amount;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SHARDS_STORAGE_KEY, updated.toString());
      }
    } catch (e) {}
    return true;
  }

  /**
   * Retrieves Upgrade levels
   */
  public static getUpgrades(): UpgradeStats {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(UPGRADES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...DEFAULT_UPGRADES,
            ...parsed,
          };
        }
      }
    } catch (e) {}
    return { ...DEFAULT_UPGRADES };
  }

  /**
   * Upgrades a specific stat tier if enough shards are available
   */
  public static purchaseUpgrade(statKey: keyof UpgradeStats): { success: boolean; newLevel: number; cost: number } {
    const upgrades = this.getUpgrades();
    const currentLevel = upgrades[statKey] || 1;
    if (currentLevel >= 5) {
      return { success: false, newLevel: currentLevel, cost: 0 };
    }
    const nextLevel = currentLevel + 1;
    const cost = UPGRADE_TIER_COSTS[nextLevel] || 50;

    if (!this.deductShards(cost)) {
      return { success: false, newLevel: currentLevel, cost };
    }

    upgrades[statKey] = nextLevel;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(UPGRADES_STORAGE_KEY, JSON.stringify(upgrades));
      }
    } catch (e) {}

    return { success: true, newLevel: nextLevel, cost };
  }

  /**
   * Multiplier getters for combat calculation
   */
  public static getFistDamageMultiplier(): number {
    const lvl = this.getUpgrades().fistDamageLevel;
    return 1.0 + (lvl - 1) * 0.25; // 1.0x -> 2.0x
  }

  public static getElementalResistMultiplier(): number {
    const lvl = this.getUpgrades().elementalResistLevel;
    return 1.0 - (lvl - 1) * 0.12; // Takes 48% less elemental damage at Max
  }

  public static getAbilityCooldownReduction(): number {
    const lvl = this.getUpgrades().abilityCooldownLevel;
    return (lvl - 1) * 0.10; // Up to 40% cooldown reduction
  }

  public static getVanguardFireRateMultiplier(): number {
    const lvl = this.getUpgrades().vanguardFireRateLevel;
    return 1.0 + (lvl - 1) * 0.30; // 30% faster shots per level
  }
}
