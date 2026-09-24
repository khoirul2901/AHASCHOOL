import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { TeachingSchedule, PicketSchedule, TeacherSubstitution } from '../../src/types/index.js';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  return sA < eB && eA > sB;
}

export class ScheduleService {
  public static getTeachingSchedules(params?: {
    dayOfWeek?: number;
    teacherId?: string;
    classId?: string;
  }) {
    const store = dbManager.getStore();
    let list = store.teachingSchedules.filter((s) => s.active && !s.deletedAt);

    if (params?.dayOfWeek !== undefined) {
      list = list.filter((s) => s.dayOfWeek === params.dayOfWeek);
    }
    if (params?.teacherId) {
      list = list.filter((s) => s.teacherId === params.teacherId);
    }
    if (params?.classId) {
      list = list.filter((s) => s.classId === params.classId);
    }

    return list.map((s) => {
      const teacher = store.teachers.find((t) => t.id === s.teacherId);
      const cls = store.classes.find((c) => c.id === s.classId);
      const subject = store.subjects.find((sb) => sb.id === s.subjectId);
      return {
        ...s,
        teacherName: teacher ? teacher.name : 'Unknown',
        className: cls ? cls.name : 'Unknown',
        subjectName: subject ? subject.name : 'Unknown',
      } as TeachingSchedule;
    });
  }

  public static createTeachingSchedule(
    data: {
      teacherId: string;
      classId: string;
      subjectId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string;
    },
    currentUserId?: string
  ): TeachingSchedule {
    const store = dbManager.getStore();

    if (parseTimeToMinutes(data.startTime) >= parseTimeToMinutes(data.endTime)) {
      throw new Error('Jam mulai harus lebih awal dari jam selesai.');
    }

    // Check conflicts:
    // 1. Guru conflict: same day, same teacher, overlapping time
    const teacherConflict = store.teachingSchedules.find(
      (s) =>
        s.active &&
        !s.deletedAt &&
        s.dayOfWeek === data.dayOfWeek &&
        s.teacherId === data.teacherId &&
        timesOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );
    if (teacherConflict) {
      const teacher = store.teachers.find((t) => t.id === data.teacherId);
      throw new Error(
        `Jadwal bentrok untuk Guru ${teacher?.name || ''} pada hari tersebut (${teacherConflict.startTime} - ${teacherConflict.endTime}).`
      );
    }

    // 2. Kelas conflict: same day, same class, overlapping time
    const classConflict = store.teachingSchedules.find(
      (s) =>
        s.active &&
        !s.deletedAt &&
        s.dayOfWeek === data.dayOfWeek &&
        s.classId === data.classId &&
        timesOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
    );
    if (classConflict) {
      const cls = store.classes.find((c) => c.id === data.classId);
      throw new Error(
        `Jadwal bentrok untuk Kelas ${cls?.name || ''} pada hari tersebut (${classConflict.startTime} - ${classConflict.endTime}).`
      );
    }

    // 3. Ruangan conflict: same day, same room, overlapping time
    if (data.room && data.room.trim() !== '') {
      const roomConflict = store.teachingSchedules.find(
        (s) =>
          s.active &&
          !s.deletedAt &&
          s.dayOfWeek === data.dayOfWeek &&
          s.room &&
          s.room.toLowerCase() === data.room!.toLowerCase() &&
          timesOverlap(s.startTime, s.endTime, data.startTime, data.endTime)
      );
      if (roomConflict) {
        throw new Error(
          `Ruangan ${data.room} sudah dipakai jadwal lain pada waktu tersebut (${roomConflict.startTime} - ${roomConflict.endTime}).`
        );
      }
    }

    const newSchedule: TeachingSchedule = {
      id: uuidv4(),
      teacherId: data.teacherId,
      classId: data.classId,
      subjectId: data.subjectId,
      academicYearId: store.academicYear.id,
      semesterId: store.semester.id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || undefined,
      active: true,
      version: 1,
    };

    store.teachingSchedules.push(newSchedule);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'teaching_schedules',
      entityId: newSchedule.id,
      newData: newSchedule,
      description: `Menambahkan jadwal mengajar baru: Hari ${data.dayOfWeek} ${data.startTime}-${data.endTime}`,
    });

    return newSchedule;
  }

  public static getPicketSchedules(params?: { date?: string; teacherId?: string }) {
    const store = dbManager.getStore();
    let list = store.picketSchedules.filter((p) => p.active && !p.deletedAt);

    if (params?.date) {
      list = list.filter((p) => p.date === params.date);
    }
    if (params?.teacherId) {
      list = list.filter((p) => p.teacherId === params.teacherId);
    }

    return list.map((p) => {
      const teacher = store.teachers.find((t) => t.id === p.teacherId);
      return {
        ...p,
        teacherName: teacher ? teacher.name : 'Unknown',
      } as PicketSchedule;
    });
  }

  public static createPicketSchedule(
    data: {
      teacherId: string;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
    },
    currentUserId?: string
  ): PicketSchedule {
    const store = dbManager.getStore();

    const existing = store.picketSchedules.find(
      (p) =>
        p.active &&
        !p.deletedAt &&
        p.teacherId === data.teacherId &&
        p.date === data.date &&
        timesOverlap(p.startTime, p.endTime, data.startTime, data.endTime)
    );
    if (existing) {
      const teacher = store.teachers.find((t) => t.id === data.teacherId);
      throw new Error(`Guru ${teacher?.name || ''} sudah memiliki jadwal piket pada tanggal dan jam tersebut.`);
    }

    const newPicket: PicketSchedule = {
      id: uuidv4(),
      teacherId: data.teacherId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || 'Pos Utama',
      active: true,
      version: 1,
    };

    store.picketSchedules.push(newPicket);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'picket_schedules',
      entityId: newPicket.id,
      newData: newPicket,
      description: `Menambahkan jadwal piket untuk ${data.date}`,
    });

    return newPicket;
  }

  public static assignSubstitute(
    data: {
      scheduleId: string;
      originalTeacherId: string;
      replacementTeacherId: string;
      date: string;
      reason?: string;
    },
    currentUserId?: string
  ): TeacherSubstitution {
    const store = dbManager.getStore();

    if (data.originalTeacherId === data.replacementTeacherId) {
      throw new Error('Guru pengganti tidak boleh sama dengan guru asli.');
    }

    const existing = store.teacherSubstitutions.find(
      (s) => s.scheduleId === data.scheduleId && s.date === data.date
    );
    if (existing) {
      existing.replacementTeacherId = data.replacementTeacherId;
      existing.reason = data.reason;
      existing.updatedAt = new Date().toISOString();
      dbManager.saveSync();
      return existing;
    }

    const sub: TeacherSubstitution = {
      id: uuidv4(),
      scheduleId: data.scheduleId,
      originalTeacherId: data.originalTeacherId,
      replacementTeacherId: data.replacementTeacherId,
      date: data.date,
      reason: data.reason,
    };

    store.teacherSubstitutions.push(sub);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'teacher_substitutions',
      entityId: sub.id,
      newData: sub,
      description: `Penugasan guru pengganti untuk tanggal ${data.date}`,
    });

    return sub;
  }
}
