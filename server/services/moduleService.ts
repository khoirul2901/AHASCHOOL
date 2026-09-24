import { dbManager } from '../db/database.js';
import type { ModuleItem } from '../../src/types/index.js';

export class ModuleService {
  public static getAll(): ModuleItem[] {
    const store = dbManager.getStore();
    return store.modules.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static getByCode(code: string): ModuleItem | null {
    const store = dbManager.getStore();
    return store.modules.find((m) => m.code.toUpperCase() === code.toUpperCase()) || null;
  }
}
