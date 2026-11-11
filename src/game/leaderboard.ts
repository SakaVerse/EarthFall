import { LeaderboardEntry } from './types';

const USERNAME_KEY = 'earthfall_username';
const LEADERBOARD_KEY = 'earthfall_global_leaderboard';

// Bot names to filter out completely from any stored data
const BOT_NAMES = new Set([
  'astronova',
  'voidrunner_x',
  'cosmocaptain',
  'stargazer_77',
  'pulsardrifter',
  'nebulaghost',
  'solarisprime',
  'orionhunter',
  'zerog_pilot',
  'terraecho',
]);

export class LeaderboardManager {
  public static getUsername(): string | null {
    try {
      return localStorage.getItem(USERNAME_KEY);
    } catch {
      return null;
    }
  }

  public static isUsernameTaken(name: string): boolean {
    const trimmed = name.trim().toLowerCase();
    const currentName = (this.getUsername() || '').trim().toLowerCase();
    if (currentName && trimmed === currentName) {
      return false; // Can keep own name
    }

    const entries = this.getRawLeaderboard();
    return entries.some((e) => e.username.trim().toLowerCase() === trimmed);
  }

  public static validateUsername(name: string): { valid: boolean; error?: string } {
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
    if (this.isUsernameTaken(trimmed)) {
      return { valid: false, error: 'Username already taken, try another' };
    }
    return { valid: true };
  }

  public static setUsername(name: string): { success: boolean; error?: string } {
    const validation = this.validateUsername(name);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = name.trim();
    try {
      localStorage.setItem(USERNAME_KEY, trimmed);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not access storage' };
    }
  }

  private static getRawLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Strictly purge all bot names and invalid entries
          const realEntries: LeaderboardEntry[] = parsed.filter(
            (e) =>
              e &&
              typeof e.username === 'string' &&
              !BOT_NAMES.has(e.username.trim().toLowerCase()) &&
              typeof e.score === 'number' &&
              e.score > 0
          );

          // Deduplicate if needed (keep highest score per username)
          const map = new Map<string, LeaderboardEntry>();
          for (const entry of realEntries) {
            const key = entry.username.trim().toLowerCase();
            const existing = map.get(key);
            if (!existing || entry.score > existing.score) {
              map.set(key, entry);
            }
          }

          const cleaned = Array.from(map.values());
          if (cleaned.length !== parsed.length) {
            this.saveRawLeaderboard(cleaned);
          }
          return cleaned;
        }
      }
    } catch {}
    return [];
  }

  private static saveRawLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    } catch {}
  }

  public static submitScore(score: number, zoneName: string): LeaderboardEntry[] {
    if (score <= 0) return this.getLeaderboard();

    const username = this.getUsername();
    if (!username) return this.getLeaderboard();

    const raw = this.getRawLeaderboard();
    const existing = raw.find((e) => e.username.trim().toLowerCase() === username.trim().toLowerCase());

    if (existing) {
      // If player beats their old score, update their existing rank, do NOT create a duplicate entry
      if (score > existing.score) {
        existing.score = score;
        existing.zone = zoneName;
        existing.date = new Date().toISOString().split('T')[0];
      }
    } else {
      raw.push({
        username: username.trim(),
        score,
        zone: zoneName,
        date: new Date().toISOString().split('T')[0],
      });
    }

    // Real-time sorting: descending by score
    raw.sort((a, b) => b.score - a.score);
    this.saveRawLeaderboard(raw);
    return this.getLeaderboard();
  }

  public static getLeaderboard(): LeaderboardEntry[] {
    const raw = this.getRawLeaderboard();
    const currentUsername = (this.getUsername() || '').trim().toLowerCase();

    // Sort descending by score
    const sorted = [...raw].sort((a, b) => b.score - a.score);

    return sorted.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentPlayer: currentUsername ? entry.username.trim().toLowerCase() === currentUsername : false,
    }));
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
