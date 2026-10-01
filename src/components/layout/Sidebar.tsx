import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  CalendarDays,
  FileEdit,
  BarChart3,
  GraduationCap,
  Briefcase,
  Building,
  BookOpen,
  RefreshCw,
  Settings,
  Calendar,
  Lock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  QrCode,
  Database,
  Layers,
  CreditCard,
  Sun,
  Shield,
} from 'lucide-react';
import type { UserSession, RoleCode, RoleAccessRule } from '../../types/index.js';

export type NavTab =
  | 'landing'
  | 'dashboard'
  | 'scan-kiosk'
  | 'attendance-student'
  | 'attendance-teacher'
  | 'attendance-dhuha'
  | 'id-cards'
  | 'schedules'
  | 'corrections'
  | 'holidays'
  | 'reports'
  | 'teachers'
  | 'students'
  | 'classes'
  | 'subjects'
  | 'sync'
  | 'database'
  | 'settings'
  // Planned modules
  | 'mod-kesiswaan'
  | 'mod-akademik'
  | 'mod-kepegawaian'
  | 'mod-keuangan'
  | 'mod-sarpras'
  | 'mod-perpustakaan'
  | 'mod-ppdb'
  | 'mod-surat'
  | 'mod-komunikasi';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  currentSession?: UserSession | null;
}

