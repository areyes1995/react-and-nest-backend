import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RbacRepository } from '../repositories/interfaces/rbac.repository';
import { RbacService } from './interfaces/rbac.service';
import { RoleDto, RoleSummaryDto } from '../dto/role.dto';
import { PermissionDto } from '../dto/permission.dto';

@Injectable()
export class DefaultRbacService implements RbacService {
  constructor(
    @Inject('RbacRepository')
    private readonly rbacRepository: RbacRepository,
  ) {}

  async getRoles(): Promise<RoleDto[]> {
    const roles = await this.rbacRepository.getRoles();
    return roles.map(RoleDto.fromEntity);
  }

  async getRolesSummary(): Promise<RoleSummaryDto[]> {
    const roles = await this.rbacRepository.getRolesSummary();
    return roles.map(RoleSummaryDto.fromEntity);
  }

  async getRolePermissions(identifier: string): Promise<RoleDto> {
    const numericId = /^\d+$/.test(identifier)
      ? Number(identifier)
      : null;

    const role = numericId
      ? await this.rbacRepository.getRoleById(numericId)
      : await this.rbacRepository.getRoleByName(identifier);

    if (!role) {
      throw new NotFoundException(`Role "${identifier}" not found`);
    }

    return RoleDto.fromEntity(role);
  }

  async getPermissions(): Promise<PermissionDto[]> {
    const permissions = await this.rbacRepository.getPermissions();
    return permissions.map(PermissionDto.fromEntity);
  }
}