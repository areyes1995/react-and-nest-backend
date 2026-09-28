import { Resource, Permission } from '@prisma/client';

export type PermissionWithResource = Permission & { resource: Resource };

export class PermissionDto {
  id!: number;
  name!: string;
  description?: string;
  resource!: string;
  resourceId!: number;

  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(permission: PermissionWithResource): PermissionDto {
    return new PermissionDto({
      id: permission.id,
      name: permission.name,
      description: permission.description ?? undefined,
      resource: permission.resource.name,
      resourceId: permission.resourceId,
    });
  }
}