import { Controller, Get } from '@nestjs/common';

/**
 * Healthcheck para Docker / orquestadores.
 * Con el prefijo global `api/v1` responde en GET /api/v1/health.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
