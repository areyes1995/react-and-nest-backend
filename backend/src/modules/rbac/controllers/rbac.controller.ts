import {
  Controller,
  Get,
  Inject,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { RbacService } from '../services/interfaces/rbac.service';

@ApiTags('RBAC')
@Controller()
@UseGuards(JwtGuard, RolesGuard)
export class RbacController {
  constructor(
    @Inject('RbacService')
    private readonly rbacService: RbacService,
  ) {}

  @Get('roles/all')
  @Roles(ROLES.ADMIN)
  @ApiResponse({ status: 200, description: 'Returns all roles with their permissions.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('roles')
  @Roles(ROLES.ADMIN)
  @ApiResponse({ status: 200, description: 'Returns all roles without their permissions.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRolesSummary() {
    return this.rbacService.getRolesSummary();
  }

  @Get('roles/:identifier')
  @Roles(ROLES.ADMIN)
  @ApiResponse({ status: 200, description: 'Returns the role (by id or name) with its permissions.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRolePermissions(@Param('identifier') identifier: string) {
    return this.rbacService.getRolePermissions(identifier);
  }

  @Get('permissions')
  @Roles(ROLES.ADMIN)
  @ApiResponse({ status: 200, description: 'Returns all permissions grouped by resource.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }
}