const DEFAULT_RULES: Record<string, RoleCode[]> = {
  dashboard: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'BENDAHARA', 'TU', 'SISWA'],
  teachers: ['SUPER_ADMIN', 'TU'],
  students: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'TU'],
  classes: ['SUPER_ADMIN', 'TU'],
  subjects: ['SUPER_ADMIN', 'TU', 'GURU', 'WALI_KELAS'],
  schedules: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU', 'SISWA'],
  holidays: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU', 'SISWA'],
  'scan-kiosk': ['SUPER_ADMIN', 'TU', 'GURU'],
  'attendance-student': ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'],
  'attendance-teacher': ['SUPER_ADMIN', 'TU', 'GURU'],
  'attendance-dhuha': ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'],
  corrections: ['SUPER_ADMIN', 'TU', 'GURU'],
  'id-cards': ['SUPER_ADMIN', 'TU'],
  reports: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'BENDAHARA', 'TU'],
  'mod-keuangan': ['SUPER_ADMIN', 'BENDAHARA', 'TU'],
  'mod-kesiswaan': ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS'],
  database: ['SUPER_ADMIN'],
  sync: ['SUPER_ADMIN', 'TU'],
  settings: ['SUPER_ADMIN'],
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  currentSession,
}) => {
  // Collapsible groups state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    presensi: false,
    master: false,
    jadwal: false,
    sistem: false,
    modulLanjutan: false,
  });

  const [accessRules, setAccessRules] = useState<RoleAccessRule[]>([]);

  useEffect(() => {
    fetch('/api/roles/access')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccessRules(data);
        }
      })
      .catch(() => {});
  }, [currentTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId as NavTab);
    onClose();
  };

  const isTabActive = (tabId: string) => currentTab === tabId;

  // Determine user roles
  const userRoles: RoleCode[] = (currentSession?.roles || ['SUPER_ADMIN']) as RoleCode[];
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // Check if current user has permission for tabId
  const canAccess = (tabId: string): boolean => {
    if (!currentSession) return true;
    if (isSuperAdmin) return true;

    const rule = accessRules.find((r) => r.tabId === tabId);
    if (rule) {
      return rule.allowedRoles.some((r) => userRoles.includes(r));
    }

    const defaultList = DEFAULT_RULES[tabId];
    if (defaultList) {
      return defaultList.some((r) => userRoles.includes(r));
    }

    return true;
  };

  // Get active role badge display
  const primaryRole = userRoles[0] || 'SUPER_ADMIN';
  const getRoleBadge = (role: RoleCode) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Admin Super', color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' };
      case 'GURU_BK':
        return { label: 'Guru BK', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' };
      case 'GURU':
        return { label: 'Guru', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' };
      case 'WALI_KELAS':
        return { label: 'Wali Kelas', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800' };
      case 'BENDAHARA':
        return { label: 'Bendahara', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' };
      case 'TU':
        return { label: 'TU', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' };
      case 'SISWA':
        return { label: 'Siswa', color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(primaryRole);

  // Visibility flags for submenus
  const hasPresensiAccess =
    canAccess('attendance-student') ||
    canAccess('attendance-teacher') ||
    canAccess('attendance-dhuha') ||
    canAccess('corrections');

  const hasMasterAccess =
    canAccess('students') ||
    canAccess('teachers') ||
    canAccess('classes') ||
    canAccess('subjects') ||
    canAccess('id-cards');

  const hasJadwalAccess = canAccess('schedules') || canAccess('holidays');

  const hasSistemAccess =
    canAccess('database') || canAccess('sync') || canAccess('settings');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Title Header */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-500/20">
            ST
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
              SIAKAD TERPADU
            </h1>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Sistem Informasi Sekolah
            </span>
          </div>
        </div>

        {/* Current Active Role Pill */}
        {currentSession && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Akses Role:</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}
            >
              {roleInfo.label}
            </span>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {/* 1. Menu Utama Tunggal: Dashboard & Kiosk */}
          <div className="space-y-1">
            {canAccess('dashboard') && (
              <button
                onClick={() => handleItemClick('dashboard')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isTabActive('dashboard')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={`w-4 h-4 ${isTabActive('dashboard') ? 'text-white' : 'text-slate-500'}`} />
                  <span>Dashboard Utama</span>
                </div>
              </button>
            )}

            {canAccess('scan-kiosk') && (
              <button
                onClick={() => handleItemClick('scan-kiosk')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isTabActive('scan-kiosk')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className={`w-4 h-4 ${isTabActive('scan-kiosk') ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>Mesin Scan Absensi</span>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isTabActive('scan-kiosk') ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                  Gate
                </span>
              </button>
            )}
          </div>

          {/* 2. SUBMENU: MENU PRESENSI / ABSENSI */}
          {hasPresensiAccess && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => toggleGroup('presensi')}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Menu Absensi</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups.presensi ? 'rotate-0' : '-rotate-90 text-slate-400'
                  }`}
                />
              </button>

              {openGroups.presensi && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-blue-100 dark:border-slate-800 ml-3">
                  {canAccess('attendance-student') && (
                    <button
                      onClick={() => handleItemClick('attendance-student')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('attendance-student')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Absensi Siswa</span>
                      </div>
                    </button>
                  )}

                  {canAccess('attendance-teacher') && (
                    <button
                      onClick={() => handleItemClick('attendance-teacher')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('attendance-teacher')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Absensi Guru & Piket</span>
                      </div>
                    </button>
                  )}

                  {canAccess('attendance-dhuha') && (
                    <button
                      onClick={() => handleItemClick('attendance-dhuha')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('attendance-dhuha')
                          ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Absensi Sholat Dhuha</span>
                      </div>
                      <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                        Scanner
                      </span>
                    </button>
                  )}

                  {canAccess('corrections') && (
                    <button
                      onClick={() => handleItemClick('corrections')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('corrections')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Koreksi Absensi</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. SUBMENU: DATA MASTER */}
          {hasMasterAccess && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => toggleGroup('master')}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Data Master</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups.master ? 'rotate-0' : '-rotate-90 text-slate-400'
                  }`}
                />
              </button>

              {openGroups.master && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-indigo-100 dark:border-slate-800 ml-3">
                  {canAccess('students') && (
                    <button
                      onClick={() => handleItemClick('students')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('students')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>Data Siswa</span>
                      </div>
                    </button>
                  )}

                  {canAccess('teachers') && (
                    <button
                      onClick={() => handleItemClick('teachers')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('teachers')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Data Guru & Pegawai</span>
                      </div>
                    </button>
                  )}

                  {canAccess('classes') && (
                    <button
                      onClick={() => handleItemClick('classes')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('classes')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Data Kelas (Rombel)</span>
                      </div>
                    </button>
                  )}

                  {canAccess('subjects') && (
                    <button
                      onClick={() => handleItemClick('subjects')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('subjects')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mata Pelajaran & JP</span>
                      </div>
                    </button>
                  )}

                  {canAccess('id-cards') && (
                    <button
                      onClick={() => handleItemClick('id-cards')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('id-cards')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Cetak Kartu ID (QR)</span>
                      </div>
                      <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                        Custom
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. SUBMENU: JADWAL & KALENDER */}
          {hasJadwalAccess && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => toggleGroup('jadwal')}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Jadwal & Kalender</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups.jadwal ? 'rotate-0' : '-rotate-90 text-slate-400'
                  }`}
                />
              </button>

              {openGroups.jadwal && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-amber-100 dark:border-slate-800 ml-3">
                  {canAccess('schedules') && (
                    <button
                      onClick={() => handleItemClick('schedules')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('schedules')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>Jadwal Mengajar & Piket</span>
                      </div>
                    </button>
                  )}

                  {canAccess('holidays') && (
                    <button
                      onClick={() => handleItemClick('holidays')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('holidays')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hari Libur Sekolah</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. MENU TUNGGAL: LAPORAN & EKSPOR */}
          {canAccess('reports') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => handleItemClick('reports')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isTabActive('reports')
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-4 h-4 ${isTabActive('reports') ? 'text-white' : 'text-slate-500'}`} />
                  <span>Laporan & Rekap</span>
                </div>
              </button>
            </div>
          )}

          {/* 6. SUBMENU: SISTEM & PENGELOLAAN DATABASE */}
          {hasSistemAccess && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => toggleGroup('sistem')}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Sistem & Hak Akses</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups.sistem ? 'rotate-0' : '-rotate-90 text-slate-400'
                  }`}
                />
              </button>

              {openGroups.sistem && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-purple-100 dark:border-slate-800 ml-3">
                  {canAccess('database') && (
                    <button
                      onClick={() => handleItemClick('database')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('database')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kelola Database & Backup</span>
                      </div>
                    </button>
                  )}

                  {canAccess('sync') && (
                    <button
                      onClick={() => handleItemClick('sync')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('sync')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sinkronisasi Offline Sync</span>
                      </div>
                    </button>
                  )}

                  {canAccess('settings') && (
                    <button
                      onClick={() => handleItemClick('settings')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isTabActive('settings')
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold">Pengaturan & Hak Akses</span>
                      </div>
                      <span className="rounded bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">
                        7 Role
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 7. SUBMENU: MODUL TERENCANA */}
          {(canAccess('mod-kesiswaan') || canAccess('mod-keuangan') || isSuperAdmin) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => toggleGroup('modulLanjutan')}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modul Terencana</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups.modulLanjutan ? 'rotate-0' : '-rotate-90 text-slate-400'
                  }`}
                />
              </button>

              {openGroups.modulLanjutan && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-amber-100 dark:border-slate-800 ml-3">
                  {[
                    { id: 'mod-kesiswaan', label: 'Kesiswaan & BK' },
                    { id: 'mod-keuangan', label: 'Keuangan & SPP' },
                    { id: 'mod-akademik', label: 'Akademik (Nilai & Rapor)' },
                    { id: 'mod-kepegawaian', label: 'Kepegawaian & Cuti' },
                    { id: 'mod-sarpras', label: 'Sarana & Prasarana' },
                    { id: 'mod-perpustakaan', label: 'Perpustakaan Digital' },
                    { id: 'mod-ppdb', label: 'PPDB Online' },
                    { id: 'mod-surat', label: 'Surat & Disposisi' },
                    { id: 'mod-komunikasi', label: 'Pengumuman / Komunikasi' },
                  ]
                    .filter((item) => canAccess(item.id))
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 transition"
                      >
                        <span className="truncate">{item.label}</span>
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Link Web Sekolah */}
        <div className="border-t border-slate-100 p-3.5 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onSelectTab('landing' as NavTab)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <span>← Website Utama Sekolah</span>
          </button>
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 text-center">
            Database Terhubung: <span className="font-mono text-blue-600 dark:text-blue-400">data/siakad-db.json</span>
          </div>
        </div>
      </aside>
    </>
  );
};
