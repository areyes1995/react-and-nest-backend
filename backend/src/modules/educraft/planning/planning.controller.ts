import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  CreateActivityDto,
  CreateLessonPlanDto,
  CreatePresentationDto,
  CreateUnitDto,
  UpdateActivityDto,
  UpdateLessonPlanDto,
  UpdatePresentationDto,
  UpdateUnitDto,
} from './dto/planning.dto';
import { PlanningService } from './planning.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('units', 'Programaciones curriculares', 'planning:manage')
export class UnitsController {
  constructor(private readonly planning: PlanningService) {}

  @Get()
  @ApiQuery({ name: 'gradeId', required: false })
  @ApiQuery({ name: 'schoolYearId', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gradeId') gradeId?: string,
    @Query('schoolYearId') schoolYearId?: string,
  ) {
    return this.planning.listUnits(user.id, {
      gradeId: optionalInt(gradeId),
      schoolYearId: optionalInt(schoolYearId),
    });
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.getUnit(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUnitDto) {
    return this.planning.createUnit(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.planning.updateUnit(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.removeUnit(user.id, id);
  }
}

@EducraftController('lesson-plans', 'Planes de clase', 'planning:manage')
export class LessonPlansController {
  constructor(private readonly planning: PlanningService) {}

  @Get()
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'q', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('sectionId') sectionId?: string,
    @Query('unitId') unitId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
  ) {
    return this.planning.listPlans(user.id, {
      sectionId: optionalInt(sectionId),
      unitId: optionalInt(unitId),
      from,
      to,
      q,
    });
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Plan con competencias, indicadores y contenidos resueltos.' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.getPlan(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLessonPlanDto) {
    return this.planning.createPlan(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonPlanDto,
  ) {
    return this.planning.updatePlan(user.id, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.duplicatePlan(user.id, id);
  }

  @Post(':id/presentation')
  @ApiResponse({ status: 201, description: 'Crea la presentación de la plantilla oficial.' })
  presentation(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.presentationFromPlan(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.removePlan(user.id, id);
  }
}

@EducraftController('presentations', 'Presentaciones', 'planning:manage')
export class PresentationsController {
  constructor(private readonly planning: PlanningService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.planning.listPresentations(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.getPresentation(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePresentationDto) {
    return this.planning.createPresentation(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresentationDto,
  ) {
    return this.planning.updatePresentation(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.removePresentation(user.id, id);
  }
}

@EducraftController('activities', 'Actividades interactivas', 'planning:manage')
export class ActivitiesController {
  constructor(private readonly planning: PlanningService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, enum: ActivityType })
  list(@CurrentUser() user: AuthenticatedUser, @Query('type') type?: ActivityType) {
    return this.planning.listActivities(user.id, type);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.getActivity(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateActivityDto) {
    return this.planning.createActivity(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.planning.updateActivity(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.planning.removeActivity(user.id, id);
  }
}
