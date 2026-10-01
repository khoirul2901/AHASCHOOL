import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  FileText,
  QrCode,
  Download,
  CreditCard,
  Radio,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { NfcRecordModal } from '../../components/common/NfcRecordModal.js';
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

  // NFC Pairing Modal State
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [selectedNfcStudent, setSelectedNfcStudent] = useState<StudentItem | null>(null);

  const [form, setForm] = useState({
    nis: '',
    nisn: '',
    name: '',
    gender: 'L',
    classId: '',
    phone: '',
    parentName: '',
    cardId: '',
    nfcUid: '',
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
      cardId: '',
      nfcUid: '',
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
      cardId: (s as any).cardId || (s as any).rfidTag || s.nis,
      nfcUid: s.nfcUid || '',
    });
    setShowModal(true);
  };

  const handleSaveNfcDirect = async (studentId: string, newNfcUid: string) => {
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentSession?.id || currentSession?.user?.id || '',
      },
      body: JSON.stringify({ nfcUid: newNfcUid }),
    });

    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Gagal menyimpan UID NFC.');
    }

    loadData();
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

  const handleDownloadTemplate = () => {
    const csvContent =
      'nis,nisn,nama,jenis_kelamin,kode_kelas,no_hp_ortu,nama_ortu,id_kartu_qr_fisik\n' +
      '2026001,0081234561,"Ahmad Dani",L,cls-7a,081234567890,"Hendrawan",ALHKM-001\n' +
      '2026002,0081234562,"Bella Saphira",P,cls-7a,081234567891,"Siti Rahma",ALHKM-002\n' +
      '2026003,0081234563,"Citra Lestari",P,cls-7b,081234567892,"Budi Santoso",ALHKM-003';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      setImportResult(null);

      // Parse CSV text: nis,nisn,name,gender,classId,phone,parentName,cardId
      const lines = importCsvText.trim().split('\n');
      const items = lines
        .map((line, idx) => {
          // Skip header row if it contains header titles
          if (idx === 0 && (line.toLowerCase().includes('nis') || line.toLowerCase().includes('nama'))) {
            return null;
          }

          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            return {
              nis: parts[0],
              nisn: parts[1] || undefined,
              name: parts[2],
              gender: (parts[3] || 'L').toUpperCase(),
              classId: parts[4] || selectedClass || classes[0]?.id || 'cls-7a',
              phone: parts[5] || undefined,
              parentName: parts[6] || undefined,
              cardId: parts[7] || parts[0], // If custom QR is given, use it, else default to NIS
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
                  <th className="px-4 py-3 font-semibold">ID Kartu Fisik (QR)</th>
                  <th className="px-4 py-3 font-semibold">Chip NFC (UID)</th>
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
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                        <QrCode className="w-2.5 h-2.5" />
                        {(s as any).cardId || (s as any).rfidTag || s.nis}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.nfcUid ? (
                        <span className="font-mono text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />
                          {s.nfcUid}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNfcStudent(s);
                            setShowNfcModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Klik untuk rekam kartu NFC"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Tap NFC</span>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedNfcStudent(s);
                            setShowNfcModal(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Rekam / Ganti Kartu NFC"
                        >
                          <Radio className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Hapus Siswa"
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

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
            <label className="block font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>ID Kartu / QR Code Fisik (Opsional / Custom)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: ALHKM-001 (Kosongkan jika sama dengan NIS)"
              value={form.cardId}
              onChange={(e) => setForm({ ...form, cardId: e.target.value })}
              className="w-full font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Jika siswa sudah memiliki kartu fisik ber-QR, masukkan isi kode QR kartu di sini agar mesin absensi langsung mengenali siswa saat kartu fisik di-scan.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <label className="block font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                <span>UID Chip Kartu NFC (Tap Sensor)</span>
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Format Hex UID
              </span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 04:A2:3F:B1:2C:6D:80"
              value={form.nfcUid}
              onChange={(e) => setForm({ ...form, nfcUid: e.target.value.toUpperCase() })}
              className="w-full font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-indigo-900 dark:text-indigo-200"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tempelkan kartu NFC / kartu pintar di HP atau USB reader, atau gunakan tombol "Tap NFC" pada tabel siswa untuk rekam cepat.
            </p>
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
        title="Impor Data Siswa via Excel / CSV"
        maxWidth="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Format Template CSV</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kolom: <code>nis, nisn, nama, jenis_kelamin, kode_kelas, no_hp, orang_tua, id_kartu_qr_fisik</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-xs border border-slate-200 hover:bg-blue-50 dark:bg-slate-700 dark:text-blue-300 dark:border-slate-600 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template CSV</span>
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Upload File CSV / TXT
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Atau Tempel (Paste) Isi CSV di Sini
            </label>
            <textarea
              rows={6}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              className="w-full font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:bg-white"
              placeholder={'nis,nisn,nama,jenis_kelamin,kode_kelas,no_hp,nama_ortu,id_kartu_qr_fisik\n2026001,0081234561,"Ahmad Dani",L,cls-7a,081234567890,"Hendrawan",ALHKM-001'}
            />
          </div>

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
              {importing ? 'Mengimpor...' : 'Proses Impor Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedNfcStudent && (
        <NfcRecordModal
          isOpen={showNfcModal}
          onClose={() => {
            setShowNfcModal(false);
            setSelectedNfcStudent(null);
          }}
          personName={selectedNfcStudent.name}
          personIdentifier={selectedNfcStudent.nis}
          targetType="STUDENT"
          currentNfcUid={selectedNfcStudent.nfcUid}
          onSave={async (newUid) => {
            await handleSaveNfcDirect(selectedNfcStudent.id, newUid);
          }}
        />
      )}
    </div>
  );
};
