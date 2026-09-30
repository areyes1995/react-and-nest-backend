import { PERMISSIONS } from './permissions.constants';
import type { PermissionName } from './permissions.constants';

// ──────────────────────────────────────────────
// Roles:
// SUPERADMIN (bypass total), ADMIN (acceso total),
// DOCENTE (espacio de trabajo del docente de
// Matemática: planificación, clases, evaluación,
// estudiantes, reportes e IA pedagógica),
// USER (uso general) y GUEST (solo lectura mínima).
// ──────────────────────────────────────────────

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  DOCENTE: 'DOCENTE',
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
    name: ROLES.DOCENTE,
    description:
      'Docente de Matemática: planificación, clases, evaluación, estudiantes, reportes e IA',
    permissions: [
      'module:dashboard',
      'module:educraft',
      'notification:read',
      'notification:update',
      'curriculum:read',
      'academic:manage',
      'planning:manage',
      'evaluation:manage',
      'library:manage',
      'report:manage',
      'ai-pedagogy:use',
      'ai-analysis:read',
      'rag:read',
      'rag:search',
    ],
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
