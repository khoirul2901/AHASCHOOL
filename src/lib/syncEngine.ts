import {
  addToOfflineQueue,
  getOfflineQueue,
  updateQueueItemStatus,
  removeQueueItem,
  saveMasterCache,
} from './indexedDb.js';
import type { OfflineQueueItem, SyncConflictItem } from '../types/index.js';

export type NetworkStatus = 'ONLINE' | 'LOCAL_SERVER' | 'OFFLINE' | 'SYNCING' | 'SYNC_ERROR';

class SyncEngine {
  private deviceId: string = '';
  private currentStatus: NetworkStatus = 'ONLINE';
  private listeners: ((status: NetworkStatus, pendingCount: number) => void)[] = [];
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDeviceId();
      this.setupEventListeners();
      this.startPeriodicSync();
    }
  }

  private initDeviceId(): void {
    let id = localStorage.getItem('siakad_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('siakad_device_id', id);
    }
    this.deviceId = id;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public async init(): Promise<void> {
    this.initDeviceId();
  }

  public async getQueueCount(): Promise<number> {
    const queue = await getOfflineQueue();
    return queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;
  }

  public async getPendingQueue(): Promise<any[]> {
    const queue = await getOfflineQueue();
    return queue.map((item) => ({
      ...item,
      tableName: item.entity,
      recordId: item.entityId,
      timestamp: item.createdAt,
    }));
  }

  public async getLastSyncTime(): Promise<number | null> {
    const raw = localStorage.getItem('siakad_last_sync_time');
    return raw ? parseInt(raw) : null;
  }

  public async removeQueueItem(id: string): Promise<void> {
    await removeQueueItem(id);
    await this.notify();
  }

  public subscribe(cb: (status: NetworkStatus, pendingCount: number) => void) {
    this.listeners.push(cb);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private async notify() {
    const queue = await getOfflineQueue();
    const pending = queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length;
    this.listeners.forEach((l) => l(this.currentStatus, pending));
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.currentStatus = 'ONLINE';
      this.notify();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.currentStatus = 'OFFLINE';
      this.notify();
    });
  }

  public startPeriodicSync(intervalSec = 30): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncNow();
      }
    }, intervalSec * 1000);
  }

  public async queueOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    entity: string,
    entityId: string,
    payload: any
  ): Promise<void> {
    const item: OfflineQueueItem = {
      id: 'q_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      operation,
      entity,
      entityId,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
      deviceId: this.deviceId,
    };

    await addToOfflineQueue(item);
    await this.notify();

    // If online, try immediate sync
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  public async syncNow(): Promise<{ success: boolean; pushed: number; pulled: number; conflicts: SyncConflictItem[] }> {
    if (this.isSyncing) return { success: true, pushed: 0, pulled: 0, conflicts: [] };

    this.isSyncing = true;
    this.currentStatus = 'SYNCING';
    await this.notify();

    let pushed = 0;
    let pulled = 0;
    let conflicts: SyncConflictItem[] = [];

    if (typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:')) {
      this.currentStatus = 'ONLINE';
      this.isSyncing = false;
      await this.notify();
      return { success: true, pushed: 0, pulled: 0, conflicts: [] };
    }

    try {
      const queue = await getOfflineQueue();
      const pendingItems = queue.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');

      if (pendingItems.length > 0) {
        // Mark as SYNCING
        for (const item of pendingItems) {
          await updateQueueItemStatus(item.id, 'SYNCING');
        }

        const res = await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: this.deviceId,
            changes: pendingItems.map((item) => ({
              id: item.id,
              operation: item.operation,
              entity: item.entity,
              entityId: item.entityId,
              payload: item.payload,
              version: 1,
            })),
          }),
        });

        if (!res.ok) {
          throw new Error('Gagal push data ke server.');
        }

        const data = await res.json();
        pushed = data.syncedCount || 0;
        conflicts = data.conflicts || [];

        // Remove synced items from queue
        for (const id of data.syncedIds || []) {
          await removeQueueItem(id);
        }
      }

      // Pull fresh data from server
      const pullRes = await fetch('/api/sync/pull');
      if (pullRes.ok) {
        const serverData = await pullRes.json();
        pulled = (serverData.attendanceRecords?.length || 0) + (serverData.schedules?.length || 0);
        await saveMasterCache('server_data', serverData);
      }

      localStorage.setItem('siakad_last_sync_time', Date.now().toString());
      this.currentStatus = 'ONLINE';
    } catch (err) {
      console.warn('Sync encounter error:', err);
      this.currentStatus = navigator.onLine ? 'SYNC_ERROR' : 'OFFLINE';
    } finally {
      this.isSyncing = false;
      await this.notify();
    }

    return { success: this.currentStatus !== 'SYNC_ERROR', pushed, pulled, conflicts };
  }
}

export const syncEngine = new SyncEngine();
