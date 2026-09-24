import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.js';
import { Sidebar, type NavTab } from './components/layout/Sidebar.js';
import { DashboardView } from './features/dashboard/DashboardView.js';
import { ScannerKioskView } from './features/attendance/ScannerKioskView.js';
import { StudentAttendanceView } from './features/attendance/StudentAttendanceView.js';
import { TeacherAttendanceView } from './features/attendance/TeacherAttendanceView.js';
import { TeachingScheduleView } from './features/schedules/TeachingScheduleView.js';
import { CorrectionView } from './features/attendance/CorrectionView.js';
import { HolidaysView } from './features/schedules/HolidaysView.js';
import { ReportsView } from './features/reports/ReportsView.js';
import { TeachersView } from './features/teachers/TeachersView.js';
import { StudentsView } from './features/students/StudentsView.js';
import { ClassesView } from './features/classes/ClassesView.js';
import { SubjectsView } from './features/subjects/SubjectsView.js';
import { ModulesView } from './features/modules/ModulesView.js';
import { SyncCenterView } from './features/sync/SyncCenterView.js';
import { AuditLogsView } from './features/audit/AuditLogsView.js';
import { PlannedModuleView } from './features/modules/PlannedModuleView.js';
import { SchoolLandingPage } from './features/portal/SchoolLandingPage.js';
import { LoginPage } from './features/auth/LoginPage.js';
import { DatabaseManageView } from './features/database/DatabaseManageView.js';
import { syncEngine, type NetworkStatus } from './lib/syncEngine.js';
import type { UserSession } from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<NetworkStatus>(
    navigator.onLine ? 'ONLINE' : 'OFFLINE'
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Active view mode: 'portal' (school landing page), 'login' (login form), or 'app' (SIAKAD dashboard)
  const [activeViewMode, setActiveViewMode] = useState<'portal' | 'login' | 'app'>('portal');

  // Simulated current session (switchable or populated upon login)
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('siakad_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      id: 'usr-admin',
      username: 'admin',
      fullName: 'Administrator SIAKAD',
      roles: ['ADMIN_SEKOLAH', 'SUPER_ADMIN'],
      permissions: ['*'],
      schoolId: 'sch-smpn1',
      user: {
        id: 'usr-admin',
        username: 'admin',
        name: 'Administrator SIAKAD',
        role: 'ADMIN',
        isActive: true,
        email: 'admin@sekolah.sch.id',
      },
    };
  });

  // Initialize sync engine & offline listeners
  useEffect(() => {
    syncEngine.init().catch(console.error);

    const updateQueueCount = async () => {
      try {
        const count = await syncEngine.getQueueCount();
        setPendingSyncCount(count);
      } catch (e) {
        // ignore
      }
    };

    updateQueueCount();

    const handleOnline = () => {
      setSyncStatus('ONLINE');
      syncEngine.syncNow().then(() => updateQueueCount());
    };

    const handleOffline = () => {
      setSyncStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updateQueueCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    try {
      setSyncStatus('SYNCING');
      await syncEngine.syncNow();
      const count = await syncEngine.getQueueCount();
      setPendingSyncCount(count);
      setSyncStatus(navigator.onLine ? 'ONLINE' : 'OFFLINE');
    } catch (e) {
      setSyncStatus('OFFLINE');
    }
  };

  const handleQuickSwitchUser = (username: string) => {
    if (username === 'admin') {
      setCurrentSession({
        id: 'usr-admin',
        username: 'admin',
        fullName: 'Administrator SIAKAD',
        roles: ['ADMIN_SEKOLAH', 'SUPER_ADMIN'],
        permissions: ['*'],
        schoolId: 'sch-smpn1',
        user: {
          id: 'usr-admin',
          username: 'admin',
          name: 'Administrator SIAKAD',
          role: 'ADMIN',
          isActive: true,
          email: 'admin@sekolah.sch.id',
        },
      });
    } else if (username === 'budi') {
      setCurrentSession({
        id: 'usr-budi',
        username: 'budi',
        fullName: 'Budi Santoso, S.Pd.',
        roles: ['GURU', 'GURU_PIKET'],
        permissions: ['ATTENDANCE_READ', 'ATTENDANCE_WRITE'],
        teacherId: 'tch-budi',
        schoolId: 'sch-smpn1',
        user: {
          id: 'usr-budi',
          username: 'budi',
          name: 'Budi Santoso, S.Pd.',
          role: 'TEACHER',
          teacherId: 'tch-budi',
          isActive: true,
          email: 'budi@sekolah.sch.id',
        },
      });
    } else if (username === 'siti') {
      setCurrentSession({
        id: 'usr-siti',
        username: 'siti',
        fullName: 'Siti Rahayu, M.Pd.',
        roles: ['GURU'],
        permissions: ['ATTENDANCE_READ', 'ATTENDANCE_WRITE'],
        teacherId: 'tch-siti',
        schoolId: 'sch-smpn1',
        user: {
          id: 'usr-siti',
          username: 'siti',
          name: 'Siti Rahayu, M.Pd.',
          role: 'TEACHER',
          teacherId: 'tch-siti',
          isActive: true,
          email: 'siti@sekolah.sch.id',
        },
      });
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            currentSession={currentSession}
            onNavigate={(tab) => setCurrentTab(tab as NavTab)}
          />
        );
      case 'scan-kiosk':
        return <ScannerKioskView currentSession={currentSession} />;
      case 'attendance-student':
        return <StudentAttendanceView currentSession={currentSession} />;
      case 'attendance-teacher':
        return <TeacherAttendanceView currentSession={currentSession} />;
      case 'schedules':
        return <TeachingScheduleView currentSession={currentSession} />;
      case 'corrections':
        return <CorrectionView currentSession={currentSession} />;
      case 'holidays':
        return <HolidaysView currentSession={currentSession} />;
      case 'reports':
        return <ReportsView currentSession={currentSession} />;
      case 'teachers':
        return <TeachersView currentSession={currentSession} />;
      case 'students':
        return <StudentsView currentSession={currentSession} />;
      case 'classes':
        return <ClassesView currentSession={currentSession} />;
      case 'subjects':
        return <SubjectsView currentSession={currentSession} />;
      case 'sync':
        return <SyncCenterView currentSession={currentSession} />;
      case 'database':
        return <DatabaseManageView currentSession={currentSession} />;
      case 'settings':
        return (
          <div className="space-y-6">
            <ModulesView currentSession={currentSession} />
            <AuditLogsView currentSession={currentSession} />
          </div>
        );
      default:
        if (currentTab.startsWith('mod-')) {
          return (
            <PlannedModuleView
              tab={currentTab}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          );
        }
        return (
          <DashboardView
            currentSession={currentSession}
            onNavigate={(tab) => setCurrentTab(tab as NavTab)}
          />
        );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('siakad_session');
    setActiveViewMode('login');
  };

  // If viewing public school landing page
  if (activeViewMode === 'portal') {
    return (
      <SchoolLandingPage
        onNavigateLogin={() => setActiveViewMode('login')}
        onNavigateScannerKiosk={() => {
          setCurrentTab('scan-kiosk');
          setActiveViewMode('app');
        }}
      />
    );
  }

  // If viewing login page
  if (activeViewMode === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(session) => {
          setCurrentSession(session);
          setActiveViewMode('app');
        }}
        onNavigateLanding={() => setActiveViewMode('portal')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        currentSession={currentSession}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setSidebarOpen(true)}
        syncStatus={syncStatus}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleManualSync}
        onQuickSwitchUser={handleQuickSwitchUser}
        onNavigateLanding={() => setActiveViewMode('portal')}
      />

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'landing') {
              setActiveViewMode('portal');
            } else {
              setCurrentTab(tab);
            }
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6 sm:px-8 lg:ml-72 max-w-7xl w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
