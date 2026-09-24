import React, { useState, useEffect } from 'react';
import { Blocks, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { ModuleRegistry, UserSession } from '../../types/index.js';

interface ModulesViewProps {
  currentSession: UserSession | null;
}

export const ModulesView: React.FC<ModulesViewProps> = ({ currentSession }) => {
  const [modules, setModules] = useState<ModuleRegistry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/modules');
      if (res.ok) {
        setModules(await res.json());
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleToggle = async (mod: ModuleRegistry) => {
    try {
      setUpdatingCode(mod.code);
      const res = await fetch(`/api/modules/${mod.code}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify({ isEnabled: !mod.isEnabled }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal mengubah status modul.');
      }

      loadModules();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Blocks className="w-5 h-5 text-blue-600" />
              <span>Arsitektur & Registri 10 Modul Terintegrasi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              SIAKAD dirancang dengan pola Modular Monolith. Modul dapat diaktifkan atau dinonaktifkan sesuai kebutuhan sekolah dengan validasi dependensi modul inti.
            </p>
          </div>

          <button
            onClick={loadModules}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan Status</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.code}
            className={`rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
              mod.isEnabled
                ? 'border-blue-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                : 'border-slate-200 bg-slate-50/70 opacity-70 dark:border-slate-800 dark:bg-slate-900/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {mod.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    mod.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {mod.isEnabled ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>AKTIF</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>NONAKTIF</span>
                    </>
                  )}
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                {mod.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{mod.description}</p>

              {mod.dependencies && mod.dependencies.length > 0 && (
                <div className="mt-3 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Ketergantungan:
                  </span>{' '}
                  {mod.dependencies.join(', ')}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">v{mod.version}</span>
              <button
                onClick={() => handleToggle(mod)}
                disabled={updatingCode === mod.code || mod.code === 'CORE'}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  mod.code === 'CORE'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                    : mod.isEnabled
                    ? 'border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {updatingCode === mod.code
                  ? 'Memproses...'
                  : mod.code === 'CORE'
                  ? 'Modul Inti'
                  : mod.isEnabled
                  ? 'Nonaktifkan'
                  : 'Aktifkan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
