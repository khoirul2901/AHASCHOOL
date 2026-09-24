import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seedData.js';

export interface DatabaseStore {
  school: any;
  schoolSetting: any;
  academicYear: any;
  semester: any;
  roles: any[];
  permissions: any[];
  rolePermissions: any[];
  users: any[];
  userRoles: any[];
  teachers: any[];
  subjects: any[];
  classes: any[];
  students: any[];
  teachingSchedules: any[];
  picketSchedules: any[];
  holidays: any[];
  modules: any[];
  teacherSubstitutions: any[];
  teacherAttendance: any[];
  studentAttendance: any[];
  attendanceCorrections: any[];
  auditLogs: any[];
  syncDevices: any[];
  syncChanges: any[];
  syncConflicts: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'siakad-db.json');

class DatabaseManager {
  private store: DatabaseStore | null = null;
  private isInitialized = false;

  public async init(): Promise<DatabaseStore> {
    if (this.isInitialized && this.store) {
      return this.store;
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.store = JSON.parse(fileContent);
      } else {
        this.store = await getInitialSeedData();
        this.saveSync();
      }

      this.isInitialized = true;
      return this.store!;
    } catch (err) {
      console.warn('Initializing fresh store due to error or missing data:', err);
      this.store = await getInitialSeedData();
      this.saveSync();
      this.isInitialized = true;
      return this.store;
    }
  }

  public getStore(): DatabaseStore {
    if (!this.store) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.store;
  }

  public saveSync(): void {
    if (!this.store) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.store, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  public async resetToSeed(): Promise<void> {
    this.store = await getInitialSeedData();
    this.saveSync();
  }
}

export const dbManager = new DatabaseManager();
