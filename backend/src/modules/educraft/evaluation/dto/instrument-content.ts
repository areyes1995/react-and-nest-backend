import { InstrumentType } from '@prisma/client';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const MAX_CRITERIA = 10;
const MAX_ITEMS = 30;
const SCALES = ['1-4', '1-5', 'AD-A-B-C'] as const;

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export interface ContentValidation {
  ok: boolean;
  message: string;
}

const ok: ContentValidation = { ok: true, message: '' };

/** Infiere el tipo cuando un DTO de actualización no envía `type`. */
export function inferInstrumentType(
  content: unknown,
): InstrumentType | undefined {
  if (!isRecord(content)) return undefined;
  if (Array.isArray(content.criteria) && Array.isArray(content.levels))
    return 'RUBRIC';
  if (Array.isArray(content.levels) && Array.isArray(content.items))
    return 'RATING_SCALE';
  if (Array.isArray(content.items)) return 'CHECKLIST';
  return undefined;
}

function validateRubric(content: unknown): ContentValidation {
  if (!isRecord(content))
    return {
      ok: false,
      message: 'El contenido de la rúbrica debe ser un objeto',
    };
  const levels = content.levels;
  if (!Array.isArray(levels) || levels.length !== 4 || !levels.every(isText)) {
    return {
      ok: false,
      message: 'La rúbrica debe tener exactamente 4 niveles de descripción',
    };
  }
  if (
    content.scores !== undefined &&
    (!Array.isArray(content.scores) ||
      content.scores.length !== 4 ||
      !content.scores.every(isNumber))
  ) {
    return {
      ok: false,
      message: 'Las puntuaciones de la rúbrica deben ser 4 valores numéricos',
    };
  }
  const criteria = content.criteria;
  if (
    !Array.isArray(criteria) ||
    criteria.length < 1 ||
    criteria.length > MAX_CRITERIA
  ) {
    return {
      ok: false,
      message: `La rúbrica debe tener entre 1 y ${MAX_CRITERIA} criterios`,
    };
  }
  let total = 0;
  for (const [index, raw] of criteria.entries()) {
    if (!isRecord(raw) || !isText(raw.criterion)) {
      return {
        ok: false,
        message: `El criterio ${index + 1} necesita un nombre`,
      };
    }
    if (!isNumber(raw.weight) || raw.weight < 0 || raw.weight > 100) {
      return {
        ok: false,
        message: `El peso del criterio ${index + 1} debe ser un número entre 0 y 100`,
      };
    }
    if (
      !Array.isArray(raw.descriptors) ||
      raw.descriptors.length !== 4 ||
      !raw.descriptors.every(isText)
    ) {
      return {
        ok: false,
        message: `El criterio ${index + 1} debe tener 4 descriptores`,
      };
    }
    total += raw.weight;
  }
  if (Math.abs(total - 100) > 0.01) {
    return {
      ok: false,
      message: `Los pesos de la rúbrica deben sumar 100 (actualmente ${total})`,
    };
  }
  return ok;
}

function validateChecklist(content: unknown): ContentValidation {
  if (!isRecord(content))
    return {
      ok: false,
      message: 'El contenido de la lista de cotejo debe ser un objeto',
    };
  const items = content.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    return {
      ok: false,
      message: `La lista de cotejo debe tener entre 1 y ${MAX_ITEMS} indicadores`,
    };
  }
  if (!items.every((item) => isRecord(item) && isText(item.text))) {
    return {
      ok: false,
      message: 'Todos los indicadores de la lista de cotejo necesitan texto',
    };
  }
  return ok;
}

function validateRatingScale(content: unknown): ContentValidation {
  if (!isRecord(content))
    return {
      ok: false,
      message: 'El contenido de la escala debe ser un objeto',
    };
  const scale = content.scale;
  if (
    typeof scale !== 'string' ||
    !SCALES.includes(scale as (typeof SCALES)[number])
  ) {
    return { ok: false, message: 'La escala debe ser 1-4, 1-5 o AD-A-B-C' };
  }
  const expected = scale === '1-5' ? 5 : 4;
  const levels = content.levels;
  if (!Array.isArray(levels) || levels.length !== expected) {
    return {
      ok: false,
      message: `La escala ${scale} debe tener ${expected} niveles`,
    };
  }
  if (
    !levels.every(
      (level) => isRecord(level) && isText(level.value) && isText(level.label),
    )
  ) {
    return {
      ok: false,
      message: 'Cada nivel de la escala necesita valor y etiqueta',
    };
  }
  const values = levels.map((level) => (level as RecordValue).value);
  if (new Set(values).size !== values.length) {
    return {
      ok: false,
      message: 'Los valores de la escala no pueden repetirse',
    };
  }
  const items = content.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    return {
      ok: false,
      message: `La escala debe tener entre 1 y ${MAX_ITEMS} aspecto(s) a valorar`,
    };
  }
  if (!items.every((item) => isRecord(item) && isText(item.text))) {
    return {
      ok: false,
      message: 'Todos los aspectos de la escala necesitan texto',
    };
  }
  return ok;
}

