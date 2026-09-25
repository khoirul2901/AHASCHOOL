import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  Building,
  CheckCircle2,
  Calendar,
  QrCode,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StatusBadge, TypeBadge } from '../../components/ui/Badge.js';
import type { DashboardStats, UserSession, TeacherAttendance } from '../../types/index.js';

interface DashboardViewProps {
  currentSession: UserSession | null;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentSession,
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [myAttendances, setMyAttendances] = useState<TeacherAttendance[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const isTeacher = currentSession?.roles.includes('GURU');
  const teacherId = currentSession?.teacherId || currentSession?.user?.teacherId;

  const loadData = async () => {
    try {
      setLoading(true);

      const isStaticDeploy = typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');

      if (isStaticDeploy) {
        setStats({
          totalStudents: 384,
          totalTeachers: 28,
          totalClasses: 12,
          teachersPresent: 26,
          teachersLate: 2,
          teachersPicket: 4,
          studentAttendanceRate: 96.8,
          studentsPresent: 372,
          studentsSick: 5,
          studentsPermit: 4,
          studentsAlpha: 3,
          classesCompleted: 8,
          classesInProgress: 4,
          totalClassesScheduled: 12,
          weeklyTrends: [
            { day: 'Sen', hadir: 375, izin: 4, sakit: 3, alpha: 2 },
            { day: 'Sel', hadir: 378, izin: 3, sakit: 2, alpha: 1 },
            { day: 'Rab', hadir: 370, izin: 6, sakit: 5, alpha: 3 },
            { day: 'Kam', hadir: 374, izin: 4, sakit: 4, alpha: 2 },
            { day: 'Jum', hadir: 380, izin: 2, sakit: 2, alpha: 0 },
          ],
          classAttendanceList: [
            { classId: 'cls-7a', className: 'Kelas 7-A', rate: 98.2, total: 32, present: 31 },
            { classId: 'cls-7b', className: 'Kelas 7-B', rate: 96.5, total: 32, present: 30 },
            { classId: 'cls-8a', className: 'Kelas 8-A', rate: 94.0, total: 32, present: 29 },
            { classId: 'cls-8b', className: 'Kelas 8-B', rate: 97.1, total: 32, present: 31 },
            { classId: 'cls-9a', className: 'Kelas 9-A', rate: 95.8, total: 32, present: 30 },
          ],
          recentActivities: [
            { id: 'act-1', text: 'Scan RFID Siswa berhasil - M. Ridwan (7-A)', time: '06:55' },
            { id: 'act-2', text: 'Check-in Guru Piket - Drs. H. Mulyono', time: '06:45' },
            { id: 'act-3', text: 'Absensi Jam ke-1 Kelas 8-B diselesaikan', time: '07:35' },
            { id: 'act-4', text: 'Sinkronisasi offline 12 kartu presensi sukses', time: '07:40' },
          ],
        });

        if (isTeacher) {
          setMyAttendances([
            {
              id: 'att-tch-1',
              teacherId: teacherId || 'tch-01',
              date: new Date().toISOString().split('T')[0],
              attendanceType: 'TEACHING',
              status: 'HADIR',
              scheduledStart: '07:30',
              scheduledEnd: '09:00',
              actualTime: '07:20',
              source: 'RFID_GATE',
              scheduleDetail: 'Kelas VII-A (Matematika)',
            },
            {
              id: 'att-tch-2',
              teacherId: teacherId || 'tch-01',
              date: new Date().toISOString().split('T')[0],
              attendanceType: 'PICKET',
              status: 'HADIR',
              scheduledStart: '06:30',
              scheduledEnd: '08:00',
              actualTime: '06:25',
              source: 'RFID_GATE',
              scheduleDetail: 'Piket Gerbang Utama & Lobi',
            },
          ]);
        }
        return;
      }

      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      if (teacherId) {
        const today = new Date().toISOString().split('T')[0];
        const attRes = await fetch(`/api/attendance/teacher?date=${today}&teacherId=${teacherId}`);
        if (attRes.ok) {
          const atts = await attRes.json();
          setMyAttendances(atts);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const handleGenerateAttendance = async () => {
    try {
      setGenerating(true);
      setGenerateMsg(null);
      const res = await fetch('/api/attendance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });
      const data = await res.json();
      if (data.success) {
        setGenerateMsg(
          `Absensi berhasil di-generate! (${data.teachingCount} mengajar, ${data.picketCount} piket)`
        );
        loadData();
      }
    } catch (err: any) {
      setGenerateMsg('Gagal generate: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleTeacherCheckIn = async (attendanceId: string) => {
    if (!teacherId) return;
    try {
      setCheckingInId(attendanceId);
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
        loadData();
      }
    } catch (err) {
      console.error('Error checkin:', err);
    } finally {
      setCheckingInId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat statistik dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Selamat Datang, {currentSession?.fullName || currentSession?.user?.name || currentSession?.username || 'Pengguna'}!
            </h2>
            <p className="mt-1 text-sm text-blue-100/80">
              {isTeacher
                ? 'Jadwal mengajar dan tugas piket Anda terpantau secara mandiri dan otomatis.'
                : 'Pusat pemantauan kehadiran, jadwal mengajar, dan absensi piket sekolah terpadu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('scan-kiosk')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md border border-blue-400/40 active:scale-95 transition"
            >
              <QrCode className="w-4 h-4 text-white" />
              <span>Buka Mesin Scan Absensi</span>
            </button>

            <button
              onClick={handleGenerateAttendance}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-blue-50 active:scale-95 transition disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>{generating ? 'Memproses...' : 'Generate Absensi Hari Ini'}</span>
            </button>
          </div>
        </div>

        {generateMsg && (
          <div className="mt-4 rounded-xl bg-blue-500/30 p-3 text-xs text-white border border-blue-400/30 flex items-center justify-between">
            <span>{generateMsg}</span>
            <button onClick={() => setGenerateMsg(null)} className="font-bold underline ml-2">
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* Special Teacher Section if user has GURU role */}
      {isTeacher && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Tugas & Jadwal Saya Hari Ini</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Piket dan Mengajar tercatat secara independen.
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance-student')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-xs"
            >
              Buka Form Absensi Siswa &rarr;
            </button>
          </div>

          {myAttendances.length === 0 ? (
            <div className="rounded-xl bg-white dark:bg-slate-800 p-6 text-center text-xs text-slate-500">
              Belum ada record absensi ter-generate untuk hari ini. Klik tombol "Generate Absensi Hari Ini" di atas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAttendances.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <TypeBadge type={att.attendanceType} />
                      <StatusBadge status={att.status} />
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {att.scheduleDetail || (att.attendanceType === 'PICKET' ? 'Tugas Piket Sekolah' : 'Jadwal Mengajar')}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Jadwal: {att.scheduledStart} - {att.scheduledEnd}
                      </span>
                    </div>
                    {att.actualTime && (
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        Hadir jam: {att.actualTime} ({att.source})
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Toleransi: 10 mnt
                    </span>
                    <button
                      onClick={() => handleTeacherCheckIn(att.id)}
                      disabled={checkingInId === att.id}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                    >
                      {att.status === 'HADIR' ? 'Check-In Ulang' : 'Check-In Sekarang'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Guru Hadir & Piket */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Kehadiran Guru</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.teachersPresent || 0}
            </span>
            <span className="text-xs text-slate-500">
              / {stats?.totalTeachers || 0} Guru Aktif
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-amber-600">
              {stats?.teachersLate || 0} Terlambat
            </span>
            <span>&bull;</span>
            <span className="font-semibold text-indigo-600">
              {stats?.teachersPicket || 0} Piket
            </span>
          </div>
        </div>

        {/* Kehadiran Siswa */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tingkat Kehadiran Siswa</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.attendanceRate || 96}%
            </span>
            <span className="text-xs text-slate-500">
              ({stats?.studentsPresent || 0} Hadir)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total Siswa Terdaftar: {stats?.totalStudents || 0}
          </div>
        </div>

        {/* Siswa Sakit & Izin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Siswa Izin / Sakit</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {(stats?.studentsExcused || 0) + (stats?.studentsSick || 0)}
            </span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-blue-600 font-semibold">{stats?.studentsExcused || 0} Izin</span>
            <span>&bull;</span>
            <span className="text-purple-600 font-semibold">{stats?.studentsSick || 0} Sakit</span>
          </div>
        </div>

        {/* Siswa Alpha & Terlambat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Siswa Alpha / Terlambat</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats?.studentsAlpha || 0}
            </span>
            <span className="text-xs text-slate-500">Alpha</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-semibold">
            {stats?.studentsLate || 0} Siswa Datang Terlambat
          </div>
        </div>
      </div>

      {/* Charts & Recap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tren Kehadiran Siswa 5 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500">
                Pemantauan tren harian siswa masuk sekolah
              </p>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
              Minggu Berjalan
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.dailyStudentTrend || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="present" name="Hadir" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Tidak Hadir" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Guru Piket Hari Ini Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Guru Piket Hari Ini</span>
              </h3>
              <span className="text-xs font-semibold text-indigo-600">
                {stats?.picketToday.length || 0} Petugas
              </span>
            </div>

            {stats?.picketToday.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada guru yang dijadwalkan piket hari ini.
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.picketToday.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.location} &bull; {p.time}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('schedules')}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
            >
              Lihat Seluruh Jadwal Piket &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Class Recap Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rekap Kehadiran Siswa per Kelas Hari Ini
            </h3>
            <p className="text-xs text-slate-500">
              Rincian persentase kehadiran masing-masing rombel
            </p>
          </div>
          <button
            onClick={() => onNavigate('attendance-student')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Kelola Absensi Siswa &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-xl">Nama Kelas</th>
                <th className="px-4 py-3 font-semibold">Total Siswa</th>
                <th className="px-4 py-3 font-semibold">Siswa Hadir</th>
                <th className="px-4 py-3 font-semibold">Persentase</th>
                <th className="px-4 py-3 font-semibold rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.classRecap.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {c.className}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.total}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{c.present}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${c.rate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {c.rate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.rate >= 90 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" /> Perhatian
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
