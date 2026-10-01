import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { TeachingSchedule, PicketSchedule, TeacherSubstitution, ManagementSchedule } from '../../src/types/index.js';

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
      startPeriod: (data as any).startPeriod,
      endPeriod: (data as any).endPeriod,
      periodCount: (data as any).periodCount,
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

  public static getManagementSchedules(params?: { teacherId?: string; dayOfWeek?: number }) {
    const store = dbManager.getStore();
    if (!store.managementSchedules) store.managementSchedules = [];
    let list = store.managementSchedules.filter((m) => m.active && !m.deletedAt);

    if (params?.teacherId) {
      list = list.filter((m) => m.teacherId === params.teacherId);
    }
    if (params?.dayOfWeek !== undefined) {
      list = list.filter((m) => m.dayOfWeek === 0 || m.dayOfWeek === params.dayOfWeek);
    }

    return list.map((m) => {
      const teacher = store.teachers.find(
        (t) => t.id === m.teacherId || t.name === (m as any).teacherName
      );
      return {
        ...m,
        teacherName: teacher ? teacher.name : ((m as any).teacherName || 'Guru Manajemen'),
        teacherNip: teacher?.nip || (m as any).teacherNip || '-',
      } as ManagementSchedule;
    });
  }

  public static createManagementSchedule(
    data: {
      teacherId: string;
      roleTitle: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      roomOrDesk?: string;
      description?: string;
    },
    currentUserId?: string
  ): ManagementSchedule {
    const store = dbManager.getStore();
    if (!store.managementSchedules) store.managementSchedules = [];

    const teacher = store.teachers.find((t) => t.id === data.teacherId);
    if (!teacher) {
      throw new Error('Guru tidak ditemukan.');
    }
    if (!data.roleTitle || !data.roleTitle.trim()) {
      throw new Error('Jabatan / tugas manajemen wajib diisi.');
    }

    const newMgmt: ManagementSchedule = {
      id: uuidv4(),
      teacherId: data.teacherId,
      teacherName: teacher.name,
      teacherNip: teacher.nip,
      roleTitle: data.roleTitle.trim(),
      dayOfWeek: data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : 0,
      startTime: data.startTime || '07:00',
      endTime: data.endTime || '15:00',
      roomOrDesk: data.roomOrDesk || 'Ruang Manajemen / Kantor',
      description: data.description || '',
      active: true,
      version: 1,
    };

    store.managementSchedules.push(newMgmt);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'management_schedules',
      entityId: newMgmt.id,
      newData: newMgmt,
      description: `Menambahkan tugas manajemen: ${newMgmt.roleTitle} untuk ${teacher.name}`,
    });

    return newMgmt;
  }

  public static updateTeachingSchedule(
    id: string,
    data: Partial<TeachingSchedule>,
    currentUserId?: string
  ): TeachingSchedule {
    const store = dbManager.getStore();
    const schedule = store.teachingSchedules.find((s) => s.id === id);
    if (!schedule) {
      throw new Error('Jadwal mengajar tidak ditemukan.');
    }

    const oldData = { ...schedule };

    if (data.teacherId) schedule.teacherId = data.teacherId;
    if (data.classId) schedule.classId = data.classId;
    if (data.subjectId) schedule.subjectId = data.subjectId;
    if (data.dayOfWeek !== undefined) schedule.dayOfWeek = Number(data.dayOfWeek);
    if (data.startTime) schedule.startTime = data.startTime;
    if (data.endTime) schedule.endTime = data.endTime;
    if (data.room !== undefined) schedule.room = data.room;
    if ((data as any).startPeriod !== undefined) schedule.startPeriod = (data as any).startPeriod;
    if ((data as any).endPeriod !== undefined) schedule.endPeriod = (data as any).endPeriod;
    if ((data as any).periodCount !== undefined) schedule.periodCount = (data as any).periodCount;
    schedule.version = (schedule.version || 1) + 1;

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'teaching_schedules',
      entityId: id,
      oldData,
      newData: schedule,
      description: `Memperbarui jadwal mengajar: Hari ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`,
    });

    return schedule;
  }

  public static deleteTeachingSchedule(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    const index = store.teachingSchedules.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Jadwal mengajar tidak ditemukan.');
    }

    const [deleted] = store.teachingSchedules.splice(index, 1);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'teaching_schedules',
      entityId: id,
      oldData: deleted,
      description: `Menghapus jadwal mengajar: Hari ${deleted.dayOfWeek} ${deleted.startTime}-${deleted.endTime}`,
    });

    return true;
  }

  public static updatePicketSchedule(
    id: string,
    data: Partial<PicketSchedule>,
    currentUserId?: string
  ): PicketSchedule {
    const store = dbManager.getStore();
    const picket = store.picketSchedules.find((p) => p.id === id);
    if (!picket) {
      throw new Error('Jadwal piket tidak ditemukan.');
    }

    const oldData = { ...picket };

    if (data.teacherId) picket.teacherId = data.teacherId;
    if (data.date) picket.date = data.date;
    if (data.startTime) picket.startTime = data.startTime;
    if (data.endTime) picket.endTime = data.endTime;
    if (data.location !== undefined) picket.location = data.location;
    picket.version = (picket.version || 1) + 1;

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'picket_schedules',
      entityId: id,
      oldData,
      newData: picket,
      description: `Memperbarui jadwal piket: ${picket.date} ${picket.startTime}-${picket.endTime}`,
    });

    return picket;
  }

  public static deletePicketSchedule(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    const index = store.picketSchedules.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Jadwal piket tidak ditemukan.');
    }

    const [deleted] = store.picketSchedules.splice(index, 1);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'picket_schedules',
      entityId: id,
      oldData: deleted,
      description: `Menghapus jadwal piket: ${deleted.date} ${deleted.startTime}-${deleted.endTime}`,
    });

    return true;
  }

  public static deleteManagementSchedule(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    if (!store.managementSchedules) return false;
    const index = store.managementSchedules.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Jadwal manajemen tidak ditemukan.');
    }

    const [deleted] = store.managementSchedules.splice(index, 1);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'management_schedules',
      entityId: id,
      oldData: deleted,
      description: `Menghapus tugas manajemen: ${deleted.roleTitle} (${deleted.teacherName || id})`,
    });

    return true;
  }
}
