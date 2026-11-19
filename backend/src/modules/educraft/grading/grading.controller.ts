import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  CreateAssessmentDto,
  GradeHistoryQueryDto,
  RecalculateGradesDto,
  SaveFinalGradesDto,
  SaveGradesDto,
  SaveScoresDto,
  SetPeriodLockDto,
  UpdateAssessmentDto,
} from './dto/grading.dto';
import { GradingService } from './grading.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('grades', 'Calificaciones', 'academic:manage')
export class GradesController {
  constructor(private readonly grading: GradingService) {}

  @Get('sections/:sectionId')
  @ApiResponse({
    status: 200,
    description:
      'Registro oficial: P/RP por bloque y periodo, C.F., escala declarada, bloqueos y situación final.',
  })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ) {
    return this.grading.register(user.id, sectionId);
  }

  @Put('sections/:sectionId')
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: SaveGradesDto,
  ) {
    return this.grading.saveGrades(user.id, sectionId, dto.entries);
  }

  @Put('sections/:sectionId/final')
  @ApiResponse({
    status: 200,
    description: 'Calificaciones completiva, extraordinaria y especial.',
  })
  saveFinals(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: SaveFinalGradesDto,
  ) {
    return this.grading.saveFinals(user.id, sectionId, dto);
  }

  @Get('sections/:sectionId/history')
  @ApiResponse({
    status: 200,
    description: 'Historial auditable de escrituras del registro.',
  })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query() query: GradeHistoryQueryDto,
  ) {
    return this.grading.history(user.id, sectionId, query);
  }

  @Get('sections/:sectionId/locks')
  locks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ) {
    return this.grading.listLocks(user.id, sectionId);
  }

  @Post('sections/:sectionId/periods/:period/lock')
  lock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Param('period', ParseIntPipe) period: number,
    @Body() dto: SetPeriodLockDto,
  ) {
    return this.grading.setPeriodLock(
      user.id,
      sectionId,
      period,
      true,
      dto.reason,
    );
  }

  @Post('sections/:sectionId/periods/:period/unlock')
  unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Param('period', ParseIntPipe) period: number,
    @Body() dto: SetPeriodLockDto,
  ) {
    return this.grading.setPeriodLock(
      user.id,
      sectionId,
      period,
      false,
      dto.reason,
    );
  }

  @Post('sections/:sectionId/recalculate')
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'block', required: false })
  @ApiQuery({ name: 'overwriteManual', required: false })
  @ApiResponse({
    status: 200,
    description:
      'Recalcula P desde actividades con filtros opcionales de periodo y bloque.',
  })
  recalculate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query() query: RecalculateGradesDto,
  ) {
    return this.grading.recalculate(user.id, sectionId, query);
  }
}

@EducraftController('assessments', 'Actividades evaluadas', 'academic:manage')
export class AssessmentsController {
  constructor(private readonly grading: GradingService) {}

  @Get()
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'period', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId') sectionId?: string,
    @Query('period') period?: string,
  ) {
    return this.grading.listAssessments(
      user.id,
      optionalInt(sectionId),
      optionalInt(period),
    );
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.grading.getAssessment(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.grading.createAssessment(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.grading.updateAssessment(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.grading.removeAssessment(user.id, id);
  }

  @Put(':id/scores')
  @ApiResponse({
    status: 200,
    description: 'Registra puntuaciones y recalcula el periodo.',
  })
  saveScores(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveScoresDto,
  ) {
    return this.grading.saveScores(user.id, id, dto);
  }
}
