import { Router } from 'express';
import { AuthService } from './services/authService.js';
import { TeacherService } from './services/teacherService.js';
import { StudentService } from './services/studentService.js';
import { ClassService, SubjectService } from './services/classService.js';
import { AcademicService } from './services/academicService.js';
import { ScheduleService } from './services/scheduleService.js';
import { AttendanceEngine } from './services/attendanceEngine.js';
import { AttendanceService } from './services/attendanceService.js';
import { ReportService } from './services/reportService.js';
import { AuditService } from './services/auditService.js';
import { SyncService } from './services/syncService.js';
import { ModuleService } from './services/moduleService.js';
import { dbManager } from './db/database.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const session = await AuthService.login(username, password);
    if (!session) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
  }
});

apiRouter.get('/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Sesi tidak valid.' });
  }
  const session = AuthService.getUserSession(userId);
  if (!session) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ session });
});

apiRouter.post('/auth/logout', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    AuditService.log({
      userId,
      action: 'LOGOUT',
      entity: 'users',
      entityId: userId,
      description: 'Pengguna keluar dari aplikasi',
    });
  }
  res.json({ success: true });
});

// ==========================================
// 2. MASTER DATA: TEACHERS
// ==========================================
apiRouter.get('/teachers', (req, res) => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = TeacherService.getAll({ search, page, limit });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/teachers', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const teacher = TeacherService.create(req.body, userId);
    res.status(201).json({ success: true, teacher });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/teachers/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const teacher = TeacherService.update(req.params.id, req.body, userId);
    res.json({ success: true, teacher });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/teachers/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    TeacherService.delete(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. MASTER DATA: STUDENTS
// ==========================================
apiRouter.get('/students', (req, res) => {
  try {
    const classId = req.query.classId as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = StudentService.getAll({ classId, search, page, limit });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/students', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const student = StudentService.create(req.body, userId);
    res.status(201).json({ success: true, student });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/students/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const student = StudentService.update(req.params.id, req.body, userId);
    res.json({ success: true, student });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/students/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    StudentService.delete(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Batch Import Students
apiRouter.post('/students/import', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data import tidak valid atau kosong.' });
    }

    const created: any[] = [];
    const errors: string[] = [];

    items.forEach((item, index) => {
      try {
        const student = StudentService.create(item, userId);
        created.push(student);
      } catch (err: any) {
        errors.push(`Baris ${index + 1}: ${err.message}`);
      }
    });

    res.json({
      success: true,
      importedCount: created.length,
      errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. MASTER DATA: CLASSES & SUBJECTS
// ==========================================
apiRouter.get('/classes', (req, res) => {
  try {
    const list = ClassService.getAll();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/classes', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const cls = ClassService.create(req.body, userId);
    res.status(201).json({ success: true, class: cls });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/subjects', (req, res) => {
  try {
    const list = SubjectService.getAll();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/subjects', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const sbj = SubjectService.create(req.body, userId);
    res.status(201).json({ success: true, subject: sbj });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. ACADEMIC & CALENDAR
// ==========================================
apiRouter.get('/academic/year', (req, res) => {
  res.json(AcademicService.getAcademicYear());
});

apiRouter.get('/academic/semester', (req, res) => {
  res.json(AcademicService.getSemester());
});

apiRouter.get('/academic/holidays', (req, res) => {
  res.json(AcademicService.getHolidays());
});

apiRouter.post('/academic/holidays', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const holiday = AcademicService.addHoliday(req.body, userId);
    res.status(201).json({ success: true, holiday });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. SCHEDULES (TEACHING & PICKET)
// ==========================================
apiRouter.get('/schedules/teaching', (req, res) => {
  try {
    const dayOfWeek = req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : undefined;
    const teacherId = req.query.teacherId as string;
    const classId = req.query.classId as string;
    const list = ScheduleService.getTeachingSchedules({ dayOfWeek, teacherId, classId });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/schedules/teaching', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const schedule = ScheduleService.createTeachingSchedule(req.body, userId);
    res.status(201).json({ success: true, schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/schedules/picket', (req, res) => {
  try {
    const date = req.query.date as string;
    const teacherId = req.query.teacherId as string;
    const list = ScheduleService.getPicketSchedules({ date, teacherId });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/schedules/picket', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const picket = ScheduleService.createPicketSchedule(req.body, userId);
    res.status(201).json({ success: true, picket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/schedules/substitute', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const sub = ScheduleService.assignSubstitute(req.body, userId);
    res.status(201).json({ success: true, substitution: sub });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. ATTENDANCE ENGINE & OPERATIONS
// ==========================================
apiRouter.post('/attendance/generate', (req, res) => {
  try {
    const date = req.body.date as string;
    const result = AttendanceEngine.generateDailyAttendance(date);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/attendance/teacher', (req, res) => {
  try {
    const date = req.query.date as string;
    const teacherId = req.query.teacherId as string;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const list = AttendanceService.getTeacherAttendances({ date, teacherId, type, status });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/attendance/teacher/checkin', (req, res) => {
  try {
    const { teacherId, attendanceId, checkInTime } = req.body;
    if (!teacherId || !attendanceId) {
      return res.status(400).json({ error: 'Parameter check-in tidak lengkap.' });
    }
    const att = AttendanceService.teacherCheckIn(teacherId, attendanceId, checkInTime);
    res.json({ success: true, attendance: att });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/attendance/student', (req, res) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const classId = req.query.classId as string;
    const scheduleId = req.query.scheduleId as string;

    if (!classId) {
      return res.status(400).json({ error: 'Kelas harus dipilih.' });
    }

    const list = AttendanceService.getStudentAttendances({ date, classId, scheduleId });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/attendance/student', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { records, meta } = req.body;
    if (!records || !meta) {
      return res.status(400).json({ error: 'Data absensi tidak lengkap.' });
    }
    const result = AttendanceService.saveStudentAttendances(records, meta, userId);
    res.json({ success: true, count: result.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/attendance/correct', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'admin';
    const correction = AttendanceService.correctAttendance(req.body, userId);
    res.json({ success: true, correction });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/attendance/scan', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'scanner';
    const { code, type, method, classId, scheduleId, date, time } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Kode barcode atau QR code wajib diisi.' });
    }
    const result = AttendanceService.processScanAttendance({
      code,
      type,
      method,
      classId,
      scheduleId,
      date,
      time,
      currentUserId: userId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. DASHBOARD & REPORTS
// ==========================================
apiRouter.get('/dashboard/stats', (req, res) => {
  try {
    const date = req.query.date as string;
    const stats = AttendanceService.getDashboardStats(date);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/students', (req, res) => {
  try {
    const { startDate, endDate, classId, status } = req.query as any;
    const list = ReportService.getStudentReport({ startDate, endDate, classId, status });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/teachers', (req, res) => {
  try {
    const { startDate, endDate, teacherId, type, status } = req.query as any;
    const list = ReportService.getTeacherReport({ startDate, endDate, teacherId, type, status });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/students', (req, res) => {
  try {
    const { startDate, endDate, classId, status } = req.query as any;
    const list = ReportService.getStudentReport({ startDate, endDate, classId, status });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'studentNis', label: 'NIS' },
      { key: 'studentName', label: 'Nama Siswa' },
      { key: 'className', label: 'Kelas' },
      { key: 'status', label: 'Status' },
      { key: 'note', label: 'Keterangan' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi_siswa.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/teachers', (req, res) => {
  try {
    const { startDate, endDate, teacherId, type, status } = req.query as any;
    const list = ReportService.getTeacherReport({ startDate, endDate, teacherId, type, status });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'teacherNip', label: 'NIP' },
      { key: 'teacherName', label: 'Nama Guru' },
      { key: 'type', label: 'Jenis Tugas' },
      { key: 'scheduled', label: 'Jadwal' },
      { key: 'actualTime', label: 'Waktu Hadir' },
      { key: 'status', label: 'Status' },
      { key: 'note', label: 'Keterangan' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi_guru.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. MODULE REGISTRY, AUDIT & SYSTEM SETTINGS
// ==========================================
apiRouter.get('/modules', (req, res) => {
  res.json(ModuleService.getAll());
});

apiRouter.get('/settings', (req, res) => {
  const store = dbManager.getStore();
  res.json({
    school: store.school,
    settings: store.schoolSetting,
  });
});

apiRouter.post('/settings', (req, res) => {
  const store = dbManager.getStore();
  const userId = req.headers['x-user-id'] as string;
  if (req.body.settings) {
    Object.assign(store.schoolSetting, req.body.settings);
    store.schoolSetting.updatedAt = new Date().toISOString();
  }
  if (req.body.school) {
    Object.assign(store.school, req.body.school);
    store.school.updatedAt = new Date().toISOString();
  }
  dbManager.saveSync();

  AuditService.log({
    userId,
    action: 'UPDATE',
    entity: 'school_settings',
    description: 'Pembaruan konfigurasi sekolah / absensi',
  });

  res.json({ success: true });
});

apiRouter.get('/audit-logs', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(AuditService.getLogs(limit, page));
});

// ==========================================
// 10. SYNC ENGINE (PUSH, PULL, CONFLICTS)
// ==========================================
apiRouter.post('/sync/push', (req, res) => {
  try {
    const { deviceId, changes } = req.body;
    if (!deviceId || !Array.isArray(changes)) {
      return res.status(400).json({ error: 'Format payload sinkronisasi tidak valid.' });
    }
    const result = SyncService.push(deviceId, changes);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/sync/pull', (req, res) => {
  try {
    const since = req.query.since as string;
    const data = SyncService.pull(since);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/sync/conflicts', (req, res) => {
  res.json(SyncService.getConflicts());
});

apiRouter.post('/sync/conflicts/resolve', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { conflictId, resolution } = req.body;
    const resolved = SyncService.resolveConflict(conflictId, resolution, userId);
    res.json({ success: true, conflict: resolved });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/sync/status', (req, res) => {
  const store = dbManager.getStore();
  res.json({
    status: 'ONLINE',
    serverTime: new Date().toISOString(),
    activeDevicesCount: store.syncDevices.length,
    unresolvedConflictsCount: store.syncConflicts.filter((c) => !c.resolvedAt).length,
  });
});

// ==========================================
// 11. DATABASE MANAGEMENT & BACKUPS
// ==========================================
apiRouter.get('/database/stats', (req, res) => {
  try {
    const store = dbManager.getStore();
    const tables = [
      { name: 'teachers', label: 'Data Guru & Pendidik', count: store.teachers?.length || 0 },
      { name: 'students', label: 'Data Siswa', count: store.students?.length || 0 },
      { name: 'classes', label: 'Rombongan Belajar (Kelas)', count: store.classes?.length || 0 },
      { name: 'subjects', label: 'Mata Pelajaran', count: store.subjects?.length || 0 },
      { name: 'teachingSchedules', label: 'Jadwal Pelajaran', count: store.teachingSchedules?.length || 0 },
      { name: 'picketSchedules', label: 'Jadwal Guru Piket', count: store.picketSchedules?.length || 0 },
      { name: 'studentAttendance', label: 'Presensi Siswa', count: store.studentAttendance?.length || 0 },
      { name: 'teacherAttendance', label: 'Presensi Guru', count: store.teacherAttendance?.length || 0 },
      { name: 'attendanceCorrections', label: 'Koreksi Presensi', count: store.attendanceCorrections?.length || 0 },
      { name: 'holidays', label: 'Kalender & Libur', count: store.holidays?.length || 0 },
      { name: 'users', label: 'Pengguna Sistem', count: store.users?.length || 0 },
      { name: 'auditLogs', label: 'Log Aktivitas Audit', count: store.auditLogs?.length || 0 },
    ];

    res.json({
      dbPath: 'data/siakad-db.json',
      tables,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/backup', (req, res) => {
  try {
    const store = dbManager.getStore();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `siakad-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(store, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/database/restore', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object' || !Array.isArray(data.students) || !Array.isArray(data.teachers)) {
      return res.status(400).json({ error: 'Format file backup JSON tidak valid atau struktur tidak sesuai.' });
    }

    const store = dbManager.getStore();
    Object.assign(store, data);
    dbManager.saveSync();

    AuditService.log({
      userId: (req.headers['x-user-id'] as string) || 'admin',
      action: 'RESTORE_DATABASE',
      entity: 'database',
      description: 'Melakukan restore database dari file JSON backup',
    });

    res.json({ success: true, message: 'Database berhasil dipulihkan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/database/reset', async (req, res) => {
  try {
    await dbManager.resetToSeed();

    AuditService.log({
      userId: (req.headers['x-user-id'] as string) || 'admin',
      action: 'RESET_DATABASE',
      entity: 'database',
      description: 'Reset database ke seed data awal demo',
    });

    res.json({ success: true, message: 'Database berhasil di-reset ke data bawaan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

