// ──────────────────────────────────────────────
// Traducción entre el currículo (la forma que usa el
// frontend) y las filas de la base.
// Dos sentidos, y los dos tienen que ser exactos:
//  • `blockCreateInput`: bloque → fila, para el seeder.
//  • `blockFromRow`: fila → bloque, para la API.
// El test de ida y vuelta comprueba que ningún bloque
// del currículo semilla cambia al pasar por la base.
// ──────────────────────────────────────────────

import { Prisma } from '@prisma/client';
import type {
  BlockTypeId,
  CalloutToneId,
  ContentBlockSeed,
  LessonKindId,
} from '../data/curriculum/curriculum.types';

type DbBlockType =
  | 'HEADING'
  | 'PARAGRAPH'
  | 'LIST'
  | 'CALLOUT'
  | 'TABLE'
  | 'HANDS'
  | 'SPOT'
  | 'QUIZ'
  | 'DRILL'
  | 'SHOWCASE'
  | 'RANGE';
type DbLessonKind = 'LESSON' | 'VIDEO' | 'DRILL' | 'QUIZ';
type DbCalloutTone = 'KEY' | 'TIP' | 'WARNING';

export const toDbLessonKind = (kind: LessonKindId) =>
  kind.toUpperCase() as DbLessonKind;
export const fromDbLessonKind = (kind: string) =>
  kind.toLowerCase() as LessonKindId;

const toDbBlockType = (type: BlockTypeId) => type.toUpperCase() as DbBlockType;
const toDbTone = (tone: CalloutToneId) => tone.toUpperCase() as DbCalloutTone;

/** Fila de bloque tal como la devuelve Prisma con sus colecciones incluidas. */
export interface BlockRow {
  type: string;
  text: string | null;
  title: string | null;
  tone: string | null;
  ordered: boolean | null;
  items: string[];
  headers: string[];
  rows: Prisma.JsonValue | null;
  hole: string | null;
  board: string | null;
  question: string | null;
  answer: string | null;
  drillMode: string | null;
  seats: number | null;
  drillHands: number | null;
  goal: string | null;
  hands: {
    position: number;
    cards: string;
    label: string;
    note: string | null;
  }[];
  questions: {
    position: number;
    code: string;
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

/** Datos para crear la fila de un bloque (sin `lessonId`, que pone la relación). */
export function blockCreateInput(
  block: ContentBlockSeed,
  position: number,
): Prisma.AcademyLessonBlockCreateWithoutLessonInput {
  const base = { position, type: toDbBlockType(block.type) };

  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return { ...base, text: block.text };
    case 'callout':
      return {
        ...base,
        tone: toDbTone(block.tone),
        title: block.title,
        text: block.text,
      };
    case 'list':
      return { ...base, ordered: block.ordered ?? false, items: block.items };
    case 'table':
      return { ...base, headers: block.headers, rows: block.rows };
    case 'spot':
      return {
        ...base,
        hole: block.hole,
        board: block.board ?? null,
        question: block.question,
        answer: block.answer,
      };
    case 'drill':
      return {
        ...base,
        drillMode: block.mode ?? null,
        seats: block.seats,
        drillHands: block.hands,
        goal: block.goal,
      };
    case 'showcase':
      // El contenido vive en el frontend; en la base solo viaja el id.
      return { ...base, text: block.id };
    case 'range':
      // Como `showcase`: solo viaja el id del rango.
      return { ...base, text: block.id };
    case 'hands':
      return {
        ...base,
        hands: {
          create: block.items.map((item, index) => ({
            position: index,
            cards: item.cards,
            label: item.label,
            note: item.note ?? null,
          })),
        },
      };
    case 'quiz':
      return {
        ...base,
        questions: {
          create: block.questions.map((item, index) => ({
            position: index,
            code: item.id,
            question: item.question,
            options: item.options,
            answerIndex: item.answerIndex,
            explanation: item.explanation,
          })),
        },
      };
  }
}

const byPosition = <T extends { position: number }>(items: T[]) =>
  [...items].sort((a, b) => a.position - b.position);

/** Fila → bloque de la API. Un tipo desconocido devuelve `null` y se descarta. */
export function blockFromRow(row: BlockRow): ContentBlockSeed | null {
  switch (row.type) {
    case 'HEADING':
      return { type: 'heading', text: row.text ?? '' };
    case 'PARAGRAPH':
      return { type: 'paragraph', text: row.text ?? '' };
    case 'CALLOUT':
      return {
        type: 'callout',
        tone: (row.tone ?? 'KEY').toLowerCase() as CalloutToneId,
        title: row.title ?? '',
        text: row.text ?? '',
      };
    case 'LIST':
      return row.ordered
        ? { type: 'list', ordered: true, items: row.items }
        : { type: 'list', items: row.items };
    case 'TABLE':
      return {
        type: 'table',
        headers: row.headers,
        rows: Array.isArray(row.rows) ? (row.rows as string[][]) : [],
      };
    case 'SPOT':
      return {
        type: 'spot',
        hole: row.hole ?? '',
        ...(row.board ? { board: row.board } : {}),
        question: row.question ?? '',
        answer: row.answer ?? '',
      };
    case 'DRILL':
      return {
        type: 'drill',
        ...(row.drillMode ? { mode: row.drillMode } : {}),
        seats: row.seats ?? 6,
        goal: row.goal ?? '',
        hands: row.drillHands ?? 10,
      };
    case 'SHOWCASE':
      return { type: 'showcase', id: row.text ?? '' };
    case 'RANGE':
      return { type: 'range', id: row.text ?? '' };
    case 'HANDS':
      return {
        type: 'hands',
        items: byPosition(row.hands).map((hand) => ({
          cards: hand.cards,
          label: hand.label,
          ...(hand.note ? { note: hand.note } : {}),
        })),
      };
    case 'QUIZ':
      return {
        type: 'quiz',
        questions: byPosition(row.questions).map((item) => ({
          id: item.code,
          question: item.question,
          options: item.options,
          answerIndex: item.answerIndex,
          explanation: item.explanation,
        })),
      };
    default:
      return null;
  }
}
