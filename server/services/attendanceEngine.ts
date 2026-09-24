import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AcademicService } from './academicService.js';
import { AuditService } from './auditService.js';
import type {
  TeacherAttendance,
  AttendanceType,
  AttendanceStatus,
  AttendanceSource,
} from '../../src/types/index.js';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export class AttendanceEngine {
  /**
   * Evaluates late status based on scheduled start and check-in time plus tolerance.
   */
  public static processLateStatus(
    scheduledStart: string,
    actualTime: string,
    toleranceMinutes: number
  ): AttendanceStatus {
    const scheduledMin = parseTimeToMinutes(scheduledStart);
    const actualMin = parseTimeToMinutes(actualTime);

    if (actualMin <= scheduledMin + toleranceMinutes) {
      return 'HADIR';
    }
    return 'TERLAMBAT';
  }

  /**
   * Generates Teaching Attendance records for a given date.
   * - Checks if date is a holiday (if so, skips teaching generation).
   * - Checks day of week.
   * - Identifies active teaching schedules.
   * - Checks for substitute teachers.
   * - Ensures idempotency (prevents duplicate attendance).
   */
  public static generateTeachingAttendance(
    dateString: string,
    source: AttendanceSource = 'SYSTEM'
  ): TeacherAttendance[] {
    const store = dbManager.getStore();

    // Check holiday
    const { isHoliday } = AcademicService.isHoliday(dateString);
    if (isHoliday) {
      return [];
    }

    const dateObj = new Date(dateString);
    // JavaScript getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // In our system: 1 = Senin, ... 6 = Sabtu, 7 = Minggu
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const schedules = store.teachingSchedules.filter(
      (s) => s.active && !s.deletedAt && s.dayOfWeek === dayOfWeek
    );

    const generated: TeacherAttendance[] = [];

    for (const schedule of schedules) {
      // Check if substitution exists for this schedule on this date
      const substitution = store.teacherSubstitutions.find(
        (sub) => sub.scheduleId === schedule.id && sub.date === dateString
      );
      const effectiveTeacherId = substitution
        ? substitution.replacementTeacherId
        : schedule.teacherId;

      // Prevent duplicate attendance: Check unique constraint (teacherId, attendanceDate, attendanceType, scheduleId)
      const existing = store.teacherAttendance.find(
        (att) =>
          att.teacherId === effectiveTeacherId &&
          att.attendanceDate === dateString &&
          att.attendanceType === 'TEACHING' &&
          att.scheduleId === schedule.id &&
          !att.deletedAt
      );

      if (!existing) {
        const mode = store.schoolSetting.teacherAttendanceMode;
        let initialStatus: AttendanceStatus = 'HADIR';
        if (mode === 'CHECK_IN') {
          // In check-in mode, default to ALPHA or pending until teacher checks in
          initialStatus = 'ALPHA';
        }

        const newRecord: TeacherAttendance = {
          id: uuidv4(),
          teacherId: effectiveTeacherId,
          attendanceType: 'TEACHING',
          scheduleId: schedule.id,
          attendanceDate: dateString,
          scheduledStart: schedule.startTime,
          scheduledEnd: schedule.endTime,
          actualTime: mode === 'AUTO_HADIR' ? schedule.startTime : undefined,
          status: initialStatus,
          source,
          note: substitution ? `Guru Pengganti (Asli: ${schedule.teacherId})` : undefined,
          version: 1,
        };

        store.teacherAttendance.push(newRecord);
        generated.push(newRecord);
      } else {
        generated.push(existing);
      }
    }

    dbManager.saveSync();
    return generated;
  }

  /**
   * Generates Picket Attendance records for a given date.
   * - Checks picket schedules specifically set for that date.
   * - Ensures idempotency.
   * - Teacher with BOTH picket and teaching MUST receive TWO separate records!
   */
  public static generatePicketAttendance(
    dateString: string,
    source: AttendanceSource = 'SYSTEM'
  ): TeacherAttendance[] {
    const store = dbManager.getStore();
    const pickets = store.picketSchedules.filter(
      (p) => p.active && !p.deletedAt && p.date === dateString
    );

    const generated: TeacherAttendance[] = [];

    for (const picket of pickets) {
      // Prevent duplicate attendance: Check unique constraint (teacherId, attendanceDate, attendanceType, scheduleId)
      const existing = store.teacherAttendance.find(
        (att) =>
          att.teacherId === picket.teacherId &&
          att.attendanceDate === dateString &&
          att.attendanceType === 'PICKET' &&
          att.scheduleId === picket.id &&
          !att.deletedAt
      );

      if (!existing) {
        const mode = store.schoolSetting.teacherAttendanceMode;
        const newRecord: TeacherAttendance = {
          id: uuidv4(),
          teacherId: picket.teacherId,
          attendanceType: 'PICKET',
          scheduleId: picket.id,
          attendanceDate: dateString,
          scheduledStart: picket.startTime,
          scheduledEnd: picket.endTime,
          actualTime: mode === 'AUTO_HADIR' ? picket.startTime : undefined,
          status: 'HADIR',
          source,
          note: `Tugas Piket di ${picket.location || 'Pos Utama'}`,
          version: 1,
        };

        store.teacherAttendance.push(newRecord);
        generated.push(newRecord);
      } else {
        generated.push(existing);
      }
    }

    dbManager.saveSync();
    return generated;
  }

  /**
   * Generates all attendance for the day:
   * 1. Teaching Attendance
   * 2. Picket Attendance
   * Result: Guarantees Budi with Picket & Teaching gets TWO distinct records (1 PICKET, 1 TEACHING),
   * and repeating the call preserves exactly 1 PICKET and 1 TEACHING.
   */
  public static generateDailyAttendance(dateString?: string): {
    teachingCount: number;
    picketCount: number;
    totalRecordsForDate: number;
  } {
    const date = dateString || new Date().toISOString().split('T')[0];
    const teaching = this.generateTeachingAttendance(date);
    const picket = this.generatePicketAttendance(date);

    const store = dbManager.getStore();
    const totalRecordsForDate = store.teacherAttendance.filter(
      (att) => att.attendanceDate === date && !att.deletedAt
    ).length;

    AuditService.log({
      action: 'ATTENDANCE_GENERATE',
      entity: 'teacher_attendance',
      description: `Generate absensi otomatis untuk tanggal ${date}: ${teaching.length} mengajar, ${picket.length} piket`,
    });

    return {
      teachingCount: teaching.length,
      picketCount: picket.length,
      totalRecordsForDate,
    };
  }
}
