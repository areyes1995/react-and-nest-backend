// ──────────────────────────────────────────────
// Endpoints de la IA de la mesa.
//   GET  /poker/ai/status  → ¿hay IA disponible?
//   POST /poker/ai/decide  → una decisión de un rival
//   POST /poker/ai/review  → corrección de una decisión
//                            del estudiante
// El cliente llama a `status` una vez al abrir la mesa
// y decide si pide acciones a la IA o las resuelve con
// el motor local.
// ──────────────────────────────────────────────

import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { PokerAiService } from '../services/poker-ai.service';
import { TableSnapshotDto } from '../dtos/table-snapshot.dto';
import { DecisionReviewDto } from '../dtos/decision-review.dto';

@ApiTags('poker-ai')
@Controller('poker/ai')
@UseGuards(JwtGuard)
export class PokerAiController {
  constructor(private readonly pokerAi: PokerAiService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Estado de la IA de la mesa (proveedor, modelo y qué falta por configurar).',
  })
  @ApiResponse({ status: 200, description: 'Estado actual de la configuración.' })
  status(@Query('probe') probe?: string) {
    return this.pokerAi.status(probe === 'true' || probe === '1');
  }

  @Post('decide')
  @ApiOperation({ summary: 'Pide a la IA la acción de un rival de la mesa.' })
  @ApiResponse({ status: 201, description: 'Acción legal para el rival.' })
  decide(@Body() snapshot: TableSnapshotDto, @Req() request: any) {
    const userKey = String(request?.user?.id ?? request?.user?.sub ?? 'anon');
    return this.pokerAi.decide(snapshot, userKey);
  }

  @Post('review')
  @ApiOperation({
    summary: 'La IA revisa una decisión del estudiante y explica por qué.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Corrección de la jugada. Con la IA apagada devuelve source="engine" y el cliente usa el análisis del motor.',
  })
  review(@Body() dto: DecisionReviewDto, @Req() request: any) {
    const userKey = String(request?.user?.id ?? request?.user?.sub ?? 'anon');
    return this.pokerAi.review(dto, userKey);
  }
}
