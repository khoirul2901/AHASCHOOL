import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.js';
import { Sidebar, type NavTab } from './components/layout/Sidebar.js';
import { DashboardView } from './features/dashboard/DashboardView.js';
import { ScannerKioskView } from './features/attendance/ScannerKioskView.js';
import { StudentAttendanceView } from './features/attendance/StudentAttendanceView.js';
import { TeacherAttendanceView } from './features/attendance/TeacherAttendanceView.js';
import { DhuhaAttendanceView } from './features/attendance/DhuhaAttendanceView.js';
import { TeachingScheduleView } from './features/schedules/TeachingScheduleView.js';
import { CorrectionView } from './features/attendance/CorrectionView.js';
import { HolidaysView } from './features/schedules/HolidaysView.js';
import { ReportsView } from './features/reports/ReportsView.js';
import { TeachersView } from './features/teachers/TeachersView.js';
import { StudentsView } from './features/students/StudentsView.js';
import { ClassesView } from './features/classes/ClassesView.js';
import { SubjectsView } from './features/subjects/SubjectsView.js';
import { SettingsView } from './features/settings/SettingsView.js';
import { SyncCenterView } from './features/sync/SyncCenterView.js';
import { PlannedModuleView } from './features/modules/PlannedModuleView.js';
import { SchoolLandingPage } from './features/portal/SchoolLandingPage.js';
import { LoginPage } from './features/auth/LoginPage.js';
import { DatabaseManageView } from './features/database/DatabaseManageView.js';
import { IdCardGeneratorView } from './features/cards/IdCardGeneratorView.js';
import { syncEngine, type NetworkStatus } from './lib/syncEngine.js';
import type { UserSession } from './types/index.js';

