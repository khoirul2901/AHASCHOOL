import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  PlayCircle,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { StatusBadge, TypeBadge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { AttendanceScannerModal } from './AttendanceScannerModal.js';
import type {
  TeacherAttendance,
  AttendanceType,
  AttendanceStatus,
  UserSession,
} from '../../types/index.js';

interface TeacherAttendanceViewProps {
  currentSession: UserSession | null;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  currentSession,
}) => {
  const [attendances, setAttendances] = useState<TeacherAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<TeacherAttendance | null>(null);
  const [correctionNewStatus, setCorrectionNewStatus] = useState<AttendanceStatus>('HADIR');
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      let url = `/api/attendance/teacher?date=${selectedDate}`;
      if (filterType) url += `&type=${filterType}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      }
    } catch (err) {
      console.error('Error fetching teacher attendances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
  }, [selectedDate, filterType, filterStatus]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setMessage(null);
      const res = await fetch('/api/attendance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Berhasil generate absensi untuk tanggal ${selectedDate}: ${data.teachingCount} jadwal mengajar, ${data.picketCount} jadwal piket.`
        );
        loadAttendances();
      }
    } catch (err: any) {
      setMessage('Gagal generate: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckIn = async (attendanceId: string, teacherId: string) => {
    try {
      const now = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const res = await fetch('/api/attendance/teacher/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          attendanceId,
          checkInTime: now,
        }),
      });
      if (res.ok) {
        setMessage('Check-in berhasil dicatat.');
        loadAttendances();
      }
    } catch (err: any) {
      setMessage('Gagal check-in: ' + err.message);
    }
  };

  const handleOpenCorrection = (att: TeacherAttendance) => {
    setCorrectionTarget(att);
    setCorrectionNewStatus(att.status === 'HADIR' ? 'TERLAMBAT' : 'HADIR');
    setCorrectionReason('');
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !correctionReason.trim()) return;

    try {
      setSavingCorrection(true);
      const res = await fetch('/api/attendance/correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || 'admin',
        },
        body: JSON.stringify({
          targetAttendanceId: correctionTarget.id,
          targetType: 'TEACHER',
          newStatus: correctionNewStatus,
          reason: correctionReason,
        }),
      });

      if (res.ok) {
        setCorrectionTarget(null);
        setMessage('Koreksi absensi berhasil disimpan dengan catatan audit trail.');
        loadAttendances();
      }
    } catch (err: any) {
      alert('Gagal koreksi: ' + err.message);
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Daftar Presensi Guru (Mengajar & Piket)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru dengan tugas piket dan mengajar di hari yang sama tercatat dalam 2 record terpisah secara akurat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition shadow-xs"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Scan Presensi Guru (Kamera / RFID)</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{generating ? 'Memproses...' : 'Generate Absensi Tanggal Ini'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="underline ml-2">
              Tutup
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tanggal
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
              Jenis Tugas
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Semua Jenis (Mengajar & Piket)</option>
              <option value="TEACHING">Mengajar di Kelas</option>
              <option value="PICKET">Tugas Piket</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status Kehadiran
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Semua Status</option>
              <option value="HADIR">HADIR</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
              <option value="IZIN">IZIN</option>
              <option value="SAKIT">SAKIT</option>
              <option value="ALPHA">ALPHA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teacher Attendance List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Memuat data absensi guru...</span>
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada data absensi guru untuk tanggal {selectedDate}. Klik "Generate Absensi Tanggal Ini" untuk membuat data absensi harian secara otomatis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Guru</th>
                  <th className="px-4 py-3 font-semibold">Jenis Tugas</th>
                  <th className="px-4 py-3 font-semibold">Jadwal Tugas</th>
                  <th className="px-4 py-3 font-semibold">Jam Hadir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sumber</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendances.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.scheduleDetail || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={item.attendanceType} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {item.scheduledStart} - {item.scheduledEnd}
                    </td>
                    <td className="px-4 py-3">
                      {item.actualTime ? (
                        <span className="font-mono font-semibold text-emerald-600">
                          {item.actualTime}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {item.source}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCheckIn(item.id, item.teacherId)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                          title="Catat Jam Masuk Sekarang"
                        >
                          Check-In
                        </button>
                        <button
                          onClick={() => handleOpenCorrection(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Koreksi Absensi"
                        >
                          <FileEdit className="w-4 h-4" />
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

      {/* Modal Koreksi Absensi */}
      <Modal
        isOpen={!!correctionTarget}
        onClose={() => setCorrectionTarget(null)}
        title="Koreksi Status Absensi Guru"
      >
        {correctionTarget && (
          <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white">
                {correctionTarget.teacherName}
              </div>
              <div className="text-slate-500">
                Tugas: {correctionTarget.attendanceType} ({correctionTarget.scheduledStart} - {correctionTarget.scheduledEnd})
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400">Status Saat Ini:</span>
                <StatusBadge status={correctionTarget.status} />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Baru
              </label>
              <select
                value={correctionNewStatus}
                onChange={(e) => setCorrectionNewStatus(e.target.value as AttendanceStatus)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HADIR">HADIR</option>
                <option value="TERLAMBAT">TERLAMBAT</option>
                <option value="IZIN">IZIN</option>
                <option value="SAKIT">SAKIT</option>
                <option value="ALPHA">ALPHA</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Koreksi (Wajib Diisi untuk Audit Log)
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Terjadi kendala teknis pada mesin presensi atau bukti surat izin resmi..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingCorrection || !correctionReason.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {savingCorrection ? 'Menyimpan...' : 'Simpan Koreksi'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        targetType="TEACHER"
        currentSession={currentSession}
        onScanSuccess={() => {
          loadAttendances();
        }}
      />
    </div>
  );
};
