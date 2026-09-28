import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaTx } from 'prisma/prisma.types';
import { RbacRepository } from './interfaces/rbac.repository';
import { RoleSummaryEntity, RoleWithPermissions } from '../dto/role.dto';
import { PermissionWithResource } from '../dto/permission.dto';

const PERMISSION_INCLUDE = { resource: true } as const;

const ROLE_INCLUDE = {
  permissions: {
    include: {
      permission: { include: PERMISSION_INCLUDE },
    },
  },
} as const;

@Injectable()
export class PrismaRbacRepository implements RbacRepository {
  constructor(private prisma: PrismaService) {}

  private client(tx?: PrismaTx) {
    return tx ?? this.prisma;
  }

  async getRoles(tx?: PrismaTx): Promise<RoleWithPermissions[]> {
    return this.client(tx).role.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: ROLE_INCLUDE,
    });
  }

  async getRolesSummary(tx?: PrismaTx): Promise<RoleSummaryEntity[]> {
    return this.client(tx).role.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { permissions: true } },
      },
    });
  }

  async getRoleById(id: number, tx?: PrismaTx): Promise<RoleWithPermissions | null> {
    return this.client(tx).role.findFirst({
      where: { id, deletedAt: null },
      include: ROLE_INCLUDE,
    });
  }

  async getRoleByName(
    name: string,
    tx?: PrismaTx,
  ): Promise<RoleWithPermissions | null> {
    return this.client(tx).role.findFirst({
      where: { name, deletedAt: null },
      include: ROLE_INCLUDE,
    });
  }

  async getPermissions(tx?: PrismaTx): Promise<PermissionWithResource[]> {
    return this.client(tx).permission.findMany({
      include: PERMISSION_INCLUDE,
      orderBy: [{ resource: { name: 'asc' } }, { name: 'asc' }],
    });
  }
}