// Shared Types for SIAKAD SEKOLAH TERPADU

export type RoleCode =
  | 'SUPER_ADMIN'
  | 'GURU_BK'
  | 'GURU'
  | 'WALI_KELAS'
  | 'BENDAHARA'
  | 'TU'
  | 'SISWA'
  | 'KEPALA_SEKOLAH'
  | 'WAKASEK'
  | 'ADMIN_SEKOLAH'
  | 'OPERATOR'
  | 'TATA_USAHA'
  | 'GURU_PIKET'
  | 'PETUGAS_PERPUSTAKAAN'
  | 'PETUGAS_SARPRAS'
  | 'ORANG_TUA';

export interface UserAccountItem {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  roleCode: RoleCode;
  roleName: string;
  active: boolean;
  teacherId?: string;
  teacherName?: string;
  studentId?: string;
  studentName?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface RoleAccessRule {
  tabId: string;
  name: string;
  category: string;
  allowedRoles: RoleCode[];
}

export type AttendanceType = 'TEACHING' | 'PICKET' | 'MANAGEMENT';

export type AttendanceStatus =
  | 'HADIR'
  | 'TERLAMBAT'
  | 'IZIN'
  | 'SAKIT'
  | 'ALPHA'
  | 'DINAS'
  | 'LIBUR'
  | 'DIBATALKAN';

export type AttendanceSource = 'SYSTEM' | 'CHECK_IN' | 'MANUAL' | 'OFFLINE';

export type ModuleStatus = 'ACTIVE' | 'PLANNED' | 'COMING_SOON' | 'DISABLED';

export type TeacherAttendanceMode = 'AUTO_HADIR' | 'CHECK_IN' | 'AUTO_HADIR_WITH_CONFIRMATION';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  roles: RoleCode[];
  permissions: string[];
  teacherId?: string;
  studentId?: string;
  schoolId: string;
  user?: {
    id: string;
    username: string;
    name: string;
    role?: string;
    email?: string;
    teacherId?: string;
    studentId?: string;
    isActive?: boolean;
  };
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principal?: string;
  logoUrl?: string;
  version: number;
}

export interface SchoolSetting {
  id: string;
  schoolId: string;
  teacherAttendanceMode: TeacherAttendanceMode;
  lateToleranceMinutes: number;
  autoSyncIntervalSec: number;
  allowOfflineAttendance: boolean;
}

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  version: number;
}

export interface Semester {
  id: string;
  academicYearId: string;
  semesterNumber: number;
  name: string;
  active: boolean;
  startDate: string;
  endDate: string;
  version: number;
}

export interface Teacher {
  id: string;
  userId?: string;
  nip?: string;
  name: string;
  email?: string;
  phone?: string;
  gender: 'L' | 'P';
  address?: string;
  cardId?: string;
  nfcUid?: string;
  subject?: string;
  employmentStatus?: string;
  positionStatus?: string;
  photoUrl?: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  gender: 'L' | 'P';
  birthDate?: string;
  classId: string;
  className?: string;
  parentName?: string;
  parentPhone?: string;
  cardId?: string;
  nfcUid?: string;
  photoUrl?: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number | string;
  level?: number | string;
  major?: string;
  room?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  academicYearId: string;
  academicYearName?: string;
  studentCount?: number;
  active: boolean;
  version: number;
  deletedAt?: string | null;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  version: number;
}

export interface TeachingSchedule {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  academicYearId: string;
  semesterId: string;
  dayOfWeek: number; // 1 = Senin, ... 7 = Minggu
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  startPeriod?: number; // Jam Ke Mulai (misal: 1)
  endPeriod?: number;   // Jam Ke Selesai (misal: 3)
  periodCount?: number; // Total JP (misal: 3 JP)
  room?: string;
  active: boolean;
  version: number;
  class?: { name: string };
  subject?: { name: string; code?: string };
  teacher?: { name: string };
}

export interface PicketSchedule {
  id: string;
  teacherId: string;
  teacherName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "07:00"
  endTime: string; // "14:00"
  location?: string;
  active: boolean;
  version: number;
  teacher?: { name: string };
}

export interface ManagementSchedule {
  id: string;
  teacherId: string;
  teacherName?: string;
  teacherNip?: string;
  roleTitle: string; // e.g. "Kepala Sekolah", "Waka Kurikulum", "Waka Kesiswaan", "Waka Sarpras", "Waka Humas", "Kepala Lab", "Kepala Perpustakaan", "Pembina OSIS", "Wali Kelas"
  dayOfWeek?: number; // 0 = Setiap Hari Kerja, 1 = Senin, ... 6 = Sabtu
  startTime: string; // "07:00"
  endTime: string;   // "15:00"
  roomOrDesk?: string; // e.g. "Ruang Pimpinan / Kantor Waka"
  description?: string;
  active: boolean;
  version: number;
  teacher?: { name: string };
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
  isNational: boolean;
  affectsPicket?: boolean;
}

