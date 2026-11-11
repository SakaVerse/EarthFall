import { DailyMission, DailyStreakData, DailyStreakDay } from './types';
import { CosmeticsManager } from './cosmetics';
import { getTodayISTDateString, getTimeUntilMidnightIST } from '../utils/date';
import { LeaderboardManager } from './leaderboard';
import { getDeviceSignature } from '../utils/recoveryDb';

const MISSIONS_STORAGE_KEY = 'earthfall_daily_missions_v3';
const MISSIONS_DATE_KEY = 'earthfall_missions_date_v3';
const MISSIONS_USER_KEY = 'earthfall_missions_user_v3';

// Daily Streak Keys
const STREAK_COUNT_KEY = 'earthfall_daily_streak_count_v3';
const STREAK_LAST_DATE_KEY = 'earthfall_daily_streak_last_date_v3';
const STREAK_CLAIMED_DATE_KEY = 'earthfall_daily_streak_claimed_date_v3';
const STREAK_BEST_KEY = 'earthfall_daily_streak_best_v3';

// Scaled down daily streak rewards (~60% lower, as requested by player)
export const STREAK_REWARDS = [15, 20, 25, 30, 40, 50, 75];

/**
 * Deterministic integer hash for seeding user-specific daily quests
 */
function hashSeed(seedStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Seeded pseudo-random generator
 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Master pool of distinct flight directives
interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  targetType: 'energy' | 'dodge' | 'distance' | 'skills' | 'combo';
  targetCount: number;
  reward: number; // Dropped prize coin rewards (20 - 40 scrap)
}

const MISSION_POOL: MissionTemplate[] = [
  {
    id: 'mission_energy',
    title: 'Cosmic Harvester',
    description: 'Collect 30 Cosmic Energy Orbs during flights.',
    targetType: 'energy',
    targetCount: 30,
    reward: 25,
  },
  {
    id: 'mission_dodge',
    title: 'Hazard Evader',
    description: 'Dodge 18 celestial obstacles and meteorites.',
    targetType: 'dodge',
    targetCount: 18,
    reward: 25,
  },
  {
    id: 'mission_distance',
    title: 'Deep Space Voyager',
    description: 'Travel a cumulative distance of 2,200 Light Years.',
    targetType: 'distance',
    targetCount: 2200,
    reward: 35,
  },
  {
    id: 'mission_skills',
    title: 'Orbital Tactician',
    description: 'Deploy planetary abilities (EMP, Warp, Vent) 4 times.',
    targetType: 'skills',
    targetCount: 4,
    reward: 30,
  },
  {
    id: 'mission_combo',
    title: 'Gravitational Flow',
    description: 'Achieve a x4 combo by dodging hazards in close succession.',
    targetType: 'combo',
    targetCount: 4,
    reward: 30,
  },
  {
    id: 'mission_energy_burst',
    title: 'Stellar Collector',
    description: 'Gather 45 Cosmic Energy Orbs across cosmic zones.',
    targetType: 'energy',
    targetCount: 45,
    reward: 35,
  },
  {
    id: 'mission_evasion_expert',
    title: 'Asteroid Drifter',
    description: 'Perform 28 clean hazard dodges in uncharted space.',
    targetType: 'dodge',
    targetCount: 28,
    reward: 35,
  },
  {
    id: 'mission_long_voyage',
    title: 'Interstellar Cruiser',
    description: 'Traverse 3,500 Light Years into the cosmic deep.',
    targetType: 'distance',
    targetCount: 3500,
    reward: 40,
  },
  {
    id: 'mission_skill_master',
    title: 'Atmospheric Guardian',
    description: 'Activate planetary defense skills 6 times in battle.',
    targetType: 'skills',
    targetCount: 6,
    reward: 35,
  },
  {
    id: 'mission_hyper_combo',
    title: 'Momentum Virtuoso',
    description: 'Reach a high-intensity x5 combo multiplier.',
    targetType: 'combo',
    targetCount: 5,
    reward: 40,
  },
];

