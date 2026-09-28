import {
  PermissionWithResource,
} from '../../dto/permission.dto';
import { RoleSummaryEntity, RoleWithPermissions } from '../../dto/role.dto';
import { PrismaTx } from 'prisma/prisma.types';

export interface RbacRepository {
  getRoles(tx?: PrismaTx): Promise<RoleWithPermissions[]>;
  getRolesSummary(tx?: PrismaTx): Promise<RoleSummaryEntity[]>;
  getRoleById(id: number, tx?: PrismaTx): Promise<RoleWithPermissions | null>;
  getRoleByName(name: string, tx?: PrismaTx): Promise<RoleWithPermissions | null>;
  getPermissions(tx?: PrismaTx): Promise<PermissionWithResource[]>;
}