import { CloudService } from '../firebase/cloudService';
import { LeaderboardEntry } from './types';
import { getTodayISTDateString } from '../utils/date';

export class LeaderboardManager {
  private static subscribers: Array<(entries: LeaderboardEntry[], date: string) => void> = [];
  private static liveEntries: LeaderboardEntry[] = [];
  private static activeDate: string = getTodayISTDateString();
  private static inMemoryNickname: string | null = null;
  private static gamesPlayedCount = 0;
  private static isInitialized = false;

  public static initCloudSync(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.activeDate = CloudService.getTodayDateKey();

    // Auto-load nickname directly from Firestore /players/{uid}
    CloudService.autoLoadPlayerNickname().then((nick) => {
      if (nick) {
        this.inMemoryNickname = nick;
        this.notifySubscribers();
      }
    }).catch(() => {});

    // Subscribe to real-time top scores from Firestore
    CloudService.subscribeTodayTop10((entries, dateKey) => {
      this.liveEntries = entries;
      this.activeDate = dateKey;
      this.notifySubscribers();
    });
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
    return this.inMemoryNickname || CloudService.getCachedNickname();
  }

  public static async refreshNicknameFromCloud(): Promise<string | null> {
    const nick = await CloudService.autoLoadPlayerNickname();
    if (nick) {
      this.inMemoryNickname = nick;
      this.notifySubscribers();
    }
    return this.getUsername();
  }

  public static getSelectedAvatar(): string {
    return CloudService.getSelectedAvatar();
  }

  public static setSelectedAvatar(avatarId: string): void {
    CloudService.setSelectedAvatar(avatarId);
  }

  public static getPlayerCountry(): string {
    return CloudService.getPlayerCountry();
  }

  public static validateUsernameFormat(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'Nickname cannot be empty' };
    }
    if (trimmed.length < 2 || trimmed.length > 12) {
      return { valid: false, error: 'Nickname must be between 2 and 12 characters' };
    }
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(trimmed)) {
      return { valid: false, error: 'Nickname can only contain letters and numbers' };
    }
    return { valid: true };
  }

  public static async reserveNickname(
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    const validation = this.validateUsernameFormat(name);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = name.trim();
    const result = await CloudService.checkAndReserveNickname(trimmed);
    if (result.success) {
      this.inMemoryNickname = trimmed;
      this.notifySubscribers();
    }
    return result;
  }

  public static async isUsernameTakenToday(name: string): Promise<boolean> {
    const res = await CloudService.checkAndReserveNickname(name);
    return !res.success && res.error === 'Nickname is already taken, please try another!';
  }

  public static setUsername(name: string): { success: boolean; error?: string } {
    const validation = this.validateUsernameFormat(name);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = name.trim();
    this.inMemoryNickname = trimmed;
    CloudService.checkAndReserveNickname(trimmed).catch(() => {});
    this.notifySubscribers();
    return { success: true };
  }

  /**
   * Saves score to Cloud Firestore with today's date (Asia/Kolkata IST) and updates real-time ranks.
   */
  public static submitScore(
    score: number,
    zoneName: string,
    roundDuration: number = 10,
    distance: number = 0,
    skinId: string = 'default'
  ): void {
    if (score <= 0) return;

    const nickname = this.getUsername();
    if (!nickname) return;

    const avatar = this.getSelectedAvatar();
    const country = this.getPlayerCountry();

    // Immediately update local active real player entries for zero-lag instant UI update
    const existingIdx = this.liveEntries.findIndex(
      (e) => e.username.trim().toLowerCase() === nickname.trim().toLowerCase()
    );

    if (existingIdx !== -1) {
      if (score > this.liveEntries[existingIdx].score) {
        this.liveEntries[existingIdx].score = score;
        this.liveEntries[existingIdx].zone = zoneName;
        this.liveEntries[existingIdx].distance = distance;
      }
    } else {
      this.liveEntries.push({
        username: nickname,
        score,
        zone: zoneName,
        date: this.activeDate,
        avatar,
        country,
        distance,
        survivalTime: roundDuration,
      });
    }

    this.liveEntries.sort((a, b) => b.score - a.score);
    this.notifySubscribers();

    // Persist real score to Cloud Firestore
    CloudService.submitDailyScore(
      score,
      roundDuration,
      distance,
      zoneName,
      nickname,
      avatar,
      country
    ).catch((err) => {
      console.warn('Firestore daily score submission note:', err);
    });
  }

  /**
   * Returns current daily leaderboard with ONLY real players who scored (no bots).
   */
  public static getLeaderboard(): LeaderboardEntry[] {
    const currentUsername = (this.getUsername() || '').trim().toLowerCase();
    const botNames = new Set([
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
      'pilot_7426',
    ]);

    // Strictly filter out any bots and only show real scored players
    const realPlayers = this.liveEntries.filter(
      (entry) =>
        entry &&
        entry.username &&
        !botNames.has(entry.username.trim().toLowerCase()) &&
        entry.score > 0
    );

    realPlayers.sort((a, b) => b.score - a.score);

    return realPlayers.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentPlayer: currentUsername ? entry.username.trim().toLowerCase() === currentUsername : false,
    }));
  }

  public static async fetchFilterLeaderboard(
    filter: 'global' | 'country' | 'alltime' | 'weekly'
  ): Promise<LeaderboardEntry[]> {
    const currentUsername = (this.getUsername() || '').trim().toLowerCase();
    const list = await CloudService.fetchLeaderboard(filter, this.getPlayerCountry());

    return list.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isCurrentPlayer: currentUsername ? entry.username.trim().toLowerCase() === currentUsername : false,
    }));
  }

  public static getTodayDateString(): string {
    return this.activeDate || getTodayISTDateString();
  }

  public static getGamesPlayedCount(): number {
    return this.gamesPlayedCount;
  }

  public static recordGamePlayed(): number {
    this.gamesPlayedCount += 1;
    return this.gamesPlayedCount;
  }
}

// Auto-initialize real-time Firestore sync on load
LeaderboardManager.initCloudSync();
