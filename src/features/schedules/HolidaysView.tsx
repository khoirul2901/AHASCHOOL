import React, { useState, useEffect } from 'react';
import { Calendar, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { Holiday, UserSession } from '../../types/index.js';

interface HolidaysViewProps {
  currentSession: UserSession | null;
}

export const HolidaysView: React.FC<HolidaysViewProps> = ({ currentSession }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    isNational: true,
    affectsPicket: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academic/holidays');
      if (res.ok) {
        setHolidays(await res.json());
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academic/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowAdd(false);
        setForm({
          name: '',
          date: new Date().toISOString().split('T')[0],
          isNational: true,
          affectsPicket: false,
        });
        loadData();
      }
    } catch (err: any) {
      alert('Gagal menambah hari libur: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Kalender Akademik & Hari Libur</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pada tanggal libur nasional maupun sekolah, absensi mengajar tidak di-generate oleh sistem secara otomatis.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Hari Libur</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat kalender libur...</div>
        ) : holidays.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Belum ada daftar hari libur yang ditentukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal Libur</th>
                  <th className="px-4 py-3 font-semibold">Nama Hari Libur / Keterangan</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Dampak Piket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {h.date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {h.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.isNational
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {h.isNational ? 'Libur Nasional' : 'Libur Khusus Sekolah'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {h.affectsPicket
                        ? 'Piket Tetap Masuk (Khusus)'
                        : 'Piket Diliburkan'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Hari Libur">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Hari Libur
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Hari Kemerdekaan RI"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isNational"
              checked={form.isNational}
              onChange={(e) => setForm({ ...form, isNational: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isNational" className="font-semibold text-slate-700 dark:text-slate-300">
              Libur Resmi Nasional
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Simpan Hari Libur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
