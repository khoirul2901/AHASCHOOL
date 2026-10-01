import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { AcademicYear, Semester, Holiday, LessonPeriodSlot } from '../../src/types/index.js';

export const DEFAULT_LESSON_PERIODS: LessonPeriodSlot[] = [
  { id: 'jp-1', periodNumber: 1, name: 'Jam Ke-1', startTime: '07:15', endTime: '07:45', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-2', periodNumber: 2, name: 'Jam Ke-2', startTime: '07:45', endTime: '08:15', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-3', periodNumber: 3, name: 'Jam Ke-3', startTime: '08:15', endTime: '08:45', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-4', periodNumber: 4, name: 'Jam Ke-4', startTime: '08:45', endTime: '09:15', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-break-1', periodNumber: 0, name: 'Istirahat Pagi', startTime: '09:15', endTime: '09:35', isBreak: true, dayOfWeek: 0, active: true },
  { id: 'jp-5', periodNumber: 5, name: 'Jam Ke-5', startTime: '09:35', endTime: '10:05', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-6', periodNumber: 6, name: 'Jam Ke-6', startTime: '10:05', endTime: '10:35', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-7', periodNumber: 7, name: 'Jam Ke-7', startTime: '10:35', endTime: '11:05', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-8', periodNumber: 8, name: 'Jam Ke-8', startTime: '11:05', endTime: '11:35', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-break-2', periodNumber: 0, name: 'Istirahat Siang & Sholat Dzuhur', startTime: '11:35', endTime: '12:15', isBreak: true, dayOfWeek: 0, active: true },
  { id: 'jp-9', periodNumber: 9, name: 'Jam Ke-9', startTime: '12:15', endTime: '12:45', isBreak: false, dayOfWeek: 0, active: true },
  { id: 'jp-10', periodNumber: 10, name: 'Jam Ke-10', startTime: '12:45', endTime: '13:15', isBreak: false, dayOfWeek: 0, active: true },
];

export class LessonPeriodService {
  public static getAll(): LessonPeriodSlot[] {
    const store = dbManager.getStore();
    if (!store.lessonPeriods || store.lessonPeriods.length === 0) {
      store.lessonPeriods = [...DEFAULT_LESSON_PERIODS];
      dbManager.saveSync();
    }
    return store.lessonPeriods
      .filter((lp) => !lp.deletedAt)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  public static create(data: Partial<LessonPeriodSlot>, currentUserId?: string): LessonPeriodSlot {
    const store = dbManager.getStore();
    if (!store.lessonPeriods) store.lessonPeriods = [...DEFAULT_LESSON_PERIODS];

    const slot: LessonPeriodSlot = {
      id: uuidv4(),
      periodNumber: data.periodNumber !== undefined ? Number(data.periodNumber) : (data.isBreak ? 0 : store.lessonPeriods.filter(p => !p.isBreak).length + 1),
      name: data.name || (data.isBreak ? 'Istirahat' : `Jam Ke-${data.periodNumber || 1}`),
      startTime: data.startTime || '07:15',
      endTime: data.endTime || '07:45',
      isBreak: !!data.isBreak,
      dayOfWeek: data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : 0,
      active: data.active !== undefined ? !!data.active : true,
    };

    store.lessonPeriods.push(slot);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'lesson_periods',
      entityId: slot.id,
      newData: slot,
      description: `Menambahkan slot waktu JP: ${slot.name} (${slot.startTime} - ${slot.endTime})`,
    });

    return slot;
  }

  public static update(id: string, data: Partial<LessonPeriodSlot>, currentUserId?: string): LessonPeriodSlot {
    const store = dbManager.getStore();
    if (!store.lessonPeriods) store.lessonPeriods = [...DEFAULT_LESSON_PERIODS];

    const slot = store.lessonPeriods.find((lp) => lp.id === id);
    if (!slot) {
      throw new Error('Slot waktu JP tidak ditemukan.');
    }

    if (data.name !== undefined) slot.name = data.name;
    if (data.periodNumber !== undefined) slot.periodNumber = Number(data.periodNumber);
    if (data.startTime !== undefined) slot.startTime = data.startTime;
    if (data.endTime !== undefined) slot.endTime = data.endTime;
    if (data.isBreak !== undefined) slot.isBreak = !!data.isBreak;
    if (data.dayOfWeek !== undefined) slot.dayOfWeek = Number(data.dayOfWeek);
    if (data.active !== undefined) slot.active = !!data.active;

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'lesson_periods',
      entityId: slot.id,
      newData: slot,
      description: `Memperbarui slot waktu JP: ${slot.name} (${slot.startTime} - ${slot.endTime})`,
    });

    return slot;
  }

  public static delete(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    if (!store.lessonPeriods) return true;

    const idx = store.lessonPeriods.findIndex((lp) => lp.id === id);
    if (idx !== -1) {
      const removed = store.lessonPeriods[idx];
      store.lessonPeriods.splice(idx, 1);
      dbManager.saveSync();

      AuditService.log({
        userId: currentUserId,
        action: 'DELETE',
        entity: 'lesson_periods',
        entityId: id,
        description: `Menghapus slot waktu JP: ${removed.name} (${removed.startTime} - ${removed.endTime})`,
      });
    }

    return true;
  }

  public static reset(currentUserId?: string): LessonPeriodSlot[] {
    const store = dbManager.getStore();
    store.lessonPeriods = [...DEFAULT_LESSON_PERIODS];
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'RESET',
      entity: 'lesson_periods',
      description: `Reset pengaturan slot waktu JP ke template standar (07:15 - 13:15)`,
    });

    return store.lessonPeriods;
  }
}

export class AcademicService {
  public static getAcademicYear(): AcademicYear {
    const store = dbManager.getStore();
    return store.academicYear;
  }

  public static getSemester(): Semester {
    const store = dbManager.getStore();
    return store.semester;
  }

  public static getHolidays(): Holiday[] {
    const store = dbManager.getStore();
    return store.holidays || [];
  }

  public static addHoliday(data: { date: string; name: string; description?: string; isNational?: boolean }, currentUserId?: string): Holiday {
    const store = dbManager.getStore();
    const existing = store.holidays.find((h) => h.date === data.date);
    if (existing) {
      throw new Error(`Tanggal ${data.date} sudah terdaftar sebagai libur: ${existing.name}`);
    }

    const newHoliday: Holiday = {
      id: uuidv4(),
      date: data.date,
      name: data.name,
      description: data.description,
      isNational: data.isNational !== undefined ? data.isNational : true,
    };

    store.holidays.push(newHoliday);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'holidays',
      entityId: newHoliday.id,
      newData: newHoliday,
      description: `Menambahkan hari libur: ${newHoliday.name} (${newHoliday.date})`,
    });

    return newHoliday;
  }

  public static isHoliday(dateString: string): { isHoliday: boolean; holiday?: Holiday } {
    const store = dbManager.getStore();
    const holiday = store.holidays.find((h) => h.date === dateString);
    if (holiday) {
      return { isHoliday: true, holiday };
    }

    // Also check Sunday (Hari Minggu)
    const d = new Date(dateString);
    if (d.getDay() === 0) {
      return {
        isHoliday: true,
        holiday: { id: 'sunday', date: dateString, name: 'Hari Minggu', isNational: true },
      };
    }

    return { isHoliday: false };
  }
}
