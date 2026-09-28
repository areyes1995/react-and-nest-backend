import { PagedResultDto } from 'src/shared/dtos/paged-result.dto';
import { SystemUserDto } from '../../dto/system-user.dto';
import { UserQueryParameters } from '../../dto/system-user-query-parameters.dto';
import { UpdateSystemUserDto } from '../../dto/update-system-user.dto';
import { AuthUserDto } from 'src/modules/auth/dto/auth-user.dto';
import { CreateSystemUserDto } from '../../dto/create-system-user.dto';
import { CreateAdminCliDto } from 'src/cli/dto/create-admin-cli.dto';

export interface SystemUserService {
  getById(id: number): Promise<SystemUserDto>;
  getByEmail(email: string): Promise<SystemUserDto>;
  getAuthUserByEmail(email: string): Promise<AuthUserDto>;
  getUsers(
    queryParameters: UserQueryParameters,
  ): Promise<PagedResultDto<SystemUserDto>>;
  create(dto: CreateSystemUserDto): Promise<SystemUserDto>;
  createAdmin(dto: CreateAdminCliDto): Promise<SystemUserDto>;
  update(id: number, data: UpdateSystemUserDto): Promise<SystemUserDto>;
  deactivate(id: number): Promise<void>;
  delete(id: number): Promise<void>;
}
