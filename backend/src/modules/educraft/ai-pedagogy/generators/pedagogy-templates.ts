// ──────────────────────────────────────────────
// Generadores pedagógicos deterministas. Son el
// respaldo cuando no hay proveedor de IA configurado
// (o cuando falla) y siguen al pie de la letra las
// plantillas oficiales del proyecto:
//   • Esquema plan de clase (Inicio/Desarrollo/Cierre
//     con tiempo, actividades, indicadores de logro,
//     metacognición, evidencias, técnicas e
//     instrumentos y recursos).
//   • Rúbrica: Criterios | Excelente | Logrado |
//     En proceso | Inicio.
//   • Lista de cotejo y escalas de valoración.
// ──────────────────────────────────────────────

import { solveStepByStep } from '../math/step-solver';
import {
  distractors,
  generateProblems,
  makeRng,
  type DifficultyLevel,
  type GeneratedProblem,
} from './problem-generator';

export const DEFAULT_STRATEGIES = [
  'Recuperación de saberes previos.',
  'Manipulación de materiales didácticos.',
  'Descubrimiento guiado.',
  'Trabajo colaborativo.',
  'Socialización de respuestas.',
  'Resolución de problemas del contexto.',
  'Uso de TIC.',
];

export interface LessonMoment {
  moment: 'INICIO' | 'DESARROLLO' | 'CIERRE';
  minutes: number;
  activities: string[];
  metacognition: string;
  evidences: string[];
  techniques: string[];
  resources: string[];
}

export interface LessonPlanDraft {
  title: string;
  topic: string;
  purpose: string;
  durationMinutes: number;
  strategies: string[];
  moments: LessonMoment[];
  evaluation: { type: string; instruments: string[]; evidences: string[]; indicators: string[] };
  assignment: string;
}

export interface LessonPlanInput {
  topic: string;
  gradeName?: string;
  durationMinutes?: number;
  indicators?: string[];
  competences?: string[];
  strategies?: string[];
  context?: string;
}

function distribute(total: number): [number, number, number] {
  const inicio = Math.max(5, Math.round(total * 0.2));
  const cierre = Math.max(5, Math.round(total * 0.2));
  return [inicio, Math.max(5, total - inicio - cierre), cierre];
}

