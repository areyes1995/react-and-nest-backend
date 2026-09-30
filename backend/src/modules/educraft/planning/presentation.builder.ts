// ──────────────────────────────────────────────
// Construye una presentación a partir de un plan de
// clase siguiendo la "Plantilla de presentación de
// clase" oficial (11 diapositivas):
//   1 Nombre de la clase · 2 Reflexión del día ·
//   3 Retroalimentación · 4 Propósito · 5 Tabla de
//   contenido · 6 Título de la primera parte ·
//   7 Contenidos o ejemplos · 8 Actividades ·
//   9 Asignación · 10 Descripción de tarea ·
//   11 Frase final del día
// ──────────────────────────────────────────────

export type SlideLayout =
  | 'title'
  | 'reflection'
  | 'feedback'
  | 'purpose'
  | 'agenda'
  | 'section'
  | 'content'
  | 'activities'
  | 'assignment'
  | 'task'
  | 'closing';

export type SlideBlock =
  | { type: 'text'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'formula'; latex: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'video'; url: string }
  | { type: 'question'; prompt: string; options?: string[]; answer?: string }
  | { type: 'table'; rows: string[][] };

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  blocks: SlideBlock[];
  notes?: string;
}

export interface PlanForSlides {
  title: string;
  topic: string;
  purpose?: string | null;
  assignment?: string | null;
  gradeName?: string;
  moments: Array<{ moment: string; activities: string[]; metacognition?: string }>;
  contents?: string[];
  examples?: Array<{ title: string; latex?: string; steps?: string[] }>;
  exercises?: Array<{ statement: string; answer?: string }>;
}

const QUOTES = [
  'La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo. — Paulo Freire',
  'Las matemáticas son el alfabeto con el cual Dios ha escrito el universo. — Galileo Galilei',
  'No te preocupes por tus dificultades en matemáticas; te aseguro que las mías son mayores. — Albert Einstein',
  'La esencia de las matemáticas es su libertad. — Georg Cantor',
];

const REFLECTIONS = [
  'Cada error es una oportunidad para aprender algo nuevo.',
  'El esfuerzo de hoy es el logro de mañana.',
  'Pensar con calma también es pensar con fuerza.',
];

let counter = 0;
const slideId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function buildPresentationFromPlan(plan: PlanForSlides): Slide[] {
  const inicio = plan.moments.find((m) => m.moment === 'INICIO');
  const desarrollo = plan.moments.find((m) => m.moment === 'DESARROLLO');
  const cierre = plan.moments.find((m) => m.moment === 'CIERRE');
  const contents = plan.contents?.length ? plan.contents : [plan.topic];

  const slides: Slide[] = [
    {
      id: slideId(),
      layout: 'title',
      title: plan.title,
      subtitle: plan.gradeName ? `${plan.topic} · ${plan.gradeName}` : plan.topic,
      blocks: [],
    },
    {
      id: slideId(),
      layout: 'reflection',
      title: 'Reflexión del día',
      blocks: [{ type: 'text', text: pick(REFLECTIONS, plan.topic) }],
    },
    {
      id: slideId(),
      layout: 'feedback',
      title: 'Retroalimentación',
      blocks: [
        {
          type: 'bullets',
          items: inicio?.activities.length
            ? inicio.activities
            : ['¿Qué recordamos de la clase anterior?', `¿Qué sabemos sobre ${plan.topic}?`],
        },
      ],
      notes: inicio?.metacognition,
    },
    {
      id: slideId(),
      layout: 'purpose',
      title: 'Propósito',
      blocks: [
        {
          type: 'text',
          text: plan.purpose || `Comprender y aplicar ${plan.topic} en situaciones del contexto.`,
        },
      ],
    },
    {
      id: slideId(),
      layout: 'agenda',
      title: 'Tabla de contenido',
      blocks: [{ type: 'bullets', items: contents }],
    },
    {
      id: slideId(),
      layout: 'section',
      title: plan.topic,
      subtitle: 'Desarrollo del tema',
      blocks: [],
    },
  ];

  const examples = plan.examples ?? [];
  if (examples.length) {
    for (const ex of examples) {
      slides.push({
        id: slideId(),
        layout: 'content',
        title: ex.title,
        blocks: [
          ...(ex.latex ? [{ type: 'formula' as const, latex: ex.latex }] : []),
          ...(ex.steps?.length ? [{ type: 'bullets' as const, items: ex.steps }] : []),
        ],
      });
    }
  } else {
    slides.push({
      id: slideId(),
      layout: 'content',
      title: 'Contenidos o ejemplos abordados',
      blocks: [
        {
          type: 'bullets',
          items: desarrollo?.activities.length ? desarrollo.activities : contents,
        },
      ],
      notes: desarrollo?.metacognition,
    });
  }

  slides.push({
    id: slideId(),
    layout: 'activities',
    title: 'Actividades',
    blocks: plan.exercises?.length
      ? plan.exercises.map((e) => ({
          type: 'question' as const,
          prompt: e.statement,
          answer: e.answer,
        }))
      : [{ type: 'bullets', items: desarrollo?.activities ?? ['Ejercicios guiados en parejas.'] }],
  });

  slides.push(
    {
      id: slideId(),
      layout: 'assignment',
      title: 'Asignación',
      blocks: [],
    },
    {
      id: slideId(),
      layout: 'task',
      title: 'Descripción de tarea',
      blocks: [
        {
          type: 'text',
          text:
            plan.assignment ||
            cierre?.activities.find((a) => /casa|tarea/i.test(a)) ||
            `Resolver 5 ejercicios de ${plan.topic} del cuaderno de práctica.`,
        },
      ],
    },
    {
      id: slideId(),
      layout: 'closing',
      title: 'Frase final del día',
      blocks: [{ type: 'text', text: pick(QUOTES, plan.title) }],
      notes: cierre?.metacognition,
    },
  );

  return slides;
}
