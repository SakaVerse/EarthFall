/**
 * EarthFall: Beyond the Solar System
 * CrazyGames HTML5 SDK v3 Complete Integration
 * Documentation: https://docs.crazygames.com/sdk/html5/v3/
 */

import { soundEngine } from './audio';

export type PlatformEnvironment = 'crazygames' | 'vercel' | 'localhost';

export interface CrazyGamesUser {
  username?: string;
  profilePictureUrl?: string;
  countryCode?: string;
}

// Extend Window interface for CrazyGames SDK v3
declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
        environment?: 'crazygames' | 'local' | 'disabled';
        game: {
          gameplayStart: () => void;
          gameplayStop: () => void;
          loadingStart: () => void;
          loadingStop: () => void;
          happyTime: () => void;
        };
        ad: {
          requestAd: (
            type: 'midgame' | 'rewarded',
            callbacks?: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: any, errorData?: any) => void;
            }
          ) => void;
          hasAdblock?: () => Promise<boolean>;
        };
        banner?: {
          requestBanner: (options: { id: string; width: number; height: number }) => Promise<void>;
          clearBanner: (id: string) => void;
          clearAllBanners: () => void;
        };
        user?: {
          getUser: () => Promise<any>;
          showAuthPrompt: () => Promise<any>;
          addAuthListener?: (callback: (user: any) => void) => void;
        };
        data?: {
          setItem: (key: string, value: string) => Promise<void>;
          getItem: (key: string) => Promise<string | null>;
          clear?: () => Promise<void>;
        };
        leaderboard?: {
          setScore: (leaderboardId: string, score: number) => Promise<void>;
          getScores?: (leaderboardId: string, options?: any) => Promise<any>;
        };
      };
    };
  }
}

class CrazyGamesManager {
  private isInitialized = false;
  private isInitializing = false;
  private isAvailable = false;
  private lastMidgameAdTime = 0;
  private readonly MIDGAME_COOLDOWN_MS = 60000; // 60s cooldown between midgame interstitials
  private environment: PlatformEnvironment = 'vercel';
  private cachedUser: CrazyGamesUser | null = null;

  constructor() {
    this.detectEnvironment();
    this.setupWindowListeners();
  }

  private detectEnvironment(): void {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname || '';
    const search = window.location.search || '';
    const referrer = document.referrer || '';

    if (
      search.includes('crazygames=true') ||
      referrer.includes('crazygames.com') ||
      hostname.includes('crazygames.com')
    ) {
      this.environment = 'crazygames';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      this.environment = 'localhost';
    } else {
      this.environment = 'vercel';
    }
  }

  private setupWindowListeners(): void {
    if (typeof window === 'undefined') return;

    // Platform audio sync: when window loses focus in crazygames iframe, mute sound to avoid ghost audio
    window.addEventListener('blur', () => {
      if (this.isCrazyGames()) {
        soundEngine.setPlatformMuted(true);
      }
    });

    window.addEventListener('focus', () => {
      if (this.isCrazyGames()) {
        soundEngine.setPlatformMuted(false);
      }
    });
  }

  public async init(): Promise<boolean> {
    if (this.isInitialized) return this.isAvailable;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.loadingStart();

    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init();
        this.isInitialized = true;
        this.isAvailable = true;
        console.log(`[CrazyGames SDK v3] Initialized in ${this.environment} mode`);
        await this.fetchUser();
        this.loadingStop();
        return true;
      }

