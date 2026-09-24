import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { Teacher } from '../../src/types/index.js';

export class TeacherService {
  public static getAll(params?: { search?: string; activeOnly?: boolean; page?: number; limit?: number }) {
    const store = dbManager.getStore();
    let list = store.teachers.filter((t) => !t.deletedAt);

    if (params?.activeOnly) {
      list = list.filter((t) => t.active);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.nip && t.nip.includes(q)) ||
          (t.email && t.email.toLowerCase().includes(q))
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { items, total, page, limit };
  }

  public static getById(id: string): Teacher | null {
    const store = dbManager.getStore();
    return store.teachers.find((t) => t.id === id && !t.deletedAt) || null;
  }

  public static create(data: Partial<Teacher>, currentUserId?: string): Teacher {
    const store = dbManager.getStore();

    if (data.nip) {
      const existing = store.teachers.find((t) => t.nip === data.nip && !t.deletedAt);
      if (existing) {
        throw new Error(`NIP ${data.nip} sudah digunakan oleh guru lain.`);
      }
    }

    const newTeacher: Teacher = {
      id: uuidv4(),
      nip: data.nip || undefined,
      name: data.name || 'Guru Baru',
      email: data.email || undefined,
      phone: data.phone || undefined,
      gender: data.gender || 'L',
      address: data.address || undefined,
      active: data.active !== undefined ? data.active : true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    store.teachers.push(newTeacher);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'teachers',
      entityId: newTeacher.id,
      newData: newTeacher,
      description: `Menambahkan guru baru: ${newTeacher.name}`,
    });

    return newTeacher;
  }

  public static update(id: string, data: Partial<Teacher>, currentUserId?: string): Teacher {
    const store = dbManager.getStore();
    const index = store.teachers.findIndex((t) => t.id === id && !t.deletedAt);
    if (index === -1) {
      throw new Error('Data guru tidak ditemukan.');
    }

    const current = store.teachers[index];

    if (data.nip && data.nip !== current.nip) {
      const existing = store.teachers.find((t) => t.nip === data.nip && t.id !== id && !t.deletedAt);
      if (existing) {
        throw new Error(`NIP ${data.nip} sudah digunakan oleh guru lain.`);
      }
    }

    const updated: Teacher = {
      ...current,
      ...data,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };

    store.teachers[index] = updated;
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'teachers',
      entityId: updated.id,
      oldData: current,
      newData: updated,
      description: `Memperbarui data guru: ${updated.name}`,
    });

    return updated;
  }

  public static delete(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    const index = store.teachers.findIndex((t) => t.id === id && !t.deletedAt);
    if (index === -1) {
      throw new Error('Data guru tidak ditemukan.');
    }

    const current = store.teachers[index];
    current.deletedAt = new Date().toISOString();
    current.version += 1;
    current.updatedAt = new Date().toISOString();
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'teachers',
      entityId: current.id,
      oldData: current,
      description: `Menghapus (soft delete) guru: ${current.name}`,
    });

    return true;
  }
}
