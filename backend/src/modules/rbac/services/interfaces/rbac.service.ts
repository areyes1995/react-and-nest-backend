import { RoleDto, RoleSummaryDto } from '../../dto/role.dto';
import { PermissionDto } from '../../dto/permission.dto';

export interface RbacService {
  getRoles(): Promise<RoleDto[]>;
  getRolesSummary(): Promise<RoleSummaryDto[]>;
  getRolePermissions(identifier: string): Promise<RoleDto>;
  getPermissions(): Promise<PermissionDto[]>;
}