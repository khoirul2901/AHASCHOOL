import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CloudOff,
  Cloud,
  CheckCircle2,
  Clock,
  RefreshCw,
  HardDrive,
  Database,
} from 'lucide-react';
import { syncEngine } from '../../lib/syncEngine.js';
import type { SyncQueueItem, UserSession } from '../../types/index.js';

interface SyncCenterViewProps {
  currentSession: UserSession | null;
}

export const SyncCenterView: React.FC<SyncCenterViewProps> = ({ currentSession }) => {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const refreshQueue = async () => {
    try {
      const items = await syncEngine.getPendingQueue();
      setQueueItems(items);
      const last = await syncEngine.getLastSyncTime();
      setLastSyncTime(last);
    } catch (err) {
      console.error('Error loading sync queue:', err);
    }
  };

  useEffect(() => {
    refreshQueue();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      setSyncStatusMsg('Menghubungkan dan menyinkronkan data...');

      const result = await syncEngine.syncNow();
      await refreshQueue();

      if (result.success) {
        setSyncStatusMsg(
          `Sinkronisasi tuntas! Terkirim: ${result.pushed} record, Diterima: ${result.pulled} perubahan.`
        );
      } else {
        setSyncStatusMsg('Gagal menyinkronkan data. Pastikan koneksi internet aktif.');
      }
    } catch (err: any) {
      setSyncStatusMsg('Error sinkronisasi: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Hapus seluruh antrean offline lokal? Data belum tersinkronkan akan dibuang.'))
      return;
    try {
      for (const item of queueItems) {
        await syncEngine.removeQueueItem(item.id);
      }
      await refreshQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <span>Pusat Sinkronisasi & Offline-First Engine</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan absensi tetap beroperasi penuh tanpa koneksi internet dan otomatis disinkronkan ke server pusat saat online.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSync}
              disabled={syncing || !isOnline}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 flex items-center justify-between">
            <span>{syncStatusMsg}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="underline ml-2">
              Tutup
            </button>
          </div>
        )}

        {/* Sync Status Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Status Jaringan</span>
              {isOnline ? (
                <Cloud className="w-4 h-4 text-emerald-600" />
              ) : (
                <CloudOff className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
              {isOnline ? 'Terhubung (Online)' : 'Terputus (Offline)'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {isOnline
                ? 'Sistem dapat terhubung langsung ke API server.'
                : 'Mode offline aktif. Semua aksi tersimpan di IndexedDB.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Antrean Offline</span>
              <HardDrive className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
              {queueItems.length} Operasi Tertunda
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Menunggu transmisi aman ke server database sekolah.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Sinkronisasi Terakhir</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              {lastSyncTime
                ? new Date(lastSyncTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Belum pernah'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {lastSyncTime
                ? new Date(lastSyncTime).toLocaleDateString('id-ID')
                : 'Klik tombol di atas untuk sinkron'}
            </p>
          </div>
        </div>
      </div>

      {/* Queue items table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Antrean Mutasi Data (IndexedDB)
          </h3>
          {queueItems.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Bersihkan Antrean
            </button>
          )}
        </div>

        {queueItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada antrean pending. Seluruh data lokal telah tersinkronisasi dengan server pusat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tipe Aksi</th>
                  <th className="px-4 py-3 font-semibold">Tabel / Koleksi</th>
                  <th className="px-4 py-3 font-semibold">ID Entitas</th>
                  <th className="px-4 py-3 font-semibold">Waktu Dibuat</th>
                  <th className="px-4 py-3 font-semibold">Percobaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {queueItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        {item.operation}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.tableName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{item.recordId}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono">{item.retryCount || 0}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
