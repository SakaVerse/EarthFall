import { LeaderboardEntry } from './types';

const USERNAME_KEY = 'earthfall_username';
const LEADERBOARD_KEY = 'earthfall_global_leaderboard';

const DEFAULT_GLOBAL_PILOTS: LeaderboardEntry[] = [
  { username: 'AstroNova', score: 184200, zone: 'Zone 5: The Unknown Universe', date: '2026-11-09' },
  { username: 'VoidRunner_X', score: 142650, zone: 'Zone 4: Glacial Expanse', date: '2026-11-08' },
  { username: 'CosmoCaptain', score: 119400, zone: 'Zone 4: Glacial Expanse', date: '2026-11-10' },
  { username: 'StarGazer_77', score: 94800, zone: 'Zone 3: Dark Nebula Veil', date: '2026-11-07' },
  { username: 'PulsarDrifter', score: 78250, zone: 'Zone 3: Dark Nebula Veil', date: '2026-11-09' },
  { username: 'NebulaGhost', score: 62100, zone: 'Zone 2: Main Asteroid Belt', date: '2026-11-06' },
  { username: 'SolarisPrime', score: 49900, zone: 'Zone 2: Main Asteroid Belt', date: '2026-11-10' },
  { username: 'OrionHunter', score: 36450, zone: 'Zone 2: Main Asteroid Belt', date: '2026-11-05' },
  { username: 'ZeroG_Pilot', score: 24100, zone: 'Zone 1: Solar System Outskirts', date: '2026-11-08' },
  { username: 'TerraEcho', score: 15200, zone: 'Zone 1: Solar System Outskirts', date: '2026-11-04' },
];

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

      // If user had existing entry under another name or needs initial record
      const raw = this.getRawLeaderboard();
      const existingIdx = raw.findIndex((e) => e.username.toLowerCase() === trimmed.toLowerCase());
      if (existingIdx === -1) {
        raw.push({
          username: trimmed,
          score: 0,
          zone: 'Zone 1: Solar System Outskirts',
          date: new Date().toISOString().split('T')[0],
        });
        this.saveRawLeaderboard(raw);
      }
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [...DEFAULT_GLOBAL_PILOTS];
  }

  private static saveRawLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    } catch {}
  }

  public static submitScore(score: number, zoneName: string): LeaderboardEntry[] {
    const username = this.getUsername();
    if (!username) return this.getLeaderboard();

    const raw = this.getRawLeaderboard();
    const existing = raw.find((e) => e.username.toLowerCase() === username.toLowerCase());

    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.zone = zoneName;
        existing.date = new Date().toISOString().split('T')[0];
      }
    } else {
      raw.push({
        username,
        score,
        zone: zoneName,
        date: new Date().toISOString().split('T')[0],
      });
    }

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
