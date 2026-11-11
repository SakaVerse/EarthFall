import { DailyMission, DailyStreakData, DailyStreakDay } from './types';
import { CosmeticsManager } from './cosmetics';

const MISSIONS_STORAGE_KEY = 'earthfall_daily_missions';
const MISSIONS_DATE_KEY = 'earthfall_missions_date';

// Daily Streak Keys
const STREAK_COUNT_KEY = 'earthfall_daily_streak_count';
const STREAK_LAST_DATE_KEY = 'earthfall_daily_streak_last_date';
const STREAK_CLAIMED_DATE_KEY = 'earthfall_daily_streak_claimed_date';
const STREAK_BEST_KEY = 'earthfall_daily_streak_best';

// Daily Streak rewards for 7 consecutive days (Day 7 is cosmic milestone, repeating with bonus)
export const STREAK_REWARDS = [50, 75, 100, 135, 175, 225, 350];

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseDateDays(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
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
        reward: 80,
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
        reward: 90,
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
        reward: 110,
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
        reward: 75,
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
        reward: 100,
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

  // ==================== DAILY STREAK RETENTION SYSTEM ====================

  /**
   * Evaluates and updates the daily streak based on calendar days.
   * Consecutive days increment the streak; missed days reset streak to 1.
   */
  public static checkAndRecordStreak(): number {
    const today = getTodayString();
    try {
      const lastActiveDate = localStorage.getItem(STREAK_LAST_DATE_KEY);
      let streak = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0', 10);
      let bestStreak = parseInt(localStorage.getItem(STREAK_BEST_KEY) || '0', 10);

      if (!lastActiveDate) {
        // First recorded visit
        streak = 1;
        localStorage.setItem(STREAK_COUNT_KEY, '1');
        localStorage.setItem(STREAK_LAST_DATE_KEY, today);
      } else if (lastActiveDate !== today) {
        const diff = parseDateDays(today) - parseDateDays(lastActiveDate);
        if (diff === 1) {
          // Exactly consecutive day!
          streak += 1;
        } else if (diff > 1) {
          // Missed at least one day, reset to 1
          streak = 1;
        }
        localStorage.setItem(STREAK_COUNT_KEY, streak.toString());
        localStorage.setItem(STREAK_LAST_DATE_KEY, today);
      }

      bestStreak = Math.max(bestStreak, streak);
      localStorage.setItem(STREAK_BEST_KEY, bestStreak.toString());
      return streak;
    } catch {
      return 1;
    }
  }

  /**
   * Retrieves full details about the current streak, rewards, and 7-day progression roadmap.
   */
  public static getStreakData(): DailyStreakData {
    this.checkAndRecordStreak();
    const today = getTodayString();

    let currentStreak = 1;
    let bestStreak = 1;
    let claimedToday = false;

    try {
      currentStreak = Math.max(1, parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '1', 10));
      bestStreak = Math.max(currentStreak, parseInt(localStorage.getItem(STREAK_BEST_KEY) || '1', 10));
      const lastClaimed = localStorage.getItem(STREAK_CLAIMED_DATE_KEY);
      claimedToday = lastClaimed === today;
    } catch {}

    // Cycle day inside 1-7 bracket (e.g. Day 1, Day 2 ... Day 7, Day 8 is cycle 2 Day 1, etc.)
    const cycleDay = ((currentStreak - 1) % 7) + 1;
    const todayReward = STREAK_REWARDS[cycleDay - 1];

    const days: DailyStreakDay[] = STREAK_REWARDS.map((reward, idx) => {
      const dayNum = idx + 1;
      const isPast = dayNum < cycleDay;
      const isToday = dayNum === cycleDay;
      const isCompleted = isPast || (isToday && claimedToday);

      return {
        day: dayNum,
        reward,
        isCompleted,
        isToday,
        isMilestone: dayNum === 7,
      };
    });

    return {
      currentStreak,
      bestStreak,
      claimedToday,
      todayReward,
      days,
      canClaim: !claimedToday,
    };
  }

  /**
   * Claims today's daily streak scrap reward and deposits it to player balance.
   */
  public static claimStreakReward(): { success: boolean; reward: number; newStreak: number } {
    const today = getTodayString();
    const streakData = this.getStreakData();

    if (streakData.claimedToday || !streakData.canClaim) {
      return { success: false, reward: 0, newStreak: streakData.currentStreak };
    }

    try {
      localStorage.setItem(STREAK_CLAIMED_DATE_KEY, today);
      CosmeticsManager.addScrap(streakData.todayReward);

      const bestStreak = Math.max(streakData.bestStreak, streakData.currentStreak);
      localStorage.setItem(STREAK_BEST_KEY, bestStreak.toString());

      return {
        success: true,
        reward: streakData.todayReward,
        newStreak: streakData.currentStreak,
      };
    } catch {
      return { success: false, reward: 0, newStreak: streakData.currentStreak };
    }
  }

  public static getUnclaimedCount(): number {
    const missions = this.getMissions();
    const missionUnclaimed = missions.filter((m) => m.completed && !m.claimed).length;
    const streakUnclaimed = this.getStreakData().canClaim ? 1 : 0;
    return missionUnclaimed + streakUnclaimed;
  }
}
