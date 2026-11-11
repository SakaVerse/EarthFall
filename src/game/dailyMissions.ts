/**
 * Earthfall: Beyond the Solar System - Daily Missions System
 */

import { DailyMission } from './types';
import { CosmeticsManager } from './cosmetics';

const MISSIONS_STORAGE_KEY = 'earthfall_daily_missions';
const MISSIONS_DATE_KEY = 'earthfall_missions_date';

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export class DailyMissionsManager {
  private static generateDefaultMissions(): DailyMission[] {
    return [
      {
        id: 'mission_energy',
        title: 'Cosmic Harvester',
        description: 'Collect 45 Cosmic Energy Orbs during flights.',
        targetType: 'energy',
        targetCount: 45,
        currentCount: 0,
        reward: 80, // 50% rebalance (was 160)
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_dodge',
        title: 'Hazard Evader',
        description: 'Successfully dodge 20 celestial obstacles and meteorites.',
        targetType: 'dodge',
        targetCount: 20,
        currentCount: 0,
        reward: 90, // 50% rebalance (was 180)
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_distance',
        title: 'Deep Space Voyager',
        description: 'Travel a cumulative distance of 3,500 Light Years.',
        targetType: 'distance',
        targetCount: 3500,
        currentCount: 0,
        reward: 110, // 50% rebalance (was 220)
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_skills',
        title: 'Orbital Tactician',
        description: 'Deploy planetary skills (EMP, Warp, Vent) 4 times.',
        targetType: 'skills',
        targetCount: 4,
        currentCount: 0,
        reward: 75, // 50% rebalance (was 150)
        completed: false,
        claimed: false,
      },
      {
        id: 'mission_combo',
        title: 'Gravitational Flow',
        description: 'Achieve a x5 combo by dodging hazards in close succession.',
        targetType: 'combo',
        targetCount: 5,
        currentCount: 0,
        reward: 100, // 50% rebalance (was 200)
        completed: false,
        claimed: false,
      },
    ];
  }

  public static getMissions(): DailyMission[] {
    const today = getTodayString();
    try {
      const storedDate = localStorage.getItem(MISSIONS_DATE_KEY);
      const storedData = localStorage.getItem(MISSIONS_STORAGE_KEY);

      if (storedDate === today && storedData) {
        const parsed: DailyMission[] = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Reset for today
      const freshMissions = this.generateDefaultMissions();
      localStorage.setItem(MISSIONS_DATE_KEY, today);
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(freshMissions));
      return freshMissions;
    } catch (e) {
      return this.generateDefaultMissions();
    }
  }

  public static saveMissions(missions: DailyMission[]) {
    try {
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
    } catch (e) {}
  }

  public static recordProgress(
    targetType: 'energy' | 'dodge' | 'distance' | 'skills' | 'combo',
    amount = 1
  ): DailyMission[] {
    const missions = this.getMissions();
    let changed = false;

    for (const mission of missions) {
      if (mission.targetType === targetType && !mission.completed) {
        if (targetType === 'combo') {
          // Highest value achieved
          if (amount > mission.currentCount) {
            mission.currentCount = Math.min(mission.targetCount, amount);
            changed = true;
          }
        } else {
          mission.currentCount = Math.min(mission.targetCount, mission.currentCount + amount);
          changed = true;
        }

        if (mission.currentCount >= mission.targetCount) {
          mission.completed = true;
        }
      }
    }

    if (changed) {
      this.saveMissions(missions);
    }
    return missions;
  }

  public static claimReward(missionId: string): { success: boolean; reward: number } {
    const missions = this.getMissions();
    const mission = missions.find((m) => m.id === missionId);

    if (mission && mission.completed && !mission.claimed) {
      mission.claimed = true;
      CosmeticsManager.addScrap(mission.reward);
      this.saveMissions(missions);
      return { success: true, reward: mission.reward };
    }
    return { success: false, reward: 0 };
  }

  public static getUnclaimedCount(): number {
    const missions = this.getMissions();
    return missions.filter((m) => m.completed && !m.claimed).length;
  }
}
