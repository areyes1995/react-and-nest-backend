import { Body, Get, ParseIntPipe, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { formatDateOnly } from '../shared/dates.util';
import { AttendanceService } from './attendance.service';
import { SaveAttendanceDto } from './dto/attendance.dto';

@EducraftController('attendance', 'Asistencia', 'academic:manage')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (hoy por defecto)' })
  @ApiResponse({ status: 200, description: 'Pase de lista del día.' })
  roster(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId', ParseIntPipe) sectionId: number,
    @Query('date') date?: string,
  ) {
    return this.attendance.roster(user.id, sectionId, date ?? formatDateOnly(new Date()));
  }

  @Put()
  @ApiResponse({ status: 200, description: 'Guarda el pase de lista y devuelve las estadísticas.' })
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveAttendanceDto) {
    return this.attendance.save(user.id, dto);
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
