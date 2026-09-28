import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuthUserDto } from 'src/modules/auth/dto/auth-user.dto';
import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { CreateSystemUserDto } from '../dto/create-system-user.dto';
import {
  SystemUserDto,
  resolveEffectivePermissions,
} from '../dto/system-user.dto';
import { UserQueryParameters } from '../dto/system-user-query-parameters.dto';
import { UpdateSystemUserDto } from '../dto/update-system-user.dto';
import {
  SystemUserRepository,
  SystemUserWithRoles,
} from '../repositories/interfaces/system-user.repository';
import { SystemUserService } from './interfaces/system-user.service';
import { CreateAdminCliDto } from 'src/cli/dto/create-admin-cli.dto';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DefaultSystemUserService implements SystemUserService {
  constructor(
    @Inject('SystemUserRepository')
    private readonly systemUserRepository: SystemUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getById(id: number): Promise<SystemUserDto> {
    const user = await this.systemUserRepository.getById(id);

    if (!user) {
      throw new NotFoundException(`System user with id ${id} not found`);
    }

    return SystemUserDto.fromEntity(user);
  }

  async getByEmail(email: string): Promise<SystemUserDto> {
    const normalized = this.normalizeEmail(email)
    const user = await this.systemUserRepository.getByEmail(normalized);

    if (!user) {
      throw new NotFoundException(`System user with email ${email} not found`);
    }

    return SystemUserDto.fromEntity(user);
  }

  async getAuthUserByEmail(email: string): Promise<AuthUserDto> {
    const normalized = this.normalizeEmail(email)
    const user = await this.systemUserRepository.getByEmail(normalized);

    if (!user) {
      throw new NotFoundException(`System user with email ${email} not found`);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.roles.map((r) => r.role.name),
      permissions: resolveEffectivePermissions(user.roles),
      emailVerified: user.emailVerified,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async getUsers(
    queryParameters: UserQueryParameters,
  ): Promise<PagedResultDto<SystemUserDto>> {
    const pagedResult: PagedResultDto<SystemUserWithRoles> =
      await this.systemUserRepository.getUsers(queryParameters);

    return {
      items: pagedResult.items.map(SystemUserDto.fromEntity),
      totalItems: pagedResult.totalItems,
      page: pagedResult.page,
      pageSize: pagedResult.pageSize,
      totalPages: pagedResult.totalPages,
    };
  }

  async create(dto: CreateSystemUserDto): Promise<SystemUserDto> {
    const role = await this.resolveRole(dto.role ?? ROLES.GUEST);

    const createdUser = await this.systemUserRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      employeeId: dto.employeeId
        ? this.normalizeEmployeeId(dto.employeeId)
        : null,
      email: this.normalizeEmail(dto.email),
      passwordHash: dto.passwordHash,
      phoneNumber: dto.phoneNumber ?? null,
      emailVerified: false,
      mustChangePassword: true,
      roles: { create: { roleId: role.id } },
    });

    return SystemUserDto.fromEntity(createdUser);
  }

  async createAdmin(dto: CreateAdminCliDto): Promise<SystemUserDto> {
    const existingUser = await this.systemUserRepository.getByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException(
        `A user with email '${dto.email}' already exists.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = await this.resolveRole(dto.role ?? ROLES.GUEST);

    const createdUser = await this.systemUserRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      employeeId: dto.employeeId
        ? this.normalizeEmployeeId(dto.employeeId)
        : null,
      email: this.normalizeEmail(dto.email),
      passwordHash,
      emailVerified: false,
      mustChangePassword: true,
      roles: { create: { roleId: role.id } },
    });

    return SystemUserDto.fromEntity(createdUser);
  }

  async update(id: number, dto: UpdateSystemUserDto): Promise<SystemUserDto> {
    const existingUser = await this.systemUserRepository.getById(id);

    if (!existingUser) {
      throw new NotFoundException(`System user with id ${id} not found`);
    }

    const data: Prisma.SystemUserUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      emailVerified: dto.emailVerified,
      mustChangePassword: dto.mustChangePassword,
    };

    if (dto.role) {
      const role = await this.resolveRole(dto.role);
      data.roles = {
        deleteMany: {},
        create: { roleId: role.id },
      };
    }

    const updatedUser = await this.systemUserRepository.update(id, data);

    return SystemUserDto.fromEntity(updatedUser);
  }

  private async resolveRole(name: string) {
    const role = await this.prisma.role.findUnique({ where: { name } });

    if (!role?.isActive) {
      throw new BadRequestException(`Invalid role: ${name}`);
    }

    return role;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeEmployeeId(employeeId: string): string {
    return employeeId
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  async deactivate(id: number): Promise<void> {
    await this.prisma.systemUser.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: number): Promise<void> {
    await this.systemUserRepository.remove(id);
  }
}
