import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { RoleCode, RoleAccessRule, UserAccountItem } from '../../src/types/index.js';

export const CORE_APP_ROLES: { code: RoleCode; name: string; description: string; color: string }[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Admin Super',
    description: 'Akses penuh ke seluruh menu, pengaturan akun, database, dan hak akses sistem.',
    color: 'red',
  },
  {
    code: 'GURU_BK',
    name: 'Guru BK',
    description: 'Bimbingan Konseling, monitoring kedisiplinan siswa, catatan absensi, dan pembinaan.',
    color: 'emerald',
  },
  {
    code: 'GURU',
    name: 'Guru',
    description: 'Jadwal mengajar, presensi kelas, presensi piket, dan jurnal mengajar harian.',
    color: 'blue',
  },
  {
    code: 'WALI_KELAS',
    name: 'Wali Kelas',
    description: 'Monitoring siswa kelas binaan, absensi harian kelas, rekap kehadiran, dan komunikasi ortu.',
    color: 'teal',
  },
  {
    code: 'BENDAHARA',
    name: 'Bendahara',
    description: 'Pengelolaan keuangan sekolah, administrasi SPP, penerimaan, dan rekap pembayaran.',
    color: 'amber',
  },
  {
    code: 'TU',
    name: 'TU (Tata Usaha)',
    description: 'Administrasi kesiswaan, kepegawaian, cetak kartu ID/NFC, dan persuratan dinas.',
    color: 'indigo',
  },
  {
    code: 'SISWA',
    name: 'Siswa',
    description: 'Melihat jadwal pelajaran pribadi, rekap kehadiran diri, dan pengumuman sekolah.',
    color: 'cyan',
  },
];

export const DEFAULT_ROLE_ACCESS_RULES: RoleAccessRule[] = [
  {
    tabId: 'dashboard',
    name: 'Dashboard & Statistik',
    category: 'Umum',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'BENDAHARA', 'TU', 'SISWA'],
  },
  {
    tabId: 'teachers',
    name: 'Master Data Guru & Pegawai',
    category: 'Master Data',
    allowedRoles: ['SUPER_ADMIN', 'TU'],
  },
  {
    tabId: 'students',
    name: 'Master Data Siswa & Wali',
    category: 'Master Data',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'TU'],
  },
  {
    tabId: 'classes',
    name: 'Manajemen Kelas & Ruangan',
    category: 'Master Data',
    allowedRoles: ['SUPER_ADMIN', 'TU'],
  },
  {
    tabId: 'subjects',
    name: 'Mata Pelajaran & Jam Pelajaran (JP)',
    category: 'Master Data',
    allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU', 'WALI_KELAS'],
  },
  {
    tabId: 'schedules',
    name: 'Jadwal Mengajar & Piket',
    category: 'KBM & Jadwal',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU', 'SISWA'],
  },
  {
    tabId: 'scan-kiosk',
    name: 'Mesin Scan Presensi (Kiosk)',
    category: 'Presensi',
    allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'],
  },
  {
    tabId: 'attendance-student',
    name: 'Presensi Kelas Siswa',
    category: 'Presensi',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'],
  },
  {
    tabId: 'attendance-teacher',
    name: 'Presensi Harian Guru & Staf',
    category: 'Presensi',
    allowedRoles: ['SUPER_ADMIN', 'TU', 'GURU'],
  },
  {
    tabId: 'attendance-dhuha',
    name: 'Presensi Sholat Dhuha',
    category: 'Presensi',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'GURU', 'WALI_KELAS', 'TU'],
  },
  {
    tabId: 'id-cards',
    name: 'Cetak Kartu Siswa & Guru (QR/NFC)',
    category: 'Administrasi',
    allowedRoles: ['SUPER_ADMIN', 'TU'],
  },
  {
    tabId: 'reports',
    name: 'Laporan Rekap & Statistik',
    category: 'Laporan',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS', 'BENDAHARA', 'TU'],
  },
  {
    tabId: 'mod-keuangan',
    name: 'Modul Keuangan & SPP',
    category: 'Modul Ekstensi',
    allowedRoles: ['SUPER_ADMIN', 'BENDAHARA', 'TU'],
  },
  {
    tabId: 'mod-kesiswaan',
    name: 'Modul BK & Kesiswaan',
    category: 'Modul Ekstensi',
    allowedRoles: ['SUPER_ADMIN', 'GURU_BK', 'WALI_KELAS'],
  },
  {
    tabId: 'database',
    name: 'Kelola Database JSON & Backup',
    category: 'Sistem',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    tabId: 'sync',
    name: 'Pusat Sinkronisasi Offline',
    category: 'Sistem',
    allowedRoles: ['SUPER_ADMIN', 'TU'],
  },
  {
    tabId: 'settings',
    name: 'Pengaturan Akun & Hak Akses Role',
    category: 'Sistem',
    allowedRoles: ['SUPER_ADMIN'],
  },
];

