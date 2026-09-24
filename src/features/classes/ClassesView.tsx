import React, { useState, useEffect } from 'react';
import { Building, Plus, Users, UserCheck } from 'lucide-react';
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

  const [form, setForm] = useState({
    name: '',
    level: 8,
    major: 'UMUM',
    room: 'R. 201',
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Master Data Rombongan Belajar (Kelas)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kelas rombel, tingkat pendidikan, ruangan kelas, dan penugasan wali kelas.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rombel Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const homeroom = teachers.find((t) => t.id === cls.homeroomTeacherId);
          return (
            <div
              key={cls.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Tingkat {cls.level}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{cls.room || 'R. ?'}</span>
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  Kelas {cls.name}
                </h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Wali: <strong>{homeroom ? homeroom.name : 'Belum Ditugaskan'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Jurusan / Program: {cls.major || 'Umum'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kelas Baru">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 9C"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value={7}>Kelas 7</option>
                <option value={8}>Kelas 8</option>
                <option value={9}>Kelas 9</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan
              </label>
              <input
                type="text"
                placeholder="R. 201"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Wali Kelas
            </label>
            <select
              value={form.homeroomTeacherId}
              onChange={(e) => setForm({ ...form, homeroomTeacherId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            >
              <option value="">Pilih Guru Wali...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
