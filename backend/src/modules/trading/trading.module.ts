import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { TradingController } from './controllers/trading.controller';
import { TradingProfileService } from './services/trading-profile.service';
import { JournalService } from './services/journal.service';
import { FundingService } from './services/funding.service';
import { FinanceService } from './services/finance.service';

/**
 * Trading Risk Manager: "Tú decides qué operar. Yo controlo cómo
 * administras el riesgo y el dinero." Nunca emite señales de mercado.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TradingController],
  providers: [
    TradingProfileService,
    JournalService,
    FundingService,
    FinanceService,
  ],
})
export class TradingModule {}