export class UserService {
  private static ensureRoles() {
    const store = dbManager.getStore();
    if (!store.roles) store.roles = [];

    CORE_APP_ROLES.forEach((r) => {
      const existing = store.roles.find((item) => item.code === r.code);
      if (!existing) {
        store.roles.push({
          id: `role-${r.code.toLowerCase().replace(/_/g, '')}`,
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: true,
        });
      } else {
        existing.name = r.name;
        existing.description = r.description;
      }
    });

    // Ensure roleAccess array
    if (!(store as any).roleAccess || (store as any).roleAccess.length === 0) {
      (store as any).roleAccess = [...DEFAULT_ROLE_ACCESS_RULES];
    }

    // Ensure 7 standard accounts exist for all core roles
    const standardAccounts: {
      username: string;
      pass: string;
      fullName: string;
      roleCode: RoleCode;
      email: string;
    }[] = [
      {
        username: 'admin',
        pass: 'admin123',
        fullName: 'Administrator Sekolah (Admin Super)',
        roleCode: 'SUPER_ADMIN',
        email: 'admin@sekolah.sch.id',
      },
      {
        username: 'gurubk',
        pass: 'bk123',
        fullName: 'Dra. Hj. Siti Aminah, M.Si. (Guru BK)',
        roleCode: 'GURU_BK',
        email: 'gurubk@sekolah.sch.id',
      },
      {
        username: 'budi',
        pass: 'guru123',
        fullName: 'Budi Santoso, S.Pd. (Guru Pengajar)',
        roleCode: 'GURU',
        email: 'budi.santoso@sekolah.sch.id',
      },
      {
        username: 'walikelas',
        pass: 'wali123',
        fullName: 'Hendra Gunawan, S.Kom. (Wali Kelas VII-A)',
        roleCode: 'WALI_KELAS',
        email: 'walikelas@sekolah.sch.id',
      },
      {
        username: 'bendahara',
        pass: 'bendahara123',
        fullName: 'Ratna Sari, S.Pd. (Bendahara Sekolah)',
        roleCode: 'BENDAHARA',
        email: 'bendahara@sekolah.sch.id',
      },
      {
        username: 'tu',
        pass: 'tu123',
        fullName: 'Joko Purnomo, S.Pd. (Staf Tata Usaha)',
        roleCode: 'TU',
        email: 'tu@sekolah.sch.id',
      },
      {
        username: 'siswa',
        pass: 'siswa123',
        fullName: 'Ahmad Faiz Pratama (Siswa VII-A)',
        roleCode: 'SISWA',
        email: 'siswa@sekolah.sch.id',
      },
    ];

    let hasChanges = false;
    standardAccounts.forEach((acc) => {
      const existing = store.users.find(
        (u) => u.username.toLowerCase() === acc.username.toLowerCase() && !u.deletedAt
      );
      const roleRecord = store.roles.find((r) => r.code === acc.roleCode);

      if (!existing) {
        const newId = `usr-${acc.username}`;
        store.users.push({
          id: newId,
          schoolId: store.school?.id || 'sch-alhikam-001',
          username: acc.username,
          passwordHash: bcrypt.hashSync(acc.pass, 10),
          fullName: acc.fullName,
          email: acc.email,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });

        if (roleRecord) {
          store.userRoles.push({
            id: uuidv4(),
            userId: newId,
            roleId: roleRecord.id,
          });
        }
        hasChanges = true;
      } else {
        // Ensure user has their role mapped
        const userRole = store.userRoles.find((ur) => ur.userId === existing.id);
        if (!userRole && roleRecord) {
          store.userRoles.push({
            id: uuidv4(),
            userId: existing.id,
            roleId: roleRecord.id,
          });
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      dbManager.saveSync();
    }
  }

  public static getRoles() {
    this.ensureRoles();
    return CORE_APP_ROLES;
  }

  public static getAllUsers(): UserAccountItem[] {
    this.ensureRoles();
    const store = dbManager.getStore();

    return store.users
      .filter((u) => !u.deletedAt)
      .map((u) => {
        // Find mapped role
        const mapping = store.userRoles.find((ur) => ur.userId === u.id);
        let role = store.roles.find((r) => r.id === mapping?.roleId);
        
        // Fallback for code matching
        if (!role && mapping?.roleId) {
          role = store.roles.find((r) => r.code === mapping.roleId);
        }

        const roleCode = (role ? role.code : (u.role || 'GURU')) as RoleCode;
        const roleInfo = CORE_APP_ROLES.find((r) => r.code === roleCode);

        // Find linked teacher or student
        const teacher = store.teachers.find((t) => t.userId === u.id || t.id === u.teacherId);
        const student = store.students.find((s) => s.id === u.studentId);

        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName || u.name || u.username,
          email: u.email,
          roleCode,
          roleName: roleInfo ? roleInfo.name : (role ? role.name : 'Guru'),
          active: u.active !== false,
          teacherId: teacher?.id,
          teacherName: teacher?.name,
          studentId: student?.id,
          studentName: student?.name,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        };
      });
  }

  public static async createUser(
    data: {
      username: string;
      fullName: string;
      password: string;
      roleCode: RoleCode;
      email?: string;
      phone?: string;
      teacherId?: string;
      studentId?: string;
      active?: boolean;
    },
    currentUserId?: string
  ): Promise<UserAccountItem> {
    this.ensureRoles();
    const store = dbManager.getStore();

    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername) {
      throw new Error('Username wajib diisi.');
    }
    if (cleanUsername.length < 3) {
      throw new Error('Username minimal 3 karakter.');
    }
    if (!data.password || data.password.length < 5) {
      throw new Error('Password minimal 5 karakter.');
    }

    const existing = store.users.find(
      (u) => u.username.toLowerCase() === cleanUsername && !u.deletedAt
    );
    if (existing) {
      throw new Error(`Username "${cleanUsername}" sudah digunakan akun lain.`);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUserId = uuidv4();

    const newUser = {
      id: newUserId,
      schoolId: store.school?.id || 'sch-alhikam-001',
      username: cleanUsername,
      passwordHash,
      fullName: data.fullName.trim(),
      email: data.email?.trim() || `${cleanUsername}@smpalhikam.sch.id`,
      phone: data.phone?.trim() || undefined,
      teacherId: data.teacherId || undefined,
      studentId: data.studentId || undefined,
      active: data.active !== undefined ? !!data.active : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    store.users.push(newUser);

    // Link role
    const roleRecord = store.roles.find((r) => r.code === data.roleCode) || store.roles[0];
    store.userRoles.push({
      id: uuidv4(),
      userId: newUserId,
      roleId: roleRecord ? roleRecord.id : 'role-guru',
    });

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'users',
      entityId: newUserId,
      newData: { username: newUser.username, role: data.roleCode },
      description: `Menambahkan akun pengguna baru: ${newUser.username} (${data.roleCode})`,
    });

    const roleInfo = CORE_APP_ROLES.find((r) => r.code === data.roleCode);

    return {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      roleCode: data.roleCode,
      roleName: roleInfo ? roleInfo.name : data.roleCode,
      active: newUser.active,
      teacherId: data.teacherId,
      studentId: data.studentId,
      createdAt: newUser.createdAt,
    };
  }

  public static async updateUser(
    id: string,
    data: {
      username?: string;
      fullName?: string;
      password?: string;
      roleCode?: RoleCode;
      email?: string;
      phone?: string;
      teacherId?: string;
      studentId?: string;
      active?: boolean;
    },
    currentUserId?: string
  ): Promise<UserAccountItem> {
    this.ensureRoles();
    const store = dbManager.getStore();

    const user = store.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) {
      throw new Error('Data pengguna tidak ditemukan.');
    }

    if (data.username) {
      const cleanUsername = data.username.trim().toLowerCase();
      if (cleanUsername !== user.username.toLowerCase()) {
        const existing = store.users.find(
          (u) => u.username.toLowerCase() === cleanUsername && u.id !== id && !u.deletedAt
        );
        if (existing) {
          throw new Error(`Username "${cleanUsername}" sudah digunakan akun lain.`);
        }
        user.username = cleanUsername;
      }
    }

    if (data.fullName !== undefined) user.fullName = data.fullName.trim();
    if (data.email !== undefined) user.email = data.email.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.active !== undefined) user.active = !!data.active;
    if (data.teacherId !== undefined) user.teacherId = data.teacherId;
    if (data.studentId !== undefined) user.studentId = data.studentId;

