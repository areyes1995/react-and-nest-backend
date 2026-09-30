import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Difficulty, InstrumentType, QuestionType } from '@prisma/client';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import {
  BulkQuestionsDto,
  CreateExamDto,
  CreateInstrumentDto,
  CreateQuestionDto,
  RandomExamDto,
  UpdateExamDto,
  UpdateInstrumentDto,
  UpdateQuestionDto,
} from './dto/evaluation.dto';
import { EvaluationService } from './evaluation.service';

const optionalInt = (value?: string) => (value ? Number(value) : undefined);

@EducraftController('questions', 'Banco de preguntas', 'evaluation:manage')
export class QuestionsController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'type', required: false, enum: QuestionType })
  @ApiQuery({ name: 'gradeId', required: false })
  @ApiQuery({ name: 'difficulty', required: false, enum: Difficulty })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q?: string,
    @Query('type') type?: QuestionType,
    @Query('gradeId') gradeId?: string,
    @Query('difficulty') difficulty?: Difficulty,
  ) {
    return this.evaluation.listQuestions(user.id, {
      q,
      type,
      gradeId: optionalInt(gradeId),
      difficulty,
    });
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuestionDto) {
    return this.evaluation.createQuestion(user.id, dto);
  }

  @Post('bulk')
  @ApiResponse({ status: 201, description: 'Guarda varias preguntas (p.ej. generadas con IA).' })
  bulk(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkQuestionsDto) {
    return this.evaluation.createQuestions(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.evaluation.updateQuestion(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.evaluation.removeQuestion(user.id, id);
  }
}

@EducraftController('exams', 'Exámenes', 'evaluation:manage')
export class ExamsController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.evaluation.listExams(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.evaluation.getExam(user.id, id);
  }

  @Get(':id/versions')
  @ApiQuery({ name: 'count', required: false })
  @ApiResponse({ status: 200, description: 'Versiones barajadas del examen con su clave.' })
  versions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('count') count?: string,
  ) {
    return this.evaluation.versions(user.id, id, optionalInt(count));
  }

  @Post(':id/grade')
  @ApiResponse({ status: 201, description: 'Corrección automática de preguntas objetivas.' })
  grade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { version?: number; answers: Record<number, unknown> },
  ) {
    return this.evaluation.grade(user.id, id, body.version ?? 0, body.answers ?? {});
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.evaluation.createExam(user.id, dto);
  }

  @Post('random')
  random(@CurrentUser() user: AuthenticatedUser, @Body() dto: RandomExamDto) {
    return this.evaluation.randomExam(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
  ) {
    return this.evaluation.updateExam(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.evaluation.removeExam(user.id, id);
  }
}

@EducraftController('instruments', 'Instrumentos de evaluación', 'evaluation:manage')
export class InstrumentsController {
  constructor(private readonly evaluation: EvaluationService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, enum: InstrumentType })
  list(@CurrentUser() user: AuthenticatedUser, @Query('type') type?: InstrumentType) {
    return this.evaluation.listInstruments(user.id, type);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.evaluation.getInstrument(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInstrumentDto) {
    return this.evaluation.createInstrument(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstrumentDto,
  ) {
    return this.evaluation.updateInstrument(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.evaluation.removeInstrument(user.id, id);
  }
}
