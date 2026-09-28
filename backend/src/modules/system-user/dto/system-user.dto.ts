import { PERMISSIONS } from 'src/modules/auth/constants/permissions.constants';
import { ROLES } from 'src/modules/auth/constants/roles.constants';

interface SystemUserEntity {
  id: number;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  email: string;
  phoneNumber?: string | null;
  roles?: {
    role: {
      name: string;
      isActive: boolean;
      permissions?: { permission: { name: string } }[];
    };
  }[];
  isActive: boolean;
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Permisos efectivos de un usuario = unión de permisos de sus roles activos. */
export function resolveEffectivePermissions(
  roles: NonNullable<SystemUserEntity['roles']>,
): string[] {
  const activeRoles = roles.map((r) => r.role).filter((r) => r.isActive);

  if (activeRoles.some((r) => r.name === ROLES.SUPERADMIN)) {
    return PERMISSIONS.map((p) => p.name);
  }

  return Array.from(
    new Set(
      activeRoles.flatMap((r) =>
        (r.permissions ?? []).map((p) => p.permission.name),
      ),
    ),
  );
}

export class SystemUserDto {
  id!: number;
  firstName!: string;
  lastName!: string;
  employeeId?: string;
  email!: string;
  phoneNumber?: string;
  roles!: string[];
  permissions!: string[];
  isActive!: boolean;
  emailVerified!: boolean;
  mustChangePassword!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<SystemUserDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(user: SystemUserEntity): SystemUserDto {
    return new SystemUserDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.employeeId ?? undefined,
      email: user.email,
      phoneNumber: user.phoneNumber ?? undefined,
      roles: (user.roles ?? []).map((r) => r.role.name),
      permissions: resolveEffectivePermissions(user.roles ?? []),
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