    if (data.password && data.password.trim() !== '') {
      if (data.password.length < 5) {
        throw new Error('Password baru minimal 5 karakter.');
      }
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    user.updatedAt = new Date().toISOString();
    user.version = (user.version || 1) + 1;

    // Update role if provided
    if (data.roleCode) {
      const roleRecord = store.roles.find((r) => r.code === data.roleCode);
      if (roleRecord) {
        // remove existing mapping
        store.userRoles = store.userRoles.filter((ur) => ur.userId !== id);
        // add new mapping
        store.userRoles.push({
          id: uuidv4(),
          userId: id,
          roleId: roleRecord.id,
        });
      }
    }

    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'users',
      entityId: id,
      description: `Memperbarui akun pengguna: ${user.username}`,
    });

    const mapping = store.userRoles.find((ur) => ur.userId === id);
    const role = store.roles.find((r) => r.id === mapping?.roleId);
    const roleCode = (role ? role.code : (data.roleCode || 'GURU')) as RoleCode;
    const roleInfo = CORE_APP_ROLES.find((r) => r.code === roleCode);

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleCode,
      roleName: roleInfo ? roleInfo.name : roleCode,
      active: user.active,
      teacherId: user.teacherId,
      studentId: user.studentId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  public static deleteUser(id: string, currentUserId?: string): boolean {
    const store = dbManager.getStore();
    const user = store.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) {
      throw new Error('Data pengguna tidak ditemukan.');
    }

    if (user.username.toLowerCase() === 'admin') {
      throw new Error('Akun Admin Utama tidak boleh dihapus demi keamanan sistem.');
    }

    user.deletedAt = new Date().toISOString();
    user.active = false;
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'DELETE',
      entity: 'users',
      entityId: id,
      description: `Menonaktifkan / menghapus akun pengguna: ${user.username}`,
    });

    return true;
  }

  public static getRoleAccessRules(): RoleAccessRule[] {
    this.ensureRoles();
    const store = dbManager.getStore();
    if (!(store as any).roleAccess || (store as any).roleAccess.length === 0) {
      (store as any).roleAccess = [...DEFAULT_ROLE_ACCESS_RULES];
      dbManager.saveSync();
    }
    return (store as any).roleAccess;
  }

  public static updateRoleAccessRules(rules: RoleAccessRule[], currentUserId?: string): RoleAccessRule[] {
    this.ensureRoles();
    const store = dbManager.getStore();
    (store as any).roleAccess = rules;
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'UPDATE',
      entity: 'role_access',
      description: `Memperbarui matriks hak akses menu untuk 7 role aplikasi`,
    });

    return (store as any).roleAccess;
  }

  public static resetRoleAccessRules(currentUserId?: string): RoleAccessRule[] {
    this.ensureRoles();
    const store = dbManager.getStore();
    (store as any).roleAccess = [...DEFAULT_ROLE_ACCESS_RULES];
    dbManager.saveSync();

    AuditService.log({
      userId: currentUserId,
      action: 'RESET',
      entity: 'role_access',
      description: `Reset matriks hak akses menu ke standar default sekolah`,
    });

    return (store as any).roleAccess;
  }
}