      // Retry once after 500ms in case the script tag was delayed
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
        await window.CrazyGames.SDK.init();
        this.isInitialized = true;
        this.isAvailable = true;
        console.log(`[CrazyGames SDK v3] Initialized in ${this.environment} mode on retry`);
        await this.fetchUser();
        this.loadingStop();
        return true;
      }

      // Standalone mode (Vercel or local preview)
      this.isInitialized = true;
      this.isAvailable = false;
      console.info(`[CrazyGames SDK] Standalone mode (${this.environment})`);
      this.loadingStop();
      return false;
    } catch (err) {
      console.warn('[CrazyGames SDK] Initialization fallback:', err);
      this.isInitialized = true;
      this.isAvailable = false;
      this.loadingStop();
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  public get available(): boolean {
    return this.isAvailable;
  }

  public getPlatform(): PlatformEnvironment {
    return this.environment;
  }

  public isCrazyGames(): boolean {
    return this.environment === 'crazygames';
  }

  // --- USER MODULE ---

  public async fetchUser(): Promise<CrazyGamesUser | null> {
    if (this.cachedUser) return this.cachedUser;

    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.user?.getUser) {
        const user = await window.CrazyGames.SDK.user.getUser();
        if (user && typeof user === 'object') {
          this.cachedUser = {
            username: user.username,
            profilePictureUrl: user.profilePictureUrl,
            countryCode: user.countryCode || user.system?.countryCode,
          };
          return this.cachedUser;
        }
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] getUser note:', e);
    }
    return null;
  }

  public getCachedUser(): CrazyGamesUser | null {
    return this.cachedUser;
  }

  public async showAuthPrompt(): Promise<any> {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.user?.showAuthPrompt) {
        return await window.CrazyGames.SDK.user.showAuthPrompt();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] showAuthPrompt note:', e);
    }
    return null;
  }

  // --- GAME LIFECYCLE ---

  public gameplayStart(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStart error:', e);
    }
  }

  public gameplayStop(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStop error:', e);
    }
  }

  public loadingStart(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStart) {
        window.CrazyGames.SDK.game.loadingStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStart error:', e);
    }
  }

  public loadingStop(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStop) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStop error:', e);
    }
  }

  public happyTime(): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.happyTime) {
        window.CrazyGames.SDK.game.happyTime();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] happyTime error:', e);
    }
  }

  // --- AD MODULE ---

  /**
   * Request Midgame Interstitial Ad with rate limiting and audio mute
   */
  public requestMidgameAd(onFinished?: () => void): void {
    const now = Date.now();
    // Only invoke ad overlay if running on CrazyGames platform
    if (!this.isAvailable || !this.isCrazyGames() || !window.CrazyGames?.SDK?.ad?.requestAd) {
      if (onFinished) onFinished();
      return;
    }

    // Cooldown check (don't spam ads during rapid restarts)
    if (now - this.lastMidgameAdTime < this.MIDGAME_COOLDOWN_MS) {
      if (onFinished) onFinished();
      return;
    }

    this.lastMidgameAdTime = now;

    try {
      window.CrazyGames.SDK.ad.requestAd('midgame', {
        adStarted: () => {
          soundEngine.setPlatformMuted(true);
        },
        adFinished: () => {
          soundEngine.setPlatformMuted(false);
          if (onFinished) onFinished();
        },
        adError: (error, errorData) => {
          console.warn('[CrazyGames SDK] Midgame ad error:', error, errorData);
          soundEngine.setPlatformMuted(false);
          if (onFinished) onFinished();
        },
      });
    } catch (e) {
      console.warn('[CrazyGames SDK] requestAd midgame exception:', e);
      soundEngine.setPlatformMuted(false);
      if (onFinished) onFinished();
    }
  }

  /**
   * Request Rewarded Ad (Bonus Scrap or Second Chance)
   */
  public requestRewardedAd(onReward: () => void, onDismiss?: () => void): void {
    // Only invoke ad overlay if running on CrazyGames platform; otherwise reward immediately
    if (!this.isAvailable || !this.isCrazyGames() || !window.CrazyGames?.SDK?.ad?.requestAd) {
      onReward();
      return;
    }

    try {
      window.CrazyGames.SDK.ad.requestAd('rewarded', {
        adStarted: () => {
          soundEngine.setPlatformMuted(true);
        },
        adFinished: () => {
          soundEngine.setPlatformMuted(false);
          onReward();
        },
        adError: (error, errorData) => {
          console.warn('[CrazyGames SDK] Rewarded ad notice:', error, errorData);
          soundEngine.setPlatformMuted(false);
          if (onDismiss) onDismiss();
        },
      });
    } catch (e) {
      console.warn('[CrazyGames SDK] Rewarded ad exception:', e);
      soundEngine.setPlatformMuted(false);
      if (onDismiss) onDismiss();
    }
  }

  public async hasAdblock(): Promise<boolean> {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.ad?.hasAdblock) {
        return await window.CrazyGames.SDK.ad.hasAdblock();
      }
    } catch (e) {}
    return false;
  }

  // --- BANNER MODULE ---

  public async requestBanner(options: { id: string; width: number; height: number }): Promise<void> {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.banner?.requestBanner) {
        await window.CrazyGames.SDK.banner.requestBanner(options);
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] requestBanner note:', e);
    }
  }

  public clearBanner(id: string): void {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.banner?.clearBanner) {
        window.CrazyGames.SDK.banner.clearBanner(id);
      }
    } catch (e) {}
  }

  // --- CLOUD DATA MODULE ---

  public async saveCloudData(key: string, value: any): Promise<boolean> {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.data?.setItem) {
        await window.CrazyGames.SDK.data.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] saveCloudData notice:', e);
    }
    return false;
  }

  public async loadCloudData<T>(key: string): Promise<T | null> {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.data?.getItem) {
        const raw = await window.CrazyGames.SDK.data.getItem(key);
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch {
            return raw as unknown as T;
          }
        }
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadCloudData notice:', e);
    }
    return null;
  }

  // --- PLATFORM LEADERBOARD MODULE ---

  public async submitPlatformScore(score: number, leaderboardId = 'main'): Promise<boolean> {
    if (score <= 0) return false;

    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.leaderboard?.setScore) {
        await window.CrazyGames.SDK.leaderboard.setScore(leaderboardId, Math.round(score));
        return true;
      }
    } catch (e) {
      // Not enabled in Developer Portal yet or unsupported, gracefully handled
      console.info('[CrazyGames SDK] Leaderboard portal configuration notice:', e);
    }
    return false;
  }
}

export const crazyGames = new CrazyGamesManager();