export interface TeacherSubstitution {
  id: string;
  scheduleId: string;
  originalTeacherId: string;
  originalTeacherName?: string;
  replacementTeacherId: string;
  replacementTeacherName?: string;
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName?: string;
  attendanceType: AttendanceType;
  scheduleId?: string;
  scheduleDetail?: string;
  attendanceDate: string; // YYYY-MM-DD
  scheduledStart: string;
  scheduledEnd: string;
  actualTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  note?: string;
  version: number;
  originDeviceId?: string;
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classId: string;
  className?: string;
  teacherId: string;
  subjectId?: string;
  scheduleId?: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  actualTime?: string;
  checkOutTime?: string;
  note?: string;
  version: number;
  originDeviceId?: string;
}

export type DhuhaStatus = 'HADIR' | 'BERHALANGAN' | 'TIDAK_HADIR';

export interface DhuhaAttendance {
  id: string;
  targetType: 'STUDENT' | 'TEACHER';
  personId: string;
  name: string;
  identifier: string; // NIS or NIP
  classOrSubject?: string;
  gender?: 'L' | 'P';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: DhuhaStatus;
  note?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrection {
  id: string;
  targetAttendanceId: string;
  targetType: 'TEACHER' | 'STUDENT';
  targetName?: string;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  correctedByUserId: string;
  correctedByName?: string;
  correctedAt: string;
}

export interface ModuleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  status: ModuleStatus;
  enabled: boolean;
  sortOrder: number;
  version: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  description?: string;
  createdAt: string;
}

export interface SyncConflictItem {
  id: string;
  entity: string;
  entityId: string;
  localData: any;
  serverData: any;
  localVersion: number;
  serverVersion: number;
  resolution?: 'USE_LOCAL' | 'USE_SERVER' | 'MERGE';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface OfflineQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  payload: any;
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  deviceId: string;
  error?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  teachersPresent: number;
  teachersLate: number;
  teachersPicket: number;
  studentsPresent: number;
  studentsLate: number;
  studentsExcused: number; // IZIN
  studentsSick: number;    // SAKIT
  studentsAlpha: number;   // ALPHA
  attendanceRate: number;
  dailyStudentTrend: { date: string; present: number; absent: number; rate: number }[];
  classRecap: { className: string; total: number; present: number; rate: number }[];
  picketToday: { teacherName: string; location: string; time: string; status: AttendanceStatus }[];
}

// Aliases for unified feature naming
export type TeacherItem = Teacher & { phone?: string; employmentStatus?: string; positionStatus?: string };
export type StudentItem = Student & { phone?: string; parentName?: string; class?: { name: string } };
export type ClassItem = SchoolClass & { room?: string; level?: number };
export type SubjectItem = Subject & { category?: string; hoursPerWeek?: number };
export type ModuleRegistry = ModuleItem & { isEnabled?: boolean; dependencies?: string[] };
export type SyncQueueItem = OfflineQueueItem & { tableName?: string; recordId?: string; timestamp?: string };

export type ScanMethod = 'MANUAL' | 'CAMERA' | 'HARDWARE_SCANNER' | 'NFC';

export interface LessonPeriodSlot {
  id: string;
  periodNumber: number; // 1, 2, 3... (0 untuk Istirahat)
  name: string;         // "Jam Ke-1", "Jam Ke-2", "Istirahat Pagi", dll.
  startTime: string;    // "07:15"
  endTime: string;      // "07:45"
  isBreak?: boolean;    // true jika waktu istirahat
  dayOfWeek?: number;   // 0 = Semua Hari Kerja, 1 = Senin, dll.
  active: boolean;
}

export interface ScanAttendanceResult {
  success: boolean;
  targetType: 'STUDENT' | 'TEACHER';
  person: {
    id: string;
    name: string;
    code: string;
    subtext: string;
    photoUrl?: string;
  };
  attendance: any;
  status: AttendanceStatus;
  time: string;
  isLate: boolean;
  isAlreadyRecorded: boolean;
  scanSession?: 'MASUK' | 'TERLAMBAT' | 'PULANG';
  checkOutTime?: string;
  message: string;
}

