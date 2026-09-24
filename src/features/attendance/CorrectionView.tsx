import React, { useState, useEffect } from 'react';
import { FileEdit, ShieldAlert, History, Plus } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge.js';
import type { AttendanceCorrection, UserSession } from '../../types/index.js';

interface CorrectionViewProps {
  currentSession: UserSession | null;
}

export const CorrectionView: React.FC<CorrectionViewProps> = ({ currentSession }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        const correctionLogs = data.filter(
          (l: any) => l.action === 'ATTENDANCE_CORRECTION'
        );
        setLogs(correctionLogs);
      }
    } catch (err) {
      console.error('Error fetching correction logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-blue-600" />
              <span>Log & Riwayat Koreksi Absensi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap perubahan status absensi tercatat lengkap dengan status awal, status baru, alasan koreksi, dan identitas pengguna yang mengubah.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat log koreksi...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Belum ada riwayat koreksi absensi. Koreksi dapat dilakukan melalui menu Absensi Guru atau Absensi Siswa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu Koreksi</th>
                  <th className="px-4 py-3 font-semibold">Entitas</th>
                  <th className="px-4 py-3 font-semibold">Perubahan Status</th>
                  <th className="px-4 py-3 font-semibold">Keterangan / Alasan</th>
                  <th className="px-4 py-3 font-semibold">Diubah Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const oldSt = log.oldData?.status;
                  const newSt = log.newData?.status;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.entity === 'teacher_attendance' ? 'Guru' : 'Siswa'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {oldSt && <StatusBadge status={oldSt} />}
                          <span className="text-slate-400">&rarr;</span>
                          {newSt && <StatusBadge status={newSt} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 font-medium">
                        {log.userId || 'admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