export default function App() {
  // Persistent Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash as NavTab;
      const saved = localStorage.getItem('siakad_current_tab');
      if (saved) return saved as NavTab;
    } catch (e) {
      // ignore
    }
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<NetworkStatus>(
    navigator.onLine ? 'ONLINE' : 'OFFLINE'
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Active view mode: 'portal' (school landing page), 'login' (login form), or 'app' (SIAKAD dashboard)
  // When refreshed, persist the active view mode so the user stays on the page they were currently viewing
  const [activeViewMode, setActiveViewMode] = useState<'portal' | 'login' | 'app'>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      // If there is any view hash (e.g. #schedules, #attendance-teacher, #dashboard), always stay on app!
      if (hash && hash !== 'landing') {
        return 'app';
      }
      const savedMode = localStorage.getItem('siakad_view_mode');
      if (savedMode === 'app' || savedMode === 'login') {
        return savedMode;
      }
      // If user has active session or active tab, never throw back to website landing on refresh:
      const hasSession = localStorage.getItem('siakad_session');
      const savedTab = localStorage.getItem('siakad_current_tab');
      if (hasSession || (savedTab && savedTab !== 'landing')) {
        return 'app';
      }
      if (savedMode === 'portal') {
        return 'portal';
      }
    } catch (e) {
      // ignore
    }
    return 'app';
  });

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
    switch (username) {
      case 'admin':
        setCurrentSession({
          id: 'usr-admin',
          username: 'admin',
          fullName: 'Administrator Sekolah (Admin Super)',
          roles: ['SUPER_ADMIN'],
          permissions: ['*'],
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-admin',
            username: 'admin',
            name: 'Administrator Sekolah',
            role: 'SUPER_ADMIN',
            isActive: true,
            email: 'admin@sekolah.sch.id',
          },
        });
        break;
      case 'gurubk':
        setCurrentSession({
          id: 'usr-gurubk',
          username: 'gurubk',
          fullName: 'Dra. Hj. Siti Aminah, M.Si. (Guru BK)',
          roles: ['GURU_BK'],
          permissions: ['ATTENDANCE_READ', 'STUDENTS_READ', 'STUDENTS_WRITE'],
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-gurubk',
            username: 'gurubk',
            name: 'Dra. Hj. Siti Aminah, M.Si.',
            role: 'GURU_BK',
            isActive: true,
            email: 'gurubk@sekolah.sch.id',
          },
        });
        break;
      case 'budi':
      case 'guru':
        setCurrentSession({
          id: 'usr-budi',
          username: 'budi',
          fullName: 'Budi Santoso, S.Pd. (Guru Pengajar)',
          roles: ['GURU'],
          permissions: ['ATTENDANCE_READ', 'ATTENDANCE_WRITE', 'SCHEDULE_READ'],
          teacherId: 'tch-budi-01',
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-budi',
            username: 'budi',
            name: 'Budi Santoso, S.Pd.',
            role: 'GURU',
            teacherId: 'tch-budi-01',
            isActive: true,
            email: 'budi.santoso@sekolah.sch.id',
          },
        });
        break;
      case 'walikelas':
        setCurrentSession({
          id: 'usr-walikelas',
          username: 'walikelas',
          fullName: 'Hendra Gunawan, S.Kom. (Wali Kelas VII-A)',
          roles: ['WALI_KELAS', 'GURU'],
          permissions: ['ATTENDANCE_READ', 'STUDENTS_READ'],
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-walikelas',
            username: 'walikelas',
            name: 'Hendra Gunawan, S.Kom.',
            role: 'WALI_KELAS',
            isActive: true,
            email: 'walikelas@sekolah.sch.id',
          },
        });
        break;
      case 'bendahara':
        setCurrentSession({
          id: 'usr-bendahara',
          username: 'bendahara',
          fullName: 'Ratna Sari, S.Pd. (Bendahara Sekolah)',
          roles: ['BENDAHARA'],
          permissions: ['REPORTS_READ', 'FINANCE_MANAGE'],
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-bendahara',
            username: 'bendahara',
            name: 'Ratna Sari, S.Pd.',
            role: 'BENDAHARA',
            isActive: true,
            email: 'bendahara@sekolah.sch.id',
          },
        });
        break;
      case 'tu':
        setCurrentSession({
          id: 'usr-tu',
          username: 'tu',
          fullName: 'Joko Purnomo, S.Pd. (Staf Tata Usaha)',
          roles: ['TU'],
          permissions: ['STUDENTS_MANAGE', 'TEACHERS_MANAGE', 'CARDS_PRINT'],
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-tu',
            username: 'tu',
            name: 'Joko Purnomo, S.Pd.',
            role: 'TU',
            isActive: true,
            email: 'tu@sekolah.sch.id',
          },
        });
        break;
      case 'siswa':
        setCurrentSession({
          id: 'usr-siswa',
          username: 'siswa',
          fullName: 'Ahmad Faiz Pratama (Siswa VII-A)',
          roles: ['SISWA'],
          permissions: ['SCHEDULE_READ', 'ATTENDANCE_OWN_READ'],
          studentId: 'std-faiz-01',
          schoolId: 'sch-smpn1',
          user: {
            id: 'usr-siswa',
            username: 'siswa',
            name: 'Ahmad Faiz Pratama',
            role: 'SISWA',
            isActive: true,
            email: 'siswa@sekolah.sch.id',
          },
        });
        break;
      default:
        break;
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
      case 'attendance-dhuha':
        return <DhuhaAttendanceView currentSession={currentSession} />;
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
      case 'id-cards':
        return <IdCardGeneratorView currentSession={currentSession} />;
      case 'sync':
        return <SyncCenterView currentSession={currentSession} />;
      case 'database':
        return <DatabaseManageView currentSession={currentSession} />;
      case 'settings':
        return <SettingsView currentSession={currentSession} />;
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

  useEffect(() => {
    try {
      if (currentTab && currentTab !== 'landing') {
        localStorage.setItem('siakad_current_tab', currentTab);
        window.location.hash = currentTab;
        localStorage.setItem('siakad_view_mode', 'app');
      }
    } catch (e) {
      // ignore
    }
  }, [currentTab]);

  useEffect(() => {
    try {
      localStorage.setItem('siakad_view_mode', activeViewMode);
    } catch (e) {
      // ignore
    }
  }, [activeViewMode]);

  const handleLogout = () => {
    localStorage.removeItem('siakad_session');
    localStorage.setItem('siakad_view_mode', 'login');
    setActiveViewMode('login');
  };

  // If viewing public school landing page
  if (activeViewMode === 'portal') {
    return (
      <SchoolLandingPage
        onNavigateLogin={() => {
          localStorage.setItem('siakad_view_mode', 'login');
          setActiveViewMode('login');
        }}
        onNavigateScannerKiosk={() => {
          setCurrentTab('scan-kiosk');
          localStorage.setItem('siakad_current_tab', 'scan-kiosk');
          localStorage.setItem('siakad_view_mode', 'app');
          window.location.hash = 'scan-kiosk';
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
          setCurrentTab('dashboard');
          localStorage.setItem('siakad_current_tab', 'dashboard');
          localStorage.setItem('siakad_view_mode', 'app');
          window.location.hash = 'dashboard';
          setActiveViewMode('app');
        }}
        onNavigateLanding={() => {
          localStorage.setItem('siakad_view_mode', 'portal');
          setActiveViewMode('portal');
        }}
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
        onNavigateLanding={() => {
          localStorage.setItem('siakad_view_mode', 'portal');
          setActiveViewMode('portal');
        }}
      />

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'landing') {
              localStorage.setItem('siakad_view_mode', 'portal');
              setActiveViewMode('portal');
            } else {
              setCurrentTab(tab);
              localStorage.setItem('siakad_current_tab', tab);
              localStorage.setItem('siakad_view_mode', 'app');
              window.location.hash = tab;
              setActiveViewMode('app');
            }
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentSession={currentSession}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-6 sm:px-8 lg:ml-72 max-w-7xl w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
