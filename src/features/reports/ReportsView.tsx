import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  UserCheck,
  Sun,
  Calendar,
  Layers,
  Database,
  Search,
  Clock,
  RotateCcw,
  Radio,
  Barcode,
  Camera,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge.js';
import type { ClassItem, TeacherItem, UserSession } from '../../types/index.js';
import { DatabaseViewerModal } from '../database/DatabaseViewerModal.js';

interface ReportsViewProps {
  currentSession: UserSession | null;
}

type ReportCategory =
  | 'STUDENT_DAILY'
  | 'CLASS_SUMMARY'
  | 'TEACHER_DAILY'
  | 'DHUHA_PRAYER'
  | 'SCHEDULES'
  | 'JOURNALS'
  | 'SEPARATED_DB';

export const ReportsView: React.FC<ReportsViewProps> = ({ currentSession }) => {
  const [activeTab, setActiveTab] = useState<ReportCategory>('STUDENT_DAILY');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [databaseTables, setDatabaseTables] = useState<any[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<string>('siakad-db');

  const openViewer = (targetId: string = 'siakad-db') => {
    setViewerTarget(targetId);
    setViewerOpen(true);
  };

  // Filter States
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dhuhaTargetType, setDhuhaTargetType] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');

  // Data States
  const [studentData, setStudentData] = useState<any[]>([]);
  const [classSummaryData, setClassSummaryData] = useState<{ period: any; items: any[] }>({
    period: {},
    items: [],
  });
  const [teacherData, setTeacherData] = useState<any[]>([]);
  const [dhuhaData, setDhuhaData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [journalData, setJournalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load master data
  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then(setClasses)
      .catch(console.error);

    fetch('/api/teachers')
      .then((res) => res.json())
      .then((d) => setTeachers(d.items || []))
      .catch(console.error);

    fetch('/api/database/tables')
      .then((res) => res.json())
      .then((d) => setDatabaseTables(d.tables || []))
      .catch(console.error);
  }, []);

  // Quick Preset Handlers
  const handleQuickPreset = (preset: 'today' | 'yesterday' | '7days' | 'thisMonth' | 'lastMonth' | 'semester') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === '7days') {
      const prev7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      setStartDate(prev7);
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'lastMonth') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .split('T')[0];
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        .toISOString()
        .split('T')[0];
      setStartDate(firstDayLastMonth);
      setEndDate(lastDayLastMonth);
    } else if (preset === 'semester') {
      const month = today.getMonth();
      const year = today.getFullYear();
      if (month >= 6) {
        setStartDate(`${year}-07-01`);
        setEndDate(`${year}-12-31`);
      } else {
        setStartDate(`${year}-01-01`);
        setEndDate(`${year}-06-30`);
      }
    }
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    const prev7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    setStartDate(prev7);
    setEndDate(today);
    setSelectedClassId('');
    setSelectedGradeLevel('');
    setSelectedTeacherId('');
    setSelectedStatus('');
    setSelectedMethod('');
    setSelectedGender('');
    setSelectedSession('');
    setSelectedEmploymentStatus('');
    setSelectedDay('');
    setSearchQuery('');
    setDhuhaTargetType('ALL');
  };

  // Main Report Fetcher
  const loadReport = async () => {
    if (activeTab === 'SEPARATED_DB') return;

    try {
      setLoading(true);

      if (activeTab === 'STUDENT_DAILY') {
        let url = `/api/reports/students?startDate=${startDate}&endDate=${endDate}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;
        if (selectedMethod) url += `&method=${selectedMethod}`;
        if (selectedGender) url += `&gender=${selectedGender}`;
        if (selectedSession) url += `&session=${selectedSession}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (res.ok) setStudentData(await res.json());
      } else if (activeTab === 'CLASS_SUMMARY') {
        let url = `/api/reports/class-summary?startDate=${startDate}&endDate=${endDate}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
        const res = await fetch(url);
        if (res.ok) setClassSummaryData(await res.json());
      } else if (activeTab === 'TEACHER_DAILY') {
        let url = `/api/reports/teachers?startDate=${startDate}&endDate=${endDate}`;
        if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;
        if (selectedMethod) url += `&method=${selectedMethod}`;
        if (selectedGender) url += `&gender=${selectedGender}`;
        if (selectedEmploymentStatus) url += `&employmentStatus=${selectedEmploymentStatus}`;
        if (selectedSession) url += `&session=${selectedSession}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (res.ok) setTeacherData(await res.json());
      } else if (activeTab === 'DHUHA_PRAYER') {
        let url = `/api/reports/dhuha?startDate=${startDate}&endDate=${endDate}&targetType=${dhuhaTargetType}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;
        if (selectedMethod) url += `&method=${selectedMethod}`;
        if (selectedGender) url += `&gender=${selectedGender}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (res.ok) setDhuhaData(await res.json());
      } else if (activeTab === 'SCHEDULES') {
        let url = `/api/reports/schedules?`;
        if (selectedDay) url += `&day=${selectedDay}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
        if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
        const res = await fetch(url);
        if (res.ok) setScheduleData(await res.json());
      } else if (activeTab === 'JOURNALS') {
        let url = `/api/reports/journals?startDate=${startDate}&endDate=${endDate}`;
        if (selectedClassId) url += `&classId=${selectedClassId}`;
        if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (res.ok) setJournalData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [
    activeTab,
    startDate,
    endDate,
    selectedClassId,
    selectedGradeLevel,
    selectedTeacherId,
    selectedStatus,
    selectedMethod,
    selectedGender,
    selectedSession,
    selectedEmploymentStatus,
    selectedDay,
    dhuhaTargetType,
    searchQuery,
  ]);

  // Export CSV Handler
  const handleExportCsv = () => {
    let url = '';
    if (activeTab === 'STUDENT_DAILY') {
      url = `/api/reports/export/students?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (selectedMethod) url += `&method=${selectedMethod}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      if (selectedSession) url += `&session=${selectedSession}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    } else if (activeTab === 'CLASS_SUMMARY') {
      url = `/api/reports/export/class-summary?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
    } else if (activeTab === 'TEACHER_DAILY') {
      url = `/api/reports/export/teachers?startDate=${startDate}&endDate=${endDate}`;
      if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (selectedMethod) url += `&method=${selectedMethod}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      if (selectedEmploymentStatus) url += `&employmentStatus=${selectedEmploymentStatus}`;
      if (selectedSession) url += `&session=${selectedSession}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    } else if (activeTab === 'DHUHA_PRAYER') {
      url = `/api/reports/export/dhuha?startDate=${startDate}&endDate=${endDate}&targetType=${dhuhaTargetType}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      if (selectedMethod) url += `&method=${selectedMethod}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    } else if (activeTab === 'SCHEDULES') {
      url = `/api/reports/export/schedules?`;
      if (selectedDay) url += `&day=${selectedDay}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedGradeLevel) url += `&gradeLevel=${selectedGradeLevel}`;
      if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
    } else if (activeTab === 'JOURNALS') {
      url = `/api/reports/export/journals?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (selectedTeacherId) url += `&teacherId=${selectedTeacherId}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    if (url) {
      window.location.href = url;
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    if (activeTab === 'STUDENT_DAILY') {
      const total = studentData.length;
      const hadir = studentData.filter((r) => r.status === 'HADIR').length;
      const telat = studentData.filter((r) => r.status === 'TERLAMBAT').length;
      const sakit = studentData.filter((r) => r.status === 'SAKIT').length;
      const izin = studentData.filter((r) => r.status === 'IZIN').length;
      const alpha = studentData.filter((r) => r.status === 'ALPHA').length;
      const presentRate = total > 0 ? Math.round(((hadir + telat) / total) * 100) : 0;
      return { total, hadir, telat, sakit, izin, alpha, presentRate };
    } else if (activeTab === 'CLASS_SUMMARY') {
      const items = classSummaryData.items || [];
      const total = items.length;
      const totalHadir = items.reduce((acc, curr) => acc + curr.hadirCount, 0);
      const totalTelat = items.reduce((acc, curr) => acc + curr.terlambatCount, 0);
      const totalSakit = items.reduce((acc, curr) => acc + curr.sakitCount, 0);
      const totalIzin = items.reduce((acc, curr) => acc + curr.izinCount, 0);
      const totalAlpha = items.reduce((acc, curr) => acc + curr.alphaCount, 0);
      const avgRate =
        total > 0
          ? Math.round(items.reduce((acc, curr) => acc + curr.attendanceRate, 0) / total)
          : 0;
      return { total, hadir: totalHadir, telat: totalTelat, sakit: totalSakit, izin: totalIzin, alpha: totalAlpha, presentRate: avgRate };
    } else if (activeTab === 'TEACHER_DAILY') {
      const total = teacherData.length;
      const hadir = teacherData.filter((r) => r.status === 'HADIR').length;
      const telat = teacherData.filter((r) => r.status === 'TERLAMBAT').length;
      const izin = teacherData.filter((r) => r.status === 'IZIN').length;
      const sakit = teacherData.filter((r) => r.status === 'SAKIT').length;
      const alpha = teacherData.filter((r) => r.status === 'ALPHA').length;
      const presentRate = total > 0 ? Math.round(((hadir + telat) / total) * 100) : 0;
      return { total, hadir, telat, sakit, izin, alpha, presentRate };
    } else if (activeTab === 'DHUHA_PRAYER') {
      const total = dhuhaData.length;
      const sholat = dhuhaData.filter((r) => r.status === 'HADIR').length;
      const haid = dhuhaData.filter((r) => r.status === 'HALANGAN_SYARI').length;
      const belum = dhuhaData.filter((r) => r.status === 'BELUM').length;
      const rate = total > 0 ? Math.round((sholat / total) * 100) : 0;
      return { total, hadir: sholat, telat: 0, sakit: haid, izin: 0, alpha: belum, presentRate: rate };
    } else if (activeTab === 'JOURNALS') {
      const total = journalData.length;
      const terlaksana = journalData.filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT').length;
      const rate = total > 0 ? Math.round((terlaksana / total) * 100) : 0;
      return { total, hadir: terlaksana, telat: 0, sakit: 0, izin: 0, alpha: total - terlaksana, presentRate: rate };
    }
    return { total: 0, hadir: 0, telat: 0, sakit: 0, izin: 0, alpha: 0, presentRate: 0 };
  }, [activeTab, studentData, classSummaryData, teacherData, dhuhaData, journalData]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Pusat Laporan & Rekapitulasi Presensi</span>
                  <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Lengkap & Terpisah
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem pelaporan terpadu absensi harian, rekapitulasi kelas, presensi sholat dhuha, jurnal KBM guru, jadwal, dan basis data terpisah.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions (Print, Export CSV, Reset) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Reset semua filter ke pengaturan default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Cetak Laporan Resmi</span>
            </button>
            {activeTab !== 'SEPARATED_DB' && (
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Excel / CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('STUDENT_DAILY')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'STUDENT_DAILY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="truncate">Absensi Siswa Harian</span>
          </button>

          <button
            onClick={() => setActiveTab('CLASS_SUMMARY')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'CLASS_SUMMARY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="truncate">Rekapitulasi Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('TEACHER_DAILY')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'TEACHER_DAILY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="truncate">Absensi Guru & Staf</span>
          </button>

          <button
            onClick={() => setActiveTab('DHUHA_PRAYER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'DHUHA_PRAYER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="truncate">Presensi Sholat Dhuha</span>
          </button>

          <button
            onClick={() => setActiveTab('JOURNALS')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'JOURNALS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="truncate">Jurnal KBM Guru</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULES')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'SCHEDULES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="truncate">Jadwal Pelajaran</span>
          </button>

          <button
            onClick={() => setActiveTab('SEPARATED_DB')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl font-bold transition ${
              activeTab === 'SEPARATED_DB'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="truncate">Database Terpisah</span>
          </button>
        </div>

        {/* Filter Controls Bar (Visible for attendance tabs) */}
        {activeTab !== 'SEPARATED_DB' && (
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pilihan Periode Waktu Cepat:</span>
              </span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('today')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('yesterday')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  Kemarin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('7days')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('thisMonth')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('lastMonth')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  Bulan Lalu
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('semester')}
                  className="rounded-lg bg-white px-2.5 py-1 font-bold text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                >
                  Semester Berjalan
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {activeTab !== 'SCHEDULES' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {/* Tingkat / Jenjang Filter */}
              {(activeTab === 'STUDENT_DAILY' ||
                activeTab === 'CLASS_SUMMARY' ||
                activeTab === 'DHUHA_PRAYER' ||
                activeTab === 'SCHEDULES') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tingkat Kelas
                  </label>
                  <select
                    value={selectedGradeLevel}
                    onChange={(e) => setSelectedGradeLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Tingkat</option>
                    <option value="VII">Tingkat VII (Kelas 7)</option>
                    <option value="VIII">Tingkat VIII (Kelas 8)</option>
                    <option value="IX">Tingkat IX (Kelas 9)</option>
                  </select>
                </div>
              )}

              {/* Class Filter */}
              {(activeTab === 'STUDENT_DAILY' ||
                activeTab === 'CLASS_SUMMARY' ||
                activeTab === 'DHUHA_PRAYER' ||
                activeTab === 'SCHEDULES' ||
                activeTab === 'JOURNALS') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Rombel / Kelas
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Teacher Filter */}
              {(activeTab === 'TEACHER_DAILY' || activeTab === 'SCHEDULES' || activeTab === 'JOURNALS') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Filter Guru
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Guru & Pegawai</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Kepegawaian (for Teacher) */}
              {activeTab === 'TEACHER_DAILY' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Status Pegawai
                  </label>
                  <select
                    value={selectedEmploymentStatus}
                    onChange={(e) => setSelectedEmploymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Status Pegawai</option>
                    <option value="GURU_TETAP">Guru Tetap Yayasan (GTY)</option>
                    <option value="GURU_HONORER">Guru Tidak Tetap (GTT)</option>
                    <option value="PNS">Guru DPK / PNS</option>
                  </select>
                </div>
              )}

              {/* Dhuha Target Filter */}
              {activeTab === 'DHUHA_PRAYER' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Target Jamaah Dhuha
                  </label>
                  <select
                    value={dhuhaTargetType}
                    onChange={(e) => setDhuhaTargetType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">Semua (Siswa & Guru)</option>
                    <option value="STUDENT">Hanya Siswa</option>
                    <option value="TEACHER">Hanya Guru & Pegawai</option>
                  </select>
                </div>
              )}

              {/* Status Filter */}
              {activeTab !== 'CLASS_SUMMARY' && activeTab !== 'SCHEDULES' && activeTab !== 'JOURNALS' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Status Kehadiran
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Status</option>
                    <option value="HADIR">HADIR (Tepat Waktu)</option>
                    <option value="TERLAMBAT">TERLAMBAT</option>
                    <option value="SAKIT">SAKIT</option>
                    <option value="IZIN">IZIN</option>
                    <option value="ALPHA">ALPHA</option>
                    {activeTab === 'DHUHA_PRAYER' && (
                      <option value="HALANGAN_SYARI">HALANGAN SYAR'I (HAID)</option>
                    )}
                  </select>
                </div>
              )}

              {/* Sesi Scan Filter */}
              {(activeTab === 'STUDENT_DAILY' || activeTab === 'TEACHER_DAILY') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Sesi Presensi
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Sesi</option>
                    <option value="MASUK">Sesi Masuk Pagi</option>
                    <option value="SUDAH_PULANG">Sudah Tap Pulang</option>
                    <option value="BELUM_PULANG">Hadir Tapi Belum Pulang</option>
                  </select>
                </div>
              )}

              {/* Method Filter */}
              {(activeTab === 'STUDENT_DAILY' || activeTab === 'TEACHER_DAILY' || activeTab === 'DHUHA_PRAYER') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Metode Scan
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Metode</option>
                    <option value="NFC">Sensor NFC (Tap)</option>
                    <option value="Hard Scanner">Laser Hard Scanner</option>
                    <option value="Kamera">Kamera Visual (QR)</option>
                    <option value="Manual">Input Manual</option>
                  </select>
                </div>
              )}

              {/* Gender Filter */}
              {(activeTab === 'STUDENT_DAILY' ||
                activeTab === 'TEACHER_DAILY' ||
                activeTab === 'DHUHA_PRAYER') && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Gender</option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              )}

              {/* Day Filter for Schedules */}
              {activeTab === 'SCHEDULES' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Hari
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Semua Hari</option>
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
              )}

              {/* Search text filter */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Pencarian Nama / NIS / NIP / Topik
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama, NIS, NIP, materi..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        {activeTab !== 'SEPARATED_DB' && activeTab !== 'SCHEDULES' && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Kehadiran
              </span>
              <div className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {activeTab === 'DHUHA_PRAYER' ? 'Sudah Sholat' : 'Tepat Waktu'}
              </span>
              <div className="mt-1 font-mono text-xl font-black text-emerald-700 dark:text-emerald-300">
                {stats.hadir}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {activeTab === 'DHUHA_PRAYER' ? "Haid (Syar'i)" : 'Terlambat'}
              </span>
              <div className="mt-1 font-mono text-xl font-black text-amber-700 dark:text-amber-300">
                {activeTab === 'DHUHA_PRAYER' ? stats.sakit : stats.telat}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {activeTab === 'DHUHA_PRAYER' ? 'Belum Sholat' : 'Sakit / Izin'}
              </span>
              <div className="mt-1 font-mono text-xl font-black text-blue-700 dark:text-blue-300">
                {activeTab === 'DHUHA_PRAYER' ? stats.alpha : stats.sakit + stats.izin}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Alpha (Tanpa Ket)
              </span>
              <div className="mt-1 font-mono text-xl font-black text-rose-700 dark:text-rose-300">
                {activeTab === 'DHUHA_PRAYER' ? 0 : stats.alpha}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                % Partisipasi Hadir
              </span>
              <div className="mt-1 font-mono text-xl font-black text-indigo-700 dark:text-indigo-300">
                {stats.presentRate}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Print Header (Visible only when printed) */}
      <div className="hidden print:block text-center mb-6">
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <h1 className="text-xl font-black uppercase tracking-wider">SMP AL HIKAM TERPADU</h1>
          <p className="text-xs text-slate-700">
            NPSN: 20108392 &bull; SK Operasional: 421.3/1209/Disdik/2021 &bull; Akreditasi A (Unggul)
          </p>
          <p className="text-[11px] text-slate-600">
            Jl. Pendidikan No. 45, Kompleks Islamic Center &bull; Email: datasmpalhikam@gmail.com
          </p>
        </div>

        <h2 className="text-base font-black uppercase tracking-wide">
          {activeTab === 'STUDENT_DAILY' && 'LAPORAN REKAPITULASI PRESENSI HARIAN SISWA'}
          {activeTab === 'CLASS_SUMMARY' && 'LAPORAN REKAPITULASI PERSENTASE KEHADIRAN KELAS'}
          {activeTab === 'TEACHER_DAILY' && 'LAPORAN REKAPITULASI KEHADIRAN GURU & PEGAWAI'}
          {activeTab === 'DHUHA_PRAYER' && 'LAPORAN REKAPITULASI PRESENSI SHOLAT DHUHA TERPADU'}
          {activeTab === 'JOURNALS' && 'LAPORAN JURNAL & KBM MENGAJAR GURU'}
          {activeTab === 'SCHEDULES' && 'LAPORAN JADWAL PELAJARAN SEKOLAH'}
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Periode Tanggal: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3" />
            <span className="text-xs font-bold">Menyiapkan Rekapan Laporan Terpadu...</span>
          </div>
        ) : (
          <>
            {/* 1. Laporan Absensi Siswa Harian */}
            {activeTab === 'STUDENT_DAILY' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Tanggal</th>
                      <th className="px-4 py-3 font-bold">NIS / NISN</th>
                      <th className="px-4 py-3 font-bold">Nama Siswa</th>
                      <th className="px-4 py-3 font-bold">L/P</th>
                      <th className="px-4 py-3 font-bold">Kelas</th>
                      <th className="px-4 py-3 font-bold text-center">Status</th>
                      <th className="px-4 py-3 font-bold">Jam Masuk</th>
                      <th className="px-4 py-3 font-bold">Jam Pulang</th>
                      <th className="px-4 py-3 font-bold">Metode Scan</th>
                      <th className="px-4 py-3 font-bold">Catatan / Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          Tidak ada rekaman data presensi siswa yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      studentData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-mono font-medium">{row.date}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">
                            {row.studentNis}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            {row.studentName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.gender}</td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.className}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {row.checkInTime}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.checkOutTime}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {row.method === 'NFC' ? (
                                <Radio className="w-3 h-3 text-indigo-600" />
                              ) : row.method?.includes('Laser') ? (
                                <Barcode className="w-3 h-3 text-emerald-600" />
                              ) : row.method === 'Kamera' ? (
                                <Camera className="w-3 h-3 text-blue-600" />
                              ) : null}
                              {row.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">
                            {row.note}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Laporan Rekapitulasi Kelas */}
            {activeTab === 'CLASS_SUMMARY' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">NIS</th>
                      <th className="px-4 py-3 font-bold">Nama Siswa</th>
                      <th className="px-4 py-3 font-bold">Kelas</th>
                      <th className="px-4 py-3 font-bold text-center">Hari Efektif</th>
                      <th className="px-4 py-3 font-bold text-center text-emerald-600">Hadir</th>
                      <th className="px-4 py-3 font-bold text-center text-amber-600">Terlambat</th>
                      <th className="px-4 py-3 font-bold text-center text-blue-600">Sakit</th>
                      <th className="px-4 py-3 font-bold text-center text-indigo-600">Izin</th>
                      <th className="px-4 py-3 font-bold text-center text-rose-600">Alpha</th>
                      <th className="px-4 py-3 font-bold text-center">% Partisipasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classSummaryData.items?.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          Tidak ada data siswa untuk kelas / periode ini.
                        </td>
                      </tr>
                    ) : (
                      classSummaryData.items.map((row) => (
                        <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.nis}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.className}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {row.totalDays}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-600">
                            {row.hadirCount}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-amber-600">
                            {row.terlambatCount}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-blue-600">
                            {row.sakitCount}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-600">
                            {row.izinCount}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-rose-600">
                            {row.alphaCount}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-black ${
                                row.attendanceRate >= 90
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : row.attendanceRate >= 75
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {row.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Laporan Absensi Guru & Pegawai */}
            {activeTab === 'TEACHER_DAILY' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Tanggal</th>
                      <th className="px-4 py-3 font-bold">NIP</th>
                      <th className="px-4 py-3 font-bold">Nama Guru</th>
                      <th className="px-4 py-3 font-bold">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-bold">Status Pegawai</th>
                      <th className="px-4 py-3 font-bold">Jenis Tugas</th>
                      <th className="px-4 py-3 font-bold">Jadwal</th>
                      <th className="px-4 py-3 font-bold">Jam Masuk</th>
                      <th className="px-4 py-3 font-bold">Jam Pulang</th>
                      <th className="px-4 py-3 font-bold text-center">Status</th>
                      <th className="px-4 py-3 font-bold">Metode Scan</th>
                      <th className="px-4 py-3 font-bold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teacherData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-400">
                          Tidak ada data absensi guru pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      teacherData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-mono font-medium">{row.date}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.teacherNip}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            {row.teacherName}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {row.subject}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                            {row.employmentStatus === 'GURU_TETAP' ? 'GTY' : row.employmentStatus === 'GURU_HONORER' ? 'GTT' : row.employmentStatus}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.type}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.scheduled}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">
                            {row.actualTime}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                            {row.checkOutTime}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {row.method === 'NFC' ? (
                                <Radio className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <Barcode className="w-3 h-3 text-emerald-600" />
                              )}
                              {row.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 max-w-[180px] truncate">
                            {row.note}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Laporan Presensi Sholat Dhuha */}
            {activeTab === 'DHUHA_PRAYER' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Tanggal</th>
                      <th className="px-4 py-3 font-bold">Tipe Peserta</th>
                      <th className="px-4 py-3 font-bold">NIS / NIP</th>
                      <th className="px-4 py-3 font-bold">Nama Lengkap</th>
                      <th className="px-4 py-3 font-bold">Kelas / Mapel</th>
                      <th className="px-4 py-3 font-bold">Waktu Sholat</th>
                      <th className="px-4 py-3 font-bold text-center">Status Jamaah</th>
                      <th className="px-4 py-3 font-bold">Metode Pindai</th>
                      <th className="px-4 py-3 font-bold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dhuhaData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          Tidak ada data presensi sholat dhuha pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      dhuhaData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-mono font-medium">{row.date}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                row.targetType === 'STUDENT'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {row.targetType === 'STUDENT' ? 'Siswa' : 'Guru / Staf'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.identifier}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                            {row.classOrSubject}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">
                            {row.time} WIB
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                                row.status === 'HADIR'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : row.status === 'HALANGAN_SYARI'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {row.status === 'HADIR'
                                ? 'Sudah Sholat'
                                : row.status === 'HALANGAN_SYARI'
                                ? 'Halangan (Haid)'
                                : 'Belum Sholat'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                              {row.method === 'NFC' ? (
                                <Radio className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <Barcode className="w-3 h-3 text-emerald-600" />
                              )}
                              {row.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">
                            {row.note}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. Laporan Jurnal & KBM Mengajar Guru */}
            {activeTab === 'JOURNALS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Tanggal</th>
                      <th className="px-4 py-3 font-bold">Guru Pengampu</th>
                      <th className="px-4 py-3 font-bold">Rombel Kelas</th>
                      <th className="px-4 py-3 font-bold">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-bold">Jadwal Jam</th>
                      <th className="px-4 py-3 font-bold">Jam Masuk</th>
                      <th className="px-4 py-3 font-bold">Jam Selesai</th>
                      <th className="px-4 py-3 font-bold text-center">Status</th>
                      <th className="px-4 py-3 font-bold">Topik / Jurnal Materi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {journalData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          Tidak ada rekaman jurnal mengajar pada periode / filter ini.
                        </td>
                      </tr>
                    ) : (
                      journalData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-mono font-medium">{row.date}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            {row.teacherName}
                            <div className="font-mono text-[10px] text-slate-400">{row.teacherNip}</div>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.className}
                          </td>
                          <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                            {row.subjectName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.scheduledTime}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">
                            {row.actualInTime}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                            {row.actualOutTime}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 max-w-[250px] truncate">
                            {row.topic}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Laporan Jadwal Pelajaran */}
            {activeTab === 'SCHEDULES' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Hari</th>
                      <th className="px-4 py-3 font-bold">Jam Pelajaran</th>
                      <th className="px-4 py-3 font-bold">Kelas</th>
                      <th className="px-4 py-3 font-bold">Mata Pelajaran</th>
                      <th className="px-4 py-3 font-bold">Guru Pengampu</th>
                      <th className="px-4 py-3 font-bold">Ruang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scheduleData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Tidak ada jadwal pelajaran yang cocok.
                        </td>
                      </tr>
                    ) : (
                      scheduleData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 font-bold text-indigo-700 dark:text-indigo-400">
                            {row.day}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                            {row.time}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                            Kelas {row.className}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {row.subjectName} ({row.subjectCode})
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {row.teacherName}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{row.room}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. Ekspor Database Terpisah */}
            {activeTab === 'SEPARATED_DB' && (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="max-w-2xl">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-amber-600" />
                      <span>Penyimpanan Basis Data Terpisah (Modular Multi-File)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Seluruh basis data siswa, guru, jadwal mengajar, dan riwayat absensi disimpan dalam berkas terpisah di server untuk mempermudah backup berkala, rekapan laporan Dapodik / Kemenag, dan auditing data independen.
                    </p>
                  </div>
                  <button
                    onClick={() => openViewer('siakad-db')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-xs font-bold text-white hover:bg-amber-500 shadow-sm transition shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka Database Utama (siakad-db.json)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {databaseTables.map((tbl) => (
                    <div
                      key={tbl.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {tbl.file}
                          </span>
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {tbl.total} Record
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                          {tbl.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">{tbl.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Format: JSON</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewer(tbl.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka JSON</span>
                          </button>
                          <a
                            href={`/api/database/download/${tbl.id}`}
                            download
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interactive JSON & Table Database Viewer Modal */}
      <DatabaseViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialTarget={viewerTarget}
        separatedFiles={databaseTables}
      />

      {/* Official Signature Area for Printing */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-12 pt-4 text-xs text-center">
        <div>
          <p className="text-slate-600">Mengetahui,</p>
          <p className="font-bold text-slate-900">Kepala Sekolah SMP Al Hikam</p>
          <div className="h-20" />
          <p className="font-bold underline text-slate-900">Dr. H. Muhammad Ihsan, M.Pd.</p>
          <p className="text-slate-500 font-mono">NIP. 19750812 200003 1 004</p>
        </div>

        <div>
          <p className="text-slate-600">
            Dicetak pada tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
          <p className="font-bold text-slate-900">Wali Kelas / Koordinator Presensi</p>
          <div className="h-20" />
          <p className="font-bold underline text-slate-900">
            {currentSession?.user?.name || (currentSession as any)?.name || 'Petugas Administrasi'}
          </p>
          <p className="text-slate-500 font-mono">Petugas SIAKAD Resmi</p>
        </div>
      </div>
    </div>
  );
};
