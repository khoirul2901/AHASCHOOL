import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData.js';

export interface DatabaseStore {
  school: any;
  schoolSetting: any;
  academicYear: any;
  semester: any;
  roles: any[];
  permissions: any[];
  rolePermissions: any[];
  users: any[];
  userRoles: any[];
  teachers: any[];
  subjects: any[];
  classes: any[];
  students: any[];
  teachingSchedules: any[];
  picketSchedules: any[];
  managementSchedules?: any[];
  lessonPeriods?: any[];
  holidays: any[];
  modules: any[];
  teacherSubstitutions: any[];
  teacherAttendance: any[];
  studentAttendance: any[];
  dhuhaAttendance?: any[];
  attendanceCorrections: any[];
  auditLogs: any[];
  syncDevices: any[];
  syncChanges: any[];
  syncConflicts: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'siakad-db.json');

// Separated database files for modularity and easy reporting
export const SEPARATED_FILES = {
  students: path.join(DATA_DIR, 'students.json'),
  teachers: path.join(DATA_DIR, 'teachers.json'),
  teachingSchedules: path.join(DATA_DIR, 'teaching_schedules.json'),
  attendanceStudents: path.join(DATA_DIR, 'attendance_students.json'),
  attendanceTeachers: path.join(DATA_DIR, 'attendance_teachers.json'),
  attendanceDhuha: path.join(DATA_DIR, 'attendance_dhuha.json'),
  masterAcademic: path.join(DATA_DIR, 'master_academic.json'),
};

class DatabaseManager {
  private store: DatabaseStore | null = null;
  private isInitialized = false;

