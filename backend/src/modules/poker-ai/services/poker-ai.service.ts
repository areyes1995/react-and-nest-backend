// ──────────────────────────────────────────────
// PokerAiService — decide quién juega el asiento.
// Tres escenarios, uno por variable de entorno:
//   POKER_AI_ENABLED=false → responde `bots` y la mesa
//     usa el motor local (comportamiento actual).
//   ENABLED=true y configurado → pregunta al modelo.
//   ENABLED=true pero el modelo falla → heurística
//     local, para que la mano nunca se quede colgada.
// ──────────────────────────────────────────────

import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  configIssues,
  isPokerAiReady,
  readPokerAiSettings,
  PokerAiSettings,
} from '../config/poker-ai.config';
import {
  PokerAiDecisionResult,
  PokerAiStatusResult,
} from '../dtos/ai-decision.dto';
import { TableSnapshotDto } from '../dtos/table-snapshot.dto';
import {
  DecisionReviewDto,
  DecisionReviewResult,
} from '../dtos/decision-review.dto';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { OpenAiCompatibleProvider } from '../providers/openai-compatible.provider';
import {
  AiCompletion,
  AiPrompt,
  PokerAiProvider,
} from '../providers/interfaces/poker-ai-provider';
import { HeuristicFallbackService } from './heuristic-fallback.service';
import { buildPrompt } from './prompt.builder';
import { buildReviewPrompt } from './review.prompt';
import { extractJson, toLegalAction } from './decision.validator';

@Injectable()
export class PokerAiService {
  private readonly logger = new Logger(PokerAiService.name);

  /** Peticiones por usuario dentro del minuto en curso. */
  private readonly usage = new Map<string, { windowStart: number; count: number }>();

  constructor(
    private readonly openAiCompatible: OpenAiCompatibleProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly fallback: HeuristicFallbackService,
  ) {}

  /** La configuración se lee en cada llamada: cambiar `.env` y reiniciar basta. */
  settings(): PokerAiSettings {
    return readPokerAiSettings();
  }

  async status(probe = false): Promise<PokerAiStatusResult> {
    const settings = this.settings();
    const issues = configIssues(settings);
    const ready = isPokerAiReady(settings);

    const result: PokerAiStatusResult = {
      ready,
      enabled: settings.enabled,
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      hasApiKey: settings.apiKey.length > 0,
      maxAiSeats: settings.maxAiSeats,
      fallbackToBots: settings.fallbackToBots,
      issues,
    };

    if (probe && ready) {
      try {
        await this.provider(settings).ping(settings);
        result.reachable = true;
      } catch (err) {
        result.reachable = false;
        result.reachableError = (err as Error).message;
      }
    }

    return result;
  }

  async decide(
    snapshot: TableSnapshotDto,
    userKey = 'anon',
  ): Promise<PokerAiDecisionResult> {
    const settings = this.settings();

    // ── IA apagada: la mesa sigue con sus bots ──
    if (!isPokerAiReady(settings)) {
      return {
        source: 'bots',
        action: this.fallback.decide(snapshot),
        error: settings.enabled
          ? configIssues(settings).join(' ')
          : 'POKER_AI_ENABLED está desactivado.',
      };
    }

    if (!this.withinQuota(userKey, settings.requestsPerMinute)) {
      return {
        source: 'fallback',
        action: this.fallback.decide(snapshot),
        error: 'Se alcanzó el límite de peticiones por minuto (POKER_AI_REQUESTS_PER_MINUTE).',
      };
    }

    try {
      const prompt = buildPrompt(snapshot);
      const completion = await this.provider(settings).complete(prompt, settings);
      const parsed = toLegalAction(extractJson(completion.text), snapshot.legal);

      return {
        source: 'ai',
        action: parsed.action,
        reasoning: parsed.reasoning,
        mood: parsed.mood,
        adjusted: parsed.adjusted,
        model: completion.model,
        provider: settings.provider,
        latencyMs: completion.latencyMs,
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`La IA no pudo decidir (${snapshot.playerName}): ${message}`);

      if (!settings.fallbackToBots) throw err;

      return {
        source: 'fallback',
        action: this.fallback.decide(snapshot),
        provider: settings.provider,
        error: message,
      };
    }
  }

