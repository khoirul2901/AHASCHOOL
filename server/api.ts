import { Router } from 'express';
import { AuthService } from './services/authService.js';
import { TeacherService } from './services/teacherService.js';
import { StudentService } from './services/studentService.js';
import { ClassService, SubjectService } from './services/classService.js';
import { AcademicService, LessonPeriodService } from './services/academicService.js';
import { ScheduleService } from './services/scheduleService.js';
import { AttendanceEngine } from './services/attendanceEngine.js';
import { AttendanceService } from './services/attendanceService.js';
import { DhuhaService } from './services/dhuhaService.js';
import { ReportService } from './services/reportService.js';
import { AuditService } from './services/auditService.js';
import { SyncService } from './services/syncService.js';
import { ModuleService } from './services/moduleService.js';
import { UserService } from './services/userService.js';
import fs from 'fs';
import { dbManager, SEPARATED_FILES } from './db/database.js';

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
// USER ACCOUNTS & ROLE ACCESS MANAGEMENT
// ==========================================
apiRouter.get('/users', (req, res) => {
  try {
    const list = UserService.getAllUsers();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    const user = await UserService.createUser(req.body, currentUserId);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', async (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    const user = await UserService.updateUser(req.params.id, req.body, currentUserId);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    UserService.deleteUser(req.params.id, currentUserId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/roles', (req, res) => {
  try {
    const roles = UserService.getRoles();
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/roles/access', (req, res) => {
  try {
    const rules = UserService.getRoleAccessRules();
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/roles/access', (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    const rules = UserService.updateRoleAccessRules(req.body, currentUserId);
    res.json({ success: true, rules });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/roles/access/reset', (req, res) => {
  try {
    const currentUserId = req.headers['x-user-id'] as string;
    const rules = UserService.resetRoleAccessRules(currentUserId);
    res.json({ success: true, rules });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
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

// Batch Import Teachers
apiRouter.post('/teachers/import', (req, res) => {
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
        const teacher = TeacherService.create(item, userId);
        created.push(teacher);
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

apiRouter.delete('/classes/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    ClassService.delete(req.params.id, userId);
    res.json({ success: true });
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

// Jam Pelajaran (JP) Endpoints
apiRouter.get('/academic/lesson-periods', (req, res) => {
  try {
    const list = LessonPeriodService.getAll();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/academic/lesson-periods', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const period = LessonPeriodService.create(req.body, userId);
    res.status(201).json({ success: true, period });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/academic/lesson-periods/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const period = LessonPeriodService.update(req.params.id, req.body, userId);
    res.json({ success: true, period });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/academic/lesson-periods/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    LessonPeriodService.delete(req.params.id, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/academic/lesson-periods/reset', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const list = LessonPeriodService.reset(userId);
    res.json({ success: true, list });
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

apiRouter.put('/schedules/teaching/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const schedule = ScheduleService.updateTeachingSchedule(req.params.id, req.body, userId);
    res.json({ success: true, schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/schedules/teaching/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    ScheduleService.deleteTeachingSchedule(req.params.id, userId);
    res.json({ success: true });
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

apiRouter.put('/schedules/picket/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const picket = ScheduleService.updatePicketSchedule(req.params.id, req.body, userId);
    res.json({ success: true, picket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/schedules/picket/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    ScheduleService.deletePicketSchedule(req.params.id, userId);
    res.json({ success: true });
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

// Jadwal Tugas Manajemen Sekolah
apiRouter.get('/schedules/management', (req, res) => {
  try {
    const teacherId = req.query.teacherId as string;
    const dayOfWeek = req.query.dayOfWeek !== undefined ? Number(req.query.dayOfWeek) : undefined;
    const list = ScheduleService.getManagementSchedules({ teacherId, dayOfWeek });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/schedules/management', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const mgmt = ScheduleService.createManagementSchedule(req.body, userId);
    res.status(201).json({ success: true, management: mgmt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/schedules/management/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    ScheduleService.deleteManagementSchedule(req.params.id, userId);
    res.json({ success: true });
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
// 7.1 PRESENSI SHOLAT DHUHA & SCANNER
// ==========================================
apiRouter.get('/attendance/dhuha', (req, res) => {
  try {
    const { date, targetType, classId, search } = req.query as any;
    const result = DhuhaService.getAll({ date, targetType, classId, search });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/attendance/dhuha/scan', (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'scanner';
    const { code, method, date, time } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Kode barcode atau QR code wajib diisi.' });
    }
    const result = DhuhaService.processScan({ code, method, date, time, currentUserId: userId });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/attendance/dhuha/status', (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'admin';
    const { personId, targetType, date, status, note } = req.body;
    if (!personId || !status || !date) {
      return res.status(400).json({ error: 'Parameter tidak lengkap.' });
    }
    const record = DhuhaService.updateStatus({ personId, targetType, date, status, note }, userId);
    res.json({ success: true, record });
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

// ==========================================
// 8. LAPORAN & DATABASE TERPISAH (REPORTS & SEPARATED DB)
// ==========================================
apiRouter.get('/database/tables', (req, res) => {
  try {
    const list = dbManager.getSeparatedInfo();
    res.json({
      success: true,
      tables: list,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/download/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const store = dbManager.getStore();
    let data: any = null;
    let filename = `${tableName}.json`;

    switch (tableName) {
      case 'students':
        data = {
          tableName: 'students',
          description: 'Database Master Seluruh Siswa & Kredensial Kartu',
          exportedAt: new Date().toISOString(),
          totalRecords: store.students.length,
          data: store.students,
        };
        break;
      case 'teachers':
        data = {
          tableName: 'teachers',
          description: 'Database Master Guru & Pegawai',
          exportedAt: new Date().toISOString(),
          totalRecords: store.teachers.length,
          data: store.teachers,
        };
        break;
      case 'teaching_schedules':
      case 'schedules':
        data = {
          tableName: 'teaching_schedules',
          description: 'Database Jadwal Pelajaran & Jadwal Piket Guru',
          exportedAt: new Date().toISOString(),
          totalTeachingSchedules: store.teachingSchedules.length,
          totalPicketSchedules: store.picketSchedules.length,
          teachingSchedules: store.teachingSchedules,
          picketSchedules: store.picketSchedules,
        };
        break;
      case 'attendance_students':
        data = {
          tableName: 'attendance_students',
          description: 'Database Riwayat & Rekap Absensi Siswa Lengkap',
          exportedAt: new Date().toISOString(),
          totalRecords: store.studentAttendance.length,
          data: store.studentAttendance,
        };
        break;
      case 'attendance_teachers':
        data = {
          tableName: 'attendance_teachers',
          description: 'Database Riwayat & Rekap Absensi Guru & Pegawai',
          exportedAt: new Date().toISOString(),
          totalRecords: store.teacherAttendance.length,
          data: store.teacherAttendance,
        };
        break;
      case 'attendance_dhuha':
        data = {
          tableName: 'attendance_dhuha',
          description: 'Database Rekap Presensi Sholat Dhuha Siswa & Guru',
          exportedAt: new Date().toISOString(),
          totalRecords: (store.dhuhaAttendance || []).length,
          data: store.dhuhaAttendance || [],
        };
        break;
      case 'master_academic':
        data = {
          tableName: 'master_academic',
          description: 'Database Master Profil Sekolah, Kelas, Mapel, & Tahun Ajaran',
          exportedAt: new Date().toISOString(),
          school: store.school,
          schoolSetting: store.schoolSetting,
          academicYear: store.academicYear,
          semester: store.semester,
          classes: store.classes,
          subjects: store.subjects,
        };
        break;
      default:
        return res.status(404).json({ error: `Tabel ${tableName} tidak ditemukan.` });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/students', (req, res) => {
  try {
    const { startDate, endDate, classId, gradeLevel, status, method, gender, session, search } = req.query as any;
    const list = ReportService.getStudentReport({
      startDate,
      endDate,
      classId,
      gradeLevel,
      status,
      method,
      gender,
      session,
      search,
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/class-summary', (req, res) => {
  try {
    const { startDate, endDate, classId, gradeLevel } = req.query as any;
    const summary = ReportService.getClassSummaryReport({ startDate, endDate, classId, gradeLevel });
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/teachers', (req, res) => {
  try {
    const { startDate, endDate, teacherId, type, status, method, gender, employmentStatus, session, search } = req.query as any;
    const list = ReportService.getTeacherReport({
      startDate,
      endDate,
      teacherId,
      type,
      status,
      method,
      gender,
      employmentStatus,
      session,
      search,
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/dhuha', (req, res) => {
  try {
    const { startDate, endDate, targetType, classId, gradeLevel, status, method, gender, search } = req.query as any;
    const list = ReportService.getDhuhaReport({
      startDate,
      endDate,
      targetType,
      classId,
      gradeLevel,
      status,
      method,
      gender,
      search,
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/schedules', (req, res) => {
  try {
    const { day, classId, teacherId, gradeLevel } = req.query as any;
    const list = ReportService.getScheduleReport({ day, classId, teacherId, gradeLevel });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/journals', (req, res) => {
  try {
    const { startDate, endDate, classId, teacherId, search } = req.query as any;
    const list = ReportService.getJournalReport({ startDate, endDate, classId, teacherId, search });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/students', (req, res) => {
  try {
    const { startDate, endDate, classId, gradeLevel, status, method, gender, session, search } = req.query as any;
    const list = ReportService.getStudentReport({
      startDate,
      endDate,
      classId,
      gradeLevel,
      status,
      method,
      gender,
      session,
      search,
    });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'studentNis', label: 'NIS' },
      { key: 'studentNisn', label: 'NISN' },
      { key: 'studentName', label: 'Nama Siswa' },
      { key: 'gender', label: 'L/P' },
      { key: 'className', label: 'Kelas' },
      { key: 'status', label: 'Status' },
      { key: 'checkInTime', label: 'Jam Masuk' },
      { key: 'checkOutTime', label: 'Jam Pulang' },
      { key: 'method', label: 'Metode Scan' },
      { key: 'note', label: 'Keterangan' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi_siswa.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/class-summary', (req, res) => {
  try {
    const { startDate, endDate, classId, gradeLevel } = req.query as any;
    const report = ReportService.getClassSummaryReport({ startDate, endDate, classId, gradeLevel });
    const csv = ReportService.exportToCsv(report.items, [
      { key: 'nis', label: 'NIS' },
      { key: 'name', label: 'Nama Siswa' },
      { key: 'gender', label: 'L/P' },
      { key: 'className', label: 'Kelas' },
      { key: 'totalDays', label: 'Hari Efektif' },
      { key: 'hadirCount', label: 'Hadir' },
      { key: 'terlambatCount', label: 'Terlambat' },
      { key: 'sakitCount', label: 'Sakit' },
      { key: 'izinCount', label: 'Izin' },
      { key: 'alphaCount', label: 'Alpha' },
      { key: 'attendanceRate', label: '% Kehadiran' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rekapitulasi_kehadiran_kelas.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/teachers', (req, res) => {
  try {
    const { startDate, endDate, teacherId, type, status, method, gender, employmentStatus, session, search } = req.query as any;
    const list = ReportService.getTeacherReport({
      startDate,
      endDate,
      teacherId,
      type,
      status,
      method,
      gender,
      employmentStatus,
      session,
      search,
    });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'teacherNip', label: 'NIP' },
      { key: 'teacherName', label: 'Nama Guru' },
      { key: 'gender', label: 'L/P' },
      { key: 'subject', label: 'Mata Pelajaran' },
      { key: 'employmentStatus', label: 'Status Pegawai' },
      { key: 'type', label: 'Jenis Tugas' },
      { key: 'scheduled', label: 'Jadwal' },
      { key: 'actualTime', label: 'Jam Masuk' },
      { key: 'checkOutTime', label: 'Jam Pulang' },
      { key: 'status', label: 'Status' },
      { key: 'method', label: 'Metode Scan' },
      { key: 'note', label: 'Keterangan' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_absensi_guru.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/dhuha', (req, res) => {
  try {
    const { startDate, endDate, targetType, classId, gradeLevel, status, method, gender, search } = req.query as any;
    const list = ReportService.getDhuhaReport({
      startDate,
      endDate,
      targetType,
      classId,
      gradeLevel,
      status,
      method,
      gender,
      search,
    });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'targetType', label: 'Tipe (Siswa/Guru)' },
      { key: 'identifier', label: 'NIS / NIP' },
      { key: 'name', label: 'Nama' },
      { key: 'gender', label: 'L/P' },
      { key: 'classOrSubject', label: 'Kelas / Jabatan' },
      { key: 'time', label: 'Waktu Sholat' },
      { key: 'status', label: 'Status Sholat' },
      { key: 'method', label: 'Metode Scan' },
      { key: 'note', label: 'Keterangan' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_presensi_sholat_dhuha.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/schedules', (req, res) => {
  try {
    const { day, classId, teacherId, gradeLevel } = req.query as any;
    const list = ReportService.getScheduleReport({ day, classId, teacherId, gradeLevel });
    const csv = ReportService.exportToCsv(list, [
      { key: 'day', label: 'Hari' },
      { key: 'period', label: 'Jam Ke' },
      { key: 'time', label: 'Waktu' },
      { key: 'className', label: 'Kelas' },
      { key: 'teacherName', label: 'Guru Pengampu' },
      { key: 'teacherNip', label: 'NIP' },
      { key: 'subjectName', label: 'Mata Pelajaran' },
      { key: 'subjectCode', label: 'Kode Mapel' },
      { key: 'room', label: 'Ruang' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_jadwal_pelajaran.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/export/journals', (req, res) => {
  try {
    const { startDate, endDate, classId, teacherId, search } = req.query as any;
    const list = ReportService.getJournalReport({ startDate, endDate, classId, teacherId, search });
    const csv = ReportService.exportToCsv(list, [
      { key: 'date', label: 'Tanggal' },
      { key: 'teacherName', label: 'Nama Guru' },
      { key: 'teacherNip', label: 'NIP' },
      { key: 'className', label: 'Kelas' },
      { key: 'subjectName', label: 'Mata Pelajaran' },
      { key: 'scheduledTime', label: 'Jam Pelajaran' },
      { key: 'actualInTime', label: 'Hadir Pukul' },
      { key: 'actualOutTime', label: 'Selesai Pukul' },
      { key: 'status', label: 'Status' },
      { key: 'topic', label: 'Materi / Topik KBM' },
    ]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_jurnal_mengajar_guru.csv"');
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

// Separated database files info (Students, Teachers, Schedules, Attendances)
apiRouter.get(['/database/tables', '/database/files'], (req, res) => {
  try {
    const tables = dbManager.getSeparatedInfo();
    res.json({
      success: true,
      tables,
      files: tables,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download individual separated database JSON file
const handleDownloadSeparatedFile = (req: any, res: any) => {
  try {
    const { id } = req.params;
    let filePath: string | undefined;
    let filename = `${id}.json`;

    if (id === 'students') {
      filePath = SEPARATED_FILES.students;
      filename = 'students.json';
    } else if (id === 'teachers') {
      filePath = SEPARATED_FILES.teachers;
      filename = 'teachers.json';
    } else if (id === 'schedules' || id === 'teaching-schedules' || id === 'teaching_schedules') {
      filePath = SEPARATED_FILES.teachingSchedules;
      filename = 'teaching_schedules.json';
    } else if (id === 'attendance-students' || id === 'attendance_students') {
      filePath = SEPARATED_FILES.attendanceStudents;
      filename = 'attendance_students.json';
    } else if (id === 'attendance-teachers' || id === 'attendance_teachers') {
      filePath = SEPARATED_FILES.attendanceTeachers;
      filename = 'attendance_teachers.json';
    } else if (id === 'attendance-dhuha' || id === 'attendance_dhuha') {
      filePath = SEPARATED_FILES.attendanceDhuha;
      filename = 'attendance_dhuha.json';
    } else if (id === 'master-academic' || id === 'master_academic') {
      filePath = SEPARATED_FILES.masterAcademic;
      filename = 'master_academic.json';
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File database terpisah untuk "${id}" tidak ditemukan.` });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const content = fs.readFileSync(filePath, 'utf-8');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

apiRouter.get('/database/download/:id', handleDownloadSeparatedFile);
apiRouter.get('/database/files/:id/download', handleDownloadSeparatedFile);

// Pratinjau & Buka isi file database (siakad-db.json & separated files)
apiRouter.get('/database/view', (req, res) => {
  try {
    const target = (req.query.target as string) || 'siakad-db';
    const store = dbManager.getStore();

    if (target === 'siakad-db' || target === 'all') {
      return res.json({
        success: true,
        title: 'siakad-db.json (Basis Data Utama SIAKAD)',
        fileName: 'siakad-db.json',
        fileSize: JSON.stringify(store).length,
        itemCount: Object.keys(store).length,
        data: store,
      });
    }

    let data: any = null;
    let title = target;

    if (target === 'students') {
      data = store.students;
      title = 'students.json (Data Master Siswa)';
    } else if (target === 'teachers') {
      data = store.teachers;
      title = 'teachers.json (Data Master Guru & Pegawai)';
    } else if (target === 'schedules' || target === 'teachingSchedules' || target === 'teaching_schedules') {
      data = { teachingSchedules: store.teachingSchedules, picketSchedules: store.picketSchedules };
      title = 'teaching_schedules.json (Jadwal Mengajar & Piket)';
    } else if (target === 'attendance-students' || target === 'studentAttendance' || target === 'attendance_students') {
      data = store.studentAttendance;
      title = 'attendance_students.json (Riwayat Presensi Siswa)';
    } else if (target === 'attendance-teachers' || target === 'teacherAttendance' || target === 'attendance_teachers') {
      data = store.teacherAttendance;
      title = 'attendance_teachers.json (Riwayat Presensi Guru)';
    } else if (target === 'attendance-dhuha' || target === 'dhuhaAttendance' || target === 'attendance_dhuha') {
      data = store.dhuhaAttendance || [];
      title = 'attendance_dhuha.json (Presensi Sholat Dhuha)';
    } else if (target === 'master-academic' || target === 'masterAcademic' || target === 'master_academic') {
      data = {
        school: store.school,
        schoolSetting: store.schoolSetting,
        academicYear: store.academicYear,
        classes: store.classes,
        subjects: store.subjects,
      };
      title = 'master_academic.json (Master Akademik & Sekolah)';
    } else if ((store as any)[target] !== undefined) {
      data = (store as any)[target];
      title = `store.${target}`;
    }

    if (data === null) {
      return res.status(404).json({ error: `Data untuk "${target}" tidak ditemukan.` });
    }

    res.json({
      success: true,
      title,
      fileName: `${target}.json`,
      itemCount: Array.isArray(data) ? data.length : Object.keys(data).length,
      data,
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

