/**
 * Mock API Interceptor for Static Hosting (e.g. GitHub Pages)
 * When deployed statically without an Express backend, this interceptor handles
 * all /api/* requests in-memory & in localStorage so the application works seamlessly
 * without triggering 404 or 405 network errors.
 */

export function initMockApiIfNeeded() {
  if (typeof window === 'undefined') return;

  const isStatic =
    window.location.hostname.includes('github.io') ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '';

  if (!isStatic) {
    return;
  }

  console.info('[SIAKAD] Static hosting environment detected (GitHub Pages). Enabling Client-side Mock API Engine.');

  // Initialize mock store in localStorage if not already present
  if (!localStorage.getItem('siakad_mock_initialized')) {
    const initialTeachers = [
      { id: 'tch-1', nip: '197505122000031001', name: 'Drs. H. Mulyono, M.Pd.', subject: 'Matematika', phone: '081234567890', email: 'mulyono@sekolah.sch.id', role: 'GURU', active: true },
      { id: 'tch-2', nip: '198203142008012003', name: 'Dra. Hj. Siti Aminah, M.Si.', subject: 'Ilmu Pengetahuan Alam (IPA)', phone: '081234567891', email: 'siti.aminah@sekolah.sch.id', role: 'GURU', active: true },
      { id: 'tch-3', nip: '198811202012121004', name: 'Ahmad Fauzi, S.Pd., Gr.', subject: 'Bahasa Indonesia', phone: '081234567892', email: 'ahmad.fauzi@sekolah.sch.id', role: 'GURU', active: true },
      { id: 'tch-4', nip: '199004182015042002', name: 'Nurul Hidayah, S.Kom.', subject: 'Informatika & Komputer', phone: '081234567893', email: 'nurul.h@sekolah.sch.id', role: 'GURU', active: true },
      { id: 'tch-5', nip: '198509092010011005', name: 'Bambang Sudarsono, S.Pd.', subject: 'Pendidikan Jasmani & Olahraga', phone: '081234567894', email: 'bambang.s@sekolah.sch.id', role: 'GURU', active: true },
    ];

    const initialClasses = [
      { id: 'cls-7a', name: 'Kelas 7-A', grade: 7, homeroomTeacherId: 'tch-1', homeroomTeacherName: 'Drs. H. Mulyono, M.Pd.', capacity: 32, studentCount: 32 },
      { id: 'cls-7b', name: 'Kelas 7-B', grade: 7, homeroomTeacherId: 'tch-2', homeroomTeacherName: 'Dra. Hj. Siti Aminah, M.Si.', capacity: 32, studentCount: 32 },
      { id: 'cls-8a', name: 'Kelas 8-A', grade: 8, homeroomTeacherId: 'tch-3', homeroomTeacherName: 'Ahmad Fauzi, S.Pd., Gr.', capacity: 32, studentCount: 32 },
      { id: 'cls-8b', name: 'Kelas 8-B', grade: 8, homeroomTeacherId: 'tch-4', homeroomTeacherName: 'Nurul Hidayah, S.Kom.', capacity: 32, studentCount: 32 },
      { id: 'cls-9a', name: 'Kelas 9-A', grade: 9, homeroomTeacherId: 'tch-5', homeroomTeacherName: 'Bambang Sudarsono, S.Pd.', capacity: 32, studentCount: 32 },
    ];

    const initialStudents = [
      { id: 'std-1', nis: '2026001', nisn: '0089123451', name: 'Muhammad Ridwan Al-Farabi', classId: 'cls-7a', className: 'Kelas 7-A', gender: 'L', rfidTag: 'RFID-1001', active: true },
      { id: 'std-2', nis: '2026002', nisn: '0089123452', name: 'Aisyah Putri Azzahra', classId: 'cls-7a', className: 'Kelas 7-A', gender: 'P', rfidTag: 'RFID-1002', active: true },
      { id: 'std-3', nis: '2026003', nisn: '0089123453', name: 'Bagas Aditya Pratama', classId: 'cls-7a', className: 'Kelas 7-A', gender: 'L', rfidTag: 'RFID-1003', active: true },
      { id: 'std-4', nis: '2026004', nisn: '0089123454', name: 'Citra Dewi Kirana', classId: 'cls-7a', className: 'Kelas 7-A', gender: 'P', rfidTag: 'RFID-1004', active: true },
      { id: 'std-5', nis: '2026005', nisn: '0089123455', name: 'Dimas Anggara Putra', classId: 'cls-7b', className: 'Kelas 7-B', gender: 'L', rfidTag: 'RFID-1005', active: true },
      { id: 'std-6', nis: '2026006', nisn: '0089123456', name: 'Fatimah Zahra Salsabila', classId: 'cls-8a', className: 'Kelas 8-A', gender: 'P', rfidTag: 'RFID-1006', active: true },
    ];

    const initialSubjects = [
      { id: 'sbj-1', code: 'MTK-7', name: 'Matematika Terpadu', grade: 7, creditHours: 4, category: 'UMUM' },
      { id: 'sbj-2', code: 'IPA-7', name: 'Ilmu Pengetahuan Alam', grade: 7, creditHours: 4, category: 'UMUM' },
      { id: 'sbj-3', code: 'BIN-7', name: 'Bahasa Indonesia', grade: 7, creditHours: 4, category: 'UMUM' },
      { id: 'sbj-4', code: 'INF-7', name: 'Informatika & Robotika', grade: 7, creditHours: 2, category: 'KEJURUAN_MULOK' },
      { id: 'sbj-5', code: 'PJK-7', name: 'Pendidikan Jasmani & Olahraga', grade: 7, creditHours: 3, category: 'UMUM' },
    ];

    const initialModules = [
      { id: 'mod-1', code: 'MOD_ABSENSI_SEKOLAH', name: 'Core & Presensi Cerdas', active: true, installed: true, isCore: true, description: 'Modul inti absensi multi-role' },
      { id: 'mod-2', code: 'MOD_AKADEMIK_KURIKULUM', name: 'Akademik & Rapor Merdeka', active: true, installed: true, isCore: false, description: 'Kurikulum dan penilaian' },
      { id: 'mod-3', code: 'MOD_KEUANGAN_SPP', name: 'Keuangan & Pembayaran SPP', active: true, installed: true, isCore: false, description: 'Modul kas dan tagihan' },
      { id: 'mod-4', code: 'MOD_PERPUSTAKAAN', name: 'Digital Library & E-Katalog', active: true, installed: true, isCore: false, description: 'Katalog buku & sirkulasi pinjam' },
      { id: 'mod-5', code: 'MOD_BK_KONSELING', name: 'Bimbingan Konseling & Poin', active: true, installed: true, isCore: false, description: 'Catatan kedisiplinan siswa' },
      { id: 'mod-6', code: 'MOD_PPDB_ONLINE', name: 'PPDB Online Terpadu', active: true, installed: true, isCore: false, description: 'Penerimaan peserta didik baru' },
    ];

    localStorage.setItem('siakad_mock_teachers', JSON.stringify(initialTeachers));
    localStorage.setItem('siakad_mock_classes', JSON.stringify(initialClasses));
    localStorage.setItem('siakad_mock_students', JSON.stringify(initialStudents));
    localStorage.setItem('siakad_mock_subjects', JSON.stringify(initialSubjects));
    localStorage.setItem('siakad_mock_modules', JSON.stringify(initialModules));
    localStorage.setItem('siakad_mock_initialized', 'true');
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this request is targeted at /api or api/
    if (urlString.includes('/api/') || urlString.startsWith('api/') || urlString.endsWith('/api') || urlString.includes('api/')) {
      return handleMockApiRequest(urlString, init);
    }

    return originalFetch(input, init);
  };
}

