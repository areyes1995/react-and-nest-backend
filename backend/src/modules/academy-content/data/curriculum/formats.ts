// ──────────────────────────────────────────────
// Datos semilla — Curso transversal: Cash vs MTT vs Spin.
// Qué cambia de verdad entre modalidades: estructura,
// stacks, ICM, rake y bankroll. Teoría moderna vigente
// (Acevedo / Brokos / Clarke): sizings pequeños,
// ventaja de rango/nuts y ajustes por pool. Sin lo
// caducado de la literatura pre-solver (opens 3x fijos,
// c-bet 100%, push/fold rígidos sin ICM).
// ──────────────────────────────────────────────

import type { CourseSeed } from './curriculum.types';

export const FORMATS_COURSE: CourseSeed = {
  id: 'c-formatos',
  slug: 'cash-vs-torneos-vs-spin',
  title: 'Cash vs Torneos vs Spin: cómo cambia tu juego',
  summary:
    'La misma mano se juega distinto según la modalidad: stacks profundos, ICM o push/fold. Aprende qué ajustar y qué no.',
  level: 'beginner',
  icon: 'GitCompare',
  formats: ['all'],
  outcomes: [
    'Explicar qué cambia entre cash, MTT y Spin: stacks, ciegas y premios',
    'Ajustar rangos y sizings a cada modalidad sin memorizar tres juegos',
    'Elegir bankroll y volumen según la varianza de tu formato',
  ],
  lessons: [
    {
      id: 'l-formatos-mapa',
      slug: 'mapa-de-formatos',
      title: 'El mapa: qué cambia entre Cash, MTT y Spin',
      summary: 'Estructura, stacks y premios: las tres diferencias que lo cambian todo.',
      kind: 'lesson',
      minutes: 10,
      xp: 30,
      formats: ['all'],
      blocks: [
        {
          type: 'paragraph',
          text: 'Antes de abrir un rango, mira la estructura. En cash las ciegas no suben y cada ficha vale dinero. En torneos las ciegas suben, los stacks se acortan y las fichas valen premios según el ICM. En Spin son 3 jugadores, stacks de 25 ciegas e hiper-turbo: casi todo es push/fold en minutos.',
        },
        {
          type: 'table',
          headers: ['Factor', 'Cash', 'MTT', 'Spin'],
          rows: [
            ['Ciegas', 'Fijas, 100bb profundo', 'Suben, 10-60bb según fase', 'Suben rápido, 25bb inicial'],
            ['La ficha vale', 'Dinero directo', 'ICM: depende de premios y stacks', 'ICM extremo + multiplicador'],
            ['Error caro', 'Jugar botes grandes sin nuts a SPR alto', 'Arriesgar tu torneo en burbuja por fichas', 'Pagar de más con stacks cortos'],
            ['Habilidad clave', 'Valor fino y control de bote', 'Robo, defensa y supervivencia por fase', 'Push/fold y heads-up'],
          ],
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'La regla de oro',
          text: 'Cash: maximiza EV en fichas. MTT: maximiza EV en dinero de torneo (ICM). Spin: maximiza EV con stacks cortos y sin margen de espera.',
        },
        {
          type: 'spot',
          hole: 'As Kd',
          board: 'Qh 9c 2d',
          question:
            'Tienes A-K en Q-9-2 seco. En cash 100bb apuestas pequeño por valor y foldeas ante subida. ¿Harías lo mismo en burbuja de MTT con 18bb y un stack medio?',
          answer:
            'No. En cash el call con 31% de equity real puede ser rentable; en burbuja con stack medio, arriesgar tu torneo por un bote marginal es perdedor en ICM aunque sea ganador en fichas. En Spin con 12bb, A-K es push o 3-bet all-in preflop: no hay calles para jugar fino.',
        },
        {
          type: 'quiz',
          questions: [
            {
              id: 'q1',
              question: '¿Qué diferencia principal hace que el MTT no sea "cash con otro nombre"?',
              options: [
                'Se juega con más jugadores',
                'Las fichas no valen dinero directo: valen premios según ICM',
                'Los faroles están prohibidos',
                'No hay ciegas',
              ],
              answerIndex: 1,
              explanation:
                'En torneos el premio se reparte entre pocos y eliminarte cuesta todo. El ICM mide ese desajuste: una jugada ganadora en fichas puede ser perdedora en dinero real.',
            },
          ],
        },
      ],
    },
    {
      id: 'l-formatos-cash',
      slug: 'cash-profundo',
      title: 'Cash: stacks profundos y valor fino',
      summary: 'SPR alto, rake y thin value: el juego de las pequeñas ventajas repetidas.',
      kind: 'lesson',
      minutes: 11,
      xp: 35,
      formats: ['cash'],
      blocks: [
        {
          type: 'paragraph',
          text: 'En cash juegas 100 ciegas profundas con rake en cada bote. El dinero sale del valor fino repetido: apuestas pequeñas frecuentes en boards secos (25-33% del bote), control de bote fuera de posición con manos medias y defensa de ciega grande amplia pero sin pagar de más con rake alto.',
        },
        {
          type: 'table',
          headers: ['Concepto cash', 'Ajuste moderno', 'Error clásico'],
          rows: [
            ['Open raise', '2-2,5x (2x en botón), 3x en SB', 'Abrir 3-4x en todas las posiciones'],
            ['C-bet', 'Pequeña y frecuente con ventaja; check mucho sin ella', 'C-bet 100% automática'],
            ['SPR alto', 'Sin compromiso con una pareja: dos parejas o más para bote grande', 'Stackearte con top pair a 100bb'],
            ['Rake alto', 'Defiende 2-3% más estrecho; quita broadways offsuit marginales', 'Pagar "por precio justo" sin margen'],
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Thin value',
          text: 'Apostar en river con una mano media buscando pago de manos aún peores es la diferencia medible entre quien empata y quien gana en cash. Haz las dos listas: qué peor paga y qué mejor paga.',
        },
        {
          type: 'spot',
          hole: 'Ah Jd',
          board: 'Ac 8s 4h 2d 7c',
          question: 'Pareja de ases con jota en river seco. El rival pagó dos calles. ¿Apuestas en cash 100bb?',
          answer:
            'Sí, pequeño (un tercio). Pagan A-9, A-T, 8-x y parejas medias; solo te gana A-K y A-Q. En cash profundo este fino se repite cientos de veces y es tu winrate.',
        },
        {
          type: 'drill',
          mode: 'aggression',
          seats: 6,
          goal: 'Juega 25 manos de cash: apuesta fino por valor y controla el bote sin nuts a SPR alto',
          hands: 25,
        },
      ],
    },
    {
      id: 'l-formatos-mtt',
      slug: 'torneos-supervivencia-icm',
      title: 'Torneos: fases, ICM y supervivencia',
      summary: 'Early, burbuja y mesa final: cuándo robar, cuándo apretar y cuándo no arriesgar.',
      kind: 'lesson',
      minutes: 12,
      xp: 40,
      formats: ['mtt'],
      blocks: [
        {
          type: 'paragraph',
          text: 'En torneos tu stack manda más que tus cartas. Fase inicial: juega casi como cash profundo. Fase media: roba ciegas y antes contra stacks que no pueden pagarte. Burbuja: el stack mediano es la peor posición, evita botes marginales; el grande presiona a los medianos. Mesa final: cada salto de premio estrecha tus calls.',
        },
        {
          type: 'table',
          headers: ['Fase', 'Tu stack', 'Plan'],
          rows: [
            ['Inicial (50bb+)', 'Profundo', 'Como cash: valor y posición'],
            ['Media (20-30bb)', 'Maniobrable', 'Roba, 3-bet light en posición, evita pagar 3-bets OOP'],
            ['Burbuja', 'Mediano', 'Ajustado: no arriesgues tu torneo en 50/50'],
            ['Burbuja', 'Grande', 'Presiona a medianos: ellos no pueden arriesgar'],
            ['Mesa final', 'Corto', 'Push/fold con tablas Nash ajustadas por ICM'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Un 52% puede ser fold',
          text: 'Cerca de la burbuja, un all-in con 52% de equity en fichas puede ser perdedor en dinero si te elimina la mitad de las veces antes de premios. Mira el premio, no solo el bote.',
        },
        {
          type: 'spot',
          hole: '9s 9c',
          board: 'Kh 7d 2c',
          question:
            'Burbuja de MTT, eres stack mediano con 9-9 en K-7-2. El líder te apuesta 75% del bote. En cash pagarías por set mining y posición. ¿Aquí?',
          answer:
            'Fold la mayoría de las veces. Sin set tienes segunda pareja contra su rango de valor y presión; arriesgar tu torneo en burbuja por un bluff-catch marginal es error ICM. Con stack grande como agresor, aquí sí presionarías al mediano.',
        },
        {
          type: 'drill',
          mode: 'discipline',
          seats: 9,
          goal: 'Juega 30 manos de torneo: roba como grande, sobrevive como mediano en burbuja',
          hands: 30,
        },
      ],
    },
    {
      id: 'l-formatos-spin',
      slug: 'spin-push-fold-hu',
      title: 'Spin: 25bb, push/fold y heads-up',
      summary: 'Sin tiempo que perder: rangos de shove, calls ajustados y duelo final.',
      kind: 'lesson',
      minutes: 11,
      xp: 35,
      formats: ['spin'],
      blocks: [
        {
          type: 'paragraph',
          text: 'El Spin empieza con 25 ciegas y niveles de 3 minutos. No hay juego profundo: o robas preflop o vas all-in. Estudia rangos de push/fold por posición y stack (10-15bb: shove amplio en botón y SB; 20bb+: min-raise o shove selectivo). La mitad de tus torneos acaban en heads-up: practícalo aparte.',
        },
        {
          type: 'table',
          headers: ['Stack', 'Botón/SB', 'BB vs shove'],
          rows: [
            ['12bb o menos', 'Shove amplio: pares, ases, broadways, conectores suited', 'Paga ajustado: pares altos, A-x fuerte, broadways altos'],
            ['12-20bb', 'Min-raise o shove según rival; no pagues 3-bets OOP', '3-bet all-in con valor antes que pagar'],
            ['Heads-up', 'Abre 60-70% de botones, presiona cada bote', 'Defiende amplio pero sin pagar shoves marginales con ICM'],
          ],
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'El multiplicador no cambia los rangos',
          text: 'Juegues por x2 o por x100, los rangos preflop son los mismos. Lo que cambia es tu cabeza: no aprietes ni aflojes por el premio. El edge del Spin es volumen con decisiones idénticas.',
        },
        {
          type: 'spot',
          hole: 'Ks Ts',
          board: 'Qh 9c 2d',
          question: 'Spin, 14bb en botón con K-T suited. ¿Min-raise para ver flop o shove?',
          answer:
            'Shove la mayoría de las veces contra ciegas normales: tienes fold equity inmediata más 30% de equity cuando te pagan. El min-raise te deja un bote con SPR 2 fuera de posición si paga la ciega, el peor escenario con 14bb.',
        },
        {
          type: 'drill',
          mode: 'open-raise',
          seats: 3,
          goal: 'Juega 30 manos de Spin 3-handed: shove o min-raise según stack, sin pagar de más',
          hands: 30,
        },
      ],
    },
    {
      id: 'l-formatos-bankroll',
      slug: 'bankroll-por-formato',
      title: 'Bankroll y volumen por formato',
      summary: 'Cuántos buy-ins necesitas y por qué el Spin pide más caja que el cash.',
      kind: 'lesson',
      minutes: 9,
      xp: 30,
      formats: ['all'],
      blocks: [
        {
          type: 'paragraph',
          text: 'Sin banca suficiente juegas con miedo y cambias tus decisiones en los botes grandes. Escribe tus dos reglas antes de jugar: cuándo subes y cuándo bajas de límite.',
        },
        {
          type: 'table',
          headers: ['Formato', 'Mínimo', 'Cómodo', 'Por qué'],
          rows: [
            ['Cash 6-max', '30 buy-ins', '50', 'Varianza media, edge por hora estable'],
            ['MTT', '100 buy-ins', '200', 'Premios concentrados: puedes perder 50 torneos seguidos jugando bien'],
            ['Spin', '100 buy-ins', '150-200', 'Varianza alta por stacks cortos y formato turbo'],
            ['Sit & go', '50 buy-ins', '80', 'Varianza intermedia'],
          ],
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'Escribe las dos reglas',
          text: 'Subida: "subo cuando tenga X buy-ins del límite superior". Bajada: "bajo cuando caiga por debajo de Y". Escritas antes de jugar, cuando piensas con claridad.',
        },
        {
          type: 'quiz',
          questions: [
            {
              id: 'q1',
              question: 'Juegas Spin con 20 buy-ins y pierdes 10 en una tarde normal. ¿Qué pasó?',
              options: [
                'Juegas mal seguro',
                'Varianza normal con banca insuficiente: con 20 buy-ins el riesgo de ruina es altísimo',
                'Los Spin están amañados',
                'Nada, 20 buy-ins bastan',
              ],
              answerIndex: 1,
              explanation:
                'Con stacks cortos y formato turbo, rachas de 20-30 torneos sin premio son normales. Por eso el Spin pide 100+ buy-ins como el MTT, no 30 como el cash.',
            },
          ],
        },
      ],
    },
  ],
};