export function lessonPlanTemplate(input: LessonPlanInput): LessonPlanDraft {
  const topic = input.topic.trim();
  const duration = input.durationMinutes ?? 45;
  const [ti, td, tc] = distribute(duration);
  const problem = generateProblems({ topic, context: input.context, count: 1, difficulty: 'MEDIUM' })[0];
  const purpose = `Que los estudiantes comprendan y apliquen ${topic.toLowerCase()} para resolver situaciones de su entorno, comunicando sus procedimientos con lenguaje matemático.`;

  return {
    title: topic.charAt(0).toUpperCase() + topic.slice(1),
    topic,
    purpose,
    durationMinutes: duration,
    strategies: input.strategies?.length ? input.strategies : DEFAULT_STRATEGIES,
    moments: [
      {
        moment: 'INICIO',
        minutes: ti,
        activities: [
          'Leer y socializar la frase del día.',
          `Presentación del propósito: "${purpose}"`,
          `Activación de saberes previos sobre ${topic.toLowerCase()} con preguntas orales y una situación cotidiana.`,
          'Acuerdos de convivencia y normas de participación.',
        ],
        metacognition: `¿Qué sabes sobre ${topic.toLowerCase()}? ¿Dónde lo has visto en tu vida diaria?`,
        evidences: ['Participación oral.', 'Respuestas a la situación inicial.'],
        techniques: ['Observación directa.', 'Preguntas orales.'],
        resources: ['Proyector', 'Pizarra', 'Presentación de la clase'],
      },
      {
        moment: 'DESARROLLO',
        minutes: td,
        activities: [
          `Presentación interactiva sobre ${topic.toLowerCase()}: definición, elementos y ejemplos resueltos paso a paso.`,
          `Situación problema en equipos: "${problem.statement}"`,
          'Socialización: cada equipo explica su procedimiento y lo compara con el de otros.',
          'Práctica guiada y luego independiente con ejercicios graduados.',
        ],
        metacognition: '¿Qué estrategia usaste para resolver el problema? ¿Cómo comprobaste tu respuesta?',
        evidences: ['Resolución correcta de ejercicios.', 'Representaciones y procedimientos escritos.', 'Participación en la dinámica.'],
        techniques: ['Lista de cotejo.', 'Rúbrica de resolución de problemas.'],
        resources: ['Hojas de trabajo', 'Calculadora', 'Material manipulativo', 'Laboratorio matemático Educraft'],
      },
      {
        moment: 'CIERRE',
        minutes: tc,
        activities: [
          'Revisión: "¿Qué aprendimos hoy?" y "¿Qué fue lo más difícil?".',
          `Mini reto final (Exit ticket) sobre ${topic.toLowerCase()}.`,
          'Retroalimentación, felicitaciones y asignación para la casa.',
        ],
        metacognition: '¿Qué aprendiste hoy y para qué te sirve?',
        evidences: ['Participación en el reto final.', 'Reflexión verbal.'],
        techniques: ['Rueda de metacognición.', 'Registro anecdótico.'],
        resources: ['Imágenes en pantalla', 'Tarjetas de salida'],
      },
    ],
    evaluation: {
      type: 'FORMATIVE',
      instruments: ['Lista de cotejo', 'Rúbrica de resolución de problemas', 'Registro anecdótico'],
      evidences: ['Hoja de trabajo resuelta', 'Exit ticket'],
      indicators: input.indicators ?? [],
    },
    assignment: `Resolver 3 situaciones de ${topic.toLowerCase()} de su entorno familiar y explicar el procedimiento de una de ellas.`,
  };
}

// ── Rúbricas, listas de cotejo y escalas ─────────────

export const RUBRIC_LEVELS = ['Excelente', 'Logrado', 'En proceso', 'Inicio'];

export interface RubricCriterion {
  criterion: string;
  weight: number;
  descriptors: string[];
}

export function rubricTemplate(topic: string, competence?: string, criteriaCount = 4) {
  const t = topic.toLowerCase();
  const base: Array<[string, string[]]> = [
    [
      `Comprensión del concepto de ${t}`,
      [
        `Explica con precisión el concepto de ${t} y lo relaciona con otras ideas matemáticas.`,
        `Explica correctamente el concepto de ${t}.`,
        `Explica el concepto de ${t} con algunas imprecisiones.`,
        `Presenta dificultad para explicar el concepto de ${t}.`,
      ],
    ],
    [
      'Procedimiento de resolución',
      [
        'Aplica un procedimiento correcto, ordenado y eficiente; justifica cada paso.',
        'Aplica un procedimiento correcto con pasos ordenados.',
        'Aplica el procedimiento con errores que no afectan todo el resultado.',
        'El procedimiento es incompleto o incorrecto.',
      ],
    ],
    [
      'Representación y comunicación',
      [
        'Representa y comunica resultados usando lenguaje matemático, gráficos y tablas pertinentes.',
        'Comunica sus resultados con lenguaje matemático adecuado.',
        'Comunica resultados de forma parcial o con lenguaje poco preciso.',
        'No comunica o representa sus resultados.',
      ],
    ],
    [
      'Argumentación y verificación',
      [
        'Verifica su respuesta por dos vías y argumenta su validez en el contexto.',
        'Verifica su respuesta y la interpreta en el contexto.',
        'Verifica parcialmente su respuesta.',
        'No verifica ni interpreta su respuesta.',
      ],
    ],
    [
      'Trabajo colaborativo y actitud',
      [
        'Lidera y respeta las ideas de los demás; aporta estrategias al equipo.',
        'Participa activamente y respeta las ideas de los demás.',
        'Participa ocasionalmente en el trabajo del equipo.',
        'Muestra poca participación en el equipo.',
      ],
    ],
    [
      'Aplicación en el contexto',
      [
        'Transfiere lo aprendido a nuevas situaciones de la comunidad con creatividad.',
        'Aplica lo aprendido a situaciones de su entorno.',
        'Aplica lo aprendido solo a situaciones similares a las trabajadas.',
        'No logra aplicar lo aprendido a situaciones del contexto.',
      ],
    ],
  ];
  const chosen = base.slice(0, Math.min(Math.max(criteriaCount, 2), base.length));
  const weight = Math.floor(100 / chosen.length);
  const criteria: RubricCriterion[] = chosen.map(([criterion, descriptors], i) => ({
    criterion,
    weight: i === chosen.length - 1 ? 100 - weight * (chosen.length - 1) : weight,
    descriptors,
  }));
  return {
    title: `Rúbrica: ${topic}`,
    description: competence ? `Competencia: ${competence}` : undefined,
    content: { levels: RUBRIC_LEVELS, scores: [4, 3, 2, 1], criteria },
  };
}

