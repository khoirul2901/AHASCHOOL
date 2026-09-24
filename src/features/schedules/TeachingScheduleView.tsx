import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Building,
  UserCheck,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import type {
  TeachingSchedule,
  PicketSchedule,
  TeacherItem,
  ClassItem,
  SubjectItem,
  UserSession,
} from '../../types/index.js';

interface TeachingScheduleViewProps {
  currentSession: UserSession | null;
}

export const TeachingScheduleView: React.FC<TeachingScheduleViewProps> = ({
  currentSession,
}) => {
  const [activeTab, setActiveTab] = useState<'TEACHING' | 'PICKET' | 'SUBSTITUTE'>('TEACHING');
  const [teachingSchedules, setTeachingSchedules] = useState<TeachingSchedule[]>([]);
  const [picketSchedules, setPicketSchedules] = useState<PicketSchedule[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddTeaching, setShowAddTeaching] = useState(false);
  const [showAddPicket, setShowAddPicket] = useState(false);
  const [showAddSubstitute, setShowAddSubstitute] = useState(false);

  // Form states
  const [teachingForm, setTeachingForm] = useState({
    teacherId: '',
    classId: '',
    subjectId: '',
    dayOfWeek: 1,
    startTime: '07:30',
    endTime: '08:45',
    room: 'R. 101',
  });

  const [picketForm, setPicketForm] = useState({
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '14:00',
    location: 'Pos Lobby Utama',
  });

  const [substituteForm, setSubstituteForm] = useState({
    scheduleId: '',
    originalTeacherId: '',
    replacementTeacherId: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Guru berhalangan hadir (tugas dinas luar)',
  });

  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes, tchRes, clsRes, sbjRes] = await Promise.all([
        fetch('/api/schedules/teaching'),
        fetch('/api/schedules/picket'),
        fetch('/api/teachers'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ]);

      if (tRes.ok) setTeachingSchedules(await tRes.json());
      if (pRes.ok) setPicketSchedules(await pRes.json());
      if (tchRes.ok) {
        const data = await tchRes.json();
        setTeachers(data.items || []);
        if (data.items?.length > 0) {
          setTeachingForm((prev) => ({ ...prev, teacherId: data.items[0].id }));
          setPicketForm((prev) => ({ ...prev, teacherId: data.items[0].id }));
        }
      }
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        setClasses(clsData);
        if (clsData.length > 0) {
          setTeachingForm((prev) => ({ ...prev, classId: clsData[0].id }));
        }
      }
      if (sbjRes.ok) {
        const sbjData = await sbjRes.json();
        setSubjects(sbjData);
        if (sbjData.length > 0) {
          setTeachingForm((prev) => ({ ...prev, subjectId: sbjData[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeaching = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/schedules/teaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(teachingForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menambahkan jadwal' });
        return;
      }

      setMessage({ type: 'success', text: 'Jadwal mengajar berhasil ditambahkan!' });
      setShowAddTeaching(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreatePicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/schedules/picket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(picketForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menambahkan piket' });
        return;
      }

      setMessage({ type: 'success', text: 'Jadwal piket berhasil ditambahkan!' });
      setShowAddPicket(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/schedules/substitute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(substituteForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Gagal menugaskan guru pengganti' });
        return;
      }

      setMessage({ type: 'success', text: 'Guru pengganti berhasil ditugaskan!' });
      setShowAddSubstitute(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>Manajemen Jadwal Mengajar, Piket & Guru Pengganti</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dilengkapi validasi bentrok jadwal guru, bentrok kelas, dan bentrok ruangan secara otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'TEACHING' && (
              <button
                onClick={() => setShowAddTeaching(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Mengajar</span>
              </button>
            )}
            {activeTab === 'PICKET' && (
              <button
                onClick={() => setShowAddPicket(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Piket</span>
              </button>
            )}
            {activeTab === 'SUBSTITUTE' && (
              <button
                onClick={() => {
                  if (teachingSchedules.length > 0 && teachers.length > 1) {
                    const sch = teachingSchedules[0];
                    setSubstituteForm({
                      scheduleId: sch.id,
                      originalTeacherId: sch.teacherId,
                      replacementTeacherId: teachers.find((t) => t.id !== sch.teacherId)?.id || teachers[0].id,
                      date: new Date().toISOString().split('T')[0],
                      reason: 'Guru tugas dinas / izin',
                    });
                  }
                  setShowAddSubstitute(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tugaskan Guru Pengganti</span>
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="underline ml-2">
              Tutup
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('TEACHING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'TEACHING'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Jadwal Mengajar ({teachingSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('PICKET')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PICKET'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Jadwal Piket Guru ({picketSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBSTITUTE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'SUBSTITUTE'
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Guru Pengganti
          </button>
        </div>
      </div>

      {/* Content for TAB 1: TEACHING SCHEDULE */}
      {activeTab === 'TEACHING' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Memuat data jadwal...</div>
          ) : teachingSchedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada jadwal mengajar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Hari</th>
                    <th className="px-4 py-3 font-semibold">Waktu</th>
                    <th className="px-4 py-3 font-semibold">Kelas</th>
                    <th className="px-4 py-3 font-semibold">Mata Pelajaran</th>
                    <th className="px-4 py-3 font-semibold">Guru Pengampu</th>
                    <th className="px-4 py-3 font-semibold">Ruangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teachingSchedules.map((sch) => (
                    <tr
                      key={sch.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {dayNames[sch.dayOfWeek]}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {sch.startTime} - {sch.endTime}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {sch.class?.name || sch.className || sch.classId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {sch.subject?.name || sch.subjectName || sch.subjectId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {sch.teacher?.name || sch.teacherName || sch.teacherId}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{sch.room || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 2: PICKET SCHEDULE */}
      {activeTab === 'PICKET' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Memuat data piket...</div>
          ) : picketSchedules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada jadwal piket.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tanggal</th>
                    <th className="px-4 py-3 font-semibold">Nama Guru Piket</th>
                    <th className="px-4 py-3 font-semibold">Jam Piket</th>
                    <th className="px-4 py-3 font-semibold">Lokasi Tugas</th>
                    <th className="px-4 py-3 font-semibold">Status Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {picketSchedules.map((pkt) => (
                    <tr
                      key={pkt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {pkt.date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {pkt.teacher?.name || pkt.teacherName || pkt.teacherId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {pkt.startTime} - {pkt.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {pkt.location || 'Pos Utama'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          PIKET AKTIF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 3: SUBSTITUTE */}
      {activeTab === 'SUBSTITUTE' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sistem Penugasan Guru Pengganti (Invaler)
            </h3>
            <p className="text-xs text-slate-500">
              Jika seorang guru berhalangan, jadwal mengajar dialihkan ke guru pengganti dan otomatis ter-generate di absensi guru pengganti tanpa menghapus riwayat jadwal asli.
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-4 border border-purple-200 dark:border-purple-900 text-xs space-y-2">
            <div className="font-bold text-purple-900 dark:text-purple-300">
              Mekanisme Penggantian:
            </div>
            <p className="text-purple-800 dark:text-purple-200">
              1. Pilih jadwal mengajar kelas yang gurunya berhalangan hadir.<br />
              2. Masukkan tanggal spesifik penggantian.<br />
              3. Pilih guru pengganti yang tersedia.<br />
              4. Ketika attendance engine dijalankan, record absensi mengajar akan dibuat atas nama guru pengganti dengan catatan riwayat otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal Mengajar */}
      <Modal
        isOpen={showAddTeaching}
        onClose={() => setShowAddTeaching(false)}
        title="Tambah Jadwal Mengajar Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTeaching} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guru Pengampu
              </label>
              <select
                value={teachingForm.teacherId}
                onChange={(e) => setTeachingForm({ ...teachingForm, teacherId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelas
              </label>
              <select
                value={teachingForm.classId}
                onChange={(e) => setTeachingForm({ ...teachingForm, classId: e.target.value })}
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

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran
              </label>
              <select
                value={teachingForm.subjectId}
                onChange={(e) => setTeachingForm({ ...teachingForm, subjectId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hari
              </label>
              <select
                value={teachingForm.dayOfWeek}
                onChange={(e) =>
                  setTeachingForm({ ...teachingForm, dayOfWeek: parseInt(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
                <option value={6}>Sabtu</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={teachingForm.startTime}
                onChange={(e) => setTeachingForm({ ...teachingForm, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={teachingForm.endTime}
                onChange={(e) => setTeachingForm({ ...teachingForm, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruangan Kelas / Lab
              </label>
              <input
                type="text"
                placeholder="Contoh: R. 201 / Lab Komputer"
                value={teachingForm.room}
                onChange={(e) => setTeachingForm({ ...teachingForm, room: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddTeaching(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
            >
              Simpan Jadwal Mengajar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Jadwal Piket */}
      <Modal
        isOpen={showAddPicket}
        onClose={() => setShowAddPicket(false)}
        title="Tambah Jadwal Piket Guru"
      >
        <form onSubmit={handleCreatePicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Guru Piket
            </label>
            <select
              value={picketForm.teacherId}
              onChange={(e) => setPicketForm({ ...picketForm, teacherId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Tugas Piket
            </label>
            <input
              type="date"
              value={picketForm.date}
              onChange={(e) => setPicketForm({ ...picketForm, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Mulai
              </label>
              <input
                type="time"
                value={picketForm.startTime}
                onChange={(e) => setPicketForm({ ...picketForm, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jam Selesai
              </label>
              <input
                type="time"
                value={picketForm.endTime}
                onChange={(e) => setPicketForm({ ...picketForm, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lokasi Pos Piket
            </label>
            <input
              type="text"
              value={picketForm.location}
              onChange={(e) => setPicketForm({ ...picketForm, location: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddPicket(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              Simpan Jadwal Piket
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Guru Pengganti */}
      <Modal
        isOpen={showAddSubstitute}
        onClose={() => setShowAddSubstitute(false)}
        title="Tugaskan Guru Pengganti"
      >
        <form onSubmit={handleCreateSubstitute} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Jadwal Mengajar Asli
            </label>
            <select
              value={substituteForm.scheduleId}
              onChange={(e) => {
                const sid = e.target.value;
                const found = teachingSchedules.find((s) => s.id === sid);
                setSubstituteForm({
                  ...substituteForm,
                  scheduleId: sid,
                  originalTeacherId: found ? found.teacherId : '',
                });
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            >
              {teachingSchedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {dayNames[s.dayOfWeek]} {s.startTime}-{s.endTime} | {s.class?.name || s.className} - {s.subject?.name || s.subjectName} (Guru: {s.teacher?.name || s.teacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Penggantian
            </label>
            <input
              type="date"
              value={substituteForm.date}
              onChange={(e) => setSubstituteForm({ ...substituteForm, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Guru Pengganti
            </label>
            <select
              value={substituteForm.replacementTeacherId}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, replacementTeacherId: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Penggantian
            </label>
            <textarea
              rows={2}
              value={substituteForm.reason}
              onChange={(e) => setSubstituteForm({ ...substituteForm, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSubstitute(false)}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-purple-700"
            >
              Simpan Penugasan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
