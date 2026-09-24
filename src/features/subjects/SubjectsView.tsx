import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { SubjectItem, UserSession } from '../../types/index.js';

interface SubjectsViewProps {
  currentSession: UserSession | null;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ currentSession }) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'UMUM',
    hoursPerWeek: 4,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subjects');
      if (res.ok) setSubjects(await res.json());
    } catch (err) {
      console.error(err);
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
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambah mata pelajaran.');
      }

      setShowAdd(false);
      loadData();
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
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Master Data Mata Pelajaran</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar mata pelajaran kurikulum merdeka/nasional beserta alokasi jam tatap muka mingguan.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mapel Baru</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat mata pelajaran...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode Mapel</th>
                  <th className="px-4 py-3 font-semibold">Nama Mata Pelajaran</th>
                  <th className="px-4 py-3 font-semibold">Kategori Kelompok</th>
                  <th className="px-4 py-3 font-semibold">Beban Jam / Minggu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{sub.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sub.category || 'UMUM'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                      {sub.hoursPerWeek} Jam Pelajaran
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Mata Pelajaran">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kode Mapel
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: MAT-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Mata Pelajaran
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Matematika Terapan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="UMUM">Umum</option>
                <option value="PEMINATAN">Peminatan</option>
                <option value="MUATAN_LOKAL">Muatan Lokal</option>
                <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam per Minggu
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.hoursPerWeek}
                onChange={(e) => setForm({ ...form, hoursPerWeek: parseInt(e.target.value) || 2 })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
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
              Simpan Mapel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
