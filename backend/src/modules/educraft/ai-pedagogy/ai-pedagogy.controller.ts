import {
  BadRequestException,
  Body,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { DocumentTextExtractorService } from 'src/modules/document/services/interfaces/document-text-extractor.service';
import { AuthenticatedUser } from '../shared/authenticated-user';
import { EducraftController } from '../shared/educraft-controller.decorator';
import { MAX_UPLOAD_BYTES, type UploadedFileLike } from '../shared/uploaded-file';
import {
  DocumentToSessionDto,
  GenerateActivityDto,
  GenerateExamDto,
  GenerateInstrumentDto,
  GenerateLessonPlanDto,
  GenerateObservationDto,
  GeneratePresentationDto,
  GenerateProblemsDto,
  GenerateProgramDto,
  GenerateStrategiesDto,
  QuickCommandDto,
  StepByStepDto,
  TutorMessageDto,
} from './dto/ai-pedagogy.dto';
import { PedagogicalAiService } from './pedagogical-ai.service';

@EducraftController('ai', 'IA Educraft', 'ai-pedagogy:use')
export class AiPedagogyController {
  constructor(
    private readonly ai: PedagogicalAiService,
    @Inject('DocumentTextExtractorService')
    private readonly extractor: DocumentTextExtractorService,
  ) {}

  @Get('status')
  @ApiResponse({ status: 200, description: 'Indica si hay proveedor de IA configurado.' })
  status() {
    return this.ai.status();
  }

  @Post('lesson-plan')
  @ApiResponse({ status: 201, description: 'Generador de sesiones (plantilla oficial de plan de clase).' })
  lessonPlan(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateLessonPlanDto) {
    return this.ai.lessonPlan(user.id, dto);
  }

  @Post('document-to-session')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async documentToSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DocumentToSessionDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    let text = dto.text ?? '';
    if (file) {
      if (file.mimetype.startsWith('text/')) {
        text = file.buffer.toString('utf8');
      } else {
        try {
          text = (await this.extractor.extractText(file.buffer, file.mimetype)).text;
        } catch {
          throw new BadRequestException(
            'No se pudo leer el archivo en el servidor. Envía el texto del documento o configura Azure Document Intelligence.',
          );
        }
      }
    }
    return this.ai.documentToSession(user.id, dto, text);
  }

  @Post('problems')
  @ApiResponse({ status: 201, description: 'Problemas contextualizados con solución y variantes.' })
  problems(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateProblemsDto) {
    return this.ai.problems(user.id, dto);
  }

  @Post('step-by-step')
  @ApiResponse({ status: 201, description: 'Ejemplo resuelto paso a paso para proyectar.' })
  stepByStep(@CurrentUser() user: AuthenticatedUser, @Body() dto: StepByStepDto) {
    return this.ai.stepByStep(user.id, dto.expression);
  }

  @Post('rubric')
  rubric(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateInstrumentDto) {
    return this.ai.rubric(user.id, dto);
  }

  @Post('checklist')
  checklist(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateInstrumentDto) {
    return this.ai.checklist(user.id, dto);
  }

  @Post('rating-scale')
  ratingScale(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateInstrumentDto) {
    return this.ai.ratingScale(user.id, dto);
  }

  @Post('exam')
  exam(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateExamDto) {
    return this.ai.exam(user.id, dto);
  }

  @Post('activity')
  activity(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateActivityDto) {
    return this.ai.activity(user.id, dto);
  }

  @Post('observation')
  observation(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateObservationDto) {
    return this.ai.observation(user.id, dto);
  }

  @Post('strategies')
  @ApiResponse({ status: 201, description: 'Estrategias de refuerzo basadas en el historial del grupo.' })
  strategies(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateStrategiesDto) {
    return this.ai.strategies(user.id, dto);
  }

  @Post('presentation')
  presentation(@CurrentUser() user: AuthenticatedUser, @Body() dto: GeneratePresentationDto) {
    return this.ai.presentation(user.id, dto.lessonPlanId);
  }

  @Post('program')
  @ApiResponse({ status: 201, description: 'Borrador de programación anual por unidades.' })
  program(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateProgramDto) {
    return this.ai.program(user.id, dto);
  }

  @Post('quick')
  quick(@CurrentUser() user: AuthenticatedUser, @Body() dto: QuickCommandDto) {
    return this.ai.quick(user.id, dto);
  }

  @Get('tutor/history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.ai.history(user.id);
  }

  @Post('tutor')
  tutor(@CurrentUser() user: AuthenticatedUser, @Body() dto: TutorMessageDto) {
    return this.ai.tutor(user.id, dto.message);
  }

  @Delete('tutor/history')
  @HttpCode(204)
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.ai.clearHistory(user.id);
  }
}
