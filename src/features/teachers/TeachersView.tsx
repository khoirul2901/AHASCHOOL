import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileText,
  QrCode,
  CreditCard,
  Radio,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { NfcRecordModal } from '../../components/common/NfcRecordModal.js';
import type { TeacherItem, UserSession } from '../../types/index.js';

interface TeachersViewProps {
  currentSession: UserSession | null;
}

export const TEACHER_POSITIONS = [
  'Guru Mata Pelajaran',
  'Guru BK',
  'Wali Kelas',
  'Bendahara Sekolah',
  'Kepala Tata Usaha',
  'Staf Tata Usaha',
  'Kepala Sekolah',
  'Waka Kurikulum',
  'Waka Kesiswaan',
  'Waka Sarpras',
  'Waka Humas',
  'Guru Piket',
  'Pembina OSIS',
  'Kepala Perpustakaan',
  'Kepala Lab Komputer / IPA',
];

export const TeachersView: React.FC<TeachersViewProps> = ({ currentSession }) => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [isCustomPosition, setIsCustomPosition] = useState(false);

  // NFC Pairing Modal State
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [selectedNfcTeacher, setSelectedNfcTeacher] = useState<TeacherItem | null>(null);

  const [form, setForm] = useState({
    nip: '',
    name: '',
    gender: 'L',
    phone: '',
    email: '',
    subject: '',
    employmentStatus: 'PNS',
    positionStatus: 'Guru Mata Pelajaran',
    cardId: '',
    nfcUid: '',
  });

  const [importCsvText, setImportCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count?: number; errors?: string[] } | null>(
    null
  );

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
    setIsCustomPosition(false);
    setForm({
      nip: '',
      name: '',
      gender: 'L',
      phone: '',
      email: '',
      subject: '',
      employmentStatus: 'PNS',
      positionStatus: 'Guru Mata Pelajaran',
      cardId: '',
      nfcUid: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t: TeacherItem) => {
    setEditingTeacher(t);
    const pos = (t as any).positionStatus || 'Guru Mata Pelajaran';
    setIsCustomPosition(!TEACHER_POSITIONS.includes(pos));
    setForm({
      nip: t.nip || '',
      name: t.name,
      gender: t.gender || 'L',
      phone: t.phone || '',
      email: t.email || '',
      subject: (t as any).subject || '',
      employmentStatus: t.employmentStatus || 'PNS',
      positionStatus: pos,
      cardId: (t as any).cardId || (t as any).rfidTag || t.nip || '',
      nfcUid: t.nfcUid || '',
    });
    setShowModal(true);
  };

  const handleSaveNfcDirect = async (teacherId: string, newNfcUid: string) => {
    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentSession?.id || currentSession?.user?.id || '',
      },
      body: JSON.stringify({ nfcUid: newNfcUid }),
    });

    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Gagal menyimpan UID NFC guru.');
    }

    loadData();
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

  const handleDownloadTemplate = () => {
    const csvContent =
      'nip,nama,jenis_kelamin,no_hp,email,status_pegawai,mata_pelajaran,id_kartu_qr_fisik\n' +
      '197505122000031001,"Drs. H. Mulyono, M.Pd.",L,081234567890,mulyono@sekolah.sch.id,PNS,"Matematika",GURU-001\n' +
      '198203142008012003,"Dra. Hj. Siti Aminah, M.Si.",P,081234567891,siti.aminah@sekolah.sch.id,PNS,"Ilmu Pengetahuan Alam (IPA)",GURU-002\n' +
      '198811202012121004,"Ahmad Fauzi, S.Pd., Gr.",L,081234567892,ahmad.fauzi@sekolah.sch.id,PPPK,"Bahasa Indonesia",GURU-003';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_guru.csv');
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

      // Parse CSV: nip,nama,jenis_kelamin,no_hp,email,status_pegawai,mata_pelajaran,id_kartu_qr_fisik
      const lines = importCsvText.trim().split('\n');
      const items = lines
        .map((line, idx) => {
          if (idx === 0 && (line.toLowerCase().includes('nip') || line.toLowerCase().includes('nama'))) {
            return null;
          }

          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            return {
              nip: parts[0] || undefined,
              name: parts[1],
              gender: (parts[2] || 'L').toUpperCase(),
              phone: parts[3] || undefined,
              email: parts[4] || undefined,
              employmentStatus: parts[5] || 'GURU_TETAP',
              subject: parts[6] || undefined,
              cardId: parts[7] || parts[0] || ('GURU-' + Math.floor(1000 + Math.random() * 9000)),
            };
          }
          return null;
        })
        .filter(Boolean);

      if (items.length === 0) {
        alert('Format CSV tidak dikenali atau kosong.');
        return;
      }

      const res = await fetch('/api/teachers/import', {
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
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Master Data Guru & Tenaga Pendidik</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola profil guru, mata pelajaran yang diampu, dan ID kartu QR fisik untuk absensi mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImportCsvText(
                  '197505122000031001,"Drs. H. Mulyono, M.Pd.",L,081234567890,mulyono@sekolah.sch.id,PNS,"Matematika",GURU-001\n' +
                  '198203142008012003,"Dra. Hj. Siti Aminah, M.Si.",P,081234567891,siti.aminah@sekolah.sch.id,PNS,"IPA Terpadu",GURU-002'
                );
                setShowImportModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Impor Guru (Excel/CSV)</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru Baru</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari NIP, Nama Guru, atau ID Kartu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Filter Jabatan:</span>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Jabatan ({teachers.length})</option>
              {TEACHER_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
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
                  <th className="px-4 py-3 font-semibold">Status Jabatan</th>
                  <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                  <th className="px-4 py-3 font-semibold">Status Pegawai</th>
                  <th className="px-4 py-3 font-semibold">Kontak</th>
                  <th className="px-4 py-3 font-semibold">ID Kartu Fisik (QR)</th>
                  <th className="px-4 py-3 font-semibold">Chip NFC (UID)</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers
                  .filter(
                    (t) =>
                      filterPosition === 'ALL' ||
                      ((t as any).positionStatus || 'Guru Mata Pelajaran') === filterPosition
                  )
                  .map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-slate-500 font-medium">
                      {t.nip || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {(t as any).positionStatus || 'Guru Mata Pelajaran'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {(t as any).subject || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {t.employmentStatus || 'GURU_TETAP'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{t.phone || t.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                        <QrCode className="w-2.5 h-2.5" />
                        {(t as any).cardId || (t as any).rfidTag || t.nip || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.nfcUid ? (
                        <span className="font-mono text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />
                          {t.nfcUid}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNfcTeacher(t);
                            setShowNfcModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Klik untuk rekam kartu NFC guru"
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
                            setSelectedNfcTeacher(t);
                            setShowNfcModal(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Rekam / Ganti Kartu NFC"
                        >
                          <Radio className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Hapus Guru"
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

      {/* Modal Add / Edit Guru */}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP (Opsional)
              </label>
              <input
                type="text"
                placeholder="1980..."
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Jabatan / Tugas Tambahan <span className="text-rose-500">*</span>
              </label>
              <select
                value={isCustomPosition ? 'Lainnya' : form.positionStatus}
                onChange={(e) => {
                  if (e.target.value === 'Lainnya') {
                    setIsCustomPosition(true);
                    setForm({ ...form, positionStatus: '' });
                  } else {
                    setIsCustomPosition(false);
                    setForm({ ...form, positionStatus: e.target.value });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {TEACHER_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
                <option value="Lainnya">Lainnya (Ketik Manual)</option>
              </select>
              {isCustomPosition && (
                <input
                  type="text"
                  required
                  placeholder="Ketik status jabatan spesifik..."
                  value={form.positionStatus}
                  onChange={(e) => setForm({ ...form, positionStatus: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
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
                <option value="PNS">PNS / ASN</option>
                <option value="PPPK">PPPK</option>
                <option value="GTT">GTT (Guru Tidak Tetap)</option>
                <option value="GURU_TETAP">Guru Tetap Yayasan</option>
                <option value="HONORER">Honorer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mata Pelajaran yang Diampu
            </label>
            <input
              type="text"
              placeholder="Contoh: Matematika, Bahasa Indonesia"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor HP / WhatsApp
              </label>
              <input
                type="text"
                placeholder="08..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="guru@sekolah.sch.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
            <label className="block font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              <span>ID Kartu / QR Code Fisik Guru (Opsional / Custom)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: GURU-001 (Kosongkan jika sama dengan NIP)"
              value={form.cardId}
              onChange={(e) => setForm({ ...form, cardId: e.target.value })}
              className="w-full font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Jika guru sudah memiliki kartu fisik ber-QR, masukkan isi teks QR kartu di sini agar absensi piket & mengajar langsung terdeteksi.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <label className="block font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                <span>UID Chip Kartu NFC Guru (Tap Sensor)</span>
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
              Tempelkan kartu NFC / e-KTP / kartu pintar guru di HP atau USB reader, atau gunakan tombol "Tap NFC" pada tabel guru untuk rekam cepat.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
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

      {/* Modal Import CSV Guru */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Data Guru via Excel / CSV"
        maxWidth="lg"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Format Template CSV Guru</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kolom: <code>nip, nama, jenis_kelamin, no_hp, email, status_pegawai, mata_pelajaran, id_kartu_qr_fisik</code>
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
              placeholder={'nip,nama,jenis_kelamin,no_hp,email,status_pegawai,mata_pelajaran,id_kartu_qr_fisik\n197505122000031001,"Drs. H. Mulyono, M.Pd.",L,081234567890,mulyono@sekolah.sch.id,PNS,"Matematika",GURU-001'}
            />
          </div>

          {importResult && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs">
              <div className="font-bold text-emerald-600">
                Berhasil mengimpor {importResult.count} guru.
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
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={importing}
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Mengimpor...' : 'Proses Impor Guru'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedNfcTeacher && (
        <NfcRecordModal
          isOpen={showNfcModal}
          onClose={() => {
            setShowNfcModal(false);
            setSelectedNfcTeacher(null);
          }}
          personName={selectedNfcTeacher.name}
          personIdentifier={selectedNfcTeacher.nip || '-'}
          targetType="TEACHER"
          currentNfcUid={selectedNfcTeacher.nfcUid}
          onSave={async (newUid) => {
            await handleSaveNfcDirect(selectedNfcTeacher.id, newUid);
          }}
        />
      )}
    </div>
  );
};
