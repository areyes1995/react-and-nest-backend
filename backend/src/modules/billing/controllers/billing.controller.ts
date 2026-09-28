// ──────────────────────────────────────────────
// Pagos y suscripciones.
//   GET  /billing/config        → modo (simulado o real) y pasarela
//   GET  /billing/subscription  → la suscripción vigente del usuario
//   POST /billing/checkout      → comprar un plan
//   POST /billing/cancel        → cancelar la suscripción
//
// Siempre en el ámbito del usuario del token.
// ──────────────────────────────────────────────

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { BillingService } from '../services/billing.service';
import { CheckoutDto } from '../dtos/billing.dto';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Modo de los pagos (simulado o real) y pasarela configurada.' })
  config() {
    return this.billing.config();
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Suscripción vigente del usuario; null si está en el plan gratis.' })
  current(@CurrentUser() user: { id: number }) {
    return this.billing.current(user.id);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Compra un plan. En modo simulado se activa sin cobrar.' })
  checkout(@CurrentUser() user: { id: number }, @Body() dto: CheckoutDto) {
    return this.billing.checkout(user.id, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancela la suscripción vigente.' })
  cancel(@CurrentUser() user: { id: number }) {
    return this.billing.cancel(user.id);
  }
}