export class DailyMissionsManager {
  /**
   * Generates a unique, personalized set of 4 missions for this user today (IST 12:00 AM reset)
   */
  private static generatePersonalizedMissions(userKey: string, todayKey: string): DailyMission[] {
    const seed = hashSeed(`${todayKey}_${userKey}`);
    const rand = seededRandom(seed);

    // Shuffle pool copies deterministically
    const pool = [...MISSION_POOL];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Select first 4 distinct templates for today
    const selected = pool.slice(0, 4);

    return selected.map((tpl) => ({
      id: `${tpl.id}_${todayKey}`,
      title: tpl.title,
      description: tpl.description,
      targetType: tpl.targetType,
      targetCount: tpl.targetCount,
      currentCount: 0,
      reward: tpl.reward,
      completed: false,
      claimed: false,
    }));
  }

  private static getCurrentUserIdentifier(): string {
    const username = LeaderboardManager.getUsername();
    if (username && username.trim()) {
      return username.trim().toLowerCase();
    }
    return getDeviceSignature() || 'pilot_cadet';
  }

  /**
   * Returns current active missions.
   * Resets strictly at 12:00 AM IST (Asia/Kolkata), and generates different missions
   * for different pilots based on their user callsign / device signature!
   */
  public static getMissions(): DailyMission[] {
    const today = getTodayISTDateString();
    const currentUser = this.getCurrentUserIdentifier();

    try {
      const storedDate = localStorage.getItem(MISSIONS_DATE_KEY);
      const storedUser = localStorage.getItem(MISSIONS_USER_KEY);
      const storedData = localStorage.getItem(MISSIONS_STORAGE_KEY);

      // If same date (IST 12:00 AM) and same user, load saved progress
      if (storedDate === today && storedUser === currentUser && storedData) {
        const parsed: DailyMission[] = JSON.parse(storedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Generate fresh, distinct missions for this user on this IST calendar day
      const freshMissions = this.generatePersonalizedMissions(currentUser, today);
      localStorage.setItem(MISSIONS_DATE_KEY, today);
      localStorage.setItem(MISSIONS_USER_KEY, currentUser);
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(freshMissions));
      return freshMissions;
    } catch {
      return this.generatePersonalizedMissions(currentUser, today);
    }
  }

  public static saveMissions(missions: DailyMission[]) {
    try {
      localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
    } catch {}
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

  public static checkAndRecordStreak(): number {
    const today = getTodayISTDateString();
    try {
      const lastActiveDate = localStorage.getItem(STREAK_LAST_DATE_KEY);
      let streak = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0', 10);
      let bestStreak = parseInt(localStorage.getItem(STREAK_BEST_KEY) || '0', 10);

      if (!lastActiveDate) {
        streak = 1;
        localStorage.setItem(STREAK_COUNT_KEY, '1');
        localStorage.setItem(STREAK_LAST_DATE_KEY, today);
      } else if (lastActiveDate !== today) {
        // Compare dates in days
        const lastDays = Math.floor(new Date(lastActiveDate).getTime() / (86400000));
        const todayDays = Math.floor(new Date(today).getTime() / (86400000));
        const diff = todayDays - lastDays;

        if (diff === 1) {
          streak += 1;
        } else if (diff > 1) {
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

  public static getStreakData(): DailyStreakData {
    this.checkAndRecordStreak();
    const today = getTodayISTDateString();

    let currentStreak = 1;
    let bestStreak = 1;
    let claimedToday = false;

    try {
      currentStreak = Math.max(1, parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '1', 10));
      bestStreak = Math.max(currentStreak, parseInt(localStorage.getItem(STREAK_BEST_KEY) || '1', 10));
      const lastClaimed = localStorage.getItem(STREAK_CLAIMED_DATE_KEY);
      claimedToday = lastClaimed === today;
    } catch {}

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

  public static claimStreakReward(): { success: boolean; reward: number; newStreak: number } {
    const today = getTodayISTDateString();
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

  public static getTimeUntilReset(): string {
    return getTimeUntilMidnightIST().formatted;
  }
}
