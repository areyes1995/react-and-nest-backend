import { SystemUserRepository } from './interfaces/system-user.repository';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { UserQueryParameters } from '../dto/system-user-query-parameters.dto';
import { Injectable } from '@nestjs/common';
import { PrismaTx } from 'prisma/prisma.types';
import { paginatePrisma } from 'src/shared/helpers/prisma-pagination.helper';
import type { SystemUserWithRoles } from './interfaces/system-user.repository';

const ROLES_INCLUDE = {
  roles: {
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  },
} as const;

@Injectable()
export class PrismaSystemUserRepository implements SystemUserRepository {
  constructor(private prisma: PrismaService) {}

  async getById(
    id: number,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles | null> {
    const prismaClient = tx || this.prisma;
    return prismaClient.systemUser.findFirst({
      where: { id, deletedAt: null },
      include: ROLES_INCLUDE,
    });
  }

  async getByEmail(
    email: string,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles | null> {
    const prismaClient = tx || this.prisma;
    // Búsqueda insensible a mayúsculas/espacios — evita "credenciales inválidas" por Admin@Uapaverse.com
    return prismaClient.systemUser.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' }, deletedAt: null },
      include: ROLES_INCLUDE,
    });
  }

  async getUsers(
    query: UserQueryParameters,
  ): Promise<PagedResultDto<SystemUserWithRoles>> {
    return paginatePrisma<
      Prisma.SystemUserWhereInput,
      Prisma.SystemUserFindManyArgs,
      SystemUserWithRoles
    >({
      count: (args) => this.prisma.systemUser.count(args),
      findMany: (args) =>
        this.prisma.systemUser.findMany(args) as unknown as PromiseLike<SystemUserWithRoles[]>,
        where: { deletedAt: null },
        findManyArgs: {
          orderBy: { createdAt: 'desc' },
          include: ROLES_INCLUDE,
        },
        query,
        filterConfig: {
          id: 'number',
          firstName: 'string',
          lastName: 'string',
          employeeId: 'string',
          email: 'string',
          phoneNumber: 'string',
          role: (value) => {
            const normalized =
              typeof value === 'string' ? value.toUpperCase() : '';
            if (!normalized) return null;
            return { roles: { some: { role: { name: normalized } } } };
          },
          isActive: 'boolean',
        },
    });
  }

  async create(
    data: Prisma.SystemUserCreateInput,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles> {
    const prismaClient = tx || this.prisma;
    return prismaClient.systemUser.create({ data, include: ROLES_INCLUDE });
  }

  async update(
    id: number,
    data: Prisma.SystemUserUpdateInput,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles> {
    const prismaClient = tx || this.prisma;
    return prismaClient.systemUser.update({
      where: { id },
      data,
      include: ROLES_INCLUDE,
    });
  }

  async remove(id: number, tx?: PrismaTx): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.systemUser.delete({ where: { id } });
  }
}
