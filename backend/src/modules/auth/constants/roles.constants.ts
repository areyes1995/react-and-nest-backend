import { PERMISSIONS } from './permissions.constants';
import type { PermissionName } from './permissions.constants';

// ──────────────────────────────────────────────
// Roles UAPAverse (ver .docs/requerimientos-uapaverse,
// dashboard_requerimientos_consolidados_uapaverse.txt
// §1/§3 y todos_3d_stands.md RF-3D-46):
// SUPERADMIN (bypass total), ADMIN (acceso total),
// EXHIBITOR (presentador: gestiona sus proyectos y
// stands + sus métricas), BUSINESS (dashboard
// empresarial de lectura) y GUEST (visitante o
// académico: recorre ferias, visita stands).
// ──────────────────────────────────────────────

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  EXHIBITOR: 'EXHIBITOR',
  BUSINESS: 'BUSINESS',
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
    description:
      'Acceso total. CRUD usuarios, roles, proyectos, stands, ferias, métricas globales',
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: ROLES.EXHIBITOR,
    description:
      'Presentador. Gestiona sus proyectos y stands, sus métricas, solicitudes y mensajería',
    permissions: [
      'rag:read',
      'rag:search',
      'notification:read',
      'notification:update',
      'ai-analysis:read',
      'custom-module:read',
      'module:records',
    ],
  },
  {
    name: ROLES.BUSINESS,
    description: 'Dashboard empresarial de lectura. Métricas y documentos',
    permissions: [
      'rag:read',
      'rag:search',
      'notification:read',
      'module:records',
    ],
  },
  {
    name: ROLES.GUEST,
    description:
      'Visitante o académico. Recorre ferias, visita stands, gestiona intereses',
    permissions: [
      'rag:read',
      'rag:search',
      'notification:read',
      'module:records',
    ],
  },
];