function handleMockApiRequest(urlString: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const url = new URL(urlString, window.location.href);
  const path = url.pathname;

  const createJsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { 'Content-Type': 'application/json' },
    });
  };

  // 1. Auth Login
  if (path.includes('/api/auth/login')) {
    let body: any = {};
    try {
      body = JSON.parse((init?.body as string) || '{}');
    } catch (e) {}

    const username = (body.username || 'admin').trim().toLowerCase();
    const isGuru = username === 'guru';

    const session = isGuru
      ? {
          id: 'usr-guru',
          username: 'guru',
          fullName: 'Drs. H. Mulyono, M.Pd.',
          roles: ['GURU'],
          permissions: ['ATTENDANCE_STUDENT_WRITE', 'SCHEDULE_READ'],
          schoolId: 'sch-smpn1',
          teacherId: 'tch-1',
          user: { id: 'usr-guru', username: 'guru', name: 'Drs. H. Mulyono, M.Pd.', role: 'GURU', teacherId: 'tch-1', isActive: true, email: 'mulyono@sekolah.sch.id' },
        }
      : {
          id: 'usr-admin',
          username: 'admin',
          fullName: 'Administrator SIAKAD',
          roles: ['ADMIN_SEKOLAH', 'SUPER_ADMIN'],
          permissions: ['*'],
          schoolId: 'sch-smpn1',
          user: { id: 'usr-admin', username: 'admin', name: 'Administrator SIAKAD', role: 'ADMIN', isActive: true, email: 'admin@sekolah.sch.id' },
        };

    return Promise.resolve(createJsonResponse({ success: true, session }));
  }

  // 2. Settings & Profile
  if (path.includes('/api/settings')) {
    return Promise.resolve(
      createJsonResponse({
        school: {
          id: 'sch-smpn1',
          npsn: '20261984',
          name: 'SMP Negeri 1 Indonesia Terpadu',
          address: 'Jl. Pendidikan Terpadu No. 10, Jakarta / Nusantara',
          phone: '(021) 7890-1234',
          email: 'sekretariat@sekolah.sch.id',
          principal: 'Dr. H. Muhammad Ilyas, M.Pd.',
        },
        schoolSetting: {
          teacherAttendanceMode: 'AUTO_HADIR',
          lateToleranceMinutes: 10,
          allowOfflineAttendance: true,
        },
        academicYear: { name: '2026/2027', active: true },
        semester: { name: 'Semester Ganjil', active: true },
      })
    );
  }

  // 3. Dashboard Stats
  if (path.includes('/api/dashboard/stats')) {
    return Promise.resolve(
      createJsonResponse({
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
      })
    );
  }

  // 4. Classes
  if (path.includes('/api/classes')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_classes') || '[]');
    return Promise.resolve(createJsonResponse(data));
  }

  // 5. Teachers
  if (path.includes('/api/teachers')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_teachers') || '[]');
    return Promise.resolve(createJsonResponse({ items: data, total: data.length }));
  }

  // 6. Students
  if (path.includes('/api/students')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_students') || '[]');
    return Promise.resolve(createJsonResponse({ items: data, total: data.length }));
  }

  // 7. Subjects
  if (path.includes('/api/subjects')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_subjects') || '[]');
    return Promise.resolve(createJsonResponse(data));
  }

  // 8. Modules
  if (path.includes('/api/modules')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_modules') || '[]');
    return Promise.resolve(createJsonResponse(data));
  }

  // 9. Schedules
  if (path.includes('/api/schedules/teaching')) {
    return Promise.resolve(
      createJsonResponse([
        { id: 'sch-1', day: 'Senin', classId: 'cls-7a', className: 'Kelas 7-A', subjectName: 'Matematika', teacherId: 'tch-1', teacherName: 'Drs. H. Mulyono, M.Pd.', startTime: '07:30', endTime: '09:00', room: 'R-7A' },
        { id: 'sch-2', day: 'Senin', classId: 'cls-7b', className: 'Kelas 7-B', subjectName: 'IPA Terpadu', teacherId: 'tch-2', teacherName: 'Dra. Hj. Siti Aminah, M.Si.', startTime: '09:15', endTime: '10:45', room: 'Lab IPA' },
        { id: 'sch-3', day: 'Selasa', classId: 'cls-8a', className: 'Kelas 8-A', subjectName: 'Bahasa Indonesia', teacherId: 'tch-3', teacherName: 'Ahmad Fauzi, S.Pd., Gr.', startTime: '07:30', endTime: '09:00', room: 'R-8A' },
      ])
    );
  }

  if (path.includes('/api/schedules/picket')) {
    return Promise.resolve(
      createJsonResponse([
        { id: 'pck-1', day: 'Senin', teacherId: 'tch-1', teacherName: 'Drs. H. Mulyono, M.Pd.', location: 'Pintu Gerbang Utama & Lobi', startTime: '06:30', endTime: '08:00' },
        { id: 'pck-2', day: 'Selasa', teacherId: 'tch-3', teacherName: 'Ahmad Fauzi, S.Pd., Gr.', location: 'Lobi & Koridor Kelas 7-8', startTime: '06:30', endTime: '08:00' },
      ])
    );
  }

  // 10. Holidays
  if (path.includes('/api/academic/holidays')) {
    return Promise.resolve(
      createJsonResponse([
        { id: 'hol-1', name: 'Libur Hari Kemerdekaan Republik Indonesia', startDate: '2026-08-17', endDate: '2026-08-17', isRecurring: true },
        { id: 'hol-2', name: 'Libur Maulid Nabi Muhammad SAW', startDate: '2026-09-15', endDate: '2026-09-15', isRecurring: false },
      ])
    );
  }

  // 11. Teacher & Student Attendance
  if (path.includes('/api/attendance/teacher/checkin') || path.includes('/api/attendance/generate')) {
    return Promise.resolve(createJsonResponse({ success: true, message: 'Operasi absensi berhasil (Demo Mode)', teachingCount: 12, picketCount: 4 }));
  }

  if (path.includes('/api/attendance/teacher')) {
    return Promise.resolve(
      createJsonResponse([
        {
          id: 'att-tch-1',
          teacherId: 'tch-1',
          date: new Date().toISOString().split('T')[0],
          attendanceType: 'TEACHING',
          status: 'HADIR',
          scheduledStart: '07:30',
          scheduledEnd: '09:00',
          actualTime: '07:22',
          source: 'RFID_GATE',
          scheduleDetail: 'Kelas 7-A (Matematika)',
        },
        {
          id: 'att-tch-2',
          teacherId: 'tch-1',
          date: new Date().toISOString().split('T')[0],
          attendanceType: 'PICKET',
          status: 'HADIR',
          scheduledStart: '06:30',
          scheduledEnd: '08:00',
          actualTime: '06:25',
          source: 'RFID_GATE',
          scheduleDetail: 'Piket Gerbang Utama & Lobi',
        },
      ])
    );
  }

  if (path.includes('/api/attendance/student')) {
    return Promise.resolve(
      createJsonResponse([
        { id: 'att-std-1', studentId: 'std-1', studentName: 'Muhammad Ridwan Al-Farabi', nisn: '0089123451', status: 'HADIR', checkInTime: '06:52' },
        { id: 'att-std-2', studentId: 'std-2', studentName: 'Aisyah Putri Azzahra', nisn: '0089123452', status: 'HADIR', checkInTime: '06:58' },
        { id: 'att-std-3', studentId: 'std-3', studentName: 'Bagas Aditya Pratama', nisn: '0089123453', status: 'IZIN', notes: 'Izin lomba catur tingkat kota' },
        { id: 'att-std-4', studentId: 'std-4', studentName: 'Citra Dewi Kirana', nisn: '0089123454', status: 'HADIR', checkInTime: '07:05' },
      ])
    );
  }

  if (path.includes('/api/attendance/scan')) {
    return Promise.resolve(
      createJsonResponse({
        success: true,
        entityType: 'STUDENT',
        message: 'Presensi Scan Gate Berhasil Dicatat!',
        record: {
          name: 'Muhammad Ridwan Al-Farabi',
          identifier: '0089123451',
          detail: 'Kelas 7-A',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'HADIR_TEPAT_WAKTU',
        },
      })
    );
  }

  // 12. Sync Engine Pull & Push
  if (path.includes('/api/sync/pull')) {
    return Promise.resolve(
      createJsonResponse({
        status: 'success',
        serverTimestamp: Date.now(),
        attendanceRecords: [],
        schedules: [],
      })
    );
  }

  if (path.includes('/api/sync/push')) {
    return Promise.resolve(
      createJsonResponse({
        success: true,
        syncedCount: 1,
        conflicts: [],
        syncedIds: [],
      })
    );
  }

  // 13. Audit logs
  if (path.includes('/api/audit-logs')) {
    return Promise.resolve(
      createJsonResponse([
        { id: 'aud-1', action: 'LOGIN', entityName: 'Auth', userName: 'admin', ipAddress: '127.0.0.1', timestamp: new Date(Date.now() - 60000).toISOString(), details: 'Login sukses dari browser' },
        { id: 'aud-2', action: 'GENERATE_ATTENDANCE', entityName: 'Absensi', userName: 'system', ipAddress: '127.0.0.1', timestamp: new Date(Date.now() - 300000).toISOString(), details: 'Otomatis generate jadwal harian' },
      ])
    );
  }

  // 14. Database Stats
  if (path.includes('/api/database/stats')) {
    return Promise.resolve(
      createJsonResponse({
        teachers: 28,
        students: 384,
        classes: 12,
        subjects: 18,
        schedules: 36,
        attendanceRecords: 1540,
        auditLogs: 120,
        storageSizeKb: 450,
      })
    );
  }

  // Default fallback for any other API endpoint
  return Promise.resolve(
    createJsonResponse({
      success: true,
      message: 'Demo mode static API response',
      items: [],
    })
  );
}
