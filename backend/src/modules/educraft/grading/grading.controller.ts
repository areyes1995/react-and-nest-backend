import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  CreateAssessmentDto,
  SaveFinalGradesDto,
  SaveGradesDto,
  SaveScoresDto,
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
    description: 'Registro oficial: P/RP por bloque y periodo, C.F. y situación final.',
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
  @ApiResponse({ status: 200, description: 'Calificaciones completiva, extraordinaria y especial.' })
  saveFinals(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: SaveFinalGradesDto,
  ) {
    return this.grading.saveFinals(user.id, sectionId, dto);
  }

  @Post('sections/:sectionId/recalculate')
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'overwriteManual', required: false })
  recalculate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query('period') period?: string,
    @Query('overwriteManual') overwriteManual?: string,
  ) {
    return this.grading.recalculate(user.id, sectionId, {
      period: optionalInt(period),
      overwriteManual: overwriteManual === 'true',
    });
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
    return this.grading.listAssessments(user.id, optionalInt(sectionId), optionalInt(period));
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.grading.getAssessment(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssessmentDto) {
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
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.grading.removeAssessment(user.id, id);
  }

  @Put(':id/scores')
  @ApiResponse({ status: 200, description: 'Registra puntuaciones y recalcula el periodo.' })
  saveScores(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveScoresDto,
  ) {
    return this.grading.saveScores(user.id, id, dto);
  }
}
