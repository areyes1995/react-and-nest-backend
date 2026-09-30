// ──────────────────────────────────────────────
// @EducraftController — cabecera común de los
// controladores académicos: ruta, Swagger, JWT,
// permiso RBAC requerido y auditoría de escrituras.
// ──────────────────────────────────────────────

import { applyDecorators, Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import type { PermissionName } from 'src/modules/auth/constants/permissions.constants';
import { AuditInterceptor } from './audit.interceptor';

export function EducraftController(
  path: string,
  tag: string,
  permission: PermissionName,
) {
  return applyDecorators(
    Controller(path),
    ApiTags(tag),
    ApiBearerAuth(),
    UseGuards(JwtGuard, RolesGuard),
    Permissions(permission),
    UseInterceptors(AuditInterceptor),
  );
}
