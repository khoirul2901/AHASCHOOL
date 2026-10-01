import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  Key,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  RotateCcw,
  Save,
  Layers,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { ModulesView } from '../modules/ModulesView.js';
import { AuditLogsView } from '../audit/AuditLogsView.js';
import type {
  RoleCode,
  RoleAccessRule,
  UserAccountItem,
  UserSession,
  TeacherItem,
  StudentItem,
} from '../../types/index.js';

interface SettingsViewProps {
  currentSession: UserSession | null;
}

export const OFFICIAL_ROLES: {
  code: RoleCode;
  name: string;
  badgeName: string;
  description: string;
  badgeClass: string;
  bgLight: string;
}[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Admin Super',
    badgeName: 'Admin Super',
    description: 'Akses penuh ke seluruh menu, pengaturan akun, database, dan hak akses sistem.',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    bgLight: 'border-l-4 border-l-rose-500',
  },
  {
    code: 'GURU_BK',
    name: 'Guru BK',
    badgeName: 'Guru BK',
    description: 'Bimbingan Konseling, monitoring kedisiplinan siswa, catatan absensi, dan pembinaan.',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    bgLight: 'border-l-4 border-l-emerald-500',
  },
  {
    code: 'GURU',
    name: 'Guru',
    badgeName: 'Guru',
    description: 'Jadwal mengajar, presensi kelas, presensi piket, dan rekap KBM harian.',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    bgLight: 'border-l-4 border-l-blue-500',
  },
  {
    code: 'WALI_KELAS',
    name: 'Wali Kelas',
    badgeName: 'Wali Kelas',
    description: 'Monitoring siswa kelas binaan, absensi harian kelas, rekap kehadiran, dan komunikasi wali.',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    bgLight: 'border-l-4 border-l-teal-500',
  },
  {
    code: 'BENDAHARA',
    name: 'Bendahara',
    badgeName: 'Bendahara',
    description: 'Pengelolaan keuangan sekolah, administrasi SPP, penerimaan, dan rekap pembayaran.',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    bgLight: 'border-l-4 border-l-amber-500',
  },
  {
    code: 'TU',
    name: 'TU (Tata Usaha)',
    badgeName: 'Tata Usaha',
    description: 'Administrasi kesiswaan, kepegawaian, cetak kartu ID/NFC, dan persuratan dinas.',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    bgLight: 'border-l-4 border-l-indigo-500',
  },
  {
    code: 'SISWA',
    name: 'Siswa',
    badgeName: 'Siswa',
    description: 'Melihat jadwal pelajaran pribadi, rekap kehadiran mandiri, dan pengumuman sekolah.',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    bgLight: 'border-l-4 border-l-cyan-500',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ currentSession }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'access' | 'modules' | 'audit'>('users');

  // State Users Management
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modals for Users
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccountItem | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState<UserAccountItem | null>(null);
  const [quickNewPassword, setQuickNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // User Form
  const [userForm, setUserForm] = useState<{
    username: string;
    fullName: string;
    password: string;
    roleCode: RoleCode;
    email: string;
    phone: string;
    teacherId: string;
    studentId: string;
    active: boolean;
  }>({
    username: '',
    fullName: '',
    password: '',
    roleCode: 'GURU',
    email: '',
    phone: '',
    teacherId: '',
    studentId: '',
    active: true,
  });

  // State Role Access Rules
  const [accessRules, setAccessRules] = useState<RoleAccessRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesModified, setRulesModified] = useState(false);

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // Load Users, Teachers, Students
  const loadUsersData = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }

      // Load teachers for linking
      const resTch = await fetch('/api/teachers?limit=100');
      if (resTch.ok) {
        const dataTch = await resTch.json();
        setTeachers(dataTch.items || []);
      }

      // Load students for linking
      const resStd = await fetch('/api/students?limit=100');
      if (resStd.ok) {
        const dataStd = await resStd.json();
        setStudents(dataStd.items || []);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Role Access Matrix
  const loadAccessRules = async () => {
    try {
      setLoadingRules(true);
      const res = await fetch('/api/roles/access');
      if (res.ok) {
        const data = await res.json();
        setAccessRules(data || []);
        setRulesModified(false);
      }
    } catch (err: any) {
      console.error('Error loading role access rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    loadUsersData();
    loadAccessRules();
  }, []);

  // Open Add User
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      fullName: '',
      password: '',
      roleCode: 'GURU',
      email: '',
      phone: '',
      teacherId: '',
      studentId: '',
      active: true,
    });
    setShowUserModal(true);
  };

  // Open Edit User
  const handleOpenEditUser = (u: UserAccountItem) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      password: '',
      roleCode: u.roleCode,
      email: u.email || '',
      phone: '',
      teacherId: u.teacherId || '',
      studentId: u.studentId || '',
      active: u.active,
    });
    setShowUserModal(true);
  };

  // Open Quick Password Reset Modal
  const handleOpenPasswordModal = (u: UserAccountItem) => {
    setTargetPasswordUser(u);
    setQuickNewPassword('');
    setShowPasswordText(false);
    setShowPasswordModal(true);
  };

  // Auto-fill from Teacher Selection
  const handleTeacherSelect = (teacherId: string) => {
    setUserForm((prev) => {
      const tch = teachers.find((t) => t.id === teacherId);
      if (!tch) return { ...prev, teacherId };
      return {
        ...prev,
        teacherId,
        fullName: tch.name || prev.fullName,
        email: tch.email || prev.email,
        phone: tch.phone || prev.phone,
      };
    });
  };

  // Auto-fill from Student Selection
  const handleStudentSelect = (studentId: string) => {
    setUserForm((prev) => {
      const std = students.find((s) => s.id === studentId);
      if (!std) return { ...prev, studentId };
      return {
        ...prev,
        studentId,
        fullName: std.name || prev.fullName,
        username: prev.username || (std.nis ? `siswa_${std.nis}` : ''),
      };
    });
  };

  // Submit User Create / Update
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userForm.username.trim()) {
        showAlert('error', 'Username wajib diisi.');
        return;
      }
      if (!editingUser && (!userForm.password || userForm.password.length < 5)) {
        showAlert('error', 'Password minimal 5 karakter untuk akun baru.');
        return;
      }

      const payload: any = {
        username: userForm.username.trim().toLowerCase(),
        fullName: userForm.fullName.trim(),
        roleCode: userForm.roleCode,
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        teacherId: userForm.teacherId || undefined,
        studentId: userForm.studentId || undefined,
        active: userForm.active,
      };

      if (userForm.password && userForm.password.trim() !== '') {
        payload.password = userForm.password.trim();
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan akun pengguna.');
      }

      showAlert(
        'success',
        editingUser
          ? `Akun ${payload.username} berhasil diperbarui.`
          : `Akun baru ${payload.username} berhasil dibuat.`
      );
      setShowUserModal(false);
      loadUsersData();
    } catch (err: any) {
      showAlert('error', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Submit Quick Password Reset
  const handleSaveQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPasswordUser) return;
    if (!quickNewPassword || quickNewPassword.length < 5) {
      showAlert('error', 'Password baru minimal 5 karakter.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${targetPasswordUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify({ password: quickNewPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset kata sandi.');
      }

      showAlert('success', `Password akun ${targetPasswordUser.username} berhasil diubah!`);
      setShowPasswordModal(false);
      loadUsersData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (u: UserAccountItem) => {
    if (u.username.toLowerCase() === 'admin') {
      showAlert('error', 'Akun Admin Utama tidak boleh dihapus demi keamanan sistem.');
      return;
    }

    if (
      !confirm(
        `Nonaktifkan dan hapus akun pengguna "${u.username}" (${u.fullName})?\nPengguna ini tidak akan bisa login lagi.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus akun pengguna.');
      }

      showAlert('success', `Akun ${u.username} berhasil dinonaktifkan/dihapus.`);
      loadUsersData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  // Toggle Single Permission in Matrix
  const handleToggleAccess = (tabId: string, roleCode: RoleCode) => {
    // Admin Super should always have full access to guarantee system recovery
    if (roleCode === 'SUPER_ADMIN') {
      showAlert('error', 'Admin Super wajib memiliki akses penuh ke seluruh menu sistem.');
      return;
    }

    setAccessRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.tabId !== tabId) return rule;

        const hasRole = rule.allowedRoles.includes(roleCode);
        const newRoles = hasRole
          ? rule.allowedRoles.filter((r) => r !== roleCode)
          : [...rule.allowedRoles, roleCode];

        return {
          ...rule,
          allowedRoles: newRoles,
        };
      })
    );
    setRulesModified(true);
  };

  // Toggle All Roles for a specific Tab
  const handleToggleAllForTab = (tabId: string) => {
    setAccessRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.tabId !== tabId) return rule;

        const nonSuperRoles = OFFICIAL_ROLES.filter((r) => r.code !== 'SUPER_ADMIN').map((r) => r.code);
        const allIncluded = nonSuperRoles.every((r) => rule.allowedRoles.includes(r));

        return {
          ...rule,
          allowedRoles: allIncluded
            ? ['SUPER_ADMIN']
            : ['SUPER_ADMIN', ...nonSuperRoles],
        };
      })
    );
    setRulesModified(true);
  };

  // Save Role Access Rules
  const handleSaveAccessRules = async () => {
    try {
      setSavingRules(true);
      const res = await fetch('/api/roles/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
        body: JSON.stringify(accessRules),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan matriks hak akses.');
      }

      setRulesModified(false);
      showAlert('success', 'Konfigurasi hak akses menu untuk 7 role berhasil disimpan & aktif!');
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setSavingRules(false);
    }
  };

  // Reset Role Access Rules
  const handleResetAccessRules = async () => {
    if (
      !confirm(
        'Kembalikan hak akses seluruh menu ke standar default rekomendasi sekolah?\nPerubahan khusus akan diganti.'
      )
    ) {
      return;
    }

    try {
      setSavingRules(true);
      const res = await fetch('/api/roles/access/reset', {
        method: 'POST',
        headers: {
          'x-user-id': currentSession?.id || currentSession?.user?.id || '',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset hak akses.');
      }

      setAccessRules(data.rules || []);
      setRulesModified(false);
      showAlert('success', 'Hak akses berhasil dikembalikan ke standar rekomendasi sekolah!');
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setSavingRules(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === 'ALL' || u.roleCode === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Alert Notification Toast */}
      {alertMsg && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs font-semibold shadow-md transition-all ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Pengaturan Sistem, Pengguna & Hak Akses Role</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola akun login (username & password) serta matriks hak akses menu untuk 7 peran (role) aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>7 Role Akses Terpadu</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengelolaan Akun & Password</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'access'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Hak Akses Menu (Akses yang Dibuka)</span>
            {rulesModified && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Modul Fitur Ekstensi</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Log Audit Aktivitas</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PENGELOLAAN AKUN & PASSWORD                       */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick 7 Roles Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {OFFICIAL_ROLES.map((r) => {
              const count = users.filter((u) => u.roleCode === r.code).length;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => setFilterRole(filterRole === r.code ? 'ALL' : r.code)}
                  className={`p-3 rounded-xl border text-left transition ${
                    filterRole === r.code
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Role
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {r.name}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                      {count} akun
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        r.code === 'SUPER_ADMIN'
                          ? 'bg-rose-500'
                          : r.code === 'GURU_BK'
                          ? 'bg-emerald-500'
                          : r.code === 'GURU'
                          ? 'bg-blue-500'
                          : r.code === 'WALI_KELAS'
                          ? 'bg-teal-500'
                          : r.code === 'BENDAHARA'
                          ? 'bg-amber-500'
                          : r.code === 'TU'
                          ? 'bg-indigo-500'
                          : 'bg-cyan-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table Container & Filter Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari username, nama pengguna, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Semua 7 Role ({users.length})</option>
                  {OFFICIAL_ROLES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddUser}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Pengguna</span>
              </button>
            </div>

            {loadingUsers ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Memuat data akun pengguna...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Tidak ada akun pengguna yang sesuai kriteria pencarian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Username Login</th>
                      <th className="px-4 py-3 font-semibold">Nama Lengkap & Kontak</th>
                      <th className="px-4 py-3 font-semibold">Role Akses (Peran)</th>
                      <th className="px-4 py-3 font-semibold">Tautan Guru / Siswa</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Kelola & Sandi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => {
                      const roleConfig =
                        OFFICIAL_ROLES.find((r) => r.code === u.roleCode) || OFFICIAL_ROLES[2];
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                  {u.username}
                                </div>
                                <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {u.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email || '-'}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleConfig.badgeClass}`}
                            >
                              <Shield className="w-3 h-3" />
                              {roleConfig.name}
                            </span>
                            <div className="text-[10px] text-slate-400 max-w-[200px] truncate mt-0.5">
                              {roleConfig.description}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {u.teacherName ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <Briefcase className="w-3 h-3" />
                                <span>Guru: {u.teacherName}</span>
                              </div>
                            ) : u.studentName ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                <GraduationCap className="w-3 h-3" />
                                <span>Siswa: {u.studentName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Akun Mandiri</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {u.active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <UserCheck className="w-3 h-3" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <UserX className="w-3 h-3" />
                                <span>Nonaktif</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(u)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold transition"
                                title="Reset Kata Sandi Cepat"
                              >
                                <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Ganti Sandi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Edit Profil Akun & Role"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {u.username.toLowerCase() !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="Nonaktifkan / Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

      {/* ========================================================= */}
      {/* TAB 2: MATRIKS HAK AKSES MENU (AKSES YANG DIBUKA)         */}
      {/* ========================================================= */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Action Bar & Info */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Konfigurasi Matriks Hak Akses Menu untuk 7 Role Sistem</span>
                </h3>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
                  Tentukan halaman atau menu mana saja yang diizinkan untuk diakses oleh masing-masing peran pengguna sekolah.
                  Perubahan akan langsung mengontrol menu di Sidebar aplikasi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetAccessRules}
                  disabled={savingRules}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Standar Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAccessRules}
                  disabled={savingRules}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                    rulesModified
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingRules ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {loadingRules ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Memuat konfigurasi hak akses...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 font-bold min-w-[220px]">
                        Menu / Fitur Aplikasi
                      </th>
                      <th className="px-3 py-3.5 font-bold text-slate-500 min-w-[100px]">
                        Kategori
                      </th>
                      {OFFICIAL_ROLES.map((role) => (
                        <th
                          key={role.code}
                          className="px-2.5 py-3.5 font-bold text-center min-w-[105px]"
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-black text-slate-900 dark:text-white">
                              {role.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 lowercase">
                              {role.code === 'SUPER_ADMIN' ? '(Akses Penuh)' : role.badgeName}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accessRules.map((rule) => (
                      <tr
                        key={rule.tabId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {rule.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            tab: {rule.tabId}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {rule.category || 'Umum'}
                          </span>
                        </td>

                        {OFFICIAL_ROLES.map((role) => {
                          const isAllowed = rule.allowedRoles.includes(role.code);
                          const isSuperAdmin = role.code === 'SUPER_ADMIN';

                          return (
                            <td key={role.code} className="px-2.5 py-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  disabled={isSuperAdmin}
                                  onChange={() => handleToggleAccess(rule.tabId, role.code)}
                                  className={`w-4 h-4 rounded text-blue-600 transition ${
                                    isSuperAdmin
                                      ? 'opacity-80 cursor-not-allowed text-rose-600'
                                      : 'cursor-pointer focus:ring-blue-500'
                                  }`}
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Guidance Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Pedoman Akses Peran (Role) di Sekolah:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-rose-600 dark:text-rose-400">1. Admin Super:</span>
                <p className="mt-1">
                  Memegang wewenang penuh konfigurasi sistem, database, hak akses, dan manajemen akun.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">2. Guru BK:</span>
                <p className="mt-1">
                  Akses modul kesiswaan, catatan absensi siswa, monitoring siswa terlambat / alpha, dan rekap.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-blue-600 dark:text-blue-400">3. Guru:</span>
                <p className="mt-1">
                  Akses jadwal mengajar harian, presensi mengajar kelas, presensi piket, dan sholat dhuha.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-teal-600 dark:text-teal-400">4. Wali Kelas:</span>
                <p className="mt-1">
                  Monitoring siswa kelas asuhan, rekap kehadiran bulanan, laporan presensi, dan data siswa.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-amber-600 dark:text-amber-400">5. Bendahara:</span>
                <p className="mt-1">
                  Akses modul keuangan, pembayaran SPP, rekap uang masuk, dan statistik keterkaitan absensi.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">6. TU (Tata Usaha):</span>
                <p className="mt-1">
                  Pengelolaan master data guru, pegawai, siswa, cetak kartu fisik QR/NFC, dan persuratan.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 md:col-span-2 lg:col-span-3">
                <span className="font-bold text-cyan-600 dark:text-cyan-400">7. Siswa:</span>
                <p className="mt-1">
                  Melihat jadwal KBM kelas, rekapitulasi kehadiran mandiri, dan portal informasi pengumuman sekolah.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MODUL FITUR EKSTENSI                               */}
      {/* ========================================================= */}
      {activeTab === 'modules' && <ModulesView currentSession={currentSession} />}

      {/* ========================================================= */}
      {/* TAB 4: LOG AUDIT AKTIVITAS                                */}
      {/* ========================================================= */}
      {activeTab === 'audit' && <AuditLogsView currentSession={currentSession} />}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT AKUN PENGGUNA                        */}
      {/* ========================================================= */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? `Ubah Data Akun: ${editingUser.username}` : 'Tambah Akun Pengguna Baru'}
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: gurubk, budi, siswa1"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    username: e.target.value.toLowerCase().replace(/\s+/g, ''),
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Gunakan huruf kecil tanpa spasi.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {editingUser ? 'Ganti Password (Kosongkan jika tidak diubah)' : 'Password Akun *'}
              </label>
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required={!editingUser}
                  placeholder={editingUser ? 'Ketik sandi baru jika ingin ganti' : 'Minimal 5 karakter'}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-8 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dra. Hj. Siti Aminah, M.Si."
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Role Akses Sistem (7 Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={userForm.roleCode}
              onChange={(e) => setUserForm({ ...userForm, roleCode: e.target.value as RoleCode })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300"
            >
              {OFFICIAL_ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} — {r.description}
                </option>
              ))}
            </select>
          </div>

          {/* Link to Teacher (if role is teacher, BK, wali, bendahara, TU) */}
          {userForm.roleCode !== 'SISWA' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tautkan ke Data Guru / Pegawai (Opsional)
              </label>
              <select
                value={userForm.teacherId}
                onChange={(e) => handleTeacherSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="">-- Tidak Ditautkan / Akun Khusus --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (NIP: {t.nip || '-'}) - {t.positionStatus || 'Guru'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Memilih guru akan otomatis mengisi nama dan kontak dari database guru.
              </p>
            </div>
          )}

          {/* Link to Student (if role is SISWA) */}
          {userForm.roleCode === 'SISWA' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tautkan ke Data Siswa Terdaftar (Opsional)
              </label>
              <select
                value={userForm.studentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NIS: {s.nis}) - {s.className || 'Kelas'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Pengguna
              </label>
              <input
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Akun
              </label>
              <select
                value={userForm.active ? '1' : '0'}
                onChange={(e) => setUserForm({ ...userForm, active: e.target.value === '1' })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
              >
                <option value="1">Aktif (Dapat Login ke Aplikasi)</option>
                <option value="0">Nonaktif (Akses Dinonaktifkan)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              {editingUser ? 'Simpan Perubahan' : 'Buat Akun Sekarang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD CEPAT                               */}
      {/* ========================================================= */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={`Reset Sandi: ${targetPasswordUser?.username || 'Pengguna'}`}
      >
        <form onSubmit={handleSaveQuickPassword} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi Langsung</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Anda sedang mereset kata sandi untuk akun <strong className="font-mono font-black">{targetPasswordUser?.username}</strong> ({targetPasswordUser?.fullName}).
              Kata sandi akan dienkripsi secara aman dengan algoritma bcrypt.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Masukkan Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswordText ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Minimal 5 karakter"
                value={quickNewPassword}
                onChange={(e) => setQuickNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3 pr-8 py-2.5 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Sandi baru akan langsung aktif dan dapat digunakan pengguna untuk login.</span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
            >
              Simpan Kata Sandi Baru
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
