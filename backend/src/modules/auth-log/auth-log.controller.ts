import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthLogService } from './auth-log.service';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';

@Controller('auth-logs')
@UseGuards(JwtGuard)
export class AuthLogController {
  constructor(private readonly authLogService: AuthLogService) {}

  @Get()
  @Roles(ROLES.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.authLogService.findAll();
  }
}
