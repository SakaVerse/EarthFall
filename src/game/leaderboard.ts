import { LeaderboardEntry } from './types';
import { CloudService } from '../firebase/cloudService';
import { getTodayISTDateString } from '../utils/date';

const USERNAME_KEY = 'earthfall_username';

export class LeaderboardManager {
  private static subscribers: Array<(entries: LeaderboardEntry[], date: string) => void> = [];
  private static liveEntries: LeaderboardEntry[] = [];
  private static activeDate: string = getTodayISTDateString();
  private static cloudUnsubscribe: (() => void) | null = null;
  private static isInitialized = false;

  /**
   * Initializes real-time listener to Cloud Firestore for today's daily leaderboard.
   * Filtered by today's date string (Asia/Kolkata IST) and limited to top 20.
   */
  public static initCloudSync(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      this.cloudUnsubscribe = CloudService.subscribeDailyLeaderboard((cloudEntries, date) => {
        this.liveEntries = Array.isArray(cloudEntries) ? cloudEntries : [];
        this.activeDate = date;
        this.notifySubscribers();
      });
    } catch (e) {
      console.warn('Leaderboard cloud sync initialization notice:', e);
    }
  }

  public static subscribe(callback: (entries: LeaderboardEntry[], date: string) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getLeaderboard(), this.activeDate);

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private static notifySubscribers(): void {
    const current = this.getLeaderboard();
    for (const sub of this.subscribers) {
      try {
        sub(current, this.activeDate);
      } catch {}
    }
  }

  public static getUsername(): string | null {
    try {
      return localStorage.getItem(USERNAME_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Checks Cloud Firestore to see if the username (case-insensitive) is already taken today.
   */
  public static async isUsernameTakenToday(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;

    // Direct check against Cloud Firestore for today's date
    try {
      return await CloudService.isUsernameTakenToday(trimmed);
    } catch {
      return false;
    }
  }

  public static validateUsernameFormat(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'Username cannot be empty' };
    }
    if (trimmed.length < 3 || trimmed.length > 15) {
      return { valid: false, error: 'Username must be between 3 and 15 characters' };
    }
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(trimmed)) {
      return { valid: false, error: 'Only letters, numbers, and underscores (_) are allowed' };
    }
    return { valid: true };
  }

  public static setUsername(name: string): { success: boolean; error?: string } {
    const validation = this.validateUsernameFormat(name);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = name.trim();
    try {
      localStorage.setItem(USERNAME_KEY, trimmed);
      this.notifySubscribers();
      return { success: true };
    } catch {
      return { success: false, error: 'Could not access storage' };
    }
  }

  /**
   * Saves score to Cloud Firestore with today's date (Asia/Kolkata IST).
   * If player already has a score today, only updates if the new score is higher.
   */
  public static submitScore(
    score: number,
    zoneName: string,
    distance = 0,
    skinId = 'default'
  ): void {
    if (score <= 0) return;

    const username = this.getUsername();
    if (!username) return;

    // Cloud Firestore is the single source of truth for global rankings
    CloudService.submitScore(score, distance, zoneName, skinId, username).catch((err) => {
      console.warn('Firestore daily score submission notice:', err);
    });
  }

  /**
   * Returns current daily leaderboard from Cloud Firestore sorted by score descending,
   * limited to top 20, with rank and current player indicator.
   */
  public static getLeaderboard(): LeaderboardEntry[] {
    const currentUsername = (this.getUsername() || '').trim().toLowerCase();

    // Map live Firestore documents
    return this.liveEntries.slice(0, 20).map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentPlayer: currentUsername ? entry.username.trim().toLowerCase() === currentUsername : false,
    }));
  }

  public static getTodayDateString(): string {
    return this.activeDate || getTodayISTDateString();
  }

  public static getGamesPlayedCount(): number {
    try {
      return parseInt(localStorage.getItem('earthfall_games_played_count') || '0', 10);
    } catch {
      return 0;
    }
  }

  public static recordGamePlayed(): number {
    try {
      const current = this.getGamesPlayedCount() + 1;
      localStorage.setItem('earthfall_games_played_count', current.toString());
      return current;
    } catch {
      return 1;
    }
  }
}

// Auto-initialize real-time Firestore synchronization
LeaderboardManager.initCloudSync();
