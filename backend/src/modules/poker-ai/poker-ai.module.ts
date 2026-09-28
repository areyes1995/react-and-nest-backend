import { Module } from '@nestjs/common';
import { PokerAiController } from './controllers/poker-ai.controller';
import { PokerAiService } from './services/poker-ai.service';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { HeuristicFallbackService } from './services/heuristic-fallback.service';

/**
 * Rivales controlados por IA para la mesa de práctica.
 * No toca la base de datos: todo el estado de la mano vive en el cliente y
 * aquí solo se traduce una situación a una acción legal.
 */
@Module({
  controllers: [PokerAiController],
  providers: [
    PokerAiService,
    OpenAiCompatibleProvider,
    AnthropicProvider,
    HeuristicFallbackService,
  ],
  exports: [PokerAiService],
})
export class PokerAiModule {}
