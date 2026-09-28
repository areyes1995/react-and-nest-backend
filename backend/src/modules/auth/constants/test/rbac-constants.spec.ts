import { PERMISSIONS, RESOURCES } from 'src/modules/auth/constants/permissions.constants';
import { ROLES, ROLE_DEFINITIONS } from 'src/modules/auth/constants/roles.constants';

describe('RBAC constants', () => {
  it('ROLES contiene los 5 roles esperados', () => {
    expect(Object.values(ROLES)).toEqual(
      expect.arrayContaining(['SUPERADMIN', 'ADMIN', 'EXHIBITOR', 'BUSINESS', 'GUEST']),
    );
  });

  it('ADMIN cubre todos los PERMISSIONS', () => {
    const admin = ROLE_DEFINITIONS.find((r) => r.name === 'ADMIN')!;
    expect(admin.permissions).toHaveLength(PERMISSIONS.length);
    for (const p of PERMISSIONS) {
      expect(admin.permissions).toContain(p.name);
    }
  });

  it('SUPERADMIN tiene lista vacía (bypass por código)', () => {
    const sa = ROLE_DEFINITIONS.find((r) => r.name === 'SUPERADMIN')!;
    expect(sa.permissions).toEqual([]);
  });

  it('ningún permiso es huérfano: resource ∈ RESOURCES', () => {
    const resources = new Set<string>(RESOURCES.map((r) => r.name));
    for (const p of PERMISSIONS) {
      expect(resources.has(p.resource)).toBe(true);
    }
  });

  it('EXHIBITOR/BUSINESS/GUEST solo usan permisos existentes', () => {
    const valid = new Set<string>(PERMISSIONS.map((p) => p.name));
    for (const def of ROLE_DEFINITIONS) {
      for (const perm of def.permissions) {
        expect(valid.has(perm)).toBe(true);
      }
    }
  });

  it('nombres de permisos únicos', () => {
    const names = PERMISSIONS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
