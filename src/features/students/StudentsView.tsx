import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Edit2, Trash2, Upload, FileText } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { StudentItem, ClassItem, UserSession } from '../../types/index.js';

interface StudentsViewProps {
  currentSession: UserSession | null;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ currentSession }) => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  const [form, setForm] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    classId: '',
    phone: '',
    parentName: '',
  });

  const [importCsvText, setImportCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count?: number; errors?: string[] } | null>(
    null
  );

  useEffect(() => {
    fetch('/api/classes').then((r) => r.json()).then(setClasses).catch(console.error);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let url = `/api/students?search=${encodeURIComponent(search)}&limit=100`;
      if (selectedClass) url += `&classId=${selectedClass}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedClass]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setForm({
      nis: '',
      nisn: '',
      name: '',
      gender: 'L',
      classId: classes[0]?.id || '',
      phone: '',
      parentName: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s: StudentItem) => {
    setEditingStudent(s);
    setForm({
      nis: s.nis,
      nisn: s.nisn || '',
      name: s.name,
      gender: s.gender || 'L',
      classId: s.classId,
      phone: s.phone || '',
      parentName: s.parentName || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';

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
        throw new Error(d.error || 'Gagal menyimpan siswa.');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data siswa ${name}?`)) return;
    try {
      await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentSession?.id || currentSession?.user?.id || '' },
      });
      loadData();
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      setImportResult(null);

      // Parse CSV text: nis,nisn,name,gender,classId
      const lines = importCsvText.trim().split('\n');
      const items = lines
        .map((line) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            return {
              nis: parts[0],
              nisn: parts[1] || undefined,
              name: parts[2],
              gender: (parts[3] || 'L').toUpperCase(),
              classId: parts[4] || selectedClass || classes[0]?.id,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (items.length === 0) {
        alert('Format CSV tidak dikenali atau kosong.');
        return;
      }

      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      setImportResult({ count: data.importedCount, errors: data.errors });
      loadData();
    } catch (err: any) {
      alert('Gagal import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span>Master Data Siswa Terpadu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data peserta didik dengan pembagian rombongan belajar dan dukungan impor CSV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImportCsvText(
                  '2026001,0081234561,"Ahmad Dani",L,cls-8a\n2026002,0081234562,"Bella Saphira",P,cls-8a'
                );
                setShowImportModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari NIS atau Nama Siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Semua Rombongan Belajar (Kelas)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Memuat data siswa...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">NIS</th>
                  <th className="px-4 py-3 font-semibold">NISN</th>
                  <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-3 font-semibold">L/P</th>
                  <th className="px-4 py-3 font-semibold">Kelas</th>
                  <th className="px-4 py-3 font-semibold">Wali / Kontak</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {s.nis}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{s.nisn || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      {s.class?.name || s.classId}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.parentName ? `${s.parentName} (${s.phone || '-'})` : s.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
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

      {/* Modal Add / Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Muhammad Rizki"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIS (Nomor Induk Siswa)
              </label>
              <input
                type="text"
                required
                placeholder="2026..."
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NISN (10 Digit)
              </label>
              <input
                type="text"
                placeholder="00..."
                value={form.nisn}
                onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
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
                Kelas
              </label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Orang Tua / Wali
            </label>
            <input
              type="text"
              placeholder="Contoh: Hendrawan"
              value={form.parentName}
              onChange={(e) => setForm({ ...form, parentName: e.target.value })}
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
              Simpan Siswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Import CSV */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Data Siswa via CSV"
        maxWidth="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Format per baris: <code>nis,nisn,"nama lengkap",L/P,classId</code>
          </p>

          <textarea
            rows={8}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            className="w-full font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:bg-white"
            placeholder="2026001,0081234561,Ahmad Dani,L,cls-8a"
          />

          {importResult && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs">
              <div className="font-bold text-emerald-600">
                Berhasil mengimpor {importResult.count} siswa.
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-1 text-rose-600 space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={importing}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Mengimpor...' : 'Proses Impor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
