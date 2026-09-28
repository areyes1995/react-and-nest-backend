// ──────────────────────────────────────────────
// Configuración de la IA de la mesa — todo por .env.
// Una sola variable manda: POKER_AI_ENABLED. Si está
// apagada, la mesa sigue funcionando con los bots del
// motor (que es el estado por defecto del proyecto).
// El resto de variables solo se leen si está encendida.
// ──────────────────────────────────────────────

/** Proveedores soportados. `llamacpp`, `lmstudio` y `ollama` son OpenAI-compatibles. */
export type PokerAiProviderId =
  | 'llamacpp'
  | 'ollama'
  | 'lmstudio'
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'anthropic'
  | 'custom';

export const POKER_AI_PROVIDERS: PokerAiProviderId[] = [
  'llamacpp',
  'ollama',
  'lmstudio',
  'openai',
  'openrouter',
  'groq',
  'anthropic',
  'custom',
];

/** Familia de API: define qué cliente HTTP se usa. */
export type PokerAiApiFlavor = 'openai' | 'anthropic';

export interface PokerAiSettings {
  /** Interruptor maestro (`POKER_AI_ENABLED`). */
  enabled: boolean;
  provider: PokerAiProviderId;
  flavor: PokerAiApiFlavor;
  /** URL base de la API, sin `/chat/completions`. */
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  /** Pide respuesta JSON estricta al proveedor cuando este lo soporta. */
  jsonMode: boolean;
  /** Cuántos rivales como máximo mueve la IA; los demás siguen con bots. */
  maxAiSeats: number;
  /** Si la IA falla o tarda, se decide con la heurística local en vez de romper. */
  fallbackToBots: boolean;
  /** Techo de peticiones por usuario y minuto (protege la factura y la CPU local). */
  requestsPerMinute: number;
}

/** Valores por defecto de cada proveedor: lo mínimo para que arranque. */
const PROVIDER_DEFAULTS: Record<
  PokerAiProviderId,
  { flavor: PokerAiApiFlavor; baseUrl: string; model: string; needsKey: boolean }
> = {
  llamacpp: {
    flavor: 'openai',
    baseUrl: 'http://127.0.0.1:8080/v1',
    model: 'local-model',
    needsKey: false,
  },
  ollama: {
    flavor: 'openai',
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3.1',
    needsKey: false,
  },
  lmstudio: {
    flavor: 'openai',
    baseUrl: 'http://127.0.0.1:1234/v1',
    model: 'local-model',
    needsKey: false,
  },
  openai: {
    flavor: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    needsKey: true,
  },
  openrouter: {
    flavor: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    needsKey: true,
  },
  groq: {
    flavor: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    needsKey: true,
  },
  anthropic: {
    flavor: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-5',
    needsKey: true,
  },
  custom: {
    flavor: 'openai',
    baseUrl: '',
    model: '',
    needsKey: false,
  },
};

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(value.trim().toLowerCase());
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Quita la barra final para poder concatenar rutas sin duplicarla. */
function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function readPokerAiSettings(
  env: NodeJS.ProcessEnv = process.env,
): PokerAiSettings {
  const raw = (env.POKER_AI_PROVIDER ?? 'llamacpp').trim().toLowerCase();
  const provider = (POKER_AI_PROVIDERS as string[]).includes(raw)
    ? (raw as PokerAiProviderId)
    : 'custom';
  const defaults = PROVIDER_DEFAULTS[provider];

  return {
    enabled: bool(env.POKER_AI_ENABLED, false),
    provider,
    flavor:
      (env.POKER_AI_API_FLAVOR?.trim().toLowerCase() as PokerAiApiFlavor) ||
      defaults.flavor,
    baseUrl: trimSlash((env.POKER_AI_BASE_URL || defaults.baseUrl).trim()),
    apiKey: (env.POKER_AI_API_KEY ?? '').trim(),
    model: (env.POKER_AI_MODEL || defaults.model).trim(),
    temperature: num(env.POKER_AI_TEMPERATURE, 0.6),
    maxTokens: num(env.POKER_AI_MAX_TOKENS, 320),
    timeoutMs: num(env.POKER_AI_TIMEOUT_MS, 12_000),
    jsonMode: bool(env.POKER_AI_JSON_MODE, true),
    maxAiSeats: Math.max(0, num(env.POKER_AI_MAX_SEATS, 8)),
    fallbackToBots: bool(env.POKER_AI_FALLBACK_TO_BOTS, true),
    requestsPerMinute: Math.max(1, num(env.POKER_AI_REQUESTS_PER_MINUTE, 120)),
  };
}

/** Problemas de configuración que impiden usar la IA, en lenguaje llano. */
export function configIssues(settings: PokerAiSettings): string[] {
  const issues: string[] = [];
  if (!settings.enabled) return issues;

  if (!settings.baseUrl) {
    issues.push('Falta POKER_AI_BASE_URL (la URL de la API o del servidor local).');
  }
  if (!settings.model) {
    issues.push('Falta POKER_AI_MODEL (el modelo a usar).');
  }
  if (PROVIDER_DEFAULTS[settings.provider].needsKey && !settings.apiKey) {
    issues.push(
      `El proveedor "${settings.provider}" necesita POKER_AI_API_KEY.`,
    );
  }
  return issues;
}

/** ¿Está la IA lista para jugar? Encendida y sin configuración a medias. */
export function isPokerAiReady(settings: PokerAiSettings): boolean {
  return settings.enabled && configIssues(settings).length === 0;
}
