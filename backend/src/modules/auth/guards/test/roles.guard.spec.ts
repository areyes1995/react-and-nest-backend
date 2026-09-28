import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { PERMISSIONS_KEY } from 'src/modules/auth/decorators/permissions.decorator';
import { ROLES_KEY } from 'src/modules/auth/decorators/roles.decorator';

function makeContext(opts: {
  rolesMeta?: string[];
  permsMeta?: string[];
  user?: { id: number } | undefined;
}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === ROLES_KEY) return opts.rolesMeta;
      if (key === PERMISSIONS_KEY) return opts.permsMeta;
      return undefined;
    }),
  } as unknown as Reflector;
  const request: any = { user: opts.user };
  const context = {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
  return { reflector, context };
}

describe('RolesGuard', () => {
  it('permite si no hay metadata de roles ni permisos', async () => {
    const { reflector, context } = makeContext({});
    const guard = new RolesGuard(reflector, {} as any);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('lanza Forbidden si no hay usuario autenticado', async () => {
    const { reflector, context } = makeContext({
      rolesMeta: ['ADMIN'],
      user: undefined,
    });
    const guard = new RolesGuard(reflector, {} as any);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('SUPERADMIN hace bypass total', async () => {
    const { reflector, context } = makeContext({
      rolesMeta: ['ADMIN'],
      permsMeta: ['system-user:delete'],
      user: { id: 1 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          roles: [{ role: { name: 'SUPERADMIN', isActive: true } }],
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('permite si el usuario tiene el rol requerido', async () => {
    const { reflector, context } = makeContext({
      rolesMeta: ['ADMIN'],
      user: { id: 2 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest.fn().mockResolvedValue({
          roles: [{ role: { name: 'ADMIN', isActive: true } }],
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rechaza si el rol no coincide', async () => {
    const { reflector, context } = makeContext({
      rolesMeta: ['ADMIN'],
      user: { id: 3 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest.fn().mockResolvedValue({
          roles: [{ role: { name: 'GUEST', isActive: true } }],
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('ignora roles inactivos', async () => {
    const { reflector, context } = makeContext({
      rolesMeta: ['ADMIN'],
      user: { id: 4 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest.fn().mockResolvedValue({
          roles: [{ role: { name: 'ADMIN', isActive: false } }],
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('valida que el usuario tenga TODOS los permisos requeridos', async () => {
    const { reflector, context } = makeContext({
      permsMeta: ['rag:read', 'metrics:read'],
      user: { id: 5 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest
          .fn()
          // getUserRoles
          .mockResolvedValueOnce({
            roles: [{ role: { name: 'BUSINESS', isActive: true } }],
          })
          // userHasAllPermissions
          .mockResolvedValueOnce({
            roles: [
              {
                role: {
                  isActive: true,
                  permissions: [
                    { permission: { name: 'rag:read' } },
                    { permission: { name: 'metrics:read' } },
                  ],
                },
              },
            ],
          }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rechaza si falta algún permiso', async () => {
    const { reflector, context } = makeContext({
      permsMeta: ['rag:read', 'system-user:delete'],
      user: { id: 6 },
    });
    const prisma: any = {
      systemUser: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            roles: [{ role: { name: 'GUEST', isActive: true } }],
          })
          .mockResolvedValueOnce({
            roles: [
              {
                role: {
                  isActive: true,
                  permissions: [{ permission: { name: 'rag:read' } }],
                },
              },
            ],
          }),
      },
    };
    const guard = new RolesGuard(reflector, prisma);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
