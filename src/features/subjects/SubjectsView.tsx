import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Clock, RotateCcw, Edit2, Trash2, CheckCircle2, Coffee } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type { SubjectItem, LessonPeriodSlot, UserSession } from '../../types/index.js';

interface SubjectsViewProps {
  currentSession: UserSession | null;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ currentSession }) => {
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'PERIODS'>('SUBJECTS');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [lessonPeriods, setLessonPeriods] = useState<LessonPeriodSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Modal State
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    category: 'UMUM',
    hoursPerWeek: 4,
  });

  // Lesson Period Modal State
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [periodForm, setPeriodForm] = useState({
    periodNumber: 1,
    name: 'Jam Ke-1',
    startTime: '07:15',
    endTime: '07:45',
    isBreak: false,
    active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSubjects, resPeriods] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/academic/lesson-periods'),
      ]);

      if (resSubjects.ok) {
        setSubjects(await resSubjects.json());
      }
      if (resPeriods.ok) {
        setLessonPeriods(await resPeriods.json());
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(subjectForm),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambah mata pelajaran.');
      }

      setShowAddSubject(false);
      setSubjectForm({ code: '', name: '', category: 'UMUM', hoursPerWeek: 4 });
      setMessage({ type: 'success', text: 'Mata pelajaran berhasil ditambahkan!' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenAddPeriod = () => {
    // Find next period number
    const activeLessons = lessonPeriods.filter((p) => !p.isBreak);
    const nextNumber = activeLessons.length > 0 ? Math.max(...activeLessons.map((p) => p.periodNumber)) + 1 : 1;
    
    // Propose start time based on last period end time
    let proposedStart = '07:15';
    let proposedEnd = '07:45';
    if (lessonPeriods.length > 0) {
      const last = lessonPeriods[lessonPeriods.length - 1];
      proposedStart = last.endTime;
      // add 30 mins
      const [h, m] = proposedStart.split(':').map(Number);
      const endTotal = h * 60 + m + 30;
      const endH = String(Math.floor(endTotal / 60)).padStart(2, '0');
      const endM = String(endTotal % 60).padStart(2, '0');
      proposedEnd = `${endH}:${endM}`;
    }

    setEditingPeriodId(null);
    setPeriodForm({
      periodNumber: nextNumber,
      name: `Jam Ke-${nextNumber}`,
      startTime: proposedStart,
      endTime: proposedEnd,
      isBreak: false,
      active: true,
    });
    setShowPeriodModal(true);
  };

  const handleOpenEditPeriod = (period: LessonPeriodSlot) => {
    setEditingPeriodId(period.id);
    setPeriodForm({
      periodNumber: period.periodNumber,
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: !!period.isBreak,
      active: period.active !== false,
    });
    setShowPeriodModal(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPeriodId
        ? `/api/academic/lesson-periods/${editingPeriodId}`
        : '/api/academic/lesson-periods';
      const method = editingPeriodId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(periodForm),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menyimpan slot jam pelajaran.');
      }

      setShowPeriodModal(false);
      setMessage({
        type: 'success',
        text: editingPeriodId
          ? 'Pengaturan jam pelajaran berhasil diperbarui!'
          : 'Slot jam pelajaran baru berhasil ditambahkan!',
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeletePeriod = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus slot waktu "${name}"?`)) return;

    try {
      const res = await fetch(`/api/academic/lesson-periods/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus slot jam pelajaran.');
      }

      setMessage({ type: 'success', text: `Slot "${name}" berhasil dihapus.` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetPeriods = async () => {
    if (
      !confirm(
        'Reset semua slot jam pelajaran ke standar SMP Al Hikam (Jam Ke-1: 07.15-07.45 s/d Jam Ke-10)? Tindakan ini akan mengembalikan daftar jam pelajaran default.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/academic/lesson-periods/reset', {
        method: 'POST',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal mereset jam pelajaran.');
      }

      setMessage({
        type: 'success',
        text: 'Jam pelajaran berhasil di-reset ke template standar SMP Al Hikam (07:15 - 13:15).',
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Helper calculating duration in minutes
  const getDurationMinutes = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Master Kurikulum & Jam Pelajaran (JP)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar mata pelajaran kurikulum dan pengaturan rentang waktu jam pelajaran (JP) untuk acuan jadwal KBM sekolah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'SUBJECTS' ? (
              <button
                onClick={() => setShowAddSubject(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel Baru</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetPeriods}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  title="Kembalikan ke standar jam 07:15-13:15"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Standar (07.15)</span>
                </button>
                <button
                  onClick={handleOpenAddPeriod}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slot JP</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="underline ml-2">
              Tutup
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'SUBJECTS'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daftar Mata Pelajaran ({subjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PERIODS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'PERIODS'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pengaturan Jam Pelajaran / JP ({lessonPeriods.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAFTAR MATA PELAJARAN */}
      {activeTab === 'SUBJECTS' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Memuat mata pelajaran...</div>
          ) : subjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada data mata pelajaran. Klik "Tambah Mapel Baru" untuk menambahkan.
            </div>
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
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
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
                        {sub.hoursPerWeek} Jam Pelajaran (JP)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENGATURAN JAM PELAJARAN (JP) */}
      {activeTab === 'PERIODS' && (
        <div className="space-y-4">
          {/* Info Card */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20 text-xs">
            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Standar Alokasi Waktu Jam Pelajaran (JP)</span>
            </div>
            <p className="text-blue-800/80 dark:text-blue-200">
              Rentang waktu di bawah ini menjadi referensi otomatis pada <strong>Menu Jadwal Mengajar</strong>. Saat menyusun jadwal kelas, guru cukup memilih jam mulai (misal: <em>Jam Ke-1</em>) dan jam selesai (misal: <em>Jam Ke-3</em>), waktu mulai dan selesai akan otomatis terisi akurat.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">Memuat pengaturan JP...</div>
            ) : lessonPeriods.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada pengaturan jam pelajaran. Klik "Reset Standar (07.15)" atau "Tambah Slot JP" untuk membuat jadwal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Slot / Urutan</th>
                      <th className="px-4 py-3 font-semibold">Nama Jam Pelajaran</th>
                      <th className="px-4 py-3 font-semibold">Jam Mulai</th>
                      <th className="px-4 py-3 font-semibold">Jam Selesai</th>
                      <th className="px-4 py-3 font-semibold">Durasi</th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lessonPeriods.map((period) => {
                      const dur = getDurationMinutes(period.startTime, period.endTime);
                      return (
                        <tr
                          key={period.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            period.isBreak ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            {period.isBreak ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <Coffee className="w-3 h-3" />
                                <span>Istirahat</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                JP {period.periodNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {period.name}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {period.startTime}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {period.endTime}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium">
                            {dur} Menit
                          </td>
                          <td className="px-4 py-3">
                            {period.isBreak ? (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">
                                Waktu Istirahat
                              </span>
                            ) : (
                              <span className="text-blue-700 dark:text-blue-400 font-medium">
                                Kegiatan Belajar Mengajar
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPeriod(period)}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                                title="Edit Slot Waktu JP"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePeriod(period.id, period.name)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                                title="Hapus Slot JP"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
      )}

      {/* Modal Tambah Mapel */}
      <Modal isOpen={showAddSubject} onClose={() => setShowAddSubject(false)} title="Tambah Mata Pelajaran">
        <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kode Mapel
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: MAT-01, PAI-01, IPA-01"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
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
              placeholder="Contoh: Matematika, Bahasa Indonesia"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <select
                value={subjectForm.category}
                onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="UMUM">Umum / Wajib</option>
                <option value="PEMINATAN">Peminatan</option>
                <option value="MUATAN_LOKAL">Muatan Lokal</option>
                <option value="EKSTRAKURIKULER">Ekstrakurikuler</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Beban Jam (JP) / Minggu
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={subjectForm.hoursPerWeek}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, hoursPerWeek: parseInt(e.target.value) || 2 })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSubject(false)}
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

      {/* Modal Tambah/Edit Jam Pelajaran (JP) */}
      <Modal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title={editingPeriodId ? 'Edit Pengaturan Jam Pelajaran (JP)' : 'Tambah Slot Jam Pelajaran (JP)'}
      >
        <form onSubmit={handleSavePeriod} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor JP
              </label>
              <input
                type="number"
                min={0}
                max={20}
                required
                value={periodForm.periodNumber}
                onChange={(e) =>
                  setPeriodForm({ ...periodForm, periodNumber: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                placeholder="1, 2, 3 (0 jika istirahat)"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Label / Nama Slot
              </label>
              <input
                type="text"
                required
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                placeholder="Contoh: Jam Ke-1 / Istirahat Pagi"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                required
                value={periodForm.startTime}
                onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                required
                value={periodForm.endTime}
                onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Durasi Terhitung:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {getDurationMinutes(periodForm.startTime, periodForm.endTime)} Menit
            </span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={periodForm.isBreak}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setPeriodForm({
                    ...periodForm,
                    isBreak: isChecked,
                    name: isChecked ? 'Istirahat' : `Jam Ke-${periodForm.periodNumber || 1}`,
                    periodNumber: isChecked ? 0 : periodForm.periodNumber || 1,
                  });
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Tandai sebagai Waktu Istirahat (bukan jam tatap muka KBM)
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPeriodModal(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 shadow-xs"
            >
              {editingPeriodId ? 'Simpan Perubahan' : 'Tambah Jam Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