/** Validación estructural real del contenido según el tipo de instrumento. */
export function validateInstrumentContent(
  type: InstrumentType | undefined,
  content: unknown,
): ContentValidation {
  if (content === undefined) return ok;
  switch (type) {
    case 'RUBRIC':
      return validateRubric(content);
    case 'CHECKLIST':
      return validateChecklist(content);
    case 'RATING_SCALE':
      return validateRatingScale(content);
    default:
      return { ok: false, message: 'El tipo de instrumento no es válido' };
  }
}

@ValidatorConstraint({ name: 'validInstrumentContent', async: false })
export class ValidInstrumentContentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { type?: InstrumentType };
    return validateInstrumentContent(
      dto.type ?? inferInstrumentType(value),
      value,
    ).ok;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as { type?: InstrumentType };
    return validateInstrumentContent(
      dto.type ?? inferInstrumentType(args.value),
      args.value,
    ).message;
  }
}

export interface InstrumentScore {
  score: number | null;
  error?: string;
}

const round = (value: number) => Math.round(value * 10) / 10;

function pickIndices(value: unknown, total: number): number[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value))
    throw new Error('Las marcas deben ser una lista de índices');
  return value.map((index) => {
    if (
      !Number.isInteger(index) ||
      (index as number) < 0 ||
      (index as number) >= total
    ) {
      throw new Error(`Hay una marca fuera de rango (0-${total - 1})`);
    }
    return index as number;
  });
}

/** Calcula la nota a partir de las marcas y valida que correspondan al instrumento. */
export function scoreInstrument(
  type: InstrumentType,
  content: unknown,
  marks: unknown,
  maxScore: number,
): InstrumentScore {
  try {
    if (!isRecord(marks)) return { score: null };
    if (type === 'RUBRIC') {
      const instrument = content as {
        levels?: unknown[];
        scores?: number[];
        criteria?: Array<{ weight: number }>;
      };
      const levels = instrument.levels ?? [];
      const scores =
        instrument.scores ?? levels.map((_, i) => levels.length - i);
      const criteria = instrument.criteria ?? [];
      const picks = marks.levels;
      if (picks === undefined) return { score: null };
      if (!isRecord(picks))
        throw new Error(
          'Las marcas de la rúbrica deben estar agrupadas por criterio',
        );
      let total = 0;
      let weights = 0;
      for (const [index, criterion] of criteria.entries()) {
        const level = picks[index];
        if (level === undefined || level === null) continue;
        if (
          !Number.isInteger(level) ||
          (level as number) < 0 ||
          (level as number) >= levels.length
        ) {
          throw new Error(
            `El nivel elegido para el criterio ${index + 1} no existe`,
          );
        }
        const points = scores[level as number];
        if (!isNumber(points))
          throw new Error(
            `El nivel elegido para el criterio ${index + 1} no es válido`,
          );
        total += (points / Math.max(1, ...scores)) * criterion.weight;
        weights += criterion.weight;
      }
      return { score: weights ? round((total / weights) * maxScore) : null };
    }
    if (type === 'CHECKLIST') {
      const items = (content as { items?: unknown[] }).items ?? [];
      if (marks.checked === undefined) return { score: null };
      const checked = pickIndices(marks.checked, items.length) ?? [];
      return {
        score: items.length
          ? round((checked.length / items.length) * maxScore)
          : null,
      };
    }
    const instrument = content as {
      levels?: Array<{ value: string }>;
      items?: unknown[];
    };
    const levels = instrument.levels ?? [];
    const items = instrument.items ?? [];
    if (marks.values === undefined) return { score: null };
    if (!isRecord(marks.values))
      throw new Error(
        'Las marcas de la escala deben estar agrupadas por aspecto',
      );
    const chosen = Object.values(marks.values)
      .map((value) => levels.findIndex((level) => level.value === value))
      .filter((index) => index >= 0);
    if (chosen.some((index) => index >= levels.length))
      throw new Error('Hay un valor de escala no reconocido');
    const valid = Object.values(marks.values).filter((value) =>
      levels.some((level) => level.value === value),
    );
    if (valid.length !== Object.values(marks.values).length)
      throw new Error('Hay un valor de escala no reconocido');
    if (!chosen.length || levels.length < 2) return { score: null };
    const average =
      chosen.reduce(
        (sum, index) => sum + (levels.length - 1 - index) / (levels.length - 1),
        0,
      ) / chosen.length;
    return {
      score: round(average * maxScore),
      error: items.length ? undefined : 'La escala no tiene aspectos',
    };
  } catch (err) {
    return { score: null, error: (err as Error).message };
  }
}
