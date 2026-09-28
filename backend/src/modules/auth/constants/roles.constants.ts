import { PERMISSIONS } from './permissions.constants';
import type { PermissionName } from './permissions.constants';

// ──────────────────────────────────────────────
// Roles base del starter:
// SUPERADMIN (bypass total), ADMIN (acceso total),
// USER (uso general: dashboard, notificaciones, RAG
// y análisis IA de lectura) y GUEST (solo lectura
// mínima).
// ──────────────────────────────────────────────

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface RoleDefinition {
  name: Role;
  description: string;
  permissions: readonly PermissionName[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: ROLES.SUPERADMIN,
    description:
      'Acceso total sin validación. Se omite el chequeo de roles y permisos',
    permissions: [],
  },
  {
    name: ROLES.ADMIN,
    description: 'Acceso total. CRUD usuarios, roles, IA y auditoría',
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: ROLES.USER,
    description: 'Uso general: dashboard, notificaciones, RAG e IA',
    permissions: [
      'rag:read',
      'rag:search',
      'notification:read',
      'notification:update',
      'ai-analysis:read',
      'ai-analysis:create',
      'custom-module:read',
      'module:dashboard',
    ],
  },
  {
    name: ROLES.GUEST,
    description: 'Solo lectura mínima',
    permissions: [
      'rag:read',
      'rag:search',
      'notification:read',
      'module:dashboard',
    ],
  },
];
