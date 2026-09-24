import type { OfflineQueueItem } from '../types/index.js';

const DB_NAME = 'siakad_offline_db';
const DB_VERSION = 1;

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak tersedia di lingkungan ini.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('offline_queue')) {
        const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('cached_master_data')) {
        db.createObjectStore('cached_master_data', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('cached_attendances')) {
        const attStore = db.createObjectStore('cached_attendances', { keyPath: 'id' });
        attStore.createIndex('date', 'attendanceDate', { unique: false });
      }

      if (!db.objectStoreNames.contains('sync_metadata')) {
        db.createObjectStore('sync_metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToOfflineQueue(item: OfflineQueueItem): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_queue', 'readonly');
      const store = tx.objectStore('offline_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function updateQueueItemStatus(
  id: string,
  status: OfflineQueueItem['status'],
  error?: string
): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = status;
        if (error) item.error = error;
        if (status === 'FAILED') item.retryCount += 1;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMasterCache(key: string, data: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('cached_master_data', 'readwrite');
    tx.objectStore('cached_master_data').put({ key, data, savedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Could not cache to IndexedDB:', err);
  }
}

export async function getMasterCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cached_master_data', 'readonly');
      const req = tx.objectStore('cached_master_data').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
