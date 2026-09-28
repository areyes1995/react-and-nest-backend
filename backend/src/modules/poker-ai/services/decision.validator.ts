// ──────────────────────────────────────────────
// Validación de la respuesta del modelo.
// Regla de oro: la IA propone, las acciones legales
// disponen. Un modelo local pequeño se inventará
// importes o dirá "check" cuando hay una apuesta; en
// vez de romper la mano, se ajusta a la acción legal
// equivalente más cercana y se marca `adjusted`.
// ──────────────────────────────────────────────

import { DecisionAction, DecisionActionType } from '../dtos/ai-decision.dto';
import { LegalActionsDto } from '../dtos/table-snapshot.dto';

export interface ParsedDecision {
  action: DecisionAction;
  reasoning?: string;
  mood?: string;
  adjusted: boolean;
}

const ACTION_TYPES: DecisionActionType[] = ['fold', 'check', 'call', 'bet', 'raise'];

/** Extrae el primer objeto JSON del texto, tolerando ```json y prosa alrededor. */
export function extractJson(text: string): Record<string, unknown> {
  const withoutFences = text.replace(/```(?:json)?/gi, '').trim();

  const start = withoutFences.indexOf('{');
  if (start === -1) throw new Error('La respuesta del modelo no contiene JSON.');

  // Se recorre contando llaves para soportar objetos anidados y texto final.
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < withoutFences.length; i++) {
    const char = withoutFences[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        const slice = withoutFences.slice(start, i + 1);
        return JSON.parse(slice) as Record<string, unknown>;
      }
    }
  }

  throw new Error('El JSON de la respuesta está incompleto.');
}

/** Acción legal más segura cuando no se entiende nada: pasar si se puede, si no retirarse. */
function safestAction(legal: LegalActionsDto): DecisionAction {
  if (legal.canCheck) return { type: 'check' };
  if (legal.canFold) return { type: 'fold' };
  return { type: 'call' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Traduce la respuesta del modelo a una acción que el motor pueda aplicar. */
export function toLegalAction(
  raw: Record<string, unknown>,
  legal: LegalActionsDto,
): ParsedDecision {
  const reasoning =
    typeof raw.reasoning === 'string' ? raw.reasoning.slice(0, 240) : undefined;
  const mood = typeof raw.mood === 'string' ? raw.mood.slice(0, 24) : undefined;

  const declared = String(raw.action ?? '').trim().toLowerCase();
  let type = ACTION_TYPES.find(candidate => candidate === declared);
  let adjusted = false;

  if (!type) {
    return { action: safestAction(legal), reasoning, mood, adjusted: true };
  }

  // "all-in" llega a veces como amount enorme; el clamp lo resuelve solo.
  const amountRaw = Number(raw.amount);
  const amount = Number.isFinite(amountRaw) ? amountRaw : undefined;

  // ── Normalización contra las acciones legales ──
  if (type === 'check' && !legal.canCheck) {
    // Quería pasar pero hay apuesta: pagar si sale barato, retirarse si no.
    type = legal.canCall ? 'call' : 'fold';
    adjusted = true;
  }

  if (type === 'call' && !legal.canCall) {
    type = legal.canCheck ? 'check' : 'fold';
    adjusted = true;
  }

  if (type === 'fold' && !legal.canFold) {
    type = legal.canCheck ? 'check' : 'call';
    adjusted = true;
  }

  if (type === 'bet' && !legal.canBet) {
    type = legal.canRaise ? 'raise' : legal.canCheck ? 'check' : 'call';
    adjusted = true;
  }

  if (type === 'raise' && !legal.canRaise) {
    type = legal.canBet ? 'bet' : legal.canCall ? 'call' : legal.canCheck ? 'check' : 'fold';
    adjusted = true;
  }

  if (type === 'bet' || type === 'raise') {
    if (amount === undefined) {
      // Sin importe no hay apuesta posible: se usa la subida mínima.
      return {
        action: { type, amount: legal.minRaiseTo },
        reasoning,
        mood,
        adjusted: true,
      };
    }
    const clamped = clamp(amount, legal.minRaiseTo, legal.maxRaiseTo);
    return {
      action: { type, amount: clamped },
      reasoning,
      mood,
      adjusted: adjusted || clamped !== Math.round(amount),
    };
  }

  return { action: { type }, reasoning, mood, adjusted };
}
