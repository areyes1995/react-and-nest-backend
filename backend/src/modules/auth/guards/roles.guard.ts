import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLES } from '../constants/roles.constants';

interface AuthenticatedUser {
  id: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    const userRoles = await this.getUserRoles(user.id);

    // SUPERADMIN bypass: zero validation, grants every role and permission.
    if (userRoles.includes(ROLES.SUPERADMIN)) return true;

    if (
      requiredRoles?.length &&
      !requiredRoles.some((role) => userRoles.includes(role))
    ) {
      throw new ForbiddenException(
        `User roles [${userRoles.join(', ')}] are not allowed for this resource`,
      );
    }

    if (requiredPermissions?.length) {
      const hasAll = await this.userHasAllPermissions(
        user.id,
        requiredPermissions,
      );
      if (!hasAll) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }

  private async getUserRoles(userId: number): Promise<string[]> {
    const user = await this.prisma.systemUser.findUnique({
      where: { id: userId },
      select: {
        roles: {
          include: { role: { select: { name: true, isActive: true } } },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    return user.roles.filter((r) => r.role.isActive).map((r) => r.role.name);
  }

  private async userHasAllPermissions(
    userId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const user = await this.prisma.systemUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!user) return false;

    const userPermissions = new Set(
      user.roles
        .filter((rp) => rp.role.isActive)
        .flatMap((rp) => rp.role.permissions.map((p) => p.permission.name)),
    );

    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
