import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { SchoolClass, Subject } from '../../src/types/index.js';

export class ClassService {
  public static getAll() {
    const store = dbManager.getStore();
    return store.classes.filter((c) => !c.deletedAt).map((c) => {
      const homeroom = store.teachers.find((t) => t.id === c.homeroomTeacherId);
      const studentCount = store.students.filter((s) => s.classId === c.id && !s.deletedAt && s.active).length;
      return {
        ...c,
        homeroomTeacherName: homeroom ? homeroom.name : 'Belum Ditentukan',
        studentCount,
      } as SchoolClass;
    });
  }

  public static getById(id: string) {
    const store = dbManager.getStore();
    const c = store.classes.find((cls) => cls.id === id && !cls.deletedAt);
    if (!c) return null;
    const homeroom = store.teachers.find((t) => t.id === c.homeroomTeacherId);
    const studentCount = store.students.filter((s) => s.classId === c.id && !s.deletedAt && s.active).length;
    return {
      ...c,
      homeroomTeacherName: homeroom ? homeroom.name : 'Belum Ditentukan',
      studentCount,
    } as SchoolClass;
  }

  public static create(data: Partial<SchoolClass>, currentUserId?: string) {
    const store = dbManager.getStore();
    const existing = store.classes.find(
      (c) => c.name.toLowerCase() === (data.name || '').toLowerCase() && !c.deletedAt
    );
    if (existing) {
      throw new Error(`Kelas dengan nama ${data.name} sudah ada.`);
    }

    const newClass: SchoolClass = {
      id: uuidv4(),
      name: data.name || 'Kelas Baru',
      grade: data.grade || 7,
      major: data.major || 'Umum',
      homeroomTeacherId: data.homeroomTeacherId || undefined,
      academicYearId: data.academicYearId || store.academicYear.id,
      active: true,
      version: 1,
    };

    store.classes.push(newClass);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'classes',
      entityId: newClass.id,
      newData: newClass,
      description: `Menambahkan kelas baru: ${newClass.name}`,
    });

    return newClass;
  }
}

export class SubjectService {
  public static getAll() {
    const store = dbManager.getStore();
    return store.subjects.filter((s) => !s.deletedAt);
  }

  public static create(data: Partial<Subject>, currentUserId?: string) {
    const store = dbManager.getStore();
    const existing = store.subjects.find(
      (s) => s.code.toLowerCase() === (data.code || '').toLowerCase() && !s.deletedAt
    );
    if (existing) {
      throw new Error(`Kode mata pelajaran ${data.code} sudah digunakan.`);
    }

    const newSubject: Subject = {
      id: uuidv4(),
      code: (data.code || 'MAPEL').toUpperCase(),
      name: data.name || 'Mata Pelajaran Baru',
      description: data.description || undefined,
      active: true,
      version: 1,
    };

    store.subjects.push(newSubject);
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'subjects',
      entityId: newSubject.id,
      newData: newSubject,
      description: `Menambahkan mata pelajaran: ${newSubject.name} (${newSubject.code})`,
    });

    return newSubject;
  }
}
