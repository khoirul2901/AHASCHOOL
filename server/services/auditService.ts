import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';

export interface LogAuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  description?: string;
}

export class AuditService {
  public static log(params: LogAuditParams) {
    const store = dbManager.getStore();
    const entry = {
      id: uuidv4(),
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      description: params.description || null,
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.unshift(entry);
    // Keep max 1000 logs in storage
    if (store.auditLogs.length > 1000) {
      store.auditLogs.length = 1000;
    }
    dbManager.saveSync();
    return entry;
  }

  public static getLogs(limit = 100, page = 1) {
    const store = dbManager.getStore();
    const start = (page - 1) * limit;
    const items = store.auditLogs.slice(start, start + limit).map((log) => {
      const user = log.userId ? store.users.find((u) => u.id === log.userId) : null;
      return {
        ...log,
        userName: user ? user.fullName : 'Sistem / Anonim',
      };
    });
    return {
      items,
      total: store.auditLogs.length,
      page,
      limit,
    };
  }
}
