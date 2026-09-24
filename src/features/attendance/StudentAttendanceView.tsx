import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Search,
  CheckCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge.js';
import { syncEngine } from '../../lib/syncEngine.js';
import { AttendanceScannerModal } from './AttendanceScannerModal.js';
import type {
  ClassItem,
  TeachingSchedule,
  StudentAttendance,
  AttendanceStatus,
  UserSession,
} from '../../types/index.js';

interface StudentAttendanceViewProps {
  currentSession: UserSession | null;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  currentSession,
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-8a');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [schedules, setSchedules] = useState<TeachingSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Load classes
  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          if (!selectedClassId) setSelectedClassId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching classes:', err));
  }, []);

  // Load schedules for selected class
  useEffect(() => {
    if (!selectedClassId) return;
    fetch(`/api/schedules/teaching?classId=${selectedClassId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSchedules(data);
          if (data.length > 0) setSelectedScheduleId(data[0].id);
          else setSelectedScheduleId('');
        }
      })
      .catch((err) => console.error('Error fetching schedules:', err));
  }, [selectedClassId]);

  // Load student attendances
  const loadAttendance = async () => {
    if (!selectedClassId || !selectedDate) return;
    try {
      setLoading(true);
      const url = `/api/attendance/student?classId=${selectedClassId}&date=${selectedDate}${
        selectedScheduleId ? `&scheduleId=${selectedScheduleId}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data);
      }
    } catch (err) {
      console.error('Error loading student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedClassId, selectedDate, selectedScheduleId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentId === studentId ? { ...rec, status } : rec))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentId === studentId ? { ...rec, note } : rec))
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => ({ ...rec, status: 'HADIR' as AttendanceStatus }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      const payload = {
        meta: {
          classId: selectedClassId,
          date: selectedDate,
          scheduleId: selectedScheduleId || undefined,
          teacherId: currentSession?.teacherId || currentSession?.user?.teacherId || 'system',
        },
        records: attendanceRecords.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      };

      if (navigator.onLine) {
        const res = await fetch('/api/attendance/student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentSession?.id || currentSession?.user?.id || '',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Gagal menyimpan absensi ke server.');
        setSaveMessage('Absensi berhasil disimpan ke server!');
      } else {
        // Offline: save to syncEngine queue
        for (const record of payload.records) {
          await syncEngine.queueOperation('INSERT', 'student_attendance', record.studentId, {
            ...record,
            classId: selectedClassId,
            attendanceDate: selectedDate,
            scheduleId: selectedScheduleId,
          });
        }
        setSaveMessage('Tersimpan di antrean lokal (offline). Akan disinkronkan saat terhubung!');
      }

      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = attendanceRecords.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.studentNis && r.studentNis.toLowerCase().includes(q))
    );
  });

  const countHadir = attendanceRecords.filter((r) => r.status === 'HADIR').length;
  const countTerlambat = attendanceRecords.filter((r) => r.status === 'TERLAMBAT').length;
  const countIzin = attendanceRecords.filter((r) => r.status === 'IZIN').length;
  const countSakit = attendanceRecords.filter((r) => r.status === 'SAKIT').length;
  const countAlpha = attendanceRecords.filter((r) => r.status === 'ALPHA').length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Input & Presensi Kehadiran Siswa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan absensi per kelas / jam pelajaran secara cepat & offline-ready.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition shadow-xs"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Buka Scanner (Kamera / Hard Scan)</span>
            </button>

            <button
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Semua Hadir</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Pilih Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.room || 'Ruang Normal'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tanggal Presensi
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Jadwal / Mata Pelajaran
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Absensi Harian Kelas</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.name || s.subjectName || 'Mapel'} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cari Siswa
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama / NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-500">Ringkasan:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
            Hadir: {countHadir}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-300">
            Terlambat: {countTerlambat}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold dark:bg-blue-950 dark:text-blue-300">
            Izin: {countIzin}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold dark:bg-purple-950 dark:text-purple-300">
            Sakit: {countSakit}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-300">
            Alpha: {countAlpha}
          </span>
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Memuat data siswa kelas...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada siswa ditemukan untuk kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                  <th className="px-4 py-3 font-semibold">NIS</th>
                  <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-3 font-semibold text-center">Status Kehadiran</th>
                  <th className="px-4 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((item, index) => (
                  <tr
                    key={item.studentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {item.studentNis || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {item.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'] as AttendanceStatus[]).map(
                          (st) => {
                            const isSelected = item.status === st;
                            const colors: Record<string, string> = {
                              HADIR: isSelected
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
                              TERLAMBAT: isSelected
                                ? 'bg-amber-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40',
                              IZIN: isSelected
                                ? 'bg-blue-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
                              SAKIT: isSelected
                                ? 'bg-purple-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-purple-50 dark:hover:bg-purple-950/40',
                              ALPHA: isSelected
                                ? 'bg-rose-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-950/40',
                            };

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(item.studentId, st)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] transition ${colors[st] || ''}`}
                              >
                                {st}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Catatan / surat dokter..."
                        value={item.note || ''}
                        onChange={(e) => handleNoteChange(item.studentId, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        targetType="STUDENT"
        defaultClassId={selectedClassId}
        defaultScheduleId={selectedScheduleId}
        currentSession={currentSession}
        onScanSuccess={(res) => {
          setAttendanceRecords((prev) =>
            prev.map((rec) =>
              rec.studentId === res.person.id
                ? { ...rec, status: res.status, note: `Scan ${res.time}` }
                : rec
            )
          );
        }}
      />
    </div>
  );
};
