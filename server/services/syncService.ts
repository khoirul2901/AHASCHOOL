import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { SyncConflictItem } from '../../src/types/index.js';

export interface PushChangePayload {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  payload: any;
  version: number;
}

export class SyncService {
  public static push(deviceId: string, changes: PushChangePayload[]) {
    const store = dbManager.getStore();
    const syncedIds: string[] = [];
    const conflicts: SyncConflictItem[] = [];

    // Register / update device
    let device = store.syncDevices.find((d) => d.deviceId === deviceId);
    if (!device) {
      device = {
        id: uuidv4(),
        deviceId,
        deviceName: `Perangkat ${deviceId.slice(0, 8)}`,
        deviceType: 'CLIENT_APP',
        lastSyncAt: new Date().toISOString(),
        isActive: true,
        registeredAt: new Date().toISOString(),
      };
      store.syncDevices.push(device);
    } else {
      device.lastSyncAt = new Date().toISOString();
    }

    for (const change of changes) {
      try {
        const { entity, entityId, payload, version, operation } = change;

        // Duplicate / Idempotency handling for Teacher Attendance:
        if (entity === 'teacher_attendance') {
          const existing = store.teacherAttendance.find(
            (a) =>
              (a.id === entityId) ||
              (a.teacherId === payload.teacherId &&
                a.attendanceDate === payload.attendanceDate &&
                a.attendanceType === payload.attendanceType &&
                a.scheduleId === payload.scheduleId)
          );

          if (existing) {
            if (existing.version > version) {
              // Potential conflict
              const conflict: SyncConflictItem = {
                id: uuidv4(),
                entity,
                entityId: existing.id,
                localData: payload,
                serverData: existing,
                localVersion: version,
                serverVersion: existing.version,
                createdAt: new Date().toISOString(),
              };
              store.syncConflicts.push(conflict);
              conflicts.push(conflict);
              continue;
            } else {
              // Update existing
              Object.assign(existing, payload);
              existing.version += 1;
              existing.updatedAt = new Date().toISOString();
              syncedIds.push(change.id);
              continue;
            }
          } else {
            // Insert
            store.teacherAttendance.push({
              ...payload,
              id: entityId || uuidv4(),
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            syncedIds.push(change.id);
            continue;
          }
        }

        // Duplicate / Idempotency handling for Student Attendance:
        if (entity === 'student_attendance') {
          const existing = store.studentAttendance.find(
            (a) =>
              (a.id === entityId) ||
              (a.studentId === payload.studentId &&
                a.attendanceDate === payload.attendanceDate &&
                a.scheduleId === payload.scheduleId)
          );

          if (existing) {
            if (existing.version > version) {
              const conflict: SyncConflictItem = {
                id: uuidv4(),
                entity,
                entityId: existing.id,
                localData: payload,
                serverData: existing,
                localVersion: version,
                serverVersion: existing.version,
                createdAt: new Date().toISOString(),
              };
              store.syncConflicts.push(conflict);
              conflicts.push(conflict);
              continue;
            } else {
              Object.assign(existing, payload);
              existing.version += 1;
              existing.updatedAt = new Date().toISOString();
              syncedIds.push(change.id);
              continue;
            }
          } else {
            store.studentAttendance.push({
              ...payload,
              id: entityId || uuidv4(),
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            syncedIds.push(change.id);
            continue;
          }
        }

        // General entity handling (students, teachers, etc.)
        syncedIds.push(change.id);
      } catch (err) {
        console.error('Error applying change in sync:', err);
      }
    }

    dbManager.saveSync();

    AuditService.log({
      action: 'SYNC',
      entity: 'sync_devices',
      entityId: deviceId,
      description: `Sinkronisasi push dari ${deviceId}: ${syncedIds.length} berhasil, ${conflicts.length} konflik`,
    });

    return {
      success: true,
      syncedCount: syncedIds.length,
      syncedIds,
      conflicts,
      serverTime: new Date().toISOString(),
    };
  }

  public static pull(since?: string) {
    const store = dbManager.getStore();
    const sinceTime = since ? new Date(since).getTime() : 0;

    const filterSince = (list: any[]) =>
      list.filter((item) => {
        const t = new Date(item.updatedAt || item.createdAt || 0).getTime();
        return t >= sinceTime;
      });

    return {
      teachers: filterSince(store.teachers),
      students: filterSince(store.students),
      classes: filterSince(store.classes),
      subjects: filterSince(store.subjects),
      teachingSchedules: filterSince(store.teachingSchedules),
      picketSchedules: filterSince(store.picketSchedules),
      teacherAttendance: filterSince(store.teacherAttendance),
      studentAttendance: filterSince(store.studentAttendance),
      holidays: store.holidays,
      modules: store.modules,
      serverTime: new Date().toISOString(),
    };
  }

  public static getConflicts() {
    const store = dbManager.getStore();
    return store.syncConflicts.filter((c) => !c.resolvedAt);
  }

  public static resolveConflict(
    conflictId: string,
    resolution: 'USE_LOCAL' | 'USE_SERVER' | 'MERGE',
    userId?: string
  ) {
    const store = dbManager.getStore();
    const conflict = store.syncConflicts.find((c) => c.id === conflictId);
    if (!conflict) throw new Error('Konflik tidak ditemukan.');

    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolvedBy = userId || 'admin';

    if (resolution === 'USE_LOCAL' && conflict.localData) {
      const data = typeof conflict.localData === 'string' ? JSON.parse(conflict.localData) : conflict.localData;
      if (conflict.entity === 'teacher_attendance') {
        const item = store.teacherAttendance.find((a) => a.id === conflict.entityId);
        if (item) Object.assign(item, data);
      } else if (conflict.entity === 'student_attendance') {
        const item = store.studentAttendance.find((a) => a.id === conflict.entityId);
        if (item) Object.assign(item, data);
      }
    }

    dbManager.saveSync();

    AuditService.log({
      userId,
      action: 'SYNC_CONFLICT',
      entity: conflict.entity,
      entityId: conflict.entityId,
      description: `Resolusi konflik ${conflict.entity}: dipilih ${resolution}`,
    });

    return conflict;
  }
}
