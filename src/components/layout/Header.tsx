import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  User,
  LogOut,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { PWAInstallButton } from '../ui/PWAInstallButton.js';
import type { UserSession } from '../../types/index.js';
import type { NetworkStatus } from '../../lib/syncEngine.js';

interface HeaderProps {
  currentSession: UserSession | null;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  syncStatus: NetworkStatus;
  pendingSyncCount: number;
  onManualSync: () => void;
  onQuickSwitchUser: (username: string) => void;
  onNavigateLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  onLogout,
  onOpenMobileMenu,
  syncStatus,
  pendingSyncCount,
  onManualSync,
  onQuickSwitchUser,
  onNavigateLanding,
}) => {
  const getStatusBadge = () => {
    switch (syncStatus) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </span>
        );
      case 'LOCAL_SERVER':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Server Lokal</span>
          </span>
        );
      case 'SYNCING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="hidden sm:inline">Sinkronisasi...</span>
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:px-8">
      {/* Left side: Hamburger (mobile) + App Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-tight text-slate-900 dark:text-white sm:text-base">
              SIAKAD TERPADU
            </span>
            <span className="hidden rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300 md:inline-block">
              2026/2027 Ganjil
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
            SMP Negeri 1 Indonesia Terpadu
          </p>
        </div>
      </div>

      {/* Right side: Sync indicator, quick user toggle, PWA install, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network & Sync status */}
        <div className="flex items-center gap-1.5">
          {getStatusBadge()}
          <button
            onClick={onManualSync}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            title="Sinkronkan data ke server"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
            {pendingSyncCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {pendingSyncCount}
              </span>
            )}
          </button>
        </div>

        {/* Web Sekolah Button */}
        {onNavigateLanding && (
          <button
            onClick={onNavigateLanding}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
            title="Kunjungi Website Utama Sekolah"
          >
            <span>Web Sekolah</span>
          </button>
        )}

        {/* PWA Install */}
        <PWAInstallButton />

        {/* Quick User Switcher for testing/demo */}
        <div className="hidden xl:flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 text-xs">
          <span className="px-1.5 font-medium text-slate-500 dark:text-slate-400">Switch:</span>
          <button
            onClick={() => onQuickSwitchUser('admin')}
            className={`px-2 py-0.5 rounded font-medium transition ${
              (currentSession?.username || currentSession?.user?.username) === 'admin'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => onQuickSwitchUser('budi')}
            className={`px-2 py-0.5 rounded font-medium transition ${
              (currentSession?.username || currentSession?.user?.username) === 'budi'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Guru Budi
          </button>
          <button
            onClick={() => onQuickSwitchUser('siti')}
            className={`px-2 py-0.5 rounded font-medium transition ${
              (currentSession?.username || currentSession?.user?.username) === 'siti'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Guru Siti
          </button>
        </div>

        {/* User Profile Pill */}
        {currentSession ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs shadow-xs">
                {(currentSession.fullName || currentSession.username || 'A').charAt(0)}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentSession.fullName || currentSession.user?.name || currentSession.username}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  {currentSession.roles[0]}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <User className="w-4 h-4" />
            <span>Tamu</span>
          </div>
        )}
      </div>
    </header>
  );
};