export function checklistTemplate(topic: string, indicators: string[] = []) {
  const items = [
    ...indicators.slice(0, 4).map((i) => i.replace(/\.$/, '')),
    'Representa datos',
    'Resuelve correctamente',
    'Argumenta procedimientos',
    'Comunica resultados',
    `Aplica ${topic.toLowerCase()} en situaciones del contexto`,
  ];
  return {
    title: `Lista de cotejo: ${topic}`,
    content: { items: [...new Set(items)].slice(0, 8).map((text) => ({ text })) },
  };
}

export function ratingScaleTemplate(topic: string, scale: '1-4' | '1-5' | 'AD-A-B-C' = '1-4') {
  const levels =
    scale === '1-5'
      ? [5, 4, 3, 2, 1].map((v) => ({ value: String(v), label: ['Siempre', 'Casi siempre', 'A veces', 'Casi nunca', 'Nunca'][5 - v] }))
      : scale === 'AD-A-B-C'
        ? [
            { value: 'AD', label: 'Logro destacado' },
            { value: 'A', label: 'Logro esperado' },
            { value: 'B', label: 'En proceso' },
            { value: 'C', label: 'En inicio' },
          ]
        : [4, 3, 2, 1].map((v) => ({ value: String(v), label: RUBRIC_LEVELS[4 - v] }));
  return {
    title: `Escala de valoración: ${topic}`,
    content: {
      scale,
      levels,
      items: [
        { text: `Identifica los elementos de ${topic.toLowerCase()}` },
        { text: 'Sigue un procedimiento ordenado' },
        { text: 'Justifica sus respuestas' },
        { text: 'Participa y respeta las ideas de los demás' },
      ],
    },
  };
}

// ── Exámenes ──────────────────────────────────────────

export type ExamQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'DEVELOPMENT'
  | 'MATCHING'
  | 'COMPLETE'
  | 'PROBLEM';

export interface DraftQuestion {
  type: ExamQuestionType;
  topic: string;
  difficulty: DifficultyLevel;
  statement: string;
  options?: unknown;
  answer?: unknown;
  solution?: string;
  points: number;
}

export function examTemplate(opts: {
  topic: string;
  count: number;
  types: ExamQuestionType[];
  difficulty?: DifficultyLevel;
  context?: string;
}): DraftQuestion[] {
  const types = opts.types.length ? opts.types : (['MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROBLEM'] as ExamQuestionType[]);
  const difficulty = opts.difficulty ?? 'MEDIUM';
  const problems = generateProblems({ topic: opts.topic, count: opts.count, difficulty, context: opts.context });
  const rng = makeRng(Date.now());
  return problems.map((p, i) => toQuestion(types[i % types.length], p, opts.topic, rng));
}

