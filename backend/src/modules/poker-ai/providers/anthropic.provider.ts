// ──────────────────────────────────────────────
// Proveedor Anthropic (Messages API).
// Va aparte del OpenAI-compatible porque cambia la
// autenticación (`x-api-key`), la cabecera de versión
// y la forma de la respuesta (`content[].text`).
// ──────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { PokerAiSettings } from '../config/poker-ai.config';
import { AiCompletion, AiPrompt, PokerAiProvider } from './interfaces/poker-ai-provider';

const ANTHROPIC_VERSION = '2023-06-01';

@Injectable()
export class AnthropicProvider implements PokerAiProvider {
  async complete(prompt: AiPrompt, settings: PokerAiSettings): Promise<AiCompletion> {
    const startedAt = Date.now();

    const response = await this.fetchWithTimeout(
      `${settings.baseUrl}/messages`,
      {
        method: 'POST',
        headers: this.headers(settings),
        body: JSON.stringify({
          model: settings.model,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.user }],
        }),
      },
      settings.timeoutMs,
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `El proveedor respondió ${response.status}: ${detail.slice(0, 200)}`,
      );
    }

    const data: any = await response.json();
    const text: string = (data?.content ?? [])
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => block.text)
      .join('\n')
      .trim();

    if (!text) throw new Error('El proveedor devolvió una respuesta vacía.');

    return {
      text,
      model: data?.model ?? settings.model,
      latencyMs: Date.now() - startedAt,
      tokens: data?.usage
        ? {
            prompt: data.usage.input_tokens ?? 0,
            completion: data.usage.output_tokens ?? 0,
          }
        : undefined,
    };
  }

  async ping(settings: PokerAiSettings): Promise<void> {
    const response = await this.fetchWithTimeout(
      `${settings.baseUrl}/models`,
      { method: 'GET', headers: this.headers(settings) },
      Math.min(settings.timeoutMs, 5_000),
    );
    if (!response.ok) {
      throw new Error(`El proveedor respondió ${response.status} en /models.`);
    }
  }

  private headers(settings: PokerAiSettings): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      const message = (err as Error)?.name === 'AbortError'
        ? `El proveedor no respondió en ${timeoutMs} ms.`
        : `No se pudo contactar con el proveedor: ${(err as Error)?.message}`;
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  }
}
