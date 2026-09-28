// ──────────────────────────────────────────────
// Endpoints del banco de preguntas.
//   GET  /quiz/meta       → niveles, temas, recuento por
//                           origen y (admins) estado de la IA
//   GET  /quiz/questions  → una partida (nivel, `random`
//                           o `source=ai`), ya barajada
//   POST /quiz/generate   → preguntas nuevas con la IA,
//                           SIN guardar      (ADMIN / SUPERADMIN)
//   POST /quiz/questions  → guarda las elegidas como
//                           origen AI        (ADMIN / SUPERADMIN)
// ──────────────────────────────────────────────

import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { QuizService } from '../services/quiz.service';
import {
  GenerateQuizDto,
  QuizQuestionsQueryDto,
  SaveQuizQuestionsDto,
} from '../dtos/quiz.dto';

type AuthRequest = { user?: { id?: number; sub?: number } };

function userId(request: AuthRequest): number | undefined {
  const id = Number(request?.user?.id ?? request?.user?.sub);
  return Number.isFinite(id) ? id : undefined;
}

@ApiTags('quiz')
@Controller('quiz')
@UseGuards(JwtGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Get('meta')
  @ApiOperation({
    summary: 'Niveles, temas y recuento por origen. El estado de la IA solo se envía a administradores.',
  })
  meta(@Req() request: AuthRequest) {
    return this.quiz.meta(userId(request));
  }

  @Get('questions')
  @ApiOperation({
    summary: 'Preguntas aleatorias de un nivel (o de todos con mode=random), con las opciones barajadas.',
  })
  questions(@Query() query: QuizQuestionsQueryDto) {
    return this.quiz.questions(query);
  }

  @Post('generate')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Genera preguntas nuevas con la IA del .env. No las guarda.' })
  @ApiResponse({ status: 201, description: 'Preguntas validadas, listas para revisar o jugar.' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN o SUPERADMIN.' })
  @ApiResponse({ status: 503, description: 'La IA está apagada o mal configurada.' })
  @ApiResponse({ status: 502, description: 'El proveedor falló o no devolvió preguntas válidas.' })
  generate(@Body() dto: GenerateQuizDto, @Req() request: AuthRequest) {
    return this.quiz.generate(dto, String(userId(request) ?? 'anon'));
  }

  @Post('questions')
  @Roles(ROLES.SUPERADMIN, ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Guarda en el banco (origen AI) las preguntas generadas que el administrador eligió.',
  })
  @ApiResponse({ status: 403, description: 'Solo ADMIN o SUPERADMIN.' })
  save(@Body() dto: SaveQuizQuestionsDto) {
    return this.quiz.saveQuestions(dto);
  }
}
