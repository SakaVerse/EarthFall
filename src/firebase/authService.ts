import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';

export class AuthService {
  private static currentUser: User | null = null;
  private static listeners: Array<(user: User | null) => void> = [];
  private static initialized = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;

    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      for (const cb of this.listeners) {
        cb(user);
      }
    });
  }

  public static getUser(): User | null {
    return this.currentUser || auth.currentUser;
  }

  public static subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.getUser());

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Ensures the user has an active Firebase Auth session.
   * If not signed in via Google, signs in anonymously to allow secure Firestore writes.
   */
  public static async ensureAuth(): Promise<User> {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    try {
      const cred = await signInAnonymously(auth);
      this.currentUser = cred.user;
      return cred.user;
    } catch (err) {
      console.warn('Anonymous auth fallback error:', err);
      throw err;
    }
  }

  /**
   * Sign in using Google popup
   */
  public static async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      this.currentUser = result.user;
      return result.user;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  }

  /**
   * Sign out
   */
  public static async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
      this.currentUser = null;
    } catch (err) {
      console.error('Sign-Out failed:', err);
      throw err;
    }
  }
}

// Auto-initialize auth listener
AuthService.init();
