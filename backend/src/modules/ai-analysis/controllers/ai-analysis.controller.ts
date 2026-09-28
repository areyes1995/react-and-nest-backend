import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ROLES } from 'src/modules/auth/constants/roles.constants';
import { AiAnalysisOrchestratorService } from '../services/interfaces/ai-analysis-orchestrator.service';
import { ApiResponse } from '@nestjs/swagger';
import { AiAnalysisQueryParametersDto } from '../dtos/ai-analysis-query-parameters.dto';
import { AnalyzeTextDto } from '../dtos/analyze-text.dto';
import { z } from 'zod';
import * as crypto from 'crypto';

@Controller('ai-analysis')
@UseGuards(JwtGuard)
export class AiAnalysisController {
  constructor(
    @Inject('AiAnalysisOrchestratorService')
    private readonly aiAnalysisOrchestrator: AiAnalysisOrchestratorService,
  ) {}

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved AI analysis by ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'AI analysis not found.',
  })
  getAiAnalysisById(@Param('id', ParseIntPipe) id: number) {
    return this.aiAnalysisOrchestrator.getAiAnalysisById(id);
  }

  @Get()
  @Roles(ROLES.ADMIN, ROLES.EXHIBITOR, ROLES.BUSINESS, ROLES.GUEST)
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved AI analysis results.',
  })
  getAiAnalysis(@Query() query: AiAnalysisQueryParametersDto) {
    return this.aiAnalysisOrchestrator.getAiAnalysis(query);
  }

  @Post('analyze-text')
  @ApiResponse({
    status: 201,
    description: 'Texto analizado con éxito.',
  })
  async analyzeText(@Body() dto: AnalyzeTextDto) {
    // Esquema Zod: esperamos un objeto con { sentimiento, palabrasClave, resumen }
    const schema = z.object({
      sentimiento: z.enum(['positivo', 'negativo', 'neutral']),
      palabrasClave: z.array(z.string()),
      resumen: z.string(),
    });

    const result = await this.aiAnalysisOrchestrator.run({
      projectId: dto.projectId,
      analysisType: 'VALIDATION_REQUEST_ITEM',
      prompt: {
        systemInstructions: `Eres un analizador de texto.
Analiza el texto del usuario y devuelve SOLO un JSON con esta estructura:
{
  "sentimiento": "positivo|negativo|neutral",
  "palabrasClave": ["palabra1", "palabra2"],
  "resumen": "breve resumen del texto"
}`,
        userPrompt: dto.text,
        model: 'gpt-5-mini',
        temperature: 0.3,
      },
      schema,
      inputHash: crypto.createHash('sha256').update(dto.text).digest('hex'),
    });

    return {
      ...result.response,
      cached: result.cached,
      analysisId: result.analysis.id,
    };
  }
}
