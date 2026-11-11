/**
 * CrazyGames HTML5 SDK v3 Integration
 * Documentation: https://docs.crazygames.com/sdk/html5/v3/
 */

import { soundEngine } from './audio';

// Extend Window interface for CrazyGames SDK v3
declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
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
        user?: {
          getUser: () => Promise<any>;
          showAuthPrompt: () => Promise<any>;
        };
        data?: {
          setItem: (key: string, value: string) => Promise<void>;
          getItem: (key: string) => Promise<string | null>;
        };
      };
    };
  }
}

class CrazyGamesManager {
  private isInitialized = false;
  private isInitializing = false;
  private isAvailable = false;
  private audioWasMutedBeforeAd = false;

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;

    try {
      // Check if SDK script was loaded into window
      if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
        await window.CrazyGames.SDK.init();
        this.isInitialized = true;
        this.isAvailable = true;
        console.log('[CrazyGames SDK] Successfully initialized v3');
        return true;
      } else {
        // Retry shortly in case script is still downloading
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
          await window.CrazyGames.SDK.init();
          this.isInitialized = true;
          this.isAvailable = true;
          console.log('[CrazyGames SDK] Successfully initialized v3 on deferred check');
          return true;
        } else {
          console.info('[CrazyGames SDK] SDK script not available in this environment (standalone mode)');
          this.isInitialized = true;
          this.isAvailable = false;
          return false;
        }
      }
    } catch (err) {
      console.warn('[CrazyGames SDK] Initialization notice:', err);
      this.isInitialized = true;
      this.isAvailable = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  public get available(): boolean {
    return this.isAvailable;
  }

  public async getUser(): Promise<any | null> {
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.getUser) {
        return await window.CrazyGames.SDK.user.getUser();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] getUser notice:', e);
    }
    return null;
  }

  public gameplayStart() {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStart error:', e);
    }
  }

  public gameplayStop() {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] gameplayStop error:', e);
    }
  }

  public loadingStart() {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStart) {
        window.CrazyGames.SDK.game.loadingStart();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStart error:', e);
    }
  }

  public loadingStop() {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.loadingStop) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] loadingStop error:', e);
    }
  }

  public happyTime() {
    try {
      if (this.isAvailable && window.CrazyGames?.SDK?.game?.happyTime) {
        window.CrazyGames.SDK.game.happyTime();
      }
    } catch (e) {
      console.warn('[CrazyGames SDK] happyTime error:', e);
    }
  }

  /**
   * Request Midgame Interstitial Ad
   */
  public requestMidgameAd(onFinished?: () => void) {
    if (!this.isAvailable || !window.CrazyGames?.SDK?.ad?.requestAd) {
      if (onFinished) onFinished();
      return;
    }

    const beforeAudioMuted = soundEngine.isMuted();

    window.CrazyGames.SDK.ad.requestAd('midgame', {
      adStarted: () => {
        soundEngine.muteAll();
      },
      adFinished: () => {
        if (!beforeAudioMuted) soundEngine.unmuteAll();
        if (onFinished) onFinished();
      },
      adError: (error, errorData) => {
        console.warn('[CrazyGames SDK] Midgame ad failed or blocked:', error, errorData);
        if (!beforeAudioMuted) soundEngine.unmuteAll();
        if (onFinished) onFinished();
      },
    });
  }

  /**
   * Request Rewarded Ad (e.g. for Second Chance Revive / Extra Shields)
   */
  public requestRewardedAd(onReward: () => void, onDismiss?: () => void) {
    if (!this.isAvailable || !window.CrazyGames?.SDK?.ad?.requestAd) {
      // In offline / standalone preview, directly grant reward
      onReward();
      return;
    }

    const beforeAudioMuted = soundEngine.isMuted();

    window.CrazyGames.SDK.ad.requestAd('rewarded', {
      adStarted: () => {
        soundEngine.muteAll();
      },
      adFinished: () => {
        if (!beforeAudioMuted) soundEngine.unmuteAll();
        onReward();
      },
      adError: (error, errorData) => {
        console.warn('[CrazyGames SDK] Rewarded ad failed or closed:', error, errorData);
        if (!beforeAudioMuted) soundEngine.unmuteAll();
        if (onDismiss) onDismiss();
      },
    });
  }
}

export const crazyGames = new CrazyGamesManager();
