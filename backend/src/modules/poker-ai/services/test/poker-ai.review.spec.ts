// ──────────────────────────────────────────────
// La corrección nunca puede perderse.
// Con la IA apagada, mal configurada o caída, el
// endpoint sigue devolviendo el veredicto del motor
// para que el estudiante reciba SIEMPRE su
// corrección. Eso es lo que se fija aquí.
// ──────────────────────────────────────────────

import { PokerAiService } from '../poker-ai.service';
import { HeuristicFallbackService } from '../heuristic-fallback.service';
import { DecisionReviewDto } from '../../dtos/decision-review.dto';
import {
  AiCompletion,
  PokerAiProvider,
} from '../../providers/interfaces/poker-ai-provider';

/** Proveedor de mentira: devuelve lo que se le diga, o revienta. */
function stubProvider(reply: string | Error): PokerAiProvider {
  return {
    complete: async (): Promise<AiCompletion> => {
      if (reply instanceof Error) throw reply;
      return { text: reply, model: 'modelo-de-prueba', latencyMs: 12 };
    },
    ping: async () => undefined,
  };
}

function reviewDto(): DecisionReviewDto {
  return {
    snapshot: {
      playerId: 'hero',
      playerName: 'Tú',
      profile: 'tag',
      street: 'flop',
      hole: ['As', 'Kd'],
      board: ['2h', '7c', 'Ts'],
      position: 'CO',
      stack: 1000,
      pot: 300,
      currentBet: 100,
      committed: 0,
      bigBlind: 50,
      smallBlind: 25,
      handNumber: 3,
      legal: {
        canFold: true,
        canCheck: false,
        canCall: true,
        callAmount: 100,
        canBet: false,
        canRaise: true,
        minRaiseTo: 200,
        maxRaiseTo: 1000,
      },
      opponents: [],
      history: ['Rival 1 apuesta 100'],
    },
    action: { type: 'call' },
    engine: {
      verdict: 'mistake',
      equity: 0.18,
      required: 0.25,
      recommended: 'fold',
      message: 'Pagaste sin precio.',
      chen: 12,
    },
    focus: 'pot odds',
  } as DecisionReviewDto;
}

function service(provider: PokerAiProvider): PokerAiService {
  return new PokerAiService(
    provider as never,
    provider as never,
    new HeuristicFallbackService(),
  );
}

describe('PokerAiService.review', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('con la IA apagada devuelve el veredicto del motor', async () => {
    process.env.POKER_AI_ENABLED = 'false';

    const result = await service(stubProvider('{}')).review(reviewDto());

    expect(result.source).toBe('engine');
    expect(result.verdict).toBe('mistake');
    expect(result.error).toContain('POKER_AI_ENABLED');
  });

  it('con la IA encendida explica la jugada sin cambiar el veredicto', async () => {
    process.env.POKER_AI_ENABLED = 'true';
    process.env.POKER_AI_PROVIDER = 'llamacpp';
    process.env.POKER_AI_BASE_URL = 'http://127.0.0.1:8080/v1';
    process.env.POKER_AI_MODEL = 'local-model';

    const reply = `Claro:
\`\`\`json
{"headline":"Pago sin precio","explanation":"Necesitabas 25% y tenías 18%.","suggestion":"Retírate ante esa apuesta."}
\`\`\``;

    const result = await service(stubProvider(reply)).review(reviewDto());

    expect(result.source).toBe('ai');
    expect(result.headline).toBe('Pago sin precio');
    expect(result.suggestion).toContain('Retírate');
    // El motor manda: la IA explica, no puntúa.
    expect(result.verdict).toBe('mistake');
  });

  it('si el proveedor falla, la corrección del motor sigue llegando', async () => {
    process.env.POKER_AI_ENABLED = 'true';
    process.env.POKER_AI_PROVIDER = 'llamacpp';
    process.env.POKER_AI_BASE_URL = 'http://127.0.0.1:8080/v1';
    process.env.POKER_AI_MODEL = 'local-model';

    const result = await service(stubProvider(new Error('conexión rechazada'))).review(
      reviewDto(),
    );

    expect(result.source).toBe('engine');
    expect(result.verdict).toBe('mistake');
    expect(result.error).toContain('conexión rechazada');
  });

  it('una respuesta sin JSON no rompe: se cae al motor', async () => {
    process.env.POKER_AI_ENABLED = 'true';
    process.env.POKER_AI_PROVIDER = 'llamacpp';
    process.env.POKER_AI_BASE_URL = 'http://127.0.0.1:8080/v1';
    process.env.POKER_AI_MODEL = 'local-model';

    const result = await service(stubProvider('no me apetece responder')).review(reviewDto());

    expect(result.source).toBe('engine');
    expect(result.verdict).toBe('mistake');
  });
});
