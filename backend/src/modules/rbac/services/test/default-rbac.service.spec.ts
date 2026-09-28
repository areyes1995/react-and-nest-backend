import { NotFoundException } from '@nestjs/common';
import { DefaultRbacService } from 'src/modules/rbac/services/default-rbac.service';
import { RoleDto, RoleSummaryDto } from 'src/modules/rbac/dto/role.dto';
import { PermissionDto } from 'src/modules/rbac/dto/permission.dto';

jest.mock('src/modules/rbac/dto/role.dto', () => ({
  RoleDto: { fromEntity: jest.fn((e: any) => ({ mappedRole: e })) },
  RoleSummaryDto: { fromEntity: jest.fn((e: any) => ({ mappedSummary: e })) },
}));
jest.mock('src/modules/rbac/dto/permission.dto', () => ({
  PermissionDto: { fromEntity: jest.fn((e: any) => ({ mappedPerm: e })) },
}));

describe('DefaultRbacService', () => {
  it('getRoles mapea vía RoleDto.fromEntity', async () => {
    const repo: any = { getRoles: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const svc = new DefaultRbacService(repo);
    await expect(svc.getRoles()).resolves.toEqual([{ mappedRole: { id: 1 } }]);
    expect(RoleDto.fromEntity).toHaveBeenCalledWith({ id: 1 }, 0, [{ id: 1 }]);
  });

  it('getRolesSummary mapea vía RoleSummaryDto', async () => {
    const repo: any = {
      getRolesSummary: jest.fn().mockResolvedValue([{ id: 2 }]),
    };
    const svc = new DefaultRbacService(repo);
    await expect(svc.getRolesSummary()).resolves.toEqual([
      { mappedSummary: { id: 2 } },
    ]);
  });

  it('getRolePermissions con id numérico usa getRoleById', async () => {
    const repo: any = {
      getRoleById: jest.fn().mockResolvedValue({ id: 5 }),
      getRoleByName: jest.fn(),
    };
    const svc = new DefaultRbacService(repo);
    await svc.getRolePermissions('123');
    expect(repo.getRoleById).toHaveBeenCalledWith(123);
    expect(repo.getRoleByName).not.toHaveBeenCalled();
  });

  it('getRolePermissions con nombre usa getRoleByName', async () => {
    const repo: any = {
      getRoleById: jest.fn(),
      getRoleByName: jest.fn().mockResolvedValue({ name: 'ADMIN' }),
    };
    const svc = new DefaultRbacService(repo);
    await svc.getRolePermissions('ADMIN');
    expect(repo.getRoleByName).toHaveBeenCalledWith('ADMIN');
  });

  it('getRolePermissions inexistente → NotFound', async () => {
    const repo: any = {
      getRoleById: jest.fn().mockResolvedValue(null),
      getRoleByName: jest.fn().mockResolvedValue(null),
    };
    const svc = new DefaultRbacService(repo);
    await expect(svc.getRolePermissions('NOPE')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getPermissions mapea vía PermissionDto', async () => {
    const repo: any = {
      getPermissions: jest.fn().mockResolvedValue([{ name: 'x' }]),
    };
    const svc = new DefaultRbacService(repo);
    await expect(svc.getPermissions()).resolves.toEqual([
      { mappedPerm: { name: 'x' } },
    ]);
    expect(PermissionDto.fromEntity).toHaveBeenCalled();
  });
});
