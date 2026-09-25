import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  School as SchoolIcon,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import type { UserSession } from '../../types/index.js';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  onNavigateLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateLanding,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan username dan password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('siakad_session', JSON.stringify(data.session));
        onLoginSuccess(data.session);
        return;
      }

      // If server explicitly rejected password (e.g. 401 with JSON)
      const data = await res.json().catch(() => null);
      if (res.status === 401 && data?.error) {
        throw new Error(data.error);
      }
      throw new Error('API server tidak merespons (Mode Static / GitHub Pages)');
    } catch (err: any) {
      // Fallback for static GitHub Pages / offline mode:
      const u = username.trim().toLowerCase();
      const p = password.trim();

      const demoUsers: Record<string, { pass: string; session: any }> = {
        admin: {
          pass: 'admin123',
          session: {
            id: 'usr-admin',
            username: 'admin',
            fullName: 'Administrator SIAKAD',
            roles: ['ADMIN_SEKOLAH', 'SUPER_ADMIN'],
            permissions: ['*'],
            schoolId: 'sch-smpn1',
            user: { id: 'usr-admin', username: 'admin', name: 'Administrator SIAKAD', role: 'ADMIN', isActive: true, email: 'admin@sekolah.sch.id' }
          }
        },
        guru: {
          pass: 'guru123',
          session: {
            id: 'usr-guru',
            username: 'guru',
            fullName: 'Drs. H. Mulyono, M.Pd.',
            roles: ['GURU'],
            permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_EDIT_OWN', 'SCHEDULE_VIEW'],
            schoolId: 'sch-smpn1',
            teacherId: 'tch-01',
            user: { id: 'usr-guru', username: 'guru', name: 'Drs. H. Mulyono, M.Pd.', role: 'GURU', teacherId: 'tch-01', isActive: true, email: 'mulyono@sekolah.sch.id' }
          }
        },
        siswa: {
          pass: 'siswa123',
          session: {
            id: 'usr-siswa',
            username: 'siswa',
            fullName: 'Ahmad Faiz Pratama (Kelas VII-A)',
            roles: ['SISWA', 'ORANG_TUA'],
            permissions: ['ATTENDANCE_VIEW_STUDENT'],
            schoolId: 'sch-smpn1',
            studentId: 'std-01',
            user: { id: 'usr-siswa', username: 'siswa', name: 'Ahmad Faiz Pratama', role: 'SISWA', isActive: true }
          }
        },
        kepsek: {
          pass: 'kepsek123',
          session: {
            id: 'usr-kepsek',
            username: 'kepsek',
            fullName: 'Dra. Hj. Siti Rahmawati, M.M. (Kepala Sekolah)',
            roles: ['KEPALA_SEKOLAH'],
            permissions: ['*'],
            schoolId: 'sch-smpn1',
            user: { id: 'usr-kepsek', username: 'kepsek', name: 'Dra. Hj. Siti Rahmawati, M.M.', role: 'KEPALA_SEKOLAH', isActive: true }
          }
        }
      };

      if (demoUsers[u] && demoUsers[u].pass === p) {
        const session = demoUsers[u].session;
        localStorage.setItem('siakad_session', JSON.stringify(session));
        onLoginSuccess(session);
        return;
      }

      setErrorMessage(err.message && !err.message.includes('API server') ? err.message : 'Username atau password salah. Silakan coba salah satu akun demo.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Bar Navigation back to Public School Website */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          onClick={onNavigateLanding}
          className="flex items-center gap-3 group text-left transition"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:bg-blue-500 transition">
            ST
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white leading-tight">
              SMP Negeri 1 Indonesia Terpadu
            </div>
            <div className="text-xs text-slate-400 group-hover:text-blue-400 transition flex items-center gap-1">
              ← Kembali ke Beranda Sekolah
            </div>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Koneksi Aman TLS 256-bit</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Portal Akademik Terpadu
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Masuk untuk mengakses data akademik, presensi, jadwal & administrasi
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Email / NIP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin atau budi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block animate-pulse">Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke SIAKAD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Pilihan Akun Demo Cepat
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin', 'admin123')}
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 text-left transition flex flex-col justify-between"
              >
                <div className="font-semibold text-blue-400">Akun Admin</div>
                <div className="text-[10px] text-slate-400 mt-0.5">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('budi', 'guru123')}
                className="p-2.5 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 text-left transition flex flex-col justify-between"
              >
                <div className="font-semibold text-emerald-400">Akun Guru Piket</div>
                <div className="text-[10px] text-slate-400 mt-0.5">budi / guru123</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-800">
        <p>© 2026 SMP Negeri 1 Indonesia Terpadu · Sistem Informasi Manajemen Akademik Sekolah</p>
      </footer>
    </div>
  );
};
