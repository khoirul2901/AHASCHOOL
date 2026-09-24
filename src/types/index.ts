// Shared Types for SIAKAD SEKOLAH TERPADU

export type RoleCode =
  | 'SUPER_ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'WAKASEK'
  | 'ADMIN_SEKOLAH'
  | 'OPERATOR'
  | 'TATA_USAHA'
  | 'BENDAHARA'
  | 'GURU'
  | 'GURU_PIKET'
  | 'WALI_KELAS'
  | 'PETUGAS_PERPUSTAKAAN'
  | 'PETUGAS_SARPRAS'
  | 'SISWA'
  | 'ORANG_TUA';

export type AttendanceType = 'TEACHING' | 'PICKET';

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
  schoolId: string;
  user?: {
    id: string;
    username: string;
    name: string;
    role?: string;
    email?: string;
    teacherId?: string;
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
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  major?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  academicYearId: string;
  academicYearName?: string;
  studentCount?: number;
  active: boolean;
  version: number;
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
  note?: string;
  version: number;
  originDeviceId?: string;
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
export type TeacherItem = Teacher & { phone?: string; employmentStatus?: string };
export type StudentItem = Student & { phone?: string; parentName?: string; class?: { name: string } };
export type ClassItem = SchoolClass & { room?: string; level?: number };
export type SubjectItem = Subject & { category?: string; hoursPerWeek?: number };
export type ModuleRegistry = ModuleItem & { isEnabled?: boolean; dependencies?: string[] };
export type SyncQueueItem = OfflineQueueItem & { tableName?: string; recordId?: string; timestamp?: string };

export type ScanMethod = 'CAMERA' | 'HARDWARE_SCANNER';

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
  message: string;
}

