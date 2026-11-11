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

export interface PlayerProfileData {
  uid: string;
  nickname: string;
  nicknameLower: string;
  deviceSignature?: string;
  bestScore?: number;
  coins?: number;
  scrapBalance?: number;
  unlockedSkins?: string[];
  unlockedThemes?: string[];
  updatedAt?: string;
}

export class CloudService {
  private static lastSubmissionTimestamp = 0;
  private static cachedNickname: string | null = null;
  private static cachedProfile: PlayerProfileData | null = null;

  /**
   * Returns today's dateKey in YYYY-MM-DD format (IST / Asia/Kolkata timezone)
   */
  public static getTodayDateKey(): string {
    return getTodayISTDateString();
  }

  /**
   * Auto-loads player profile directly from Firestore /players/{uid}.
   */
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
          return data;
        }
      }
    } catch (err) {
      console.warn('loadPlayerProfile from Firestore notice:', err);
    }

    return null;
  }

  /**
   * Query Firestore for a player profile with matching device signature.
   */
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
          return { uid: data.uid, profile: data };
        }
      }
    } catch (err) {
      console.warn('findPlayerByDeviceSignature Firestore query notice:', err);
    }

    return null;
  }

  /**
   * Persists / updates player profile data in Firestore /players/{uid}
   */
  public static async savePlayerProfile(
    uid: string,
    updates: Partial<PlayerProfileData>
  ): Promise<void> {
    if (!uid) return;

    try {
      const playerDocRef = doc(db, 'players', uid);
      const signature = updates.deviceSignature || getDeviceSignature();
      const payload: Partial<PlayerProfileData> = {
        ...updates,
        uid,
        deviceSignature: signature,
        updatedAt: new Date().toISOString(),
      };

      if (updates.nickname) {
        payload.nicknameLower = updates.nickname.toLowerCase();
        this.cachedNickname = updates.nickname;
      }

      await setDoc(playerDocRef, payload, { merge: true });
    } catch (err) {
      console.warn('savePlayerProfile Firestore notice:', err);
    }
  }

  /**
   * Auto-loads the player's claimed nickname from Firestore on game start or return.
   * Directly queries the /players/{uid} collection.
   */
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

  /**
   * Checks if a nickname (case-insensitive) is available and locks it to the player's UID.
   * If already claimed by another UID in Firestore, rejects with:
   * "Nickname is already taken, please try another!"
   */
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

    try {
      // 1. Direct document lookup in /nicknames/{nicknameLower}
      const nicknameDocRef = doc(db, 'nicknames', lower);
      const snap = await getDoc(nicknameDocRef);

      if (snap.exists()) {
        const existingData = snap.data();
        // If claimed by another player UID, reject with exact error message required
        if (existingData && existingData.uid && existingData.uid !== uid) {
          return {
            success: false,
            error: 'Nickname is already taken, please try another!',
          };
        }
      }

      // 2. Query check across nicknames collection for safety
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

      // Nickname is available: Lock to this player's UID in Firestore
      const nowIso = new Date().toISOString();

      await setDoc(nicknameDocRef, {
        uid,
        nickname: trimmed,
        nicknameLower: lower,
        createdAt: snap.exists() ? (snap.data()?.createdAt || nowIso) : nowIso,
      }, { merge: true });

      // Save to /players/{uid} with device signature for permanent recovery
      const playerDocRef = doc(db, 'players', uid);
      await setDoc(playerDocRef, {
        uid,
        nickname: trimmed,
        nicknameLower: lower,
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
   */
  public static async submitDailyScore(
    score: number,
    roundDuration: number,
    distance: number,
    zone: string,
    nickname: string
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
            score: roundedScore,
            dateKey,
            roundDuration: roundedDuration,
            distance: roundedDistance,
            zone: zone.slice(0, 64),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Also update player profile with best score
        this.savePlayerProfile(uid, { bestScore: roundedScore }).catch(() => {});
        return { success: true };
      }

      // First score for today
      await setDoc(scoreDocRef, {
        uid,
        nickname: cleanNickname,
        nicknameLower: cleanNickname.toLowerCase(),
        score: roundedScore,
        dateKey,
        roundDuration: roundedDuration,
        distance: roundedDistance,
        zone: zone.slice(0, 64),
        updatedAt: new Date().toISOString(),
      });

      this.savePlayerProfile(uid, { bestScore: roundedScore }).catch(() => {});
      return { success: true };
    } catch (err) {
      console.warn('Score submission to Firestore notice:', err);
      return { success: false, reason: 'Network error' };
    }
  }

  /**
   * Real-time listener for "Today's Top 10 Global Leaderboard" (Asia/Kolkata IST).
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

      const top10Query = query(
        collection(db, 'daily_scores'),
        where('dateKey', '==', dateKey),
        orderBy('score', 'desc'),
        limit(10)
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
            });
          }
        });

        entries.sort((a, b) => b.score - a.score);
        const top10 = entries.slice(0, 10);
        callback(top10, dateKey);
      };

      try {
        unsubscribeFirestore = onSnapshot(
          top10Query,
          handleSnapshot,
          (err) => {
            if (isDisposed) return;
            console.warn('Top 10 daily_scores primary query note (falling back to dateKey filter):', err?.message);
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
}