  public async init(): Promise<DatabaseStore> {
    if (this.isInitialized && this.store) {
      return this.store;
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Check if primary or separated files exist
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.store = JSON.parse(fileContent);
        if (!this.store?.dhuhaAttendance) {
          this.store!.dhuhaAttendance = [];
        }
        if (!this.store?.managementSchedules || this.store.managementSchedules.length === 0) {
          const seed = await getInitialSeedData();
          this.store!.managementSchedules = seed.managementSchedules || [];
        }
      } else if (fs.existsSync(SEPARATED_FILES.students)) {
        // Load from separated files if main db file is not present
        const seed = await getInitialSeedData();
        const readJsonSafe = (filePath: string, fallback: any) => {
          try {
            if (fs.existsSync(filePath)) {
              const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              return parsed.data !== undefined ? parsed.data : parsed;
            }
          } catch (e) {
            console.warn(`Failed to read separated file ${filePath}:`, e);
          }
          return fallback;
        };

        seed.students = readJsonSafe(SEPARATED_FILES.students, seed.students);
        seed.teachers = readJsonSafe(SEPARATED_FILES.teachers, seed.teachers);
        seed.studentAttendance = readJsonSafe(SEPARATED_FILES.attendanceStudents, seed.studentAttendance);
        seed.teacherAttendance = readJsonSafe(SEPARATED_FILES.attendanceTeachers, seed.teacherAttendance);
        (seed as any).dhuhaAttendance = readJsonSafe(SEPARATED_FILES.attendanceDhuha, []);
        this.store = seed;
      } else {
        this.store = await getInitialSeedData();
      }

      this.isInitialized = true;
      this.saveSync();
      return this.store!;
    } catch (err) {
      console.warn('Initializing fresh store due to error or missing data:', err);
      this.store = await getInitialSeedData();
      this.isInitialized = true;
      this.saveSync();
      return this.store;
    }
  }

  public getStore(): DatabaseStore {
    if (!this.store) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.store;
  }

  public saveSync(): void {
    if (!this.store) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const now = new Date().toISOString();

      // 1. Primary Unified DB file (for full atomic transactions)
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.store, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);

      // 2. Separated Database Files for easy inspection, reporting & backup
      const writeSeparated = (filePath: string, payload: any) => {
        const tmp = `${filePath}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
        fs.renameSync(tmp, filePath);
      };

      // Separated: Students DB
      writeSeparated(SEPARATED_FILES.students, {
        tableName: 'students',
        description: 'Database Master Seluruh Siswa & Kredensial Kartu',
        updatedAt: now,
        totalRecords: this.store.students.length,
        data: this.store.students,
      });

      // Separated: Teachers DB
      writeSeparated(SEPARATED_FILES.teachers, {
        tableName: 'teachers',
        description: 'Database Master Guru & Pegawai',
        updatedAt: now,
        totalRecords: this.store.teachers.length,
        data: this.store.teachers,
      });

      // Separated: Teaching & Picket & Management Schedules DB
      writeSeparated(SEPARATED_FILES.teachingSchedules, {
        tableName: 'teaching_schedules',
        description: 'Database Jadwal Pelajaran, Jadwal Piket, & Tugas Manajemen Guru',
        updatedAt: now,
        totalTeachingSchedules: this.store.teachingSchedules.length,
        totalPicketSchedules: this.store.picketSchedules.length,
        totalManagementSchedules: (this.store.managementSchedules || []).length,
        teachingSchedules: this.store.teachingSchedules,
        picketSchedules: this.store.picketSchedules,
        managementSchedules: this.store.managementSchedules || [],
      });

      // Separated: Student Attendance DB
      writeSeparated(SEPARATED_FILES.attendanceStudents, {
        tableName: 'attendance_students',
        description: 'Database Riwayat & Rekap Absensi Siswa Lengkap',
        updatedAt: now,
        totalRecords: this.store.studentAttendance.length,
        data: this.store.studentAttendance,
      });

      // Separated: Teacher Attendance DB
      writeSeparated(SEPARATED_FILES.attendanceTeachers, {
        tableName: 'attendance_teachers',
        description: 'Database Riwayat & Rekap Absensi Guru & Pegawai',
        updatedAt: now,
        totalRecords: this.store.teacherAttendance.length,
        data: this.store.teacherAttendance,
      });

      // Separated: Dhuha Attendance DB
      writeSeparated(SEPARATED_FILES.attendanceDhuha, {
        tableName: 'attendance_dhuha',
        description: 'Database Rekap Presensi Sholat Dhuha Siswa & Guru',
        updatedAt: now,
        totalRecords: (this.store.dhuhaAttendance || []).length,
        data: this.store.dhuhaAttendance || [],
      });

      // Separated: Master Academic DB
      writeSeparated(SEPARATED_FILES.masterAcademic, {
        tableName: 'master_academic',
        description: 'Database Pengaturan Sekolah, Kelas, Mata Pelajaran, & Tahun Ajaran',
        updatedAt: now,
        school: this.store.school,
        schoolSetting: this.store.schoolSetting,
        academicYear: this.store.academicYear,
        semester: this.store.semester,
        classes: this.store.classes,
        subjects: this.store.subjects,
        roles: this.store.roles,
        users: this.store.users,
      });
    } catch (err) {
      console.error('Failed to persist database files:', err);
    }
  }

  public getSeparatedInfo() {
    if (!this.store) return [];
    return [
      {
        id: 'students',
        name: 'Database Siswa (students.json)',
        description: 'Biodata siswa, kelas, NISN, NIS, UID NFC, dan status aktif',
        total: this.store.students.length,
        file: 'students.json',
      },
      {
        id: 'teachers',
        name: 'Database Guru & Pegawai (teachers.json)',
        description: 'Biodata guru, NIP, mata pelajaran, UID NFC, status kepegawaian',
        total: this.store.teachers.length,
        file: 'teachers.json',
      },
      {
        id: 'schedules',
        name: 'Database Jadwal Mengajar & Piket (teaching_schedules.json)',
        description: 'Jadwal pelajaran kelas, jam, ruang, dan penugasan piket guru',
        total: this.store.teachingSchedules.length + this.store.picketSchedules.length,
        file: 'teaching_schedules.json',
      },
      {
        id: 'attendance-students',
        name: 'Database Absensi Siswa (attendance_students.json)',
        description: 'Rekaman absensi harian siswa, jam masuk, jam pulang, dan status',
        total: this.store.studentAttendance.length,
        file: 'attendance_students.json',
      },
      {
        id: 'attendance-teachers',
        name: 'Database Absensi Guru (attendance_teachers.json)',
        description: 'Rekaman absensi mengajar, piket, jam hadir, dan jam pulang guru',
        total: this.store.teacherAttendance.length,
        file: 'attendance_teachers.json',
      },
      {
        id: 'attendance-dhuha',
        name: 'Database Presensi Sholat Dhuha (attendance_dhuha.json)',
        description: 'Rekap kehadiran jamaah sholat dhuha siswa dan guru',
        total: (this.store.dhuhaAttendance || []).length,
        file: 'attendance_dhuha.json',
      },
      {
        id: 'master-academic',
        name: 'Database Master Akademik (master_academic.json)',
        description: 'Data profil sekolah, kelas, mata pelajaran, dan tahun ajaran',
        total: this.store.classes.length + this.store.subjects.length,
        file: 'master_academic.json',
      },
    ];
  }

  public async resetToSeed(): Promise<void> {
    this.store = await getInitialSeedData();
    this.saveSync();
  }
}

export const dbManager = new DatabaseManager();
