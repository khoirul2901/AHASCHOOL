import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { Student } from '../../src/types/index.js';

export class StudentService {
  public static getAll(params?: {
    classId?: string;
    search?: string;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const store = dbManager.getStore();
    let list = store.students.filter((s) => !s.deletedAt);

    if (params?.classId) {
      list = list.filter((s) => s.classId === params.classId);
    }

    if (params?.activeOnly) {
      list = list.filter((s) => s.active);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          (s.nisn && s.nisn.includes(q))
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const total = list.length;
    const start = (page - 1) * limit;

    const items = list.slice(start, start + limit).map((s) => {
      const cls = store.classes.find((c) => c.id === s.classId);
      return {
        ...s,
        className: cls ? cls.name : '-',
      };
    });

    return { items, total, page, limit };
  }

  public static getById(id: string): Student | null {
    const store = dbManager.getStore();
    const s = store.students.find((stu) => stu.id === id && !stu.deletedAt);
    if (!s) return null;
    const cls = store.classes.find((c) => c.id === s.classId);
    return {
      ...s,
      className: cls ? cls.name : '-',
    };
  }

  public static create(data: Partial<Student>, currentUserId?: string): Student {
    const store = dbManager.getStore();

    if (!data.nis) {
      throw new Error('Nomor Induk Siswa (NIS) wajib diisi.');
    }

    const existing = store.students.find((s) => s.nis === data.nis && !s.deletedAt);
    if (existing) {
      throw new Error(`NIS ${data.nis} sudah terdaftar atas nama ${existing.name}.`);
    }

    if (data.nisn) {
      const existingNisn = store.students.find((s) => s.nisn === data.nisn && !s.deletedAt);
      if (existingNisn) {
        throw new Error(`NISN ${data.nisn} sudah terdaftar.`);
      }
    }

    const newStudent: Student = {
      id: uuidv4(),
      nis: data.nis,
      nisn: data.nisn || undefined,
      name: data.name || 'Siswa Baru',
      gender: data.gender || 'L',
      birthDate: data.birthDate || undefined,
      classId: data.classId || 'cls-7a',
      parentName: data.parentName || undefined,
      parentPhone: data.parentPhone || undefined,
      active: data.active !== undefined ? data.active : true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    store.students.push(newStudent);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'students',
      entityId: newStudent.id,
      newData: newStudent,
      description: `Menambahkan siswa baru: ${newStudent.name} (${newStudent.nis})`,
    });

    return newStudent;
  }

  public static update(id: string, data: Partial<Student>, currentUserId?: string): Student {
    const store = dbManager.getStore();
    const index = store.students.findIndex((s) => s.id === id && !s.deletedAt);
    if (index === -1) {
      throw new Error('Data siswa tidak ditemukan.');
    }

    const current = store.students[index];

    if (data.nis && data.nis !== current.nis) {
      const existing = store.students.find((s) => s.nis === data.nis && s.id !== id && !s.deletedAt);
      if (existing) {
        throw new Error(`NIS ${data.nis} sudah terdaftar.`);
      }
    }

    const updated: Student = {
      ...current,
      ...data,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    store.students[index] = updated;
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'students',
      entityId: updated.id,
      oldData: current,
      newData: updated,
      description: `Memperbarui siswa: ${updated.name}`,
    });

    return updated;
  }

  public static delete(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    const index = store.students.findIndex((s) => s.id === id && !s.deletedAt);
    if (index === -1) {
      throw new Error('Data siswa tidak ditemukan.');
    }

    const current = store.students[index];
    current.deletedAt = new Date().toISOString();
    current.version += 1;
    current.updatedAt = new Date().toISOString();
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'students',
      entityId: current.id,
      oldData: current,
      description: `Menghapus siswa: ${current.name}`,
    });

    return true;
  }
}
