import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { PokerAiModule } from '../poker-ai/poker-ai.module';
import { QuizController } from './controllers/quiz.controller';
import { QuizService } from './services/quiz.service';

/**
 * Banco de preguntas por nivel. Se siembra con `pnpm db:seed` y la IA de la
 * mesa (mismo `.env`) puede generar más a demanda.
 */
@Module({
  imports: [PrismaModule, PokerAiModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
