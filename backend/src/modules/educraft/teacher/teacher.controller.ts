import { Body, Get, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { UpdateTeacherProfileDto } from './dto/teacher.dto';
import { TeacherService } from './teacher.service';

@EducraftController('teacher', 'Docente', 'module:educraft')
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.teacher.profile(user.id);
  }

  @Put('profile')
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTeacherProfileDto) {
    return this.teacher.updateProfile(user.id, dto);
  }

  @Get('dashboard')
  @ApiQuery({ name: 'period', required: false, description: '1-4; omitido = año completo' })
  @ApiResponse({ status: 200, description: 'Clases de hoy, resumen, competencias, agenda y alertas.' })
  dashboard(@CurrentUser() user: AuthenticatedUser, @Query('period') period?: string) {
    return this.teacher.dashboard(user.id, period ? Number(period) : undefined);
  }

  @Get('search')
  @ApiQuery({ name: 'q' })
  @ApiQuery({ name: 'scope', required: false, enum: ['all', 'resources', 'evaluations', 'students'] })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q = '',
    @Query('scope') scope?: string,
  ) {
    return this.teacher.search(user.id, q, scope);
  }
}
