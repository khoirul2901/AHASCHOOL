import bcrypt from 'bcryptjs';
import { dbManager } from '../db/database.js';
import { AuditService } from './auditService.js';
import type { UserSession, RoleCode } from '../../src/types/index.js';

export class AuthService {
  public static async login(username: string, password: string): Promise<UserSession | null> {
    const store = dbManager.getStore();
    const user = store.users.find(
      (u) => (u.username === username || u.email === username) && u.active && !u.deletedAt
    );

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    dbManager.saveSync();

    AuditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      description: `User ${user.username} berhasil login`,
    });

    return this.getUserSession(user.id);
  }

  public static getUserSession(userId: string): UserSession | null {
    const store = dbManager.getStore();
    const user = store.users.find((u) => u.id === userId && u.active && !u.deletedAt);
    if (!user) return null;

    // Get user roles
    const userRoleMappings = store.userRoles.filter((ur) => ur.userId === userId);
    const roleIds = userRoleMappings.map((ur) => ur.roleId);
    const roles = store.roles
      .filter((r) => roleIds.includes(r.id))
      .map((r) => r.code as RoleCode);

    // Get permissions from all roles
    const rolePermMappings = store.rolePermissions.filter((rp) => roleIds.includes(rp.roleId));
    const permissionIds = Array.from(new Set(rolePermMappings.map((rp) => rp.permissionId)));
    const permissions = store.permissions
      .filter((p) => permissionIds.includes(p.id))
      .map((p) => p.code);

    // Check if user is linked to teacher
    const teacher = store.teachers.find((t) => t.userId === user.id && t.active && !t.deletedAt);

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email || undefined,
      roles,
      permissions,
      teacherId: teacher ? teacher.id : undefined,
      schoolId: user.schoolId,
    };
  }

  public static hasPermission(session: UserSession | null, permissionCode: string): boolean {
    if (!session) return false;
    if (session.roles.includes('SUPER_ADMIN')) return true;
    return session.permissions.includes(permissionCode);
  }

  public static hasRole(session: UserSession | null, role: RoleCode): boolean {
    if (!session) return false;
    if (session.roles.includes('SUPER_ADMIN')) return true;
    return session.roles.includes(role);
  }
}
