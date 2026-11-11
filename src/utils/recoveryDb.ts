/**
 * Multi-layer recovery storage: IndexedDB & Device Signature
 * Supports normal browsers and cross-origin iframe sandboxes (e.g. CrazyGames)
 */

const DB_NAME = 'earthfall_storage';
const STORE_NAME = 'player_recovery';
const RECOVERY_KEY = 'primary_uid';
const LOCAL_STORAGE_KEY = 'earthfall_recovery_uid';
const COOKIE_KEY = 'ef_player_uid';

// Open IndexedDB database safely
function openRecoveryDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[RecoveryDB] IndexedDB open error, falling back to storage/cookie');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

// Get saved UID from IndexedDB
export async function getRecoveryUidFromIDB(): Promise<string | null> {
  const db = await openRecoveryDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(RECOVERY_KEY);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

// Save UID to IndexedDB
export async function saveRecoveryUidToIDB(uid: string): Promise<void> {
  const db = await openRecoveryDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(uid, RECOVERY_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Save across all backup pointers: IndexedDB, localStorage, and document.cookie
export async function saveMultiLayerUid(uid: string): Promise<void> {
  if (!uid) return;

  // 1. IndexedDB
  await saveRecoveryUidToIDB(uid).catch(() => {});

  // 2. localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, uid);
    }
  } catch {}

  // 3. Cookie (works in many iframes)
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_KEY}=${uid}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {}
}

// Read from backup pointers in priority order: localStorage -> cookie -> IndexedDB
export async function getMultiLayerSavedUid(): Promise<string | null> {
  // 1. localStorage check
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    }
  } catch {}

  // 2. Cookie check
  try {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)ef_player_uid=([^;]+)/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {}

  // 3. IndexedDB check
  try {
    const idbUid = await getRecoveryUidFromIDB();
    if (idbUid && idbUid.trim()) {
      return idbUid.trim();
    }
  } catch {}

  return null;
}

// Generate deterministic lightweight device/browser signature
export function getDeviceSignature(): string {
  let webglRenderer = 'default_gl';
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL);
          if (renderer && typeof renderer === 'string') {
            webglRenderer = renderer.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 48);
          }
        }
      }
    }
  } catch {}

  const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '1920x1080';
  const tz = typeof Intl !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : 'UTC';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || 'web') : 'web';
  const cleanPlatform = platform.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 24);
  const cleanTz = tz.replace(/[^a-zA-Z0-9_\-\/]/g, '_').slice(0, 32);

  return `${screenRes}|${cleanTz}|${cleanPlatform}|${webglRenderer}`.slice(0, 160);
}
