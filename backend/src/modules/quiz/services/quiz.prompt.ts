// ──────────────────────────────────────────────
// Prompt del generador de preguntas.
// La IA recibe tres decisiones ya tomadas —nivel,
// tema y formato— y un contrato JSON cerrado. Lo que
// devuelva pasa después por `quiz.validator.ts`, así
// que el prompt pide calidad y el validador garantiza
// la forma.
// ──────────────────────────────────────────────

import { AiPrompt } from 'src/modules/poker-ai/providers/interfaces/poker-ai-provider';
import {
  QUIZ_CATEGORIES,
  QUIZ_LEVEL_BRIEF,
  QUIZ_LEVEL_LABEL,
  QuizFormatId,
  QuizLevelId,
} from '../constants/quiz.constants';

export interface QuizPromptRequest {
  level: QuizLevelId;
  count: number;
  category?: string;
  format?: QuizFormatId;
  topic?: string;
  /** Preguntas que ya existen en el banco, para no repetirlas. */
  avoid?: string[];
}

const FORMAT_RULES: Record<QuizFormatId, string> = {
  'multiple-choice':
    '"multiple-choice": exactamente 4 opciones, una sola correcta y tres distractores plausibles (errores típicos de un jugador de ese nivel).',
  'true-false':
    '"true-false": una afirmación en "question" y options EXACTAMENTE ["Verdadero", "Falso"]; answerIndex 0 si es verdadera, 1 si es falsa.',
  spot:
    '"spot": una situación concreta con cartas. "hole" = las 2 cartas del jugador y/o "board" = de 3 a 5 cartas comunitarias, 4 opciones. Las cartas deben ser coherentes con la pregunta y no repetirse.',
};

const RESPONSE_CONTRACT = `Responde SOLO con un objeto JSON, sin texto alrededor y sin bloques de código:
{
  "questions": [
    {
      "format": "multiple-choice" | "true-false" | "spot",
      "category": "<id del tema>",
      "question": "<enunciado en español>",
      "options": ["<opción>", "..."],
      "answerIndex": <índice de la correcta, empezando en 0>,
      "explanation": "<dos o tres frases: por qué es la correcta, con los cálculos si hay números>",
      "hole": "<solo en spot, opcional: p. ej. \\"As Kh\\">",
      "board": "<solo en spot, opcional: p. ej. \\"Td 9d 2c\\">"
    }
  ]
}`;

export function buildQuizPrompt(request: QuizPromptRequest): AiPrompt {
  const category = QUIZ_CATEGORIES.find((item) => item.id === request.category);

  const topics = category
    ? `Todas las preguntas son del tema "${category.id}" (${category.description}).`
    : `Reparte las preguntas entre temas variados apropiados para el nivel. Temas válidos (usa el id en "category"):\n${QUIZ_CATEGORIES.map(
        (item) => `- ${item.id}: ${item.description}`,
      ).join('\n')}`;

  const formats = request.format
    ? `Todas las preguntas usan el formato ${FORMAT_RULES[request.format]}`
    : `Mezcla formatos, con mayoría de opción múltiple:\n${Object.values(FORMAT_RULES)
        .map((rule) => `- ${rule}`)
        .join('\n')}`;

  const system = [
    'Eres un entrenador de Texas Hold\'em No Limit que escribe preguntas de test para una academia online.',
    'Escribes en español neutro, claro y sin ambigüedades. Cada pregunta tiene UNA sola respuesta correcta según la teoría actual del poker.',
    'Las cifras (outs, pot odds, equity, MDF, ratios de farol) deben estar bien calculadas; repasa cada cálculo antes de responder.',
    'Las opciones se barajan antes de mostrarlas: nunca uses "todas las anteriores" ni "ninguna de las anteriores", y en la explicación no te refieras a las opciones por su letra o posición.',
    'Cartas en notación corta: rango (2-9, T, J, Q, K, A) + palo en minúscula (s, h, d, c). El 10 se escribe T. Ejemplo: "As Kh", "Td 9d 2c".',
    RESPONSE_CONTRACT,
  ].join('\n\n');

  const user = [
    `Genera ${request.count} ${request.count === 1 ? 'pregunta' : 'preguntas'} de nivel ${QUIZ_LEVEL_LABEL[request.level]}.`,
    `Perfil del nivel: ${QUIZ_LEVEL_BRIEF[request.level]}`,
    topics,
    formats,
    request.topic ? `Enfoque pedido por el estudiante: ${request.topic}` : '',
    request.avoid?.length
      ? `No repitas ni reformules estas preguntas, que ya están en el banco:\n${request.avoid
          .map((text) => `- ${text}`)
          .join('\n')}`
      : '',
    'Devuelve solo el JSON.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { system, user };
}
