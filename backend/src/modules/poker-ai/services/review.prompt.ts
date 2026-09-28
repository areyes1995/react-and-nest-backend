// ──────────────────────────────────────────────
// Prompt del corrector.
// Aquí la IA no juega: enseña. Se le dan los números
// ya calculados por el motor y se le pide lo que el
// motor no sabe hacer — explicar por qué, con el
// contexto de la mano y del rival, y decir qué hacer
// la próxima vez.
//
// Se le prohíbe explícitamente contradecir el
// veredicto del motor: las matemáticas no son
// opinables y un alumno no puede recibir dos
// respuestas distintas a la misma mano.
// ──────────────────────────────────────────────

import { DecisionReviewDto } from '../dtos/decision-review.dto';
import { AiPrompt } from '../providers/interfaces/poker-ai-provider';

const VERDICT_LABEL: Record<string, string> = {
  good: 'buena decisión',
  ok: 'aceptable, mejorable',
  mistake: 'error',
};

const ACTION_LABEL: Record<string, string> = {
  fold: 'retirarse',
  check: 'pasar',
  call: 'igualar',
  bet: 'apostar',
  raise: 'subir',
};

const RESPONSE_CONTRACT = `Responde SOLO con un objeto JSON, sin texto alrededor y sin bloques de código:
{
  "headline": "<titular de 3 a 6 palabras, en español>",
  "explanation": "<dos o tres frases explicando POR QUÉ, usando los números dados>",
  "suggestion": "<una frase: qué hacer la próxima vez en esta misma situación>"
}`;

export function buildReviewPrompt(dto: DecisionReviewDto): AiPrompt {
  const { snapshot, action, engine, focus, drillMessage } = dto;

  const pct = (value: number) => `${Math.round(value * 100)}%`;

  const system = [
    'Eres un entrenador de Texas Hold\'em No Limit que corrige a un estudiante de una academia online.',
    'Hablas en español, en segunda persona, directo y sin condescendencia. Nada de relleno motivacional.',
    'El motor de la academia ya ha calculado la equity, las pot odds y el veredicto: son datos, no opiniones.',
    'NUNCA contradigas el veredicto del motor ni inventes números distintos a los que se te dan.',
    'Tu trabajo es explicar el porqué con el contexto de la mano, la posición y los rivales, y decir qué hacer la próxima vez.',
    focus ? `El estudiante está entrenando específicamente: ${focus}. Céntrate en eso.` : '',
    RESPONSE_CONTRACT,
  ]
    .filter(Boolean)
    .join('\n\n');

  const user = [
    `Calle: ${snapshot.street} · posición del estudiante: ${snapshot.position} · ciegas ${snapshot.smallBlind}/${snapshot.bigBlind}`,
    `Sus cartas: ${snapshot.hole.join(' ') || '(sin repartir)'}${
      snapshot.hint?.notation ? ` (${snapshot.hint.notation})` : ''
    }`,
    `Mesa: ${snapshot.board.join(' ') || '(sin cartas comunitarias)'}`,
    `Bote: ${snapshot.pot} · apuesta a igualar: ${snapshot.legal.callAmount} · su stack: ${snapshot.stack}`,
    '',
    `LO QUE HIZO: ${ACTION_LABEL[action.type] ?? action.type}${action.amount ? ` a ${action.amount}` : ''}`,
    '',
    'ANÁLISIS DEL MOTOR (datos fijos, no los cambies):',
    `- Veredicto: ${VERDICT_LABEL[engine.verdict] ?? engine.verdict}`,
    `- Equity real del estudiante: ${pct(engine.equity)}`,
    `- Equity que exigían las pot odds: ${pct(engine.required)}`,
    `- Jugada recomendada: ${ACTION_LABEL[engine.recommended] ?? engine.recommended}`,
    engine.chen !== undefined ? `- Puntuación Chen de la mano inicial: ${engine.chen}` : '',
    engine.message ? `- Explicación del motor: ${engine.message}` : '',
    drillMessage ? `- Regla del entrenamiento: ${drillMessage}` : '',
    '',
    'Rivales en la mano:',
    snapshot.opponents
      .map(
        rival =>
          `- ${rival.name} (${rival.position}, ${rival.status})${
            rival.lastAction ? `, ${rival.lastAction}` : ''
          }`,
      )
      .join('\n') || '- (ninguno)',
    '',
    'Historial de la mano:',
    snapshot.history.length
      ? snapshot.history.map(line => `- ${line}`).join('\n')
      : '- (sin acciones previas)',
    '',
    'Devuelve solo el JSON.',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
