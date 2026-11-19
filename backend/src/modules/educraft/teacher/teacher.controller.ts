import { Body, Delete, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  GoogleCallbackDto,
  GoogleSyncDto,
  UpdateTeacherProfileDto,
} from './dto/teacher.dto';
import { GoogleCalendarService } from './google-calendar.service';
import { TeacherService } from './teacher.service';

@EducraftController('teacher', 'Docente', 'module:educraft')
export class TeacherController {
  constructor(
    private readonly teacher: TeacherService,
    private readonly google: GoogleCalendarService,
  ) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.teacher.profile(user.id);
  }

  @Put('profile')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTeacherProfileDto,
  ) {
    return this.teacher.updateProfile(user.id, dto);
  }

  @Get('google-calendar/status')
  googleStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.google.statusForUser(user.id);
  }

  @Get('google-calendar/oauth-url')
  @ApiResponse({
    status: 200,
    description: 'URL de autorización OAuth (o estado deshabilitado).',
  })
  googleOAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.google.oauthUrl(user.id);
  }

  @Post('google-calendar/callback')
  @ApiResponse({
    status: 200,
    description: 'Canjea el código de autorización y guarda los tokens.',
  })
  googleCallback(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GoogleCallbackDto,
  ) {
    return this.google.exchangeCode(user.id, dto.code, dto.state);
  }

  @Post('google-calendar/sync')
  @ApiResponse({
    status: 200,
    description: 'Envía la agenda a Google Calendar.',
  })
  googleSync(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GoogleSyncDto,
  ) {
    return this.google.sync(user.id, dto.from, dto.to);
  }

  @Delete('google-calendar/disconnect')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Desconecta Google Calendar y borra los tokens.',
  })
  googleDisconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.google.disconnect(user.id);
  }

  @Get('dashboard')
  @ApiQuery({
    name: 'period',
    required: false,
    description: '1-4; omitido = año completo',
  })
  @ApiResponse({
    status: 200,
    description: 'Clases de hoy, resumen, competencias, agenda y alertas.',
  })
  dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('period') period?: string,
  ) {
    return this.teacher.dashboard(user.id, period ? Number(period) : undefined);
  }

  @Get('search')
  @ApiQuery({ name: 'q' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['all', 'resources', 'evaluations', 'students'],
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q = '',
    @Query('scope') scope?: string,
  ) {
    return this.teacher.search(user.id, q, scope);
  }
}
