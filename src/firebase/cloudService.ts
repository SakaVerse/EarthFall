import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { AuthService } from './authService';
import { LeaderboardEntry } from '../game/types';
import { getTodayISTDateString } from '../utils/date';
import { getDeviceSignature } from '../utils/recoveryDb';
import { crazyGames } from '../game/crazyGamesSdk';

export interface PlayerProfileData {
  uid: string;
  nickname: string;
  nicknameLower: string;
  avatar?: string;
  country?: string;
  deviceSignature?: string;
  bestScore?: number;
  bestDistance?: number;
  bestSurvivalTime?: number;
  totalRuns?: number;
  coins?: number;
  scrapBalance?: number;
  unlockedSkins?: string[];
  unlockedThemes?: string[];
  updatedAt?: string;
}

export interface CosmicAvatarInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export const COSMIC_AVATARS: Record<string, CosmicAvatarInfo> = {
  earth: { id: 'earth', name: 'Terra Nova', icon: '🌍', color: '#38bdf8', desc: 'The resilient cradle of humanity' },
  mars: { id: 'mars', name: 'Ares Prime', icon: '🔴', color: '#f97316', desc: 'Terraformed frontier pioneer' },
  europa: { id: 'europa', name: 'Europa Cryo', icon: '❄️', color: '#22d3ee', desc: 'Subterranean ice sovereign' },
  titan: { id: 'titan', name: 'Titan Methane', icon: '🪐', color: '#eab308', desc: 'Hydrocarbon atmosphere cruiser' },
  solar: { id: 'solar', name: 'Helios Core', icon: '☀️', color: '#ef4444', desc: 'Coronal flare generator' },
  cyber: { id: 'cyber', name: 'Cyber Matrix', icon: '⚡', color: '#a855f7', desc: 'Quantum digital pilot' },
  void: { id: 'void', name: 'Abyssal Void', icon: '🌑', color: '#6366f1', desc: 'Singularity event horizon' },
  phoenix: { id: 'phoenix', name: 'Cosmic Phoenix', icon: '🔥', color: '#f43f5e', desc: 'Reborn in supermassive nova' },
};

export function getCountryFlag(code?: string): string {
  if (!code || code === 'UN' || code === 'GLOBAL' || code.length !== 2) return '🌐';
  try {
    const upper = code.toUpperCase();
    const codePoints = [...upper].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

export function detectPlayerCountry(): string {
  try {
    const cgUser = crazyGames.getCachedUser();
    if (cgUser?.countryCode && cgUser.countryCode.length === 2) {
      return cgUser.countryCode.toUpperCase();
    }

    if (typeof window !== 'undefined') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) return 'IN';
      if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver') || tz.includes('Phoenix')) return 'US';
      if (tz.includes('London')) return 'GB';
      if (tz.includes('Paris')) return 'FR';
      if (tz.includes('Berlin') || tz.includes('Munich') || tz.includes('Frankfurt')) return 'DE';
      if (tz.includes('Tokyo')) return 'JP';
      if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CA';
      if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane')) return 'AU';
      if (tz.includes('Sao_Paulo')) return 'BR';
      if (tz.includes('Seoul')) return 'KR';
      if (tz.includes('Dubai')) return 'AE';
      if (tz.includes('Singapore')) return 'SG';
      if (tz.includes('Amsterdam')) return 'NL';
      if (tz.includes('Rome')) return 'IT';
      if (tz.includes('Madrid')) return 'ES';

      const lang = navigator.language || '';
      if (lang.includes('-')) {
        const part = lang.split('-')[1]?.toUpperCase();
        if (part && part.length === 2) return part;
      }
    }
  } catch (e) {}
  return 'IN'; // Default to IN (Asia/Kolkata context) or fallback
}

export class CloudService {
  private static lastSubmissionTimestamp = 0;
  private static cachedNickname: string | null = null;
  private static cachedProfile: PlayerProfileData | null = null;
  private static cachedAvatar: string = 'earth';
  private static cachedCountry: string = detectPlayerCountry();

  public static getTodayDateKey(): string {
    return getTodayISTDateString();
  }

  public static getSelectedAvatar(): string {
    return this.cachedProfile?.avatar || this.cachedAvatar || 'earth';
  }

  public static setSelectedAvatar(avatarId: string): void {
    if (COSMIC_AVATARS[avatarId]) {
      this.cachedAvatar = avatarId;
      const uid = AuthService.getUserId();
      if (uid) {
        this.savePlayerProfile(uid, { avatar: avatarId }).catch(() => {});
      }
    }
  }

  public static getPlayerCountry(): string {
    return this.cachedProfile?.country || this.cachedCountry || detectPlayerCountry();
  }

