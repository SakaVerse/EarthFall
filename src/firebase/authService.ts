import {
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';
import {
  getMultiLayerSavedUid,
  saveMultiLayerUid,
  getDeviceSignature,
} from '../utils/recoveryDb';
import { CloudService, PlayerProfileData } from './cloudService';

export class AuthService {
  private static currentUser: User | null = null;
  private static resolvedUid: string = '';
  private static activeProfile: PlayerProfileData | null = null;
  private static listeners: Array<(uid: string, profile: PlayerProfileData | null) => void> = [];
  private static initialized = false;
  private static initPromise: Promise<string> | null = null;

  public static init(): Promise<string> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.initialized = true;

      // 1. Enforce browserLocalPersistence
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.warn('[AuthService] setPersistence notice:', err);
      }

      // 2. Strictly wait for onAuthStateChanged to finish checking for an existing session
      // BEFORE deciding whether to call signInAnonymously().
      const existingAuthUser = await new Promise<User | null>((resolve) => {
        let isDone = false;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!isDone) {
            isDone = true;
            unsubscribe();
            resolve(user);
          }
        });

        // Fast fallback timer so offline / network-restricted environments never hang
        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            unsubscribe();
            resolve(auth.currentUser);
          }
        }, 1200);
      });
      this.currentUser = existingAuthUser;

      // 3. Multi-layer recovery in exact priority order:
      // (a) CrazyGames SDK user ID if logged in
      let candidateUid: string | null = null;
      try {
        if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.user?.getUser) {
          const cgUser = await window.CrazyGames.SDK.user.getUser();
          if (cgUser && (cgUser.id || cgUser.username)) {
            candidateUid = `cg_${cgUser.id || cgUser.username}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
          }
        }
      } catch {}

      // (b) Active Firebase Auth UID (from checked session)
      if (!candidateUid && (existingAuthUser?.uid || auth.currentUser?.uid)) {
        candidateUid = (existingAuthUser?.uid || auth.currentUser?.uid || '').replace(/[^a-zA-Z0-9_\-]/g, '_');
      }

      // (c) Saved recovery uid from IndexedDB / localStorage / cookie
      if (!candidateUid) {
        const savedRecoveryUid = await getMultiLayerSavedUid();
        if (savedRecoveryUid) {
          candidateUid = savedRecoveryUid.replace(/[^a-zA-Z0-9_\-]/g, '_');
        }
      }

      // (d) Matching device signature query in Firestore /players
      const deviceSig = getDeviceSignature();
      if (!candidateUid) {
        try {
          const matched = await CloudService.findPlayerByDeviceSignature(deviceSig);
          if (matched && matched.uid) {
            candidateUid = matched.uid;
            this.activeProfile = matched.profile;
          }
        } catch {}
      }

      // 4. If an existing identity was recovered through (a), (b), (c), or (d),
      // NEVER create a new anonymous account!
      if (candidateUid) {
        this.resolvedUid = candidateUid;
      } else {
        // Only if NO account exists anywhere across the layers, attempt silent anonymous auth
        try {
          const cred = await signInAnonymously(auth);
          this.currentUser = cred.user;
          this.resolvedUid = cred.user.uid.replace(/[^a-zA-Z0-9_\-]/g, '_');
        } catch {
          // Project restriction fallback client UID
          const randomPart = Math.random().toString(36).substring(2, 10);
          this.resolvedUid = `pilot_${randomPart}_${Date.now().toString(36)}`;
        }
      }

      // 5. Save the primary UID across all backup layers (IndexedDB, localStorage, cookie)
      await saveMultiLayerUid(this.resolvedUid);

      // 6. Auto-load existing player profile from Firestore
      if (!this.activeProfile) {
        try {
          this.activeProfile = await CloudService.loadPlayerProfile(this.resolvedUid);
        } catch {}
      }

      // If profile exists, ensure deviceSignature is recorded on Firestore
      if (this.activeProfile) {
        CloudService.savePlayerProfile(this.resolvedUid, {
          deviceSignature: deviceSig,
        }).catch(() => {});
      }

      // Notify all subscribers
      for (const cb of this.listeners) {
        try {
          cb(this.resolvedUid, this.activeProfile);
        } catch {}
      }

      return this.resolvedUid;
    })();

    return this.initPromise;
  }

  public static async ensureAuth(): Promise<string> {
    if (!this.resolvedUid) {
      return await this.init();
    }
    return this.resolvedUid;
  }

  public static getUser(): User | null {
    return this.currentUser || auth.currentUser;
  }

  public static getUserId(): string {
    if (this.resolvedUid) {
      return this.resolvedUid;
    }
    return auth.currentUser?.uid || 'guest_pilot';
  }

  public static getActiveProfile(): PlayerProfileData | null {
    return this.activeProfile;
  }

  public static setActiveProfile(profile: PlayerProfileData | null): void {
    this.activeProfile = profile;
    if (profile?.uid && profile.uid !== this.resolvedUid) {
      this.resolvedUid = profile.uid;
      saveMultiLayerUid(profile.uid).catch(() => {});
    }
  }

  public static subscribe(
    callback: (uid: string, profile: PlayerProfileData | null) => void
  ): () => void {
    this.listeners.push(callback);
    if (this.resolvedUid) {
      callback(this.resolvedUid, this.activeProfile);
    }

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}

// Auto-initialize multi-layer auth on load
AuthService.init().catch(() => {});
