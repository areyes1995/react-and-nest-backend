import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { AttendanceService } from '../attendance/attendance.service';
import { ReportService } from './report.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('reports', 'Reportes', 'report:manage')
export class ReportController {
  constructor(
    private readonly reports: ReportService,
    private readonly attendance: AttendanceService,
  ) {}

  @Get('sections/:sectionId/performance')
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Rendimiento, competencias y asistencia por estudiante.' })
  performance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query('period') period?: string,
  ) {
    return this.reports.sectionPerformance(user.id, sectionId, optionalInt(period));
  }

  @Get('sections/:sectionId/competences/:block')
  @ApiQuery({ name: 'period', required: false })
  competence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Param('block', ParseIntPipe) block: number,
    @Query('period') period?: string,
  ) {
    return this.reports.competenceDetail(user.id, sectionId, block, optionalInt(period));
  }

  @Get('sections/:sectionId/attendance')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  attendanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.stats(user.id, sectionId, from, to);
  }

  @Get('sections/:sectionId/conduct')
  conduct(@CurrentUser() user: AuthenticatedUser, @Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.reports.conduct(user.id, sectionId);
  }

  @Get('students/:studentId/bulletin')
  @ApiResponse({ status: 200, description: 'Datos del boletín oficial (plantilla MINERD).' })
  bulletin(@CurrentUser() user: AuthenticatedUser, @Param('studentId', ParseIntPipe) studentId: number) {
    return this.reports.bulletin(user.id, studentId);
  }

  @Get('students/:studentId/parent')
  parent(@CurrentUser() user: AuthenticatedUser, @Param('studentId', ParseIntPipe) studentId: number) {
    return this.reports.parentReport(user.id, studentId);
  }

  @Post('students/:studentId/share')
  @ApiResponse({ status: 201, description: 'Crea un enlace seguro de solo lectura para la familia.' })
  share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() body: { days?: number },
  ) {
    return this.reports.share(user.id, studentId, body?.days);
  }

  @Delete('shares/:linkId')
  @HttpCode(204)
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('linkId', ParseIntPipe) linkId: number) {
    return this.reports.revokeShare(user.id, linkId);
  }

  @Get('alerts')
  @ApiResponse({ status: 200, description: 'Alertas de bajo rendimiento, asistencia y entregas.' })
  alerts(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.alerts(user.id);
  }
}

/** Enlace público para padres (sin sesión). */
@ApiTags('Reportes públicos')
@Controller('public/reports')
export class PublicReportController {
  constructor(private readonly reports: ReportService) {}

  @Get(':token')
  @Public()
  @ApiResponse({ status: 200, description: 'Informe del estudiante para la familia.' })
  @ApiResponse({ status: 404, description: 'Enlace inválido o expirado.' })
  report(@Param('token') token: string) {
    return this.reports.publicReport(token);
  }
}
