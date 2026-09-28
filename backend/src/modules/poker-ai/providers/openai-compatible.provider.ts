// ──────────────────────────────────────────────
// Proveedor OpenAI-compatible.
// Cubre de una vez llama.cpp (`llama-server`), Ollama,
// LM Studio, OpenAI, Groq y OpenRouter: todos exponen
// `POST /chat/completions` con el mismo cuerpo. La
// única diferencia real es si hace falta API key.
// ──────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { PokerAiSettings } from '../config/poker-ai.config';
import { AiCompletion, AiPrompt, PokerAiProvider } from './interfaces/poker-ai-provider';

@Injectable()
export class OpenAiCompatibleProvider implements PokerAiProvider {
  async complete(prompt: AiPrompt, settings: PokerAiSettings): Promise<AiCompletion> {
    const startedAt = Date.now();

    const body: Record<string, unknown> = {
      model: settings.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false,
    };

    // llama.cpp y los servidores locales aceptan `json_object`; si alguno no lo
    // soporta, basta con POKER_AI_JSON_MODE=false y el validador ya extrae el
    // JSON del texto.
    if (settings.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await this.fetchWithTimeout(
      `${settings.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: this.headers(settings),
        body: JSON.stringify(body),
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
    const text: string | undefined = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('El proveedor devolvió una respuesta vacía.');
    }

    return {
      text,
      model: data?.model ?? settings.model,
      latencyMs: Date.now() - startedAt,
      tokens: data?.usage
        ? {
            prompt: data.usage.prompt_tokens ?? 0,
            completion: data.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }

  async ping(settings: PokerAiSettings): Promise<void> {
    // `/models` existe en llama.cpp, Ollama, LM Studio y en las APIs de pago.
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Los servidores locales no piden clave; solo se manda si existe.
    if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
    if (settings.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://poker-academy.local';
      headers['X-Title'] = 'Poker Academy';
    }
    return headers;
  }

  /** `fetch` con corte por tiempo: una mesa no puede esperar a un modelo colgado. */
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
