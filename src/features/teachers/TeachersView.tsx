import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { TeacherItem, UserSession } from '../../types/index.js';

interface TeachersViewProps {
  currentSession: UserSession | null;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ currentSession }) => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);

  const [form, setForm] = useState({
    nip: '',
    name: '',
    gender: 'L',
    phone: '',
    email: '',
    employmentStatus: 'PNS',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teachers?search=${encodeURIComponent(search)}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setForm({
      nip: '',
      name: '',
      gender: 'L',
      phone: '',
      email: '',
      employmentStatus: 'PNS',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t: TeacherItem) => {
    setEditingTeacher(t);
    setForm({
      nip: t.nip || '',
      name: t.name,
      gender: t.gender || 'L',
      phone: t.phone || '',
      email: t.email || '',
      employmentStatus: t.employmentStatus || 'PNS',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menyimpan data guru.');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data guru ${name}?`)) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentSession?.id || currentSession?.user?.id || '' },
      });
      if (res.ok) loadData();
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Master Data Guru & Tenaga Pendidik</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola profil guru, status kepegawaian, dan data kontak terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru Baru</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari NIP atau Nama Guru..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat data guru...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">NIP / Identitas</th>
                  <th className="px-4 py-3 font-semibold">Nama Lengkap & Gelar</th>
                  <th className="px-4 py-3 font-semibold">L/P</th>
                  <th className="px-4 py-3 font-semibold">Status Pegawai</th>
                  <th className="px-4 py-3 font-semibold">Kontak</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500 font-medium">
                      {t.nip || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="px-4 py-3">{t.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {t.employmentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{t.phone || t.email || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeacher ? 'Ubah Data Guru' : 'Tambah Guru Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso, S.Pd."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              NIP (Nomor Induk Pegawai)
            </label>
            <input
              type="text"
              placeholder="18 digit NIP..."
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Kepegawaian
              </label>
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="GTT">GTT / Honorer</option>
                <option value="TETAP_YAYASAN">Tetap Yayasan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="text"
              placeholder="0812..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Simpan Data Guru
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