function toQuestion(type: ExamQuestionType, p: GeneratedProblem, topic: string, rng: () => number): DraftQuestion {
  const base = { topic, difficulty: p.difficulty, solution: p.procedure.join('\n') };
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correct = p.numericAnswer ?? 0;
      const opts = [correct, ...distractors(correct, rng)].slice(0, 4);
      const order = opts.map((_, i) => i).sort(() => rng() - 0.5);
      const options = order.map((i) => String(opts[i]).replace('.', ','));
      return { ...base, type, statement: p.statement, options, answer: order.indexOf(0), points: 2 };
    }
    case 'TRUE_FALSE': {
      const truthful = rng() > 0.5;
      const shown = truthful ? p.answer : String(distractors(p.numericAnswer ?? 1, rng)[0]).replace('.', ',');
      return {
        ...base,
        type,
        statement: `${p.statement}\nAfirmación: la respuesta es ${shown}.`,
        answer: truthful,
        points: 1,
      };
    }
    case 'COMPLETE':
      return {
        ...base,
        type,
        statement: `${p.statement}\nCompleta: la respuesta es ______.`,
        answer: String(p.numericAnswer ?? p.answer),
        points: 1,
      };
    case 'SHORT_ANSWER':
      return { ...base, type, statement: p.statement, answer: p.answer, points: 2 };
    case 'DEVELOPMENT':
      return {
        ...base,
        type,
        statement: `${p.statement}\nExplica paso a paso tu procedimiento y verifica el resultado.`,
        answer: p.answer,
        points: 4,
      };
    case 'MATCHING': {
      const pairs = generateProblems({ topic, count: 4, difficulty: p.difficulty }).map((x) => [
        x.latex ?? x.statement.slice(0, 80),
        x.answer,
      ]);
      return {
        ...base,
        type,
        statement: 'Relaciona cada planteamiento con su resultado.',
        options: { left: pairs.map((x) => x[0]), right: [...pairs.map((x) => x[1])].sort(() => rng() - 0.5) },
        answer: pairs,
        points: 4,
      };
    }
    default:
      return { ...base, type: 'PROBLEM', statement: p.statement, answer: p.answer, points: 5 };
  }
}

// ── Actividades interactivas ──────────────────────────

export function activityTemplate(type: string, topic: string, difficulty: DifficultyLevel = 'MEDIUM') {
  const rng = makeRng(Date.now());
  const problems = generateProblems({ topic, count: 6, difficulty });
  switch (type) {
    case 'TRUE_FALSE':
      return {
        statements: problems.map((p) => {
          const truthful = rng() > 0.5;
          return {
            text: `${p.latex ? `$${p.latex}$ — ` : ''}${p.statement} Respuesta: ${truthful ? p.answer : distractors(p.numericAnswer ?? 1, rng)[0]}`,
            answer: truthful,
          };
        }),
      };
    case 'MATCHING':
    case 'MEMORY':
      return { pairs: problems.slice(0, 6).map((p) => ({ left: p.latex ?? p.statement.slice(0, 70), right: p.answer })) };
    case 'ORDER_STEPS': {
      const eq = problems.find((p) => p.latex && /=/.test(p.latex) && !/\\/.test(p.latex))?.latex ?? '2x + 5 = 13';
      try {
        const solved = solveStepByStep(eq);
        return { problem: eq, steps: solved.steps.map((s) => ({ text: s.explanation, latex: s.latex })) };
      } catch {
        return { problem: problems[0].statement, steps: problems[0].procedure.map((text) => ({ text })) };
      }
    }
    case 'COMPLETE':
      return { items: problems.map((p) => ({ text: `${p.statement} → ____`, answer: String(p.numericAnswer ?? p.answer) })) };
    case 'ROULETTE':
      return { segments: problems.map((p) => ({ prompt: p.statement, answer: p.answer })) };
    case 'ESCAPE_ROOM': {
      const challenges = problems.slice(0, 4).map((p, i) => ({
        room: `Sala ${i + 1}`,
        riddle: p.statement,
        answer: String(p.numericAnswer ?? p.answer),
        hint: p.procedure[0],
      }));
      return {
        story: `El laboratorio de matemática quedó cerrado. Resuelvan los retos de ${topic.toLowerCase()} para obtener el código de salida.`,
        challenges,
        finalCode: challenges.map((c) => String(c.answer).replace(/\D/g, '').slice(-1) || '0').join(''),
      };
    }
    case 'CARTESIAN_POINTS':
      return {
        points: Array.from({ length: 5 }, (_, i) => ({
          label: String.fromCharCode(65 + i),
          x: Math.floor(rng() * 13) - 6,
          y: Math.floor(rng() * 13) - 6,
        })),
      };
    case 'SOLVE_OPERATIONS':
      return { items: problems.map((p) => ({ prompt: p.latex ?? p.statement, answer: p.answer })) };
    case 'DRAG_DROP':
      return {
        categories: ['Resultado positivo', 'Resultado negativo o cero'],
        items: problems.map((p) => ({
          text: p.latex ?? p.statement.slice(0, 60),
          category: (p.numericAnswer ?? 0) > 0 ? 0 : 1,
        })),
      };
    default:
      return {
        questions: problems.map((p) => {
          const correct = p.numericAnswer ?? 0;
          const opts = [correct, ...distractors(correct, rng)].slice(0, 4).sort(() => rng() - 0.5);
          return { prompt: p.statement, options: opts.map(String), answer: opts.indexOf(correct), seconds: 30 };
        }),
      };
  }
}

