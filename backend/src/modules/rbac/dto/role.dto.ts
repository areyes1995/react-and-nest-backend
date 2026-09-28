import { Role, RolePermission } from '@prisma/client';
import {
  PermissionDto,
  PermissionWithResource,
} from './permission.dto';

export type RoleWithPermissions = Role & {
  permissions: (RolePermission & {
    permission: PermissionWithResource;
  })[];
};

export class RoleDto {
  id!: number;
  name!: string;
  description?: string;
  isActive!: boolean;
  permissions!: PermissionDto[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(role: RoleWithPermissions): RoleDto {
    return new RoleDto({
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      isActive: role.isActive,
      permissions: role.permissions.map((rp) =>
        PermissionDto.fromEntity(rp.permission),
      ),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }
}

export interface RoleSummaryEntity {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { permissions: number };
}

export class RoleSummaryDto {
  id!: number;
  name!: string;
  description?: string;
  isActive!: boolean;
  permissionCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<RoleSummaryDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(role: RoleSummaryEntity): RoleSummaryDto {
    return new RoleSummaryDto({
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      isActive: role.isActive,
      permissionCount: role._count.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }
}