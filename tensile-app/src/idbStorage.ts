/** IndexedDB storage adapter for Zustand persist middleware.
 *  Falls back to localStorage if IndexedDB is unavailable.
 *  On first run, attempts to migrate existing localStorage data. */

const DB_NAME = 'tensile-db';
const STORE_NAME = 'tensile-store';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getItem(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // silently fail — caller will fall back to localStorage
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // silently fail
  }
}

/** Attempt one-time migration from localStorage to IndexedDB */
async function migrateFromLocalStorage(key: string): Promise<void> {
  try {
    const existing = localStorage.getItem(key);
    if (!existing) return;
    const idbValue = await getItem(key);
    if (!idbValue) {
      await setItem(key, existing);
    }
  } catch {
    // migration not critical
  }
}

export const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    await migrateFromLocalStorage(key);
    const value = await getItem(key);
    if (value !== null) return value;
    // Fallback to localStorage
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await setItem(key, value);
    // Keep localStorage as backup for conflict resolution
    try { localStorage.setItem(key, value); } catch { /* quota exceeded */ }
  },
  removeItem: async (key: string): Promise<void> => {
    await removeItem(key);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
