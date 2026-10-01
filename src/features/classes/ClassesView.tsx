import React, { useState, useEffect } from 'react';
import { Building, Plus, Users, UserCheck, Trash2, Layers } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { ClassItem, TeacherItem, UserSession } from '../../types/index.js';

interface ClassesViewProps {
  currentSession: UserSession | null;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ currentSession }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    level: '7',
    major: 'Umum',
    room: 'R. 101',
    homeroomTeacherId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, tRes] = await Promise.all([fetch('/api/classes'), fetch('/api/teachers')]);
      if (cRes.ok) setClasses(await cRes.json());
      if (tRes.ok) {
        const d = await tRes.json();
        setTeachers(d.items || []);
        if (d.items?.length > 0) {
          setForm((f) => ({ ...f, homeroomTeacherId: d.items[0].id }));
        }
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

  const handleOpenAdd = () => {
    setForm({
      name: '',
      level: '7',
      major: 'Umum',
      room: 'R. 101',
      homeroomTeacherId: teachers[0]?.id || '',
    });
    setShowAdd(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambah kelas.');
      }

      setShowAdd(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Yakin ingin menghapus kelas "${name}"?\nData jadwal dan siswa yang terhubung dengan kelas ini mungkin terpengaruh.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus kelas.');
      }

      loadData();
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Master Data Rombongan Belajar (Kelas)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kelas rombel fleksibel untuk jenjang SMP dan SMK/SMA, ruangan kelas, dan penugasan wali kelas.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rombel Baru</span>
          </button>
        </div>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Memuat data rombel...
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Belum ada data kelas yang terdaftar. Klik tombol "Tambah Rombel Baru" di atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const homeroom = teachers.find((t) => t.id === cls.homeroomTeacherId);
            const levelDisplay = cls.level || cls.grade || '-';

            return (
              <div
                key={cls.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                      Tingkat {levelDisplay}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {cls.room || 'R. ?'}
                      </span>
                      {/* Tombol Hapus Kelas */}
                      <button
                        onClick={() => handleDelete(cls.id, cls.name)}
                        disabled={deletingId === cls.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title={`Hapus Kelas ${cls.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-xl font-black text-slate-900 dark:text-white">
                    Kelas {cls.name}
                  </h3>

                  <div className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        Wali:{' '}
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {homeroom ? homeroom.name : cls.homeroomTeacherName || 'Belum Ditugaskan'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Jurusan / Program: <strong className="font-semibold">{cls.major || 'Umum'}</strong></span>
                    </div>

                    {cls.studentCount !== undefined && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Jumlah Siswa: {cls.studentCount} peserta didik</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Kelas Baru */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Rombongan Belajar (Kelas) Baru">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 7-A, 8-B, 10 TKJ 1, 11 RPL, dsb."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat / Jenjang
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 7, 8, 9 atau 10, 11, 12 / X, XI, XII"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Bebas diketik (mendukung jenjang SMP maupun SMK/SMA)
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan Kelas
              </label>
              <input
                type="text"
                placeholder="Contoh: R. 101, Lab Komputer 1"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Jurusan / Program Keahlian
            </label>
            <input
              type="text"
              placeholder="Contoh: Umum (SMP) atau TKJ, RPL, Akuntansi, Teknik Mesin (SMK)"
              value={form.major}
              onChange={(e) => setForm({ ...form, major: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Wali Kelas (Guru Pengampu)
            </label>
            <select
              value={form.homeroomTeacherId}
              onChange={(e) => setForm({ ...form, homeroomTeacherId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="">-- Pilih Guru Wali Kelas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.nip ? `(NIP: ${t.nip})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 active:scale-95 transition"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
