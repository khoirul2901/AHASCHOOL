import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, History } from 'lucide-react';
import type { UserSession } from '../../types/index.js';

interface AuditLogsViewProps {
  currentSession: UserSession | null;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ currentSession }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=150');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.entity?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.userId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Audit Trail & Log Aktivitas Sistem</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh mutasi data penting, perubahan jadwal, koreksi presensi, dan aktivitas pengguna tercatat secara permanen untuk kepatuhan dan integritas data sekolah.
            </p>
          </div>
        </div>

        <div className="mt-4 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari aktivitas, aksi, atau user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat audit log...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">Tidak ada log aktivitas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu Kejadian</th>
                  <th className="px-4 py-3 font-semibold">Tipe Aksi</th>
                  <th className="px-4 py-3 font-semibold">Koleksi Data</th>
                  <th className="px-4 py-3 font-semibold">Deskripsi / Catatan Perubahan</th>
                  <th className="px-4 py-3 font-semibold">ID Pengguna</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{log.userId || 'system'}</td>
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
