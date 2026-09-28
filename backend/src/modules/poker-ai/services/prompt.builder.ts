// ──────────────────────────────────────────────
// Prompt de la mesa.
// El modelo no necesita saber jugar al poker: necesita
// saber QUÉ puede hacer. Por eso el prompt enumera las
// acciones legales con sus importes exactos y le pide
// un JSON cerrado. Lo demás (perfil, historial, equity)
// es contexto para que la decisión tenga carácter.
// ──────────────────────────────────────────────

import { TableSnapshotDto } from '../dtos/table-snapshot.dto';
import { AiPrompt } from '../providers/interfaces/poker-ai-provider';

/** Cómo debe comportarse cada arquetipo. Mismos perfiles que los bots locales. */
const PROFILE_BRIEF: Record<string, string> = {
  nit: 'Eres muy conservador: solo juegas manos fuertes, faroleas casi nunca y te retiras ante agresión sin mano hecha.',
  tag: 'Eres sólido y agresivo (TAG): juegas pocas manos pero las juegas con iniciativa y apuestas por valor.',
  lag: 'Eres agresivo y jugador de muchas manos (LAG): presionas, subes a menudo y faroleas con proyectos.',
  station: 'Eres una calling station: pagas demasiado, casi nunca subes y te cuesta retirarte.',
  maniac: 'Eres un maníaco: subes con muchísimas manos, sobreapuestas y buscas botes grandes.',
};

const RESPONSE_CONTRACT = `Responde SOLO con un objeto JSON, sin texto alrededor y sin bloques de código:
{
  "action": "fold" | "check" | "call" | "bet" | "raise",
  "amount": <entero, solo para bet o raise: el TOTAL apostado en esta calle tras tu acción>,
  "reasoning": "<una frase corta en español explicando tu decisión>",
  "mood": "<una palabra: confiado, dudando, presionando, cauto, resignado>"
}`;

/** Lista de acciones legales, escrita para que no quepa interpretación. */
function legalLines(snapshot: TableSnapshotDto): string {
  const legal = snapshot.legal;
  const lines: string[] = [];

  if (legal.canFold) lines.push('- "fold": te retiras y pierdes lo apostado.');
  if (legal.canCheck) lines.push('- "check": pasas sin poner fichas.');
  if (legal.canCall) {
    lines.push(`- "call": igualas pagando ${legal.callAmount} fichas.`);
  }
  if (legal.canBet) {
    lines.push(
      `- "bet": apuestas. "amount" debe estar entre ${legal.minRaiseTo} y ${legal.maxRaiseTo}.`,
    );
  }
  if (legal.canRaise) {
    lines.push(
      `- "raise": subes. "amount" debe estar entre ${legal.minRaiseTo} y ${legal.maxRaiseTo}.`,
    );
  }

  return lines.join('\n');
}

export function buildPrompt(snapshot: TableSnapshotDto): AiPrompt {
  const brief = PROFILE_BRIEF[snapshot.profile] ?? PROFILE_BRIEF.tag;

  const system = [
    'Eres un jugador de Texas Hold\'em No Limit sentado en una mesa de práctica de una academia de poker.',
    brief,
    'Decides una sola acción, la tuya, con la información que se te da. No inventes cartas ni fichas que no aparezcan.',
    'Nunca elijas una acción que no esté en la lista de acciones legales.',
    RESPONSE_CONTRACT,
  ].join('\n\n');

  const opponents = snapshot.opponents
    .map(
      rival =>
        `- ${rival.name} (${rival.position}, ${rival.status}): stack ${rival.stack}, puesto en esta calle ${rival.committed}${
          rival.lastAction ? `, última acción: ${rival.lastAction}` : ''
        }`,
    )
    .join('\n');

  const hint = snapshot.hint;
  const math =
    hint?.equity !== undefined
      ? `Tu equity estimada por el simulador de la mesa es ${(hint.equity * 100).toFixed(1)}%` +
        (hint.potOdds !== undefined
          ? ` y las pot odds exigen ${(hint.potOdds * 100).toFixed(1)}%.`
          : '.')
      : '';

  const user = [
    `Mano #${snapshot.handNumber} · calle: ${snapshot.street} · ciegas ${snapshot.smallBlind}/${snapshot.bigBlind}`,
    `Eres ${snapshot.playerName}, en posición ${snapshot.position}, con un stack de ${snapshot.stack} fichas.`,
    `Tus cartas: ${snapshot.hole.join(' ') || '(sin repartir)'}`,
    `Mesa: ${snapshot.board.join(' ') || '(todavía no hay cartas comunitarias)'}`,
    `Bote: ${snapshot.pot} · apuesta a igualar en esta calle: ${snapshot.currentBet} · ya has puesto: ${snapshot.committed}`,
    hint?.notation ? `Notación de tu mano inicial: ${hint.notation}` : '',
    math,
    '',
    'Rivales:',
    opponents || '- (sin rivales activos)',
    '',
    'Historial de la mano:',
    snapshot.history.length ? snapshot.history.map(line => `- ${line}`).join('\n') : '- (sin acciones previas)',
    '',
    'Acciones legales (elige exactamente una):',
    legalLines(snapshot),
    '',
    'Devuelve solo el JSON.',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