  public static async loadPlayerProfile(uid: string): Promise<PlayerProfileData | null> {
    if (!uid) return null;

    try {
      const playerDocRef = doc(db, 'players', uid);
      const snap = await getDoc(playerDocRef);
      if (snap.exists()) {
        const data = snap.data() as PlayerProfileData;
        if (data && typeof data.nickname === 'string' && data.nickname.trim()) {
          this.cachedNickname = data.nickname.trim();
          this.cachedProfile = data;
          if (data.avatar) this.cachedAvatar = data.avatar;
          if (data.country) this.cachedCountry = data.country;
          return data;
        }
      }
    } catch (err) {
      console.warn('loadPlayerProfile from Firestore notice:', err);
    }

    return null;
  }

  public static async findPlayerByDeviceSignature(
    signature: string
  ): Promise<{ uid: string; profile: PlayerProfileData } | null> {
    if (!signature) return null;

    try {
      const q = query(
        collection(db, 'players'),
        where('deviceSignature', '==', signature),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docSnap = querySnap.docs[0];
        const data = docSnap.data() as PlayerProfileData;
        if (data && data.uid && data.nickname) {
          this.cachedNickname = data.nickname;
          this.cachedProfile = data;
          if (data.avatar) this.cachedAvatar = data.avatar;
          if (data.country) this.cachedCountry = data.country;
          return { uid: data.uid, profile: data };
        }
      }
    } catch (err) {
      console.warn('findPlayerByDeviceSignature Firestore query notice:', err);
    }

    return null;
  }

  public static async savePlayerProfile(
    uid: string,
    updates: Partial<PlayerProfileData>
  ): Promise<void> {
    if (!uid) return;

    try {
      const playerDocRef = doc(db, 'players', uid);
      const signature = updates.deviceSignature || getDeviceSignature();
      const current = this.cachedProfile || {};

      const payload: Partial<PlayerProfileData> = {
        ...current,
        ...updates,
        uid,
        deviceSignature: signature,
        updatedAt: new Date().toISOString(),
      };

      if (updates.nickname) {
        payload.nicknameLower = updates.nickname.toLowerCase();
        this.cachedNickname = updates.nickname;
      }

      if (updates.avatar) {
        this.cachedAvatar = updates.avatar;
      }

      if (updates.country) {
        this.cachedCountry = updates.country;
      }

      this.cachedProfile = payload as PlayerProfileData;
      await setDoc(playerDocRef, payload, { merge: true });

      // Sync backup to CrazyGames cloud data if available
      crazyGames.saveCloudData('player_profile', {
        nickname: payload.nickname,
        avatar: payload.avatar,
        bestScore: payload.bestScore,
        coins: payload.coins || payload.scrapBalance,
      }).catch(() => {});
    } catch (err) {
      console.warn('savePlayerProfile Firestore notice:', err);
    }
  }

  public static async autoLoadPlayerNickname(): Promise<string | null> {
    if (this.cachedNickname) {
      return this.cachedNickname;
    }

    const uid = AuthService.getUserId();
    if (!uid) return null;

    const profile = await this.loadPlayerProfile(uid);
    if (profile?.nickname) {
      return profile.nickname;
    }

    return null;
  }

  public static getCachedNickname(): string | null {
    return this.cachedNickname;
  }

  public static getCachedProfile(): PlayerProfileData | null {
    return this.cachedProfile;
  }

  public static clearCachedNickname(): void {
    this.cachedNickname = null;
    this.cachedProfile = null;
  }

  public static async checkAndReserveNickname(
    nickname: string
  ): Promise<{ success: boolean; error?: string }> {
    const trimmed = nickname.trim();
    if (!trimmed) {
      return { success: false, error: 'Nickname cannot be empty' };
    }

    if (trimmed.length < 2 || trimmed.length > 12) {
      return { success: false, error: 'Nickname must be between 2 and 12 characters' };
    }

    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(trimmed)) {
      return { success: false, error: 'Nickname can only contain letters and numbers' };
    }

    const uid = AuthService.getUserId();
    const lower = trimmed.toLowerCase();
    const signature = getDeviceSignature();
    const country = this.getPlayerCountry();
    const avatar = this.getSelectedAvatar();

