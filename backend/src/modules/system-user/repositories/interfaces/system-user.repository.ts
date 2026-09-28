import { Prisma, Role, RolePermission, SystemUser, SystemUserRole } from '@prisma/client';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { UserQueryParameters } from '../../dto/system-user-query-parameters.dto';
import { PrismaTx } from 'prisma/prisma.types';

export type SystemUserWithRoles = SystemUser & {
  roles: (SystemUserRole & {
    role: Role & {
      permissions: (RolePermission & { permission: { name: string } })[];
    };
  })[];
};

export interface SystemUserRepository {
  getById(id: number, tx?: PrismaTx): Promise<SystemUserWithRoles | null>;
  getByEmail(email: string, tx?: PrismaTx): Promise<SystemUserWithRoles | null>;
  getUsers(
    queryParameters: UserQueryParameters,
  ): Promise<PagedResultDto<SystemUserWithRoles>>;
  create(
    data: Prisma.SystemUserCreateInput,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles>;
  update(
    id: number,
    data: Prisma.SystemUserUpdateInput,
    tx?: PrismaTx,
  ): Promise<SystemUserWithRoles>;
  remove(id: number, tx?: PrismaTx): Promise<void>;
}