  /**
   * Revisa una decisión ya tomada y la explica.
   * Con la IA apagada devuelve `source: 'engine'` sin texto: el cliente ya
   * tiene la explicación del motor y la usa tal cual. La corrección nunca
   * depende de que haya modelo.
   */
  async review(
    dto: DecisionReviewDto,
    userKey = 'anon',
  ): Promise<DecisionReviewResult> {
    const settings = this.settings();

    if (!isPokerAiReady(settings)) {
      return {
        source: 'engine',
        verdict: dto.engine.verdict,
        error: settings.enabled
          ? configIssues(settings).join(' ')
          : 'POKER_AI_ENABLED está desactivado.',
      };
    }

    if (!this.withinQuota(userKey, settings.requestsPerMinute)) {
      return {
        source: 'engine',
        verdict: dto.engine.verdict,
        error: 'Se alcanzó el límite de peticiones por minuto (POKER_AI_REQUESTS_PER_MINUTE).',
      };
    }

    try {
      const completion = await this.provider(settings).complete(
        buildReviewPrompt(dto),
        settings,
      );
      const parsed = extractJson(completion.text);

      const text = (value: unknown, max: number): string | undefined =>
        typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;

      return {
        source: 'ai',
        // El veredicto lo fija el motor: la IA explica, no puntúa.
        verdict: dto.engine.verdict,
        headline: text(parsed.headline, 80),
        explanation: text(parsed.explanation, 600),
        suggestion: text(parsed.suggestion, 240),
        model: completion.model,
        provider: settings.provider,
        latencyMs: completion.latencyMs,
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`La IA no pudo revisar la decisión: ${message}`);
      return {
        source: 'engine',
        verdict: dto.engine.verdict,
        provider: settings.provider,
        error: message,
      };
    }
  }

  /**
   * Petición libre al modelo del `.env`, con la misma cuota por usuario.
   * La usan otros módulos (el banco de preguntas) para no duplicar proveedores.
   * `overrides` ajusta lo que cambia por tarea, como el techo de tokens.
   * Lanza si la IA no está lista, se agota la cuota o el proveedor falla.
   */
  async complete(
    prompt: AiPrompt,
    userKey = 'anon',
    overrides: Partial<PokerAiSettings> = {},
  ): Promise<{ completion: AiCompletion; settings: PokerAiSettings }> {
    const settings = { ...this.settings(), ...overrides };

    if (!isPokerAiReady(settings)) {
      throw new Error(
        settings.enabled
          ? configIssues(settings).join(' ')
          : 'POKER_AI_ENABLED está desactivado.',
      );
    }
    if (!this.withinQuota(userKey, settings.requestsPerMinute)) {
      throw new Error(
        'Se alcanzó el límite de peticiones por minuto (POKER_AI_REQUESTS_PER_MINUTE).',
      );
    }

    const completion = await this.provider(settings).complete(prompt, settings);
    return { completion, settings };
  }

  private provider(settings: PokerAiSettings): PokerAiProvider {
    return settings.flavor === 'anthropic' ? this.anthropic : this.openAiCompatible;
  }

  /** Ventana deslizante de un minuto, en memoria: suficiente para un aula. */
  private withinQuota(userKey: string, limit: number): boolean {
    const now = Date.now();
    const entry = this.usage.get(userKey);

    if (!entry || now - entry.windowStart > 60_000) {
      this.usage.set(userKey, { windowStart: now, count: 1 });
      return true;
    }

    entry.count += 1;
    return entry.count <= limit;
  }
}
