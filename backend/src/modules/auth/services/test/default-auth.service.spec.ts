import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DefaultAuthService } from 'src/modules/auth/services/default-auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const compare = bcrypt.compare as jest.Mock;

function makeDeps(overrides: any = {}) {
  return {
    jwtService: { sign: jest.fn().mockReturnValue('jwt'), verify: jest.fn() },
    systemUserService: { getAuthUserByEmail: jest.fn(), getById: jest.fn() },
    authLogService: { log: jest.fn(), create: jest.fn(), logEvent: jest.fn() },
    prisma: {
      systemUser: { findUnique: jest.fn(), update: jest.fn() },
    },
    mailerService: {
      sendMail: jest.fn().mockResolvedValue(undefined),
      getFrontendUrl: jest.fn((p: string) => `http://test${p}`),
    },
    accountTokenService: {
      verify: jest.fn(),
      generate: jest.fn().mockReturnValue('tok'),
    },
    ...overrides,
  };
}

const baseUser: any = {
  id: 1,
  email: 'a@b.c',
  passwordHash: 'hash',
  mustChangePassword: false,
  emailVerified: true,
  isActive: true,
  firstName: 'A',
  lastName: 'B',
  roles: ['GUEST'],
  permissions: [],
};

describe('DefaultAuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('login ok emite token + refresh', async () => {
    compare.mockResolvedValue(true);
    const deps = makeDeps();
    deps.systemUserService.getAuthUserByEmail.mockResolvedValue(baseUser);
    const svc = new DefaultAuthService(
      deps.jwtService as any,
      deps.systemUserService as any,
      deps.authLogService as any,
      deps.prisma as any,
      deps.mailerService as any,
      deps.accountTokenService as any,
    );
    const out = await svc.login({ email: 'a@b.c', password: 'x' } as any);
    expect(out.token).toBe('jwt');
    expect(deps.jwtService.sign).toHaveBeenCalled();
  });

  it('login con password inválida → NotFound', async () => {
    compare.mockResolvedValue(false);
    const deps = makeDeps();
    deps.systemUserService.getAuthUserByEmail.mockResolvedValue(baseUser);
    const svc = new DefaultAuthService(
      deps.jwtService as any,
      deps.systemUserService as any,
      deps.authLogService as any,
      deps.prisma as any,
      deps.mailerService as any,
      deps.accountTokenService as any,
    );
    await expect(
      svc.login({ email: 'a@b.c', password: 'bad' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('login con mustChangePassword → Forbidden', async () => {
    compare.mockResolvedValue(true);
    const deps = makeDeps();
    deps.systemUserService.getAuthUserByEmail.mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
    });
    const svc = new DefaultAuthService(
      deps.jwtService as any,
      deps.systemUserService as any,
      deps.authLogService as any,
      deps.prisma as any,
      deps.mailerService as any,
      deps.accountTokenService as any,
    );
    await expect(
      svc.login({ email: 'a@b.c', password: 'x' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('login con email no verificado → Forbidden', async () => {
    compare.mockResolvedValue(true);
    const deps = makeDeps();
    deps.systemUserService.getAuthUserByEmail.mockResolvedValue({
      ...baseUser,
      emailVerified: false,
    });
    const svc = new DefaultAuthService(
      deps.jwtService as any,
      deps.systemUserService as any,
      deps.authLogService as any,
      deps.prisma as any,
      deps.mailerService as any,
      deps.accountTokenService as any,
    );
    await expect(
      svc.login({ email: 'a@b.c', password: 'x' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refresh con token inválido → Unauthorized', async () => {
    const deps = makeDeps();
    deps.jwtService.verify.mockImplementation(() => {
      throw new Error('bad');
    });
    const svc = new DefaultAuthService(
      deps.jwtService as any,
      deps.systemUserService as any,
      deps.authLogService as any,
      deps.prisma as any,
      deps.mailerService as any,
      deps.accountTokenService as any,
    );
    await expect(svc.refresh('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
