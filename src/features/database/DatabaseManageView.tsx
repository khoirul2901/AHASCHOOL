import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileJson,
  HardDrive,
  ShieldCheck,
  Table,
  Eye,
} from 'lucide-react';
import type { UserSession } from '../../types/index.js';
import { DatabaseViewerModal } from './DatabaseViewerModal.js';

interface DatabaseManageViewProps {
  currentSession: UserSession | null;
}

interface TableStats {
  name: string;
  label: string;
  count: number;
}

interface SeparatedFileInfo {
  id: string;
  name: string;
  description: string;
  total: number;
  file: string;
}

export const DatabaseManageView: React.FC<DatabaseManageViewProps> = ({ currentSession }) => {
  const [stats, setStats] = useState<TableStats[]>([]);
  const [separatedFiles, setSeparatedFiles] = useState<SeparatedFileInfo[]>([]);
  const [dbPath, setDbPath] = useState('data/siakad-db.json');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<string>('siakad-db');

  const openViewer = (targetId: string = 'siakad-db') => {
    setViewerTarget(targetId);
    setViewerOpen(true);
  };

  const handleDownloadBackup = () => {
    const link = document.createElement('a');
    link.href = '/api/database/backup';
    link.download = `siakad-db-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, filesRes] = await Promise.all([
        fetch('/api/database/stats'),
        fetch('/api/database/files'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.tables || []);
        if (data.dbPath) setDbPath(data.dbPath);
      }

      if (filesRes.ok) {
        const fData = await filesRes.json();
        setSeparatedFiles(fData.files || fData.tables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setLoading(true);
        const res = await fetch('/api/database/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentSession?.id || 'admin',
          },
          body: JSON.stringify({ data: json }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Gagal merestore database.');

        setMessage({ type: 'success', text: 'Database berhasil dipulihkan dari file backup!' });
        fetchStats();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'File backup JSON tidak valid.' });
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetToSeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || 'admin',
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal reset database.');

      setMessage({ type: 'success', text: 'Database berhasil di-reset ke data bawaan (demo seed)!' });
      setIsResetConfirmOpen(false);
      fetchStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal reset database.' });
    } finally {
      setLoading(false);
    }
  };

  const totalRecords = stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Pusat Pengelolaan Database & Backup
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Penyimpanan lokal persisten SIAKAD, unduh cadangan (backup JSON), dan pemulihan data
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => openViewer('siakad-db')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-500 shadow-sm transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Buka & Lihat Database</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Alert Notification */}
        {message && (
          <div
            className={`mt-4 flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Database Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Lokasi File Database</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate">
              {dbPath}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tersimpan langsung di disk lokal server / node environment
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => openViewer('siakad-db')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Buka File siakad-db.json</span>
            </button>
            <span className="text-[10px] text-slate-400">JSON Langsung</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Catatan Rekaman</span>
            <Table className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalRecords.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tersebar di {stats.length} tabel entitas sekolah
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Metode Sinkronisasi</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Atomic Safe-Write (.tmp rename)
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Anti korupsi data saat server mati mendadak
          </p>
        </div>
      </div>

      {/* Table Entity Breakdown & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Rincian Isi Tabel Data</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    store.{item.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-black text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 tabular-nums">
                    {item.count}
                  </div>
                  <button
                    onClick={() => openViewer(item.name)}
                    title={`Buka & periksa isi data tabel ${item.label}`}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">Buka</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="space-y-4">
          {/* Restore Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Restore Database</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Unggah file backup `.json` sebelumnya untuk mengembalikan seluruh isi data sistem.
            </p>
            <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:border-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Factory Seed Card */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Reset ke Data Awal (Demo)</span>
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mb-4">
              Kembalikan database ke kondisi bawaan awal (akun admin, guru Budi, jadwal & siswa contoh).
            </p>

            {isResetConfirmOpen ? (
              <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-800">
                <p className="text-[11px] font-bold text-rose-600">
                  Yakin ingin mereset seluruh data ke awal? Data presensi saat ini akan ditimpa.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetToSeed}
                    disabled={loading}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
                  >
                    Ya, Reset Sekarang
                  </button>
                  <button
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full py-2 px-3 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-semibold transition"
              >
                Reset Database ke Seed Awal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Separated Modular Database Files Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              <span>Database Terpisah (Modular Files untuk Pelaporan & Ekspor Mandiri)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data siswa, data guru, jadwal pelajaran & piket, serta riwayat absensi disimpan ke dalam berkas JSON terpisah di server (/data/*.json) untuk memudahkan pengolahan laporan independen dan sinkronisasi berkala.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{separatedFiles.length} Berkas Aktif</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {separatedFiles.map((file) => (
            <div
              key={file.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {file.file}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 tabular-nums">
                    {file.total} Record
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {file.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => openViewer(file.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 text-xs font-bold transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka JSON</span>
                </button>
                <a
                  href={`/api/database/download/${file.id}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive JSON & Table Database Viewer Modal */}
      <DatabaseViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialTarget={viewerTarget}
        separatedFiles={separatedFiles}
        tableStats={stats}
      />
    </div>
  );
};
