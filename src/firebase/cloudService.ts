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
import { handleFirestoreError, OperationType } from './error';
import { LeaderboardEntry } from '../game/types';
import { getTodayISTDateString } from '../utils/date';

export interface CloudUserProfile {
  userId: string;
  username: string;
  scrapBalance: number;
  bestScore?: number;
  bestDistance?: number;
  unlockedSkins?: string[];
  unlockedThemes?: string[];
  streak?: number;
  updatedAt?: string;
}

export class CloudService {
  /**
   * Returns today's date string in YYYY-MM-DD format (IST / Asia/Kolkata)
   */
  public static getTodayDate(): string {
    return getTodayISTDateString();
  }

  /**
   * Checks if a username (case-insensitive) is already taken in Firestore for today's date.
   * If it was created by another player today, returns true (taken).
   * If it doesn't exist today, or belongs to the current user's session, returns false (available).
   */
  public static async isUsernameTakenToday(username: string): Promise<boolean> {
    const trimmed = username.trim();
    if (!trimmed) return false;

    const today = this.getTodayDate();
    const lower = trimmed.toLowerCase();
    const docId = `${today}_${lower}`;
    const path = `leaderboard/${docId}`;

    try {
      const user = await AuthService.ensureAuth();
      const docRef = doc(db, 'leaderboard', docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        // If it belongs to another user, it is taken
        if (data && data.userId && data.userId !== user.uid) {
          return true;
        }
      }

      // Also check query with usernameLower & date to be 100% certain
      const q = query(
        collection(db, 'leaderboard'),
        where('date', '==', today),
        where('usernameLower', '==', lower),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const matchDoc = querySnap.docs[0].data();
        if (matchDoc && matchDoc.userId && matchDoc.userId !== user.uid) {
          return true;
        }
      }

      return false;
    } catch (err) {
      console.warn('Username check notice:', err);
      // If error occurs, check through error handler
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  /**
   * Real-time listener for today's global daily leaderboard (Asia/Kolkata IST).
   * Filtered by today's date, ordered by score descending, limited to top 20.
   * Automatically handles mid-session midnight transitions.
   */
  public static subscribeDailyLeaderboard(
    callback: (entries: LeaderboardEntry[], date: string) => void
  ): () => void {
    let activeDate = this.getTodayDate();
    let unsubscribeFirestore: (() => void) | null = null;
    let isDisposed = false;

    const setupListenerForDate = (date: string) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      const path = 'leaderboard';

      // Primary query: filtered by today's date, ordered by score descending, limited to top 20
      const primaryQuery = query(
        collection(db, path),
        where('date', '==', date),
        orderBy('score', 'desc'),
        limit(20)
      );

      const handleSnapshot = (snapshot: any) => {
        if (isDisposed) return;
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (data && typeof data.username === 'string' && typeof data.score === 'number') {
            entries.push({
              username: data.username,
              score: data.score,
              zone: data.zone || 'Solar System',
              date: data.date || date,
            });
          }
        });

        // Ensure sorted descending
        entries.sort((a, b) => b.score - a.score);
        callback(entries, date);
      };

      try {
        unsubscribeFirestore = onSnapshot(
          primaryQuery,
          handleSnapshot,
          (err) => {
            if (isDisposed) return;
            console.warn('Primary leaderboard query notice (fallback to date filter):', err?.message);

            // Resilient fallback if composite index is pending: filter by date, sort in memory
            try {
              const fallbackQuery = query(
                collection(db, path),
                where('date', '==', date),
                limit(50)
              );
              unsubscribeFirestore = onSnapshot(
                fallbackQuery,
                handleSnapshot,
                (fallbackErr) => {
                  handleFirestoreError(fallbackErr, OperationType.LIST, path);
                }
              );
            } catch (fbErr) {
              handleFirestoreError(fbErr, OperationType.LIST, path);
            }
          }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    };

    // Initial setup for today's date
    setupListenerForDate(activeDate);

    // Check every 10 seconds for 12:00 AM midnight date change in IST
    const midnightCheckInterval = setInterval(() => {
      if (isDisposed) return;
      const currentDate = this.getTodayDate();
      if (currentDate !== activeDate) {
        activeDate = currentDate;
        // Instantly switch to fresh empty board for the new day
        callback([], activeDate);
        setupListenerForDate(activeDate);
      }
    }, 10000);

    return () => {
      isDisposed = true;
      clearInterval(midnightCheckInterval);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }

  /**
   * Saves or updates a player's score to Cloud Firestore for today's date (Asia/Kolkata IST).
   * If a score already exists for today, only updates if the new score is higher.
   */
  public static async submitScore(
    score: number,
    distance: number,
    zone: string,
    skinId: string,
    username: string
  ): Promise<boolean> {
    if (score <= 0) return false;

    const today = this.getTodayDate();
    const cleanUsername = username.trim().slice(0, 20);
    const lower = cleanUsername.toLowerCase();
    const docId = `${today}_${lower}`;
    const path = `leaderboard/${docId}`;

    try {
      const user = await AuthService.ensureAuth();
      const docRef = doc(db, 'leaderboard', docId);

      // Check existing entry for today
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const existingData = snap.data();
        const existingScore = existingData?.score ?? 0;

        // If new score is NOT higher than today's existing record, do not overwrite
        if (score <= existingScore) {
          return false;
        }

        // Update with higher score
        const updatePayload = {
          userId: user.uid,
          username: cleanUsername,
          usernameLower: lower,
          score: Math.round(score),
          date: today,
          distance: Math.round(distance),
          zone: zone.slice(0, 64),
          skin: skinId.slice(0, 32),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(docRef, updatePayload, { merge: true });
        return true;
      }

      // Brand new entry for today
      const newPayload = {
        userId: user.uid,
        username: cleanUsername,
        usernameLower: lower,
        score: Math.round(score),
        date: today,
        distance: Math.round(distance),
        zone: zone.slice(0, 64),
        skin: skinId.slice(0, 32),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, newPayload);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Saves user profile and game progress (cosmetics, scrap, streak) to Firestore
   */
  public static async saveUserProfile(profile: Omit<CloudUserProfile, 'userId' | 'updatedAt'>): Promise<void> {
    const user = AuthService.getUser();
    if (!user) return;

    const path = `users/${user.uid}`;
    try {
      const docId = user.uid.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const docRef = doc(db, 'users', docId);

      const payload: CloudUserProfile = {
        userId: user.uid,
        username: profile.username.trim().slice(0, 20),
        scrapBalance: Math.max(0, Math.round(profile.scrapBalance)),
        bestScore: profile.bestScore ? Math.round(profile.bestScore) : 0,
        bestDistance: profile.bestDistance ? Math.round(profile.bestDistance) : 0,
        unlockedSkins: profile.unlockedSkins || [],
        unlockedThemes: profile.unlockedThemes || [],
        streak: profile.streak || 1,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  /**
   * Loads user profile from Firestore
   */
  public static async loadUserProfile(): Promise<CloudUserProfile | null> {
    const user = AuthService.getUser();
    if (!user) return null;

    const path = `users/${user.uid}`;
    try {
      const docId = user.uid.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const docRef = doc(db, 'users', docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        return snap.data() as CloudUserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
}
