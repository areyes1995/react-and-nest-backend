import {
  Controller,
  Get,
  Body,
  Param,
  Inject,
  Query,
  ParseIntPipe,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { UserQueryParameters } from '../dto/system-user-query-parameters.dto';
import { UpdateSystemUserDto } from '../dto/update-system-user.dto';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { SystemUserService } from '../services/interfaces/system-user.service';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System Users')
@Controller(['user', 'users'])
// @UseGuards(JwtGuard)
export class SystemUserController {
  constructor(
    @Inject('SystemUserService')
    private readonly systemUserService: SystemUserService,
  ) {}

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.EXHIBITOR, ROLES.BUSINESS, ROLES.GUEST)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Returns the system user with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'System user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.getById(id);
  }

  @Get('email/:email')
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Returns the system user with the specified email.',
  })
  @ApiResponse({ status: 404, description: 'System user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getByEmail(@Param('email') email: string) {
    return this.systemUserService.getByEmail(email);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Returns a list of system users.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUsers(@Query() query: UserQueryParameters) {
    return this.systemUserService.getUsers(query);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Updates the system user with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'System user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateSystemUserDto,
  ) {
    return this.systemUserService.update(id, user);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 204,
    description: 'Deactivates the system user with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'System user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.deactivate(id);
  }

  @Delete('hard/:id')
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 204,
    description: 'Soft-deletes the system user with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'System user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.systemUserService.delete(id);
  }
}