// ── Observaciones y estrategias ───────────────────────

export interface StudentSnapshot {
  firstName: string;
  average: number | null;
  attendanceRate: number | null;
  weakBlocks: string[];
  strongBlocks: string[];
  passing: number;
}

export function observationTemplate(type: 'CONDUCT' | 'PARTICIPATION' | 'SITUATION', s: StudentSnapshot): string {
  const avg = s.average != null ? `con un promedio de ${s.average}` : 'sin calificaciones suficientes aún';
  const att = s.attendanceRate != null ? ` y una asistencia de ${s.attendanceRate}%` : '';
  if (type === 'CONDUCT') {
    return `${s.firstName} mantiene una conducta respetuosa en el aula y cumple los acuerdos de convivencia. Se recomienda continuar reforzando la responsabilidad en la entrega de sus trabajos.`;
  }
  if (type === 'PARTICIPATION') {
    const tone =
      s.average != null && s.average >= s.passing
        ? 'participa activamente, aporta ideas y explica sus procedimientos a sus compañeros'
        : 'participa cuando se le motiva; necesita acompañamiento para expresar sus procedimientos';
    return `${s.firstName} ${tone}. Se encuentra ${avg}${att}.`;
  }
  const weak = s.weakBlocks.length ? ` Presenta dificultades en: ${s.weakBlocks.join('; ')}.` : '';
  const strong = s.strongBlocks.length ? ` Destaca en: ${s.strongBlocks.join('; ')}.` : '';
  return `Situación académica de ${s.firstName}: ${avg}${att}.${strong}${weak} Se sugiere seguimiento con la familia y actividades de refuerzo.`;
}