    try {
      const nicknameDocRef = doc(db, 'nicknames', lower);
      const snap = await getDoc(nicknameDocRef);

      if (snap.exists()) {
        const existingData = snap.data();
        if (existingData && existingData.uid && existingData.uid !== uid) {
          return {
            success: false,
            error: 'Nickname is already taken, please try another!',
          };
        }
      }

      const q = query(
        collection(db, 'nicknames'),
        where('nicknameLower', '==', lower),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data();
        if (docData && docData.uid && docData.uid !== uid) {
          return {
            success: false,
            error: 'Nickname is already taken, please try another!',
          };
        }
      }

      const nowIso = new Date().toISOString();

      await setDoc(nicknameDocRef, {
        uid,
        nickname: trimmed,
        nicknameLower: lower,
        createdAt: snap.exists() ? (snap.data()?.createdAt || nowIso) : nowIso,
      }, { merge: true });

      const playerDocRef = doc(db, 'players', uid);
      await setDoc(playerDocRef, {
        uid,
        nickname: trimmed,
        nicknameLower: lower,
        avatar,
        country,
        deviceSignature: signature,
        updatedAt: nowIso,
      }, { merge: true });

      this.cachedNickname = trimmed;
      return { success: true };
    } catch (err: any) {
      console.warn('Nickname reservation Firestore notice:', err);
      this.cachedNickname = trimmed;
      return { success: true };
    }
  }

  /**
   * Anti-Bot & Real-Play Validated Score Submission:
   * 1. Requires score > 0 and score <= 1,000,000.
   * 2. Requires round duration >= 5 seconds.
   * 3. Enforces 10-second cooldown between submissions.
   * 4. Updates document only if new score is higher.
   * 5. Saves avatar, country, distance, survivalTime.
   * 6. Reports score to CrazyGames platform leaderboard if active.
   */
  public static async submitDailyScore(
    score: number,
    roundDuration: number,
    distance: number,
    zone: string,
    nickname: string,
    avatarId?: string,
    countryCode?: string
  ): Promise<{ success: boolean; reason?: string }> {
    if (score <= 0 || score > 1000000) {
      return { success: false, reason: 'Invalid score value' };
    }

    if (roundDuration < 5) {
      console.warn(`Anti-Bot: Round duration too short (${roundDuration}s < 5s). Score submission blocked.`);
      return { success: false, reason: 'Round duration too short' };
    }

    const now = Date.now();
    if (now - this.lastSubmissionTimestamp < 10000) {
      console.warn('Submission cooldown active (10s required).');
      return { success: false, reason: 'Cooldown active' };
    }
    this.lastSubmissionTimestamp = now;

    const uid = AuthService.getUserId();
    const cleanNickname = nickname.trim().slice(0, 12);
    if (!cleanNickname) {
      return { success: false, reason: 'Missing nickname' };
    }

    const dateKey = this.getTodayDateKey();
    const scoreDocId = `${dateKey}_${uid}`;
    const avatar = avatarId || this.getSelectedAvatar();
    const country = countryCode || this.getPlayerCountry();

    // Submit score to CrazyGames Platform Leaderboard if available
    crazyGames.submitPlatformScore(score).catch(() => {});

    try {
      const scoreDocRef = doc(db, 'daily_scores', scoreDocId);
      const snap = await getDoc(scoreDocRef);

      const roundedScore = Math.round(score);
      const roundedDistance = Math.round(distance);
      const roundedDuration = Math.round(roundDuration);

      if (snap.exists()) {
        const existingData = snap.data();
        const existingScore = existingData?.score ?? 0;

        if (roundedScore <= existingScore) {
          return { success: true, reason: 'Previous score higher' };
        }

        await setDoc(
          scoreDocRef,
          {
            uid,
            nickname: cleanNickname,
            nicknameLower: cleanNickname.toLowerCase(),
            avatar,
            country,
            score: roundedScore,
            dateKey,
            roundDuration: roundedDuration,
            distance: roundedDistance,
            zone: zone.slice(0, 64),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        this.savePlayerProfile(uid, {
          bestScore: roundedScore,
          bestDistance: roundedDistance,
          bestSurvivalTime: roundedDuration,
          avatar,
          country,
        }).catch(() => {});

        return { success: true };
      }

      // First score for today
      await setDoc(scoreDocRef, {
        uid,
        nickname: cleanNickname,
        nicknameLower: cleanNickname.toLowerCase(),
        avatar,
        country,
        score: roundedScore,
        dateKey,
        roundDuration: roundedDuration,
        distance: roundedDistance,
        zone: zone.slice(0, 64),
        updatedAt: new Date().toISOString(),
      });

      this.savePlayerProfile(uid, {
        bestScore: roundedScore,
        bestDistance: roundedDistance,
        bestSurvivalTime: roundedDuration,
        avatar,
        country,
      }).catch(() => {});

      return { success: true };
    } catch (err) {
      console.warn('Score submission to Firestore notice:', err);
      return { success: false, reason: 'Network error' };
    }
  }

  /**
   * Real-time listener for "Today's Top 20 Global Leaderboard" (Asia/Kolkata IST).
   */
  public static subscribeTodayTop10(
    callback: (entries: LeaderboardEntry[], dateKey: string) => void
  ): () => void {
    let activeDateKey = this.getTodayDateKey();
    let unsubscribeFirestore: (() => void) | null = null;
    let isDisposed = false;

    const setupListenerForDate = (dateKey: string) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      const topQuery = query(
        collection(db, 'daily_scores'),
        where('dateKey', '==', dateKey),
        orderBy('score', 'desc'),
        limit(20)
      );

      const handleSnapshot = (snapshot: any) => {
        if (isDisposed) return;
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (
            data &&
            typeof data.nickname === 'string' &&
            typeof data.score === 'number' &&
            data.score > 0
          ) {
            entries.push({
              username: data.nickname,
              score: data.score,
              zone: data.zone || 'Zone 1: Solar System Outskirts',
              date: data.dateKey || dateKey,
              avatar: data.avatar || 'earth',
              country: data.country || 'IN',
              distance: data.distance || 0,
              survivalTime: data.roundDuration || 0,
              uid: data.uid,
            });
          }
        });

        entries.sort((a, b) => b.score - a.score);
        callback(entries, dateKey);
      };

      try {
        unsubscribeFirestore = onSnapshot(
          topQuery,
          handleSnapshot,
          (err) => {
            if (isDisposed) return;
            console.warn('Top daily_scores query notice (fallback to dateKey filter):', err?.message);
            try {
              const fallbackQuery = query(
                collection(db, 'daily_scores'),
                where('dateKey', '==', dateKey),
                limit(50)
              );
              unsubscribeFirestore = onSnapshot(fallbackQuery, handleSnapshot);
            } catch (fbErr) {
              console.warn('Fallback onSnapshot notice:', fbErr);
            }
          }
        );
      } catch (err) {
        console.warn('Failed to attach daily_scores onSnapshot:', err);
      }
    };

    setupListenerForDate(activeDateKey);

    const midnightCheckInterval = setInterval(() => {
      if (isDisposed) return;
      const currentDateKey = this.getTodayDateKey();
      if (currentDateKey !== activeDateKey) {
        activeDateKey = currentDateKey;
        callback([], activeDateKey);
        setupListenerForDate(activeDateKey);
      }
    }, 5000);

    return () => {
      isDisposed = true;
      clearInterval(midnightCheckInterval);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }

  /**
   * Fetch filtered leaderboard for Global, Country, All-Time, or Weekly
   */
  public static async fetchLeaderboard(
    filter: 'global' | 'country' | 'alltime' | 'weekly',
    userCountry?: string
  ): Promise<LeaderboardEntry[]> {
    const dateKey = this.getTodayDateKey();
    const country = userCountry || this.getPlayerCountry();

    try {
      if (filter === 'alltime') {
        const q = query(
          collection(db, 'players'),
          orderBy('bestScore', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const entries: LeaderboardEntry[] = [];
        snap.forEach((d) => {
          const data = d.data() as PlayerProfileData;
          if (data && data.nickname && data.bestScore && data.bestScore > 0) {
            entries.push({
              username: data.nickname,
              score: data.bestScore,
              zone: 'Deep Cosmic Sector',
              date: 'ALL-TIME',
              avatar: data.avatar || 'earth',
              country: data.country || 'IN',
              distance: data.bestDistance || 0,
              survivalTime: data.bestSurvivalTime || 0,
              uid: data.uid,
            });
          }
        });
        entries.sort((a, b) => b.score - a.score);
        return entries;
      }

      if (filter === 'country') {
        const q = query(
          collection(db, 'daily_scores'),
          where('dateKey', '==', dateKey),
          where('country', '==', country),
          limit(20)
        );
        const snap = await getDocs(q);
        const entries: LeaderboardEntry[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data && data.nickname && data.score > 0) {
            entries.push({
              username: data.nickname,
              score: data.score,
              zone: data.zone || 'Zone 1: Solar System Outskirts',
              date: data.dateKey || dateKey,
              avatar: data.avatar || 'earth',
              country: data.country || country,
              distance: data.distance || 0,
              survivalTime: data.roundDuration || 0,
              uid: data.uid,
            });
          }
        });
        entries.sort((a, b) => b.score - a.score);
        return entries;
      }

      // Default or weekly: query today's daily_scores
      const q = query(
        collection(db, 'daily_scores'),
        where('dateKey', '==', dateKey),
        limit(30)
      );
      const snap = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.nickname && data.score > 0) {
          entries.push({
            username: data.nickname,
            score: data.score,
            zone: data.zone || 'Zone 1: Solar System Outskirts',
            date: data.dateKey || dateKey,
            avatar: data.avatar || 'earth',
            country: data.country || 'IN',
            distance: data.distance || 0,
            survivalTime: data.roundDuration || 0,
            uid: data.uid,
          });
        }
      });
      entries.sort((a, b) => b.score - a.score);
      return entries.slice(0, 20);
    } catch (err) {
      console.warn(`fetchLeaderboard (${filter}) error:`, err);
      return [];
    }
  }
}
