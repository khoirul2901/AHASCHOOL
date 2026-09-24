import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { AcademicYear, Semester, Holiday } from '../../src/types/index.js';

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
