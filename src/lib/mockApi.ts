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
    window.location.protocol === 'file:';

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
  if (path.includes('/api/classes') && init?.method === 'DELETE') {
    const id = path.split('/').pop();
    const current = JSON.parse(localStorage.getItem('siakad_mock_classes') || '[]');
    const updated = current.filter((c: any) => c.id !== id);
    localStorage.setItem('siakad_mock_classes', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true }));
  }

  if (path.includes('/api/classes') && init?.method === 'POST') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const current = JSON.parse(localStorage.getItem('siakad_mock_classes') || '[]');
    const newClass = {
      id: 'cls-' + Date.now(),
      name: body.name || 'Kelas Baru',
      level: body.level || body.grade || '7',
      grade: body.level || body.grade || '7',
      major: body.major || 'Umum',
      room: body.room || 'R. 101',
      homeroomTeacherId: body.homeroomTeacherId,
      studentCount: 0,
      active: true,
    };
    const updated = [...current, newClass];
    localStorage.setItem('siakad_mock_classes', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse(newClass));
  }

  if (path.includes('/api/classes')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_classes') || '[]');
    return Promise.resolve(createJsonResponse(data));
  }

  // 5. Teachers
  if (path.includes('/api/teachers/import')) {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const items = body.items || [];
    const current = JSON.parse(localStorage.getItem('siakad_mock_teachers') || '[]');
    const newItems = items.map((it: any, idx: number) => ({
      id: 'tch-' + Date.now() + '-' + idx,
      nip: it.nip,
      name: it.name,
      gender: it.gender || 'L',
      subject: it.subject || 'Guru Pengampu',
      phone: it.phone,
      email: it.email,
      employmentStatus: it.employmentStatus || 'GURU_TETAP',
      cardId: it.cardId || it.nip || ('GURU-' + (current.length + idx + 1)),
      active: true,
    }));
    const updated = [...current, ...newItems];
    localStorage.setItem('siakad_mock_teachers', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true, importedCount: newItems.length, errors: [] }));
  }

  if (path.includes('/api/teachers') && init?.method === 'POST') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const current = JSON.parse(localStorage.getItem('siakad_mock_teachers') || '[]');
    const newTeacher = {
      id: 'tch-' + Date.now(),
      nip: body.nip || undefined,
      name: body.name || 'Guru Baru',
      gender: body.gender || 'L',
      subject: body.subject || '',
      phone: body.phone || '',
      email: body.email || '',
      employmentStatus: body.employmentStatus || 'GURU_TETAP',
      positionStatus: body.positionStatus || 'Guru Mata Pelajaran',
      cardId: body.cardId || body.nip || ('GURU-' + Math.floor(1000 + Math.random() * 9000)),
      nfcUid: body.nfcUid || '',
      active: true,
      createdAt: new Date().toISOString(),
    };
    current.push(newTeacher);
    localStorage.setItem('siakad_mock_teachers', JSON.stringify(current));
    return Promise.resolve(createJsonResponse({ success: true, teacher: newTeacher }));
  }

  if (path.includes('/api/teachers') && init?.method === 'PUT') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const id = path.split('/').pop();
    const current = JSON.parse(localStorage.getItem('siakad_mock_teachers') || '[]');
    const updated = current.map((t: any) => (t.id === id ? { ...t, ...body } : t));
    localStorage.setItem('siakad_mock_teachers', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true }));
  }

  if (path.includes('/api/teachers')) {
    const data = JSON.parse(localStorage.getItem('siakad_mock_teachers') || '[]');
    return Promise.resolve(createJsonResponse({ items: data, total: data.length }));
  }

  // 6. Students
  if (path.includes('/api/students/import')) {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const items = body.items || [];
    const current = JSON.parse(localStorage.getItem('siakad_mock_students') || '[]');
    const newItems = items.map((it: any, idx: number) => ({
      id: 'std-' + Date.now() + '-' + idx,
      nis: it.nis,
      nisn: it.nisn,
      name: it.name,
      gender: it.gender || 'L',
      classId: it.classId || 'cls-7a',
      className: 'Kelas Terdaftar',
      phone: it.phone,
      parentName: it.parentName,
      cardId: it.cardId || it.nis,
      active: true,
    }));
    const updated = [...current, ...newItems];
    localStorage.setItem('siakad_mock_students', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true, importedCount: newItems.length, errors: [] }));
  }

  if (path.includes('/api/students') && init?.method === 'PUT') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const id = path.split('/').pop();
    const current = JSON.parse(localStorage.getItem('siakad_mock_students') || '[]');
    const updated = current.map((s: any) => (s.id === id ? { ...s, ...body } : s));
    localStorage.setItem('siakad_mock_students', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true }));
  }

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
    if (init?.method === 'DELETE' || init?.method === 'PUT') {
      return Promise.resolve(createJsonResponse({ success: true }));
    }
    return Promise.resolve(
      createJsonResponse([
        { id: 'sch-1', dayOfWeek: 1, classId: 'cls-7a', className: 'Kelas 7-A', subjectName: 'Matematika', teacherId: 'tch-1', teacherName: 'Drs. H. Mulyono, M.Pd.', startTime: '07:15', endTime: '08:45', startPeriod: 1, endPeriod: 3, periodCount: 3, room: 'R-7A' },
        { id: 'sch-2', dayOfWeek: 1, classId: 'cls-7b', className: 'Kelas 7-B', subjectName: 'IPA Terpadu', teacherId: 'tch-2', teacherName: 'Dra. Hj. Siti Aminah, M.Si.', startTime: '09:35', endTime: '10:35', startPeriod: 5, endPeriod: 6, periodCount: 2, room: 'Lab IPA' },
        { id: 'sch-3', dayOfWeek: 2, classId: 'cls-8a', className: 'Kelas 8-A', subjectName: 'Bahasa Indonesia', teacherId: 'tch-3', teacherName: 'Ahmad Fauzi, S.Pd., Gr.', startTime: '07:15', endTime: '08:15', startPeriod: 1, endPeriod: 2, periodCount: 2, room: 'R-8A' },
      ])
    );
  }

  if (path.includes('/api/schedules/picket')) {
    if (init?.method === 'DELETE' || init?.method === 'PUT') {
      return Promise.resolve(createJsonResponse({ success: true }));
    }
    return Promise.resolve(
      createJsonResponse([
        { id: 'pck-1', date: new Date().toISOString().split('T')[0], teacherId: 'tch-1', teacherName: 'Drs. H. Mulyono, M.Pd.', location: 'Pintu Gerbang Utama & Lobi', startTime: '06:30', endTime: '08:00' },
        { id: 'pck-2', date: new Date().toISOString().split('T')[0], teacherId: 'tch-3', teacherName: 'Ahmad Fauzi, S.Pd., Gr.', location: 'Lobi & Koridor Kelas 7-8', startTime: '06:30', endTime: '08:00' },
      ])
    );
  }

  if (path.includes('/api/schedules/management')) {
    if (init?.method === 'POST') {
      let body: any = {};
      try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
      return Promise.resolve(
        createJsonResponse({
          success: true,
          management: {
            id: 'mgmt-' + Date.now(),
            teacherId: body.teacherId || 'tch-1',
            roleTitle: body.roleTitle || 'Waka Kurikulum',
            dayOfWeek: body.dayOfWeek || 0,
            startTime: body.startTime || '07:00',
            endTime: body.endTime || '15:00',
            roomOrDesk: body.roomOrDesk || 'Ruang Manajemen',
            description: body.description || '',
          },
        })
      );
    }
    return Promise.resolve(
      createJsonResponse([
        { id: 'mgmt-1', teacherId: 'tch-1', teacherName: 'Drs. H. Mulyono, M.Pd.', roleTitle: 'Waka Kurikulum', dayOfWeek: 0, startTime: '07:00', endTime: '15:00', roomOrDesk: 'Ruang Waka Kurikulum', description: 'Pengelolaan kurikulum dan KBM harian' },
        { id: 'mgmt-2', teacherId: 'tch-2', teacherName: 'Dra. Hj. Siti Aminah, M.Si.', roleTitle: 'Waka Kesiswaan & Pembina OSIS', dayOfWeek: 0, startTime: '07:00', endTime: '15:00', roomOrDesk: 'Ruang Kesiswaan', description: 'Kedisiplinan siswa dan kegiatan OSIS' },
        { id: 'mgmt-3', teacherId: 'tch-4', teacherName: 'Nurul Hidayah, S.Kom.', roleTitle: 'Kepala Laboratorium Komputer', dayOfWeek: 0, startTime: '07:00', endTime: '15:00', roomOrDesk: 'Lab Komputer', description: 'Pemeliharaan fasilitas laboratorium IT' },
      ])
    );
  }

  // 10. Holidays & Lesson Periods
  if (path.includes('/api/academic/lesson-periods')) {
    const defaultPeriods = [
      { id: 'jp-1', periodNumber: 1, name: 'Jam Ke-1', startTime: '07:15', endTime: '07:45', isBreak: false, active: true },
      { id: 'jp-2', periodNumber: 2, name: 'Jam Ke-2', startTime: '07:45', endTime: '08:15', isBreak: false, active: true },
      { id: 'jp-3', periodNumber: 3, name: 'Jam Ke-3', startTime: '08:15', endTime: '08:45', isBreak: false, active: true },
      { id: 'jp-4', periodNumber: 4, name: 'Jam Ke-4', startTime: '08:45', endTime: '09:15', isBreak: false, active: true },
      { id: 'jp-break-1', periodNumber: 0, name: 'Istirahat Pagi', startTime: '09:15', endTime: '09:35', isBreak: true, active: true },
      { id: 'jp-5', periodNumber: 5, name: 'Jam Ke-5', startTime: '09:35', endTime: '10:05', isBreak: false, active: true },
      { id: 'jp-6', periodNumber: 6, name: 'Jam Ke-6', startTime: '10:05', endTime: '10:35', isBreak: false, active: true },
      { id: 'jp-7', periodNumber: 7, name: 'Jam Ke-7', startTime: '10:35', endTime: '11:05', isBreak: false, active: true },
      { id: 'jp-8', periodNumber: 8, name: 'Jam Ke-8', startTime: '11:05', endTime: '11:35', isBreak: false, active: true },
      { id: 'jp-break-2', periodNumber: 0, name: 'Istirahat Siang & Sholat Dzuhur', startTime: '11:35', endTime: '12:15', isBreak: true, active: true },
      { id: 'jp-9', periodNumber: 9, name: 'Jam Ke-9', startTime: '12:15', endTime: '12:45', isBreak: false, active: true },
      { id: 'jp-10', periodNumber: 10, name: 'Jam Ke-10', startTime: '12:45', endTime: '13:15', isBreak: false, active: true },
    ];
    if (init?.method === 'POST') {
      let body: any = {};
      try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
      return Promise.resolve(createJsonResponse({ success: true, period: { id: 'jp-' + Date.now(), ...body } }));
    }
    return Promise.resolve(createJsonResponse(defaultPeriods));
  }

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

  if (path.includes('/api/attendance/dhuha/scan')) {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const code = body.code || '2026001';
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return Promise.resolve(
      createJsonResponse({
        success: true,
        targetType: 'STUDENT',
        person: {
          id: 'std-1',
          name: 'Muhammad Ridwan Al-Farabi',
          identifier: code,
          classOrSubject: 'Kelas 7-A',
          gender: 'L',
        },
        record: {
          id: 'dh-' + Date.now(),
          targetType: 'STUDENT',
          personId: 'std-1',
          name: 'Muhammad Ridwan Al-Farabi',
          status: 'HADIR',
          time: currentTime,
          note: 'Scan Berhasil',
        },
        isAlreadyRecorded: false,
        message: `Alhamdulillah! Presensi Sholat Dhuha Berhasil: Muhammad Ridwan Al-Farabi (Kelas 7-A) tercatat pukul ${currentTime}.`,
      })
    );
  }

  if (path.includes('/api/attendance/dhuha/status')) {
    return Promise.resolve(createJsonResponse({ success: true }));
  }

  if (path.includes('/api/attendance/dhuha')) {
    const today = new Date().toISOString().split('T')[0];
    return Promise.resolve(
      createJsonResponse({
        date: today,
        targetType: 'STUDENT',
        items: [
          { personId: 'std-1', targetType: 'STUDENT', name: 'Muhammad Ridwan Al-Farabi', identifier: '2026001', classOrSubject: 'Kelas 7-A', gender: 'L', date: today, status: 'HADIR', time: '07:35:12', note: 'Scan Scanner' },
          { personId: 'std-2', targetType: 'STUDENT', name: 'Aisyah Putri Azzahra', identifier: '2026002', classOrSubject: 'Kelas 7-A', gender: 'P', date: today, status: 'HADIR', time: '07:36:40', note: 'Scan Kamera' },
          { personId: 'std-3', targetType: 'STUDENT', name: 'Bella Saphira', identifier: '2026003', classOrSubject: 'Kelas 7-A', gender: 'P', date: today, status: 'BERHALANGAN', time: '-', note: "Halangan Syar'i (Haid)" },
          { personId: 'std-4', targetType: 'STUDENT', name: 'Bagas Aditya Pratama', identifier: '2026004', classOrSubject: 'Kelas 7-A', gender: 'L', date: today, status: 'TIDAK_HADIR', time: '-', note: '-' },
        ],
        stats: {
          total: 4,
          hadir: 2,
          berhalangan: 1,
          belum: 1,
          rate: 50,
        },
      })
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

  // 15. User Accounts & Role Access
  if (path.includes('/api/roles/access/reset') && init?.method === 'POST') {
    const defaultRules = [
      { tabId: 'dashboard', name: 'Dashboard & Statistik', category: 'Umum', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'BENDAHARA', 'TU', 'SISWA'] },
      { tabId: 'teachers', name: 'Master Data Guru & Pegawai', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'students', name: 'Master Data Siswa & Wali', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'TU'] },
      { tabId: 'classes', name: 'Manajemen Kelas & Ruangan', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'subjects', name: 'Mata Pelajaran & Jam Pelajaran (JP)', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU', 'WALI_KELAS'] },
      { tabId: 'schedules', name: 'Jadwal Mengajar & Piket', category: 'KBM & Jadwal', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU', 'SISWA'] },
      { tabId: 'scan-kiosk', name: 'Mesin Scan Presensi (Kiosk)', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'] },
      { tabId: 'attendance-student', name: 'Presensi Kelas Siswa', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'] },
      { tabId: 'attendance-teacher', name: 'Presensi Harian Guru & Staf', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'] },
      { tabId: 'attendance-dhuha', name: 'Presensi Sholat Dhuha', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'] },
      { tabId: 'id-cards', name: 'Cetak Kartu Siswa & Guru (QR/NFC)', category: 'Administrasi', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'reports', name: 'Laporan Rekap & Statistik', category: 'Laporan', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'BENDAHARA', 'TU'] },
      { tabId: 'mod-keuangan', name: 'Modul Keuangan & SPP', category: 'Modul Ekstensi', allowedRoles: ['SUPER_ADMIN', 'BENDAHARA', 'TU'] },
      { tabId: 'mod-kesiswaan', name: 'Modul BK & Kesiswaan', category: 'Modul Ekstensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS'] },
      { tabId: 'database', name: 'Kelola Database JSON & Backup', category: 'Sistem', allowedRoles: ['SUPER_ADMIN'] },
      { tabId: 'sync', name: 'Pusat Sinkronisasi Offline', category: 'Sistem', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'settings', name: 'Pengaturan Akun & Hak Akses Role', category: 'Sistem', allowedRoles: ['SUPER_ADMIN'] },
    ];
    localStorage.setItem('siakad_mock_role_access', JSON.stringify(defaultRules));
    return Promise.resolve(createJsonResponse({ success: true, rules: defaultRules }));
  }

  if (path.includes('/api/roles/access') && init?.method === 'POST') {
    let body: any = [];
    try { body = JSON.parse((init?.body as string) || '[]'); } catch (e) {}
    localStorage.setItem('siakad_mock_role_access', JSON.stringify(body));
    return Promise.resolve(createJsonResponse({ success: true, rules: body }));
  }

  if (path.includes('/api/roles/access')) {
    const saved = localStorage.getItem('siakad_mock_role_access');
    if (saved) {
      return Promise.resolve(createJsonResponse(JSON.parse(saved)));
    }
    const defaultRules = [
      { tabId: 'dashboard', name: 'Dashboard & Statistik', category: 'Umum', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'BENDAHARA', 'TU', 'SISWA'] },
      { tabId: 'teachers', name: 'Master Data Guru & Pegawai', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'students', name: 'Master Data Siswa & Wali', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'TU'] },
      { tabId: 'classes', name: 'Manajemen Kelas & Ruangan', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'subjects', name: 'Mata Pelajaran & Jam Pelajaran (JP)', category: 'Master Data', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU', 'WALI_KELAS'] },
      { tabId: 'schedules', name: 'Jadwal Mengajar & Piket', category: 'KBM & Jadwal', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU', 'SISWA'] },
      { tabId: 'scan-kiosk', name: 'Mesin Scan Presensi (Kiosk)', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'] },
      { tabId: 'attendance-student', name: 'Presensi Kelas Siswa', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'] },
      { tabId: 'attendance-teacher', name: 'Presensi Harian Guru & Staf', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'] },
      { tabId: 'attendance-dhuha', name: 'Presensi Sholat Dhuha', category: 'Presensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'] },
      { tabId: 'id-cards', name: 'Cetak Kartu Siswa & Guru (QR/NFC)', category: 'Administrasi', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'reports', name: 'Laporan Rekap & Statistik', category: 'Laporan', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'BENDAHARA', 'TU'] },
      { tabId: 'mod-keuangan', name: 'Modul Keuangan & SPP', category: 'Modul Ekstensi', allowedRoles: ['SUPER_ADMIN', 'BENDAHARA', 'TU'] },
      { tabId: 'mod-kesiswaan', name: 'Modul BK & Kesiswaan', category: 'Modul Ekstensi', allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS'] },
      { tabId: 'database', name: 'Kelola Database JSON & Backup', category: 'Sistem', allowedRoles: ['SUPER_ADMIN'] },
      { tabId: 'sync', name: 'Pusat Sinkronisasi Offline', category: 'Sistem', allowedRoles: ['SUPER_ADMIN', 'TU'] },
      { tabId: 'settings', name: 'Pengaturan Akun & Hak Akses Role', category: 'Sistem', allowedRoles: ['SUPER_ADMIN'] },
    ];
    localStorage.setItem('siakad_mock_role_access', JSON.stringify(defaultRules));
    return Promise.resolve(createJsonResponse(defaultRules));
  }

  if (path.includes('/api/roles')) {
    return Promise.resolve(
      createJsonResponse([
        { code: 'SUPER_ADMIN', name: 'Admin Super', description: 'Akses penuh ke seluruh menu' },
        { code: 'GURU_BK', name: 'Guru BK', description: 'Bimbingan Konseling & kesiswaan' },
        { code: 'GURU', name: 'Guru', description: 'KBM dan presensi' },
        { code: 'WALI_KELAS', name: 'Wali Kelas', description: 'Monitoring kelas binaan' },
        { code: 'BENDAHARA', name: 'Bendahara', description: 'Keuangan & SPP' },
        { code: 'TU', name: 'TU', description: 'Tata usaha & kesiswaan' },
        { code: 'SISWA', name: 'Siswa', description: 'Jadwal & absensi mandiri' },
      ])
    );
  }

  if (path.includes('/api/users') && init?.method === 'POST') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const current = JSON.parse(localStorage.getItem('siakad_mock_users') || '[]');
    const newUser = {
      id: 'usr-' + Date.now(),
      username: body.username,
      fullName: body.fullName || body.username,
      email: body.email,
      roleCode: body.roleCode || 'GURU',
      roleName: body.roleCode,
      active: body.active !== undefined ? !!body.active : true,
      teacherId: body.teacherId,
      studentId: body.studentId,
      createdAt: new Date().toISOString(),
    };
    current.push(newUser);
    localStorage.setItem('siakad_mock_users', JSON.stringify(current));
    return Promise.resolve(createJsonResponse({ success: true, user: newUser }));
  }

  if (path.includes('/api/users') && init?.method === 'PUT') {
    let body: any = {};
    try { body = JSON.parse((init?.body as string) || '{}'); } catch (e) {}
    const id = path.split('/').pop();
    const current = JSON.parse(localStorage.getItem('siakad_mock_users') || '[]');
    const updated = current.map((u: any) => (u.id === id ? { ...u, ...body } : u));
    localStorage.setItem('siakad_mock_users', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true }));
  }

  if (path.includes('/api/users') && init?.method === 'DELETE') {
    const id = path.split('/').pop();
    const current = JSON.parse(localStorage.getItem('siakad_mock_users') || '[]');
    const updated = current.filter((u: any) => u.id !== id);
    localStorage.setItem('siakad_mock_users', JSON.stringify(updated));
    return Promise.resolve(createJsonResponse({ success: true }));
  }

  if (path.includes('/api/users')) {
    const current = localStorage.getItem('siakad_mock_users');
    if (current) {
      return Promise.resolve(createJsonResponse(JSON.parse(current)));
    }
    const defaultUsers = [
      { id: 'usr-admin', username: 'admin', fullName: 'Administrator Sekolah (Admin Super)', email: 'admin@sekolah.sch.id', roleCode: 'SUPER_ADMIN', roleName: 'Admin Super', active: true },
      { id: 'usr-gurubk', username: 'gurubk', fullName: 'Dra. Hj. Siti Aminah, M.Si. (Guru BK)', email: 'gurubk@sekolah.sch.id', roleCode: 'GURU_BK', roleName: 'Guru BK', active: true },
      { id: 'usr-budi', username: 'budi', fullName: 'Budi Santoso, S.Pd. (Guru Pengajar)', email: 'budi.santoso@sekolah.sch.id', roleCode: 'GURU', roleName: 'Guru', active: true, teacherId: 'tch-01' },
      { id: 'usr-walikelas', username: 'walikelas', fullName: 'Hendra Gunawan, S.Kom. (Wali Kelas VII-A)', email: 'walikelas@sekolah.sch.id', roleCode: 'WALI_KELAS', roleName: 'Wali Kelas', active: true },
      { id: 'usr-bendahara', username: 'bendahara', fullName: 'Ratna Sari, S.Pd. (Bendahara Sekolah)', email: 'bendahara@sekolah.sch.id', roleCode: 'BENDAHARA', roleName: 'Bendahara', active: true },
      { id: 'usr-tu', username: 'tu', fullName: 'Joko Purnomo, S.Pd. (Staf Tata Usaha)', email: 'tu@sekolah.sch.id', roleCode: 'TU', roleName: 'TU', active: true },
      { id: 'usr-siswa', username: 'siswa', fullName: 'Ahmad Faiz Pratama (Siswa VII-A)', email: 'siswa@sekolah.sch.id', roleCode: 'SISWA', roleName: 'Siswa', active: true, studentId: 'std-01' },
    ];
    localStorage.setItem('siakad_mock_users', JSON.stringify(defaultUsers));
    return Promise.resolve(createJsonResponse(defaultUsers));
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
