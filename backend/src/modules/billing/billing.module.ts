import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';
import { readBillingSettings } from './config/billing.config';

/**
 * Suscripciones de pago. Sin pasarela configurada los pagos van en modo
 * simulado (ver config/billing.config.ts).
 */
@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [
    {
      provide: BillingService,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new BillingService(prisma, () => readBillingSettings()),
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}
