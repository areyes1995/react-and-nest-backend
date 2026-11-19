import { Body, Delete, Get, ParseIntPipe, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { formatDateOnly } from '../shared/dates.util';
import { AttendanceService } from './attendance.service';
import {
  AttendanceHistoryDto,
  JustifyAttendanceDto,
  RevertAttendanceDto,
  SaveAttendanceDto,
} from './dto/attendance.dto';

@EducraftController('attendance', 'Asistencia', 'academic:manage')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'YYYY-MM-DD (hoy por defecto)',
  })
  @ApiResponse({ status: 200, description: 'Pase de lista del día.' })
  roster(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId', ParseIntPipe) sectionId: number,
    @Query('date') date?: string,
  ) {
    return this.attendance.roster(
      user.id,
      sectionId,
      date ?? formatDateOnly(new Date()),
    );
  }

  @Put()
  @ApiResponse({
    status: 200,
    description: 'Guarda el pase de lista y devuelve las estadísticas.',
  })
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveAttendanceDto) {
    return this.attendance.save(user.id, dto);
  }

  @Put('justify')
  @ApiResponse({
    status: 200,
    description: 'Registra o actualiza la justificación de una marca.',
  })
  justify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JustifyAttendanceDto,
  ) {
    return this.attendance.justify(user.id, dto);
  }

  @Delete()
  @ApiResponse({
    status: 200,
    description: 'Revierte la asistencia de un día o de un estudiante.',
  })
  revert(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RevertAttendanceDto,
  ) {
    return this.attendance.revert(user.id, query);
  }

  @Get('history')
  @ApiResponse({
    status: 200,
    description: 'Historial de marcas y justificaciones de la sección.',
  })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AttendanceHistoryDto,
  ) {
    return this.attendance.history(user.id, query);
  }

  @Get('stats')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  stats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId', ParseIntPipe) sectionId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.stats(user.id, sectionId, from, to);
  }
}
