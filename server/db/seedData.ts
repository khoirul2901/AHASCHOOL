import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function getInitialSeedData() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const teacherPasswordHash = await bcrypt.hash('guru123', 10);

  const schoolId = 'sch-alhikam-001';
  const academicYearId = 'ay-2026-2027';
  const semesterId = 'sem-2026-1';

  const school = {
    id: schoolId,
    npsn: '20260901',
    name: 'SMP AL-HIKAM TERPADU',
    address: 'Jl. Pendidikan No. 45, Kompleks Terpadu',
    phone: '021-88992211',
    email: 'admin@smpalhikam.sch.id',
    principal: 'Dr. H. Ahmad Dahlan, M.Pd.',
    logoUrl: '/icon.svg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const schoolSetting = {
    id: uuidv4(),
    schoolId,
    teacherAttendanceMode: 'AUTO_HADIR', // AUTO_HADIR, CHECK_IN, AUTO_HADIR_WITH_CONFIRMATION
    lateToleranceMinutes: 10,
    autoSyncIntervalSec: 30,
    allowOfflineAttendance: true,
    updatedAt: new Date().toISOString(),
  };

  const academicYear = {
    id: academicYearId,
    schoolId,
    name: '2026/2027',
    startDate: '2026-07-15T00:00:00.000Z',
    endDate: '2027-06-25T00:00:00.000Z',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  const semester = {
    id: semesterId,
    academicYearId,
    semesterNumber: 1,
    name: 'Semester Ganjil',
    active: true,
    startDate: '2026-07-15T00:00:00.000Z',
    endDate: '2026-12-20T00:00:00.000Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  // Roles
  const roles = [
    { id: 'role-superadmin', code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Akses penuh ke seluruh sistem', isSystem: true },
    { id: 'role-kepsek', code: 'KEPALA_SEKOLAH', name: 'Kepala Sekolah', description: 'Monitoring dan pelaporan seluruh unit', isSystem: true },
    { id: 'role-wakasek', code: 'WAKASEK', name: 'Wakil Kepala Sekolah', description: 'Manajemen kurikulum dan kesiswaan', isSystem: true },
    { id: 'role-admin', code: 'ADMIN_SEKOLAH', name: 'Admin Sekolah', description: 'Pengelolaan data operasional', isSystem: true },
    { id: 'role-operator', code: 'OPERATOR', name: 'Operator Dapodik / SI', description: 'Entri dan sinkronisasi data', isSystem: true },
    { id: 'role-tu', code: 'TATA_USAHA', name: 'Tata Usaha', description: 'Administrasi dan persuratan', isSystem: true },
    { id: 'role-bendahara', code: 'BENDAHARA', name: 'Bendahara Sekolah', description: 'Administrasi keuangan', isSystem: true },
    { id: 'role-guru', code: 'GURU', name: 'Guru Pengajar', description: 'Jadwal, absensi mengajar, dan nilai', isSystem: true },
    { id: 'role-piket', code: 'GURU_PIKET', name: 'Guru Piket', description: 'Absensi harian, kontrol gerbang, dan rekap piket', isSystem: true },
    { id: 'role-walikelas', code: 'WALI_KELAS', name: 'Wali Kelas', description: 'Monitoring absensi dan kesiswaan kelas binaan', isSystem: true },
    { id: 'role-perpus', code: 'PETUGAS_PERPUSTAKAAN', name: 'Petugas Perpustakaan', description: 'Layanan perpustakaan', isSystem: true },
    { id: 'role-sarpras', code: 'PETUGAS_SARPRAS', name: 'Petugas Sarpras', description: 'Inventaris dan ruangan', isSystem: true },
    { id: 'role-siswa', code: 'SISWA', name: 'Siswa', description: 'Melihat absensi dan jadwal pribadi', isSystem: true },
    { id: 'role-ortu', code: 'ORANG_TUA', name: 'Orang Tua / Wali', description: 'Monitoring absensi dan nilai anak', isSystem: true },
  ];

  // Permissions
  const permissions = [
    { id: 'perm-stu-view', code: 'student.view', name: 'Lihat Siswa', module: 'CORE' },
    { id: 'perm-stu-create', code: 'student.create', name: 'Tambah Siswa', module: 'CORE' },
    { id: 'perm-stu-update', code: 'student.update', name: 'Ubah Siswa', module: 'CORE' },
    { id: 'perm-stu-delete', code: 'student.delete', name: 'Hapus Siswa', module: 'CORE' },
    { id: 'perm-tch-view', code: 'teacher.view', name: 'Lihat Guru', module: 'CORE' },
    { id: 'perm-tch-create', code: 'teacher.create', name: 'Tambah Guru', module: 'CORE' },
    { id: 'perm-tch-update', code: 'teacher.update', name: 'Ubah Guru', module: 'CORE' },
    { id: 'perm-tch-delete', code: 'teacher.delete', name: 'Hapus Guru', module: 'CORE' },
    { id: 'perm-att-view', code: 'attendance.view', name: 'Lihat Absensi', module: 'ATTENDANCE' },
    { id: 'perm-att-create', code: 'attendance.create', name: 'Input Absensi', module: 'ATTENDANCE' },
    { id: 'perm-att-update', code: 'attendance.update', name: 'Ubah Absensi', module: 'ATTENDANCE' },
    { id: 'perm-att-delete', code: 'attendance.delete', name: 'Hapus Absensi', module: 'ATTENDANCE' },
    { id: 'perm-att-correct', code: 'attendance.correct', name: 'Koreksi Absensi', module: 'ATTENDANCE' },
    { id: 'perm-att-export', code: 'attendance.export', name: 'Ekspor Absensi', module: 'ATTENDANCE' },
    { id: 'perm-sch-view', code: 'schedule.view', name: 'Lihat Jadwal', module: 'ATTENDANCE' },
    { id: 'perm-sch-create', code: 'schedule.create', name: 'Tambah Jadwal', module: 'ATTENDANCE' },
    { id: 'perm-sch-update', code: 'schedule.update', name: 'Ubah Jadwal', module: 'ATTENDANCE' },
    { id: 'perm-sch-delete', code: 'schedule.delete', name: 'Hapus Jadwal', module: 'ATTENDANCE' },
    { id: 'perm-rep-view', code: 'report.view', name: 'Lihat Laporan', module: 'ATTENDANCE' },
    { id: 'perm-rep-export', code: 'report.export', name: 'Ekspor Laporan', module: 'ATTENDANCE' },
    { id: 'perm-sys-manage', code: 'system.manage', name: 'Kelola Sistem & Sinkronisasi', module: 'CORE' },
  ];

  // Role Permissions
  const rolePermissions: any[] = [];
  // Superadmin has all permissions
  permissions.forEach((p) => {
    rolePermissions.push({ id: uuidv4(), roleId: 'role-superadmin', permissionId: p.id });
    rolePermissions.push({ id: uuidv4(), roleId: 'role-admin', permissionId: p.id });
  });

  // Guru permissions
  ['student.view', 'attendance.view', 'attendance.create', 'attendance.update', 'schedule.view', 'report.view'].forEach((code) => {
    const perm = permissions.find((p) => p.code === code);
    if (perm) rolePermissions.push({ id: uuidv4(), roleId: 'role-guru', permissionId: perm.id });
  });

  // Guru Piket permissions
  ['student.view', 'teacher.view', 'attendance.view', 'attendance.create', 'attendance.update', 'schedule.view', 'report.view'].forEach((code) => {
    const perm = permissions.find((p) => p.code === code);
    if (perm) rolePermissions.push({ id: uuidv4(), roleId: 'role-piket', permissionId: perm.id });
  });

  // Users & Multi-role assignment
  const adminUserId = 'usr-admin-01';
  const budiUserId = 'usr-guru-budi';

  const users = [
    {
      id: adminUserId,
      schoolId,
      username: 'admin',
      passwordHash,
      fullName: 'Administrator Sekolah Terpadu',
      email: 'admin@sekolah.sch.id',
      phone: '081234567890',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    {
      id: budiUserId,
      schoolId,
      username: 'budi',
      passwordHash: teacherPasswordHash,
      fullName: 'Budi Santoso, S.Pd.',
      email: 'budi.santoso@sekolah.sch.id',
      phone: '081398765432',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  ];

  // User Roles (Budi has multiple roles: GURU, GURU_PIKET, WALI_KELAS)
  const userRoles = [
    { id: uuidv4(), userId: adminUserId, roleId: 'role-superadmin' },
    { id: uuidv4(), userId: adminUserId, roleId: 'role-admin' },
    { id: uuidv4(), userId: budiUserId, roleId: 'role-guru' },
    { id: uuidv4(), userId: budiUserId, roleId: 'role-piket' },
    { id: uuidv4(), userId: budiUserId, roleId: 'role-walikelas' },
  ];

  // 10 Teachers
  const teacherBudiId = 'tch-budi-01';
  const teachers = [
    {
      id: teacherBudiId,
      userId: budiUserId,
      nip: '198503152010011002',
      name: 'Budi Santoso, S.Pd.',
      email: 'budi.santoso@sekolah.sch.id',
      phone: '081398765432',
      gender: 'L',
      address: 'Jl. Merpati No. 12, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-siti-02',
      nip: '198807202012022001',
      name: 'Siti Rahmawati, M.Pd.',
      email: 'siti.rahmawati@sekolah.sch.id',
      phone: '081211223344',
      gender: 'P',
      address: 'Jl. Melati No. 5, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-agus-03',
      nip: '197902102005011003',
      name: 'Drs. Agus Supriyadi',
      email: 'agus.supriyadi@sekolah.sch.id',
      phone: '081255667788',
      gender: 'L',
      address: 'Jl. Mawar No. 18, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-dewi-04',
      nip: '199004122015022004',
      name: 'Dewi Lestari, S.Si.',
      email: 'dewi.lestari@sekolah.sch.id',
      phone: '081333445566',
      gender: 'P',
      address: 'Jl. Kenanga No. 8, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-hendra-05',
      nip: '198211052008011005',
      name: 'Hendra Gunawan, S.Kom.',
      email: 'hendra.gunawan@sekolah.sch.id',
      phone: '081377889900',
      gender: 'L',
      address: 'Jl. Anggrek No. 22, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-ratna-06',
      nip: '199201182018022006',
      name: 'Ratna Sari, S.Pd.',
      email: 'ratna.sari@sekolah.sch.id',
      phone: '081299001122',
      gender: 'P',
      address: 'Jl. Dahlia No. 14, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-fauzi-07',
      nip: '198606142011011007',
      name: 'Ahmad Fauzi, S.Ag.',
      email: 'ahmad.fauzi@sekolah.sch.id',
      phone: '081244556677',
      gender: 'L',
      address: 'Jl. Cempaka No. 30, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-rina-08',
      nip: '199109252016022008',
      name: 'Rina Handayani, S.Sn.',
      email: 'rina.handayani@sekolah.sch.id',
      phone: '081388990011',
      gender: 'P',
      address: 'Jl. Flamboyan No. 7, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-joko-09',
      nip: '198408102009011009',
      name: 'Joko Purnomo, S.Pd.Jas.',
      email: 'joko.purnomo@sekolah.sch.id',
      phone: '081233221100',
      gender: 'L',
      address: 'Jl. Kamboja No. 9, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tch-maya-10',
      nip: '199303302019022010',
      name: 'Maya Nurhaliza, S.Hum.',
      email: 'maya.nurhaliza@sekolah.sch.id',
      phone: '081277665544',
      gender: 'P',
      address: 'Jl. Teratai No. 11, Kota',
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 10 Subjects
  const subjects = [
    { id: 'sbj-mtk', code: 'MTK', name: 'Matematika', description: 'Matematika Terpadu Kurikulum Merdeka', active: true, version: 1 },
    { id: 'sbj-bin', code: 'BIN', name: 'Bahasa Indonesia', description: 'Literasi dan Bahasa Indonesia', active: true, version: 1 },
    { id: 'sbj-big', code: 'BIG', name: 'Bahasa Inggris', description: 'Bahasa Inggris Komunikatif', active: true, version: 1 },
    { id: 'sbj-ipa', code: 'IPA', name: 'Ilmu Pengetahuan Alam', description: 'Fisika, Biologi, Kimia Dasar', active: true, version: 1 },
    { id: 'sbj-ips', code: 'IPS', name: 'Ilmu Pengetahuan Sosial', description: 'Geografi, Sejarah, Ekonomi Terpadu', active: true, version: 1 },
    { id: 'sbj-pai', code: 'PAI', name: 'Pendidikan Agama Islam', description: 'Pendidikan Agama & Budi Pekerti', active: true, version: 1 },
    { id: 'sbj-pkn', code: 'PPKN', name: 'Pendidikan Pancasila & Kewarganegaraan', description: 'Kewarganegaraan dan Konstitusi', active: true, version: 1 },
    { id: 'sbj-pjk', code: 'PJOK', name: 'Pendidikan Jasmani & Olahraga', description: 'Olahraga dan Kesehatan', active: true, version: 1 },
    { id: 'sbj-inf', code: 'INF', name: 'Informatika', description: 'Algoritma, Pemrograman, Literasi Digital', active: true, version: 1 },
    { id: 'sbj-snk', code: 'SNB', name: 'Seni Budaya', description: 'Seni Rupa dan Seni Musik', active: true, version: 1 },
  ];

  // 5 Classes
  const classes = [
    { id: 'cls-7a', name: '7A', grade: 7, major: 'Umum', homeroomTeacherId: 'tch-siti-02', academicYearId, active: true, version: 1 },
    { id: 'cls-7b', name: '7B', grade: 7, major: 'Umum', homeroomTeacherId: 'tch-dewi-04', academicYearId, active: true, version: 1 },
    { id: 'cls-8a', name: '8A', grade: 8, major: 'Umum', homeroomTeacherId: teacherBudiId, academicYearId, active: true, version: 1 }, // Budi is homeroom of 8A!
    { id: 'cls-8b', name: '8B', grade: 8, major: 'Umum', homeroomTeacherId: 'tch-agus-03', academicYearId, active: true, version: 1 },
    { id: 'cls-9a', name: '9A', grade: 9, major: 'Umum', homeroomTeacherId: 'tch-hendra-05', academicYearId, active: true, version: 1 },
  ];

  // 50 Students (10 per class)
  const students: any[] = [];
  const studentNames = [
    // 7A (1-10)
    ['Aditya Pratama', 'L'], ['Anisa Putri', 'P'], ['Bagas Kurniawan', 'L'], ['Citra Ayu', 'P'], ['Dimas Saputra', 'L'],
    ['Eka Rahayu', 'P'], ['Fadli Rahman', 'L'], ['Gita Savitri', 'P'], ['Hafiz Ramadhan', 'L'], ['Indah Permata', 'P'],
    // 7B (11-20)
    ['Jihan Aulia', 'P'], ['Kurnia Sandy', 'L'], ['Laras Wati', 'P'], ['Muhammad Rizki', 'L'], ['Nabila Zahra', 'P'],
    ['Oki Setiawan', 'L'], ['Putri Amelia', 'P'], ['Qori Syahputra', 'L'], ['Rian Hidayat', 'L'], ['Salma Khoirun', 'P'],
    // 8A (21-30) - Kelas Budi Santoso
    ['Taufiq Ismail', 'L'], ['Umar Faruq', 'L'], ['Vina Melati', 'P'], ['Wahyu Nugroho', 'L'], ['Xenia Maharani', 'P'],
    ['Yusuf Bachtiar', 'L'], ['Zahra Salsabila', 'P'], ['Alif Ramadhan', 'L'], ['Bella Anggraini', 'P'], ['Candra Wijaya', 'L'],
    // 8B (31-40)
    ['Deni Herdian', 'L'], ['Elsa Safira', 'P'], ['Fandi Ahmad', 'L'], ['Ghea Nurul', 'P'], ['Hadi Purnomo', 'L'],
    ['Intan Suci', 'P'], ['Jerry Saputra', 'L'], ['Kirana Maharani', 'P'], ['Lukman Hakim', 'L'], ['Mira Santika', 'P'],
    // 9A (41-50)
    ['Niko Ardiansyah', 'L'], ['Olivia Syafira', 'P'], ['Panji Gumilang', 'L'], ['Rara Kusuma', 'P'], ['Surya Darma', 'L'],
    ['Tania Pratiwi', 'P'], ['Utari Lestari', 'P'], ['Vicky Prasetyo', 'L'], ['Wulan Dari', 'P'], ['Zidan Maulana', 'L'],
  ];

  const classIds = ['cls-7a', 'cls-7b', 'cls-8a', 'cls-8b', 'cls-9a'];
  studentNames.forEach(([name, gender], idx) => {
    const classIdx = Math.floor(idx / 10);
    const assignedClassId = classIds[classIdx];
    const nisNum = 2026001 + idx;
    students.push({
      id: `std-${idx + 1}`,
      nis: String(nisNum),
      nisn: `00${nisNum}892`,
      name,
      gender: gender as 'L' | 'P',
      birthDate: '2012-05-15',
      classId: assignedClassId,
      parentName: `Bpk/Ibu ${name.split(' ')[0]}`,
      parentPhone: `08129000${(100 + idx).toString().slice(-3)}`,
      active: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Teaching Schedules
  // Guru Budi:
  // - Senin: 07:30 - 08:15 MTK di 8A (Ruang 201)
  // - Senin: 08:15 - 09:00 MTK di 8B (Ruang 202)
  // - Selasa: 07:30 - 09:00 MTK di 9A (Ruang 301)
  // Other teachers also have schedules
  const teachingSchedules = [
    {
      id: 'sch-budi-8a-senin',
      teacherId: teacherBudiId,
      classId: 'cls-8a',
      subjectId: 'sbj-mtk',
      academicYearId,
      semesterId,
      dayOfWeek: 1, // Senin
      startTime: '07:30',
      endTime: '08:15',
      room: 'R. 201',
      active: true,
      version: 1,
    },
    {
      id: 'sch-budi-8b-senin',
      teacherId: teacherBudiId,
      classId: 'cls-8b',
      subjectId: 'sbj-mtk',
      academicYearId,
      semesterId,
      dayOfWeek: 1, // Senin
      startTime: '08:15',
      endTime: '09:00',
      room: 'R. 202',
      active: true,
      version: 1,
    },
    {
      id: 'sch-siti-7a-senin',
      teacherId: 'tch-siti-02',
      classId: 'cls-7a',
      subjectId: 'sbj-bin',
      academicYearId,
      semesterId,
      dayOfWeek: 1,
      startTime: '07:30',
      endTime: '08:45',
      room: 'R. 101',
      active: true,
      version: 1,
    },
    {
      id: 'sch-agus-7b-senin',
      teacherId: 'tch-agus-03',
      classId: 'cls-7b',
      subjectId: 'sbj-ips',
      academicYearId,
      semesterId,
      dayOfWeek: 1,
      startTime: '07:30',
      endTime: '08:45',
      room: 'R. 102',
      active: true,
      version: 1,
    },
    {
      id: 'sch-dewi-9a-senin',
      teacherId: 'tch-dewi-04',
      classId: 'cls-9a',
      subjectId: 'sbj-ipa',
      academicYearId,
      semesterId,
      dayOfWeek: 1,
      startTime: '07:30',
      endTime: '08:45',
      room: 'R. 301',
      active: true,
      version: 1,
    },
  ];

  // Today's date string YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Picket Schedules:
  // Guru Budi has picket today: 07:00 - 14:00 at "Pos Utama / Lobby Utama"
  // Plus Siti on picket duty as well
  const picketSchedules = [
    {
      id: 'pkt-budi-today',
      teacherId: teacherBudiId,
      date: today,
      startTime: '07:00',
      endTime: '14:00',
      location: 'Pos Utama & Lobby Sekolah',
      active: true,
      version: 1,
    },
    {
      id: 'pkt-agus-today',
      teacherId: 'tch-agus-03',
      date: today,
      startTime: '07:00',
      endTime: '14:00',
      location: 'Gerbang Belakang & Lapangan',
      active: true,
      version: 1,
    },
  ];

  // Holidays
  const holidays = [
    { id: uuidv4(), date: '2026-08-17', name: 'Hari Kemerdekaan RI Ke-81', description: 'Libur Nasional', isNational: true },
    { id: uuidv4(), date: '2026-10-01', name: 'Hari Kesaktian Pancasila', description: 'Upacara Nasional', isNational: false },
    { id: uuidv4(), date: '2026-12-25', name: 'Hari Raya Natal', description: 'Libur Nasional', isNational: true },
  ];

  // Module Registry
  const modules = [
    {
      id: 'mod-core',
      code: 'CORE',
      name: 'Platform Core & Pengaturan',
      description: 'Manajemen sekolah, user, role, permission, dan audit log.',
      icon: 'Settings',
      route: '/settings',
      status: 'ACTIVE',
      enabled: true,
      sortOrder: 1,
      version: '1.0.0',
    },
    {
      id: 'mod-att',
      code: 'ATTENDANCE',
      name: 'Modul Absensi Sekolah',
      description: 'Absensi guru mengajar, absensi piket, absensi siswa, dan koreksi.',
      icon: 'ClipboardCheck',
      route: '/attendance',
      status: 'ACTIVE',
      enabled: true,
      sortOrder: 2,
      version: '1.0.0',
    },
    {
      id: 'mod-kes',
      code: 'KESISWAAN',
      name: 'Kesiswaan',
      description: 'Data mutasi siswa, catatan pelanggaran, buku induk, prestasi, dan alumni.',
      icon: 'Users',
      route: '/kesiswaan',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 3,
      version: '1.0.0',
    },
    {
      id: 'mod-akd',
      code: 'AKADEMIK',
      name: 'Akademik & Kurikulum',
      description: 'Kurikulum merdeka, silabus, jurnal mengajar, penilaian, dan e-rapor.',
      icon: 'GraduationCap',
      route: '/akademik',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 4,
      version: '1.0.0',
    },
    {
      id: 'mod-kpg',
      code: 'KEPEGAWAIAN',
      name: 'Kepegawaian (SDM)',
      description: 'Manajemen berkas guru & tenaga kependidikan, kenaikan pangkat, cuti, dan dinas luar.',
      icon: 'Briefcase',
      route: '/kepegawaian',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 5,
      version: '1.0.0',
    },
    {
      id: 'mod-keu',
      code: 'KEUANGAN',
      name: 'Keuangan & SPP',
      description: 'Billing tagihan, pembayaran SPP, kas bendahara, pemasukan dan pengeluaran.',
      icon: 'Wallet',
      route: '/keuangan',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 6,
      version: '1.0.0',
    },
    {
      id: 'mod-srp',
      code: 'SARPRAS',
      name: 'Sarana & Prasarana',
      description: 'Inventarisasi aset barang, monitoring kondisi ruangan, peminjaman, dan pemeliharaan.',
      icon: 'Building2',
      route: '/sarpras',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 7,
      version: '1.0.0',
    },
    {
      id: 'mod-pus',
      code: 'PERPUSTAKAAN',
      name: 'Perpustakaan Terpadu',
      description: 'Katalog buku, sirkulasi peminjaman/pengembalian, kartu anggota, dan denda.',
      icon: 'BookOpen',
      route: '/perpustakaan',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 8,
      version: '1.0.0',
    },
    {
      id: 'mod-pdb',
      code: 'PPDB',
      name: 'PPDB Online',
      description: 'Pendaftaran peserta didik baru, seleksi nilai/zonasi, verifikasi berkas, dan daftar ulang.',
      icon: 'UserPlus',
      route: '/ppdb',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 9,
      version: '1.0.0',
    },
    {
      id: 'mod-srt',
      code: 'SURAT',
      name: 'Surat & Tata Usaha',
      description: 'Surat masuk, surat keluar, nomor agenda otomatis, disposisi digital, dan arsip.',
      icon: 'Mail',
      route: '/surat',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 10,
      version: '1.0.0',
    },
    {
      id: 'mod-kom',
      code: 'KOMUNIKASI',
      name: 'Komunikasi & Pengumuman',
      description: 'Broadcasting pengumuman sekolah, notifikasi WhatsApp gateway/SMS ke wali murid.',
      icon: 'Megaphone',
      route: '/komunikasi',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 11,
      version: '1.0.0',
    },
    {
      id: 'mod-lap',
      code: 'LAPORAN',
      name: 'Pusat Pelaporan & Analitik',
      description: 'Eksekutif dashboard, rekapitulasi cross-module, dan ekspor data agregat.',
      icon: 'BarChart3',
      route: '/reports',
      status: 'PLANNED',
      enabled: false,
      sortOrder: 12,
      version: '1.0.0',
    },
  ];

  return {
    school,
    schoolSetting,
    academicYear,
    semester,
    roles,
    permissions,
    rolePermissions,
    users,
    userRoles,
    teachers,
    subjects,
    classes,
    students,
    teachingSchedules,
    picketSchedules,
    holidays,
    modules,
    teacherSubstitutions: [],
    teacherAttendance: [],
    studentAttendance: [],
    attendanceCorrections: [],
    auditLogs: [
      {
        id: uuidv4(),
        userId: adminUserId,
        action: 'SYSTEM_INIT',
        entity: 'school',
        entityId: schoolId,
        description: 'Inisialisasi sistem SIAKAD SEKOLAH TERPADU Fase 1',
        createdAt: new Date().toISOString(),
      },
    ],
    syncDevices: [],
    syncChanges: [],
    syncConflicts: [],
  };
}