export function reinforcementStrategies(input: {
  sectionLabel: string;
  weakBlocks: Array<{ name: string; average: number | null }>;
  atRisk: string[];
  topic?: string;
}) {
  const strategies = [
    {
      title: 'Tutoría entre pares',
      description: 'Formar parejas con un estudiante de logro destacado y uno en riesgo para resolver retos semanales.',
    },
    {
      title: 'Material concreto y representaciones',
      description: 'Usar material manipulativo, gráficos y el laboratorio matemático antes de pasar a lo simbólico.',
    },
    {
      title: 'Retroalimentación inmediata',
      description: 'Aplicar exit tickets de 3 preguntas y devolver comentarios la clase siguiente.',
    },
    {
      title: 'Práctica diferenciada',
      description: 'Asignar ejercicios en tres niveles (básico, intermedio, reto) según el desempeño de cada estudiante.',
    },
    {
      title: 'Acompañamiento familiar',
      description: 'Compartir el informe para padres con recomendaciones concretas para el hogar.',
    },
  ];
  for (const b of input.weakBlocks) {
    strategies.unshift({
      title: `Refuerzo: ${b.name}`,
      description: `Promedio del grupo ${b.average ?? '—'}. Planificar 2 sesiones de nivelación con problemas contextualizados${input.topic ? ` de ${input.topic}` : ''} y evaluación formativa con lista de cotejo.`,
    });
  }
  return {
    summary: `${input.sectionLabel}: ${input.atRisk.length} estudiante(s) en riesgo${input.weakBlocks.length ? `; bloques a reforzar: ${input.weakBlocks.map((b) => b.name).join(', ')}` : ''}.`,
    strategies: strategies.slice(0, 7),
    plan: [
      'Semana 1: diagnóstico breve y agrupación por niveles.',
      'Semana 2: sesiones de refuerzo con material concreto y tutoría entre pares.',
      'Semana 3: evaluación formativa y ajuste del plan; comunicación con las familias.',
    ],
    students: input.atRisk,
  };
}

// ── Programación curricular ───────────────────────────

export function programTemplate(opts: {
  gradeName: string;
  concepts: Array<{ id: number; block: string | null; description: string }>;
  periods: Array<{ number: number; startDate: string; endDate: string }>;
}) {
  const units = opts.concepts.map((c, i) => {
    const period = opts.periods[Math.min(opts.periods.length - 1, Math.floor((i * opts.periods.length) / Math.max(1, opts.concepts.length)))];
    return {
      title: `Unidad ${i + 1}: ${c.block ?? 'Contenidos'}`,
      description: c.description,
      contentIds: [c.id],
      period: period?.number ?? null,
      startDate: period?.startDate ?? null,
      endDate: period?.endDate ?? null,
      evidences: ['Resolución de situaciones problema', 'Proyecto o producto final de la unidad'],
      evaluationCriteria: ['Comprensión conceptual', 'Resolución de problemas', 'Comunicación matemática'],
    };
  });
  return { title: `Programación anual de Matemática — ${opts.gradeName}`, units };
}

// ── Tutor virtual (respaldo sin proveedor) ─────────────

const COMMON_ERRORS: Array<[RegExp, string]> = [
  [/fracc/, 'Un error frecuente con fracciones es sumar numeradores y denominadores por separado (1/2 + 1/3 = 2/5). Muestra con material concreto o con una pizza dividida que primero hay que buscar un denominador común: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.'],
  [/signo|entero|negativ/, 'Con enteros, los estudiantes suelen confundir la regla de los signos de la multiplicación con la de la suma. Usa la recta numérica para la suma y una tabla de patrones (3·2, 3·1, 3·0, 3·(−1)…) para descubrir la regla del producto.'],
  [/distribut|par[eé]ntesis/, 'Al eliminar paréntesis se olvida multiplicar el segundo término: 3(x + 2) = 3x + 2. Pide que dibujen flechas desde el factor hacia cada término y verifiquen sustituyendo un valor.'],
  [/ecuaci|despej/, 'Al despejar, muchos "pasan" términos sin cambiar la operación o solo modifican un lado. Insiste en la balanza: lo que se hace a un lado se hace al otro, y verifiquen siempre sustituyendo la solución.'],
  [/potenc|exponent/, 'Es común creer que (a + b)² = a² + b². Usa un cuadrado de lado (a + b) dividido en áreas para mostrar el término 2ab.'],
];

export function tutorFallback(message: string, context: { teacherName?: string; sections?: string[] }): string {
  const m = message.toLowerCase();
  const topicMatch = /(?:enseñar|explicar|sobre|de)\s+(?:las?\s+|los?\s+|el\s+)?([a-záéíóúñ\s]{4,40})\??$/i.exec(message.trim());
  const topic = topicMatch?.[1]?.trim() ?? 'el tema';

  if (/error|equivoca|confund/.test(m)) {
    const hit = COMMON_ERRORS.find(([re]) => re.test(m));
    return hit
      ? hit[1]
      : 'Para abordar un error frecuente: 1) pide al estudiante que explique su procedimiento en voz alta, 2) muestra un contraejemplo sencillo, 3) contrasta con una representación visual y 4) propón un ejercicio similar para verificar la comprensión.';
  }
  if (/r[uú]brica/.test(m)) {
    const r = rubricTemplate(topic);
    return [
      `Te propongo esta rúbrica para ${topic}:`,
      ...r.content.criteria.map((c) => `• ${c.criterion} (${c.weight}%): Excelente — ${c.descriptors[0]}`),
      'Puedes editarla y guardarla desde Evaluación → Rúbricas.',
    ].join('\n');
  }
  if (/actividad|din[aá]mica|juego/.test(m)) {
    const p = generateProblems({ topic, count: 1 })[0];
    return `Actividad sugerida (15 min, en equipos): "${p.statement}". Cada equipo resuelve, explica su procedimiento y comprueba. Cierra con una pregunta de metacognición: ¿qué estrategia fue más eficiente? También puedes convertirla en una ruleta o un escape room desde Clases → Actividades interactivas.`;
  }
  if (/c[oó]mo ense[nñ]ar|c[oó]mo explico|estrategia/.test(m)) {
    return [
      `Secuencia sugerida para enseñar ${topic}:`,
      '1. Inicio: situación cotidiana y preguntas para activar saberes previos.',
      '2. Exploración con material concreto o el laboratorio matemático (graficadora).',
      '3. Formalización: definición y ejemplos resueltos paso a paso.',
      '4. Práctica guiada en parejas y luego independiente con dificultad graduada.',
      '5. Cierre: exit ticket y metacognición ("¿qué aprendí?, ¿para qué me sirve?").',
      'Si quieres, genera la sesión completa desde IA Educraft → Generador de sesiones.',
    ].join('\n');
  }
  if (/resum/.test(m)) {
    return 'Para resumir una sesión, ábrela en Planificación → Programaciones y usa "Generar presentación": obtendrás propósito, contenidos, actividades y tarea en la plantilla oficial.';
  }
  if (/pdf|documento/.test(m)) {
    return 'Usa la acción "Convertir PDF a sesión": sube el documento y construiré un borrador del plan de clase con sus momentos (Inicio, Desarrollo y Cierre).';
  }
  if (/\d\s*[a-z]?\s*[+\-*/=]/.test(m)) {
    try {
      const s = solveStepByStep(message.replace(/^[^0-9a-z(]*/i, ''));
      return [`Solución paso a paso:`, ...s.steps.map((st) => `• ${st.explanation} → ${st.latex}`), `Respuesta: ${s.answer}`].join('\n');
    } catch {
      // continúa con la respuesta general
    }
  }
  return [
    `¡Hola${context.teacherName ? `, ${context.teacherName}` : ''}! Soy tu Tutor Virtual Docente. Puedo ayudarte a:`,
    '• Sugerir cómo enseñar un tema ("¿Cómo enseñar funciones cuadráticas?").',
    '• Proponer actividades ("Dame una actividad para segundo grado").',
    '• Explicar errores frecuentes ("Explícame este error con fracciones").',
    '• Crear rúbricas y resolver ejercicios paso a paso ("2x + 5 = 13").',
    'Para respuestas abiertas más completas, el administrador puede configurar un proveedor de IA (OPENAI_API_URL y OPENAI_API_KEY).',
  ].join('\n');
}
