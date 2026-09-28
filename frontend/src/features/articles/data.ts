// ──────────────────────────────────────────────
// Artículos — biblioteca escrita.
// Complementa a las clases: aquí van los temas que
// no encajan en la ruta lineal pero que resuelven
// dudas concretas del estudiante.
// ──────────────────────────────────────────────

import type { ContentBlock, LevelId } from '@features/academy/types'

export type ArticleCategory =
  | 'fundamentos'
  | 'estrategia'
  | 'matematicas'
  | 'mentalidad'
  | 'torneos'
  | 'cash'
  | 'spin'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  level: LevelId
  author: string
  publishedAt: string
  readMinutes: number
  tags: string[]
  blocks: ContentBlock[]
}

export const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string; icon: string }[] = [
  { id: 'fundamentos', label: 'Fundamentos', icon: 'BookOpen' },
  { id: 'estrategia', label: 'Estrategia', icon: 'Target' },
  { id: 'matematicas', label: 'Matemáticas', icon: 'Calculator' },
  { id: 'mentalidad', label: 'Mentalidad', icon: 'Brain' },
  { id: 'torneos', label: 'Torneos', icon: 'Trophy' },
  { id: 'cash', label: 'Cash', icon: 'Coins' },
  { id: 'spin', label: 'Spin', icon: 'Zap' },
]

export const ARTICLES: Article[] = [
  {
    id: 'a-errores-principiante',
    slug: 'siete-errores-que-cuestan-dinero',
    title: 'Siete errores que le cuestan dinero a todo principiante',
    excerpt:
      'Ninguno tiene que ver con la suerte. Todos se corrigen con una decisión consciente en la próxima sesión.',
    category: 'fundamentos',
    level: 'beginner',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-02-10',
    readMinutes: 7,
    tags: ['fugas', 'preflop', 'disciplina'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Las pérdidas de un jugador nuevo casi nunca vienen de una mano espectacular mal jugada. Vienen de siete decisiones pequeñas que se repiten cientos de veces.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Jugar demasiadas manos: si entras en más del 30% de los botes en mesa de 6, estás jugando manos que no ganan.',
          'Pagar por curiosidad en el river: pagar "para ver" es la apuesta más cara del juego.',
          'Jugar fuera de posición como si estuvieras en posición: la misma mano vale la mitad desde la ciega.',
          'Enamorarse de la pareja de ases: son la mejor mano preflop y una mano mediana en un board de cuatro cartas conectadas.',
          'Apostar sin saber qué peor mano va a pagar: si no puedes nombrar una, no es apuesta de valor.',
          'Cambiar de estrategia después de una mano perdida: eso no es ajustar, es tilt.',
          'No revisar nunca las manos jugadas: sin revisión, mil manos enseñan lo mismo que diez.',
        ],
      },
      {
        type: 'callout',
        tone: 'key',
        title: 'Cómo usar esta lista',
        text: 'No intentes corregir los siete. Elige uno para tu próxima sesión y cuéntalo. Un error corregido de verdad vale más que siete identificados.',
      },
    ],
  },
  {
    id: 'a-posicion',
    slug: 'la-posicion-vale-mas-que-las-cartas',
    title: 'La posición vale más que las cartas',
    excerpt:
      'Por qué un jugador mediocre en el botón gana dinero a un jugador bueno en la ciega pequeña.',
    category: 'estrategia',
    level: 'beginner',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-02-24',
    readMinutes: 6,
    tags: ['posición', 'preflop', 'fundamentos'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Si tuvieras que quedarte con una sola ventaja en el poker, no elegirías cartas mejores: elegirías actuar siempre el último. La posición te da información gratis en cada decisión y control sobre el tamaño del bote.',
      },
      { type: 'heading', text: 'Las tres ventajas concretas' },
      {
        type: 'list',
        items: [
          'Información: sabes lo que han hecho todos antes de decidir.',
          'Control del bote: decides si la mano se juega barata o cara.',
          'Faroles más baratos: cuando el rival pasa dos veces, su debilidad es información que solo tú puedes usar.',
        ],
      },
      {
        type: 'table',
        headers: ['Posición', 'Manos jugables', 'Beneficio esperado'],
        rows: [
          ['Botón', '40-45%', 'La posición más rentable, con diferencia'],
          ['Cutoff', '25-30%', 'Positiva'],
          ['Posición media', '18-20%', 'Ligeramente positiva'],
          ['UTG', '13-15%', 'Neutra'],
          ['Ciega grande', 'Defensa amplia', 'Negativa: se trata de perder menos'],
          ['Ciega pequeña', 'Muy selectiva', 'La más negativa de la mesa'],
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Las ciegas siempre pierden',
        text: 'No es un fallo de tu juego: las ciegas son posiciones estructuralmente perdedoras porque pones fichas a ciegas y juegas el resto de la mano el primero. El objetivo ahí no es ganar, es perder menos.',
      },
    ],
  },
  {
    id: 'a-pot-odds-mentales',
    slug: 'calcular-pot-odds-en-cinco-segundos',
    title: 'Calcular pot odds en cinco segundos',
    excerpt: 'Tres atajos mentales para no quedarte bloqueado en mitad de una mano.',
    category: 'matematicas',
    level: 'beginner',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-03-08',
    readMinutes: 5,
    tags: ['pot odds', 'equity', 'cálculo'],
    blocks: [
      {
        type: 'paragraph',
        text: 'No necesitas calcular fracciones exactas en la mesa. Necesitas tres referencias memorizadas y la capacidad de compararlas con tus outs.',
      },
      {
        type: 'table',
        headers: ['Si te apuestan…', 'Necesitas…', 'Equivale a…'],
        rows: [
          ['Medio bote', '25%', '6 outs en el turn'],
          ['Tres cuartos', '30%', '7-8 outs en el turn'],
          ['El bote entero', '33%', '8-9 outs en el turn'],
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'El atajo definitivo',
        text: 'Proyecto de color en el flop (9 outs, 36%) paga cualquier apuesta de hasta el tamaño del bote. Escalera interior (4 outs, 16%) no paga casi nada. Con solo esas dos referencias resuelves la mayoría de tus decisiones.',
      },
    ],
  },
  {
    id: 'a-cbet',
    slug: 'cuando-no-hacer-continuation-bet',
    title: 'Cuándo NO hacer continuation bet',
    excerpt: 'La c-bet automática es la fuga más común del jugador que ya sabe jugar.',
    category: 'estrategia',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-04-02',
    readMinutes: 8,
    tags: ['postflop', 'c-bet', 'texturas'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Aprender a hacer c-bet es un avance. Aprender a no hacerla es el siguiente, y es el que separa a quien empata de quien gana.',
      },
      { type: 'heading', text: 'Los cuatro escenarios de pasar' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Board bajo y conectado contra quien defendió la ciega grande: ese flop le pertenece.',
          'Tres o más rivales en el bote: la probabilidad de que nadie haya ligado se desploma.',
          'Rival que nunca se retira: farolear a una calling station es regalarle fichas.',
          'Tu mano no tiene ni equity ni plan para el turn: apostar solo por inercia es quemar fichas.',
        ],
      },
      {
        type: 'spot',
        hole: 'Ad Kc',
        board: '7h 6h 5s',
        question: 'Abriste UTG, pagó la ciega grande. Flop 7-6-5 con dos corazones. ¿Apuestas?',
        answer: 'No. Este board favorece completamente el rango de quien defendió la ciega: conectores, parejas bajas, proyectos. Tu A-K no tiene nada y cualquier apuesta te va a encontrar con manos que no se retiran. Pasa y reevalúa en el turn.',
      },
    ],
  },
  {
    id: 'a-rangos',
    slug: 'empezar-a-pensar-en-rangos',
    title: 'Cómo empezar a pensar en rangos',
    excerpt: 'Un método de cuatro preguntas para construir el rango del rival sin software.',
    category: 'estrategia',
    level: 'advanced',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-05-15',
    readMinutes: 9,
    tags: ['rangos', 'lectura', 'avanzado'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Pensar en rangos suena a ejercicio teórico, pero en la mesa se reduce a cuatro preguntas que puedes hacerte en el tiempo que tarda el dealer en repartir el turn.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          '¿Desde qué posición entró? Define el rango de partida.',
          '¿Qué hizo preflop: abrir, pagar, resubir? Cada acción recorta el rango a la mitad.',
          '¿Cómo encaja el flop con ese rango? Cuenta cuántas combinaciones mejoran de verdad.',
          '¿Su apuesta es coherente con esas combinaciones o con un farol?',
        ],
      },
      {
        type: 'callout',
        tone: 'key',
        title: 'El truco de las combinaciones',
        text: 'Hay 6 combinaciones de cada pareja y 16 de cada mano no emparejada (4 suited, 12 offsuit). Cuando el board trae un as, el rival tiene muchas más combinaciones de as-x que de ases: la mano fuerte casi siempre es menos probable de lo que parece.',
      },
    ],
  },
  {
    id: 'a-tilt',
    slug: 'el-tilt-no-se-siente-como-enfado',
    title: 'El tilt no se siente como enfado',
    excerpt: 'Se siente como prisa. Y por eso pasa desapercibido hasta que la sesión ya está perdida.',
    category: 'mentalidad',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-06-01',
    readMinutes: 6,
    tags: ['tilt', 'mentalidad', 'rutinas'],
    blocks: [
      {
        type: 'paragraph',
        text: 'La imagen del tilt es la de alguien golpeando la mesa. La realidad es mucho más discreta: decides más rápido, revisas menos, entras en manos que normalmente pasarías. Nada de eso se parece a estar enfadado.',
      },
      {
        type: 'list',
        items: [
          'Señal 1: tu tiempo medio de decisión baja de golpe.',
          'Señal 2: empiezas a justificar pagos con "por si acaso".',
          'Señal 3: piensas en recuperar lo perdido, no en jugar bien la mano actual.',
          'Señal 4: abres más mesas o subes de límite sin haberlo planeado.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'La regla de los dos minutos',
        text: 'Cuando detectes cualquiera de las cuatro señales, levántate dos minutos. No es superstición: interrumpir la secuencia automática es lo único que funciona de forma fiable.',
      },
    ],
  },
  {
    id: 'a-bankroll',
    slug: 'cuanto-bankroll-necesitas-de-verdad',
    title: 'Cuánto bankroll necesitas de verdad',
    excerpt: 'Los números por formato, y por qué la regla de subir de límite se escribe antes de jugar.',
    category: 'mentalidad',
    level: 'pro',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-06-20',
    readMinutes: 7,
    tags: ['bankroll', 'varianza', 'gestión'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Un bankroll insuficiente no te hace perder por matemáticas: te hace perder porque juegas con miedo. Y jugar con miedo cambia tus decisiones justo en los botes grandes, que son los que deciden tu resultado.',
      },
      {
        type: 'table',
        headers: ['Formato', 'Mínimo', 'Cómodo', 'Por qué'],
        rows: [
          ['Cash 6-max', '30 buy-ins', '50', 'Varianza media, sesiones largas'],
          ['Cash full ring', '25 buy-ins', '40', 'Menos varianza, botes más definidos'],
          ['MTT', '100 buy-ins', '200', 'Premios concentrados en pocas posiciones'],
          ['Sit & go', '50 buy-ins', '80', 'Varianza intermedia'],
        ],
      },
      {
        type: 'callout',
        tone: 'key',
        title: 'Escribe las dos reglas',
        text: 'Regla de subida: "subo de límite cuando tenga X buy-ins del límite superior". Regla de bajada: "bajo cuando caiga por debajo de Y". Escritas antes de jugar, cuando todavía piensas con claridad.',
      },
    ],
  },
  {
    id: 'a-icm',
    slug: 'icm-por-que-las-fichas-no-valen-lo-mismo',
    title: 'ICM: por qué tus fichas no valen lo mismo en un torneo',
    excerpt: 'La diferencia conceptual que hace que el juego de torneo no sea cash con otro nombre.',
    category: 'torneos',
    level: 'advanced',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-07-05',
    readMinutes: 8,
    tags: ['torneos', 'ICM', 'burbuja'],
    blocks: [
      {
        type: 'paragraph',
        text: 'En cash, una ficha vale una ficha. En un torneo, las fichas que ganas valen menos que las que pierdes, porque el premio se reparte entre pocos y quedarse sin fichas te elimina. Ese desajuste es lo que mide el ICM.',
      },
      {
        type: 'callout',
        tone: 'key',
        title: 'La consecuencia práctica',
        text: 'Cerca de la burbuja, muchas situaciones rentables en fichas son perdedoras en dinero real. Un all-in con 52% de equity puede ser un error claro si te elimina una de cada dos veces justo antes de entrar en premios.',
      },
      {
        type: 'list',
        items: [
          'Con stack corto: busca situaciones donde nadie pueda eliminarte y roba ciegas.',
          'Con stack grande: presiona a los stacks medianos, que son los que más pierden al arriesgar.',
          'Con stack mediano en burbuja: es la peor posición. Juega ajustado y evita botes marginales.',
        ],
      },
    ],
  },
  {
    id: 'a-tamanos',
    slug: 'por-que-los-profesionales-apuestan-un-tercio',
    title: 'Por qué los profesionales apuestan un tercio del bote',
    excerpt: 'La apuesta pequeña no es debilidad: es la herramienta más precisa del juego moderno.',
    category: 'estrategia',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-07-22',
    readMinutes: 6,
    tags: ['sizing', 'postflop', 'c-bet'],
    blocks: [
      {
        type: 'paragraph',
        text: 'Durante años la apuesta estándar fue dos tercios del bote. Hoy verás a los mejores apostar un tercio en muchos flops, y no es moda: es una consecuencia directa de las pot odds.',
      },
      {
        type: 'list',
        items: [
          'Una apuesta de un tercio solo necesita funcionar el 25% de las veces para ser rentable como farol.',
          'Permite apostar con todo tu rango en boards que te favorecen, sin tener que elegir manos.',
          'Mantiene el bote pequeño con las manos medianas, que es donde más se pierde.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Cuándo no vale',
        text: 'En boards húmedos, apostar pequeño le da un precio excelente a todos los proyectos. Ahí necesitas tamaño grande: el objetivo cambia de "que paguen todos" a "que pagar les cueste caro".',
      },
    ],
  },
  {
    id: 'a-cash-vs-mtt',
    slug: 'cash-vs-torneos-que-cambia',
    title: 'Cash vs torneos: qué cambia de verdad',
    excerpt: 'Stacks, ICM y rake: los tres ajustes que separan a quien juega dos juegos de quien mezcla uno.',
    category: 'cash',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-08-20',
    readMinutes: 7,
    tags: ['cash', 'torneos', 'ICM', 'formatos'],
    blocks: [
      {
        type: 'paragraph',
        text: 'La mano es la misma, el juego no. En cash cada ficha vale dinero y juegas 100 ciegas profundas: el edge sale del valor fino repetido y del control de bote a SPR alto. En torneos las ciegas suben y las fichas valen premios: cerca de la burbuja, jugadas ganadoras en fichas son perdedoras en dinero.',
      },
      {
        type: 'table',
        headers: ['Decisión', 'Cash 100bb', 'MTT burbuja stack medio'],
        rows: [
          ['A-K sin ligar vs apuesta ¾', 'Paga o sube: equity + fold equity', 'Retira lo marginal: tu torneo vale más que el bote'],
          ['Top pair vs subida', 'Paga una calle y reevalúa', 'Fold sin nuts: no te stackees por un par'],
          ['Proyecto 8 outs', 'Semibluff rentable IP', 'Solo con fold equity real o precio ICM'],
        ],
      },
      {
        type: 'callout',
        tone: 'key',
        title: 'Una frase para recordarlo',
        text: 'Cash: maximiza fichas. Torneo: maximiza dinero de torneo. Si solo miras el bote, juegas cash en una mesa de torneo.',
      },
      {
        type: 'spot',
        hole: 'As Ks',
        board: 'Kh 9d 4c',
        question: 'Tienes top pair top kicker. En cash 100bb apuestas pequeño y pagas una subida. ¿En burbuja como stack mediano?',
        answer:
          'Check/call con control o fold ante agresión del líder. Tu mano es fuerte en fichas pero tu torneo no puede pagar varianza marginal a una ciega de entrar en premios.',
      },
    ],
  },
  {
    id: 'a-spin-fundamentos',
    slug: 'spin-fundamentos-push-fold',
    title: 'Spin: el juego de 25 ciegas',
    excerpt: 'Sin juego profundo: shove, min-raise selectivo y heads-up. Lo esencial para no regalar los primeros niveles.',
    category: 'spin',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-09-02',
    readMinutes: 6,
    tags: ['spin', 'push-fold', 'heads-up', 'formatos'],
    blocks: [
      {
        type: 'paragraph',
        text: 'El Spin empieza con 25 ciegas y niveles turbo: no hay tiempo para esperar premiums. Con 12bb o menos, botón y ciega pequeña juegan push/fold; con 12-20bb, min-raise selectivo o shove según el rival. La mitad de los Spin acaban en heads-up: abre 60-70% de botones y defiende sin pagar shoves marginales.',
      },
      {
        type: 'list',
        items: [
          'El multiplicador no cambia los rangos: x2 o x100 se juegan igual.',
          'Con 14bb, K-T suited en botón es shove contra ciegas normales, no min-raise para jugar SPR 2 fuera de posición.',
          'En heads-up, cada botón sin abrir es un robo que regalas.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Bankroll de Spin',
        text: 'El formato turbo tiene varianza de MTT: juega con 100 buy-ins mínimo, no con 30 como en cash. Rachas de 20 torneos sin premio son normales.',
      },
    ],
  },
  {
    id: 'a-revision',
    slug: 'como-revisar-tus-manos',
    title: 'Cómo revisar tus manos sin engañarte',
    excerpt: 'Separar la decisión del resultado es más difícil de lo que parece, y es todo el trabajo.',
    category: 'mentalidad',
    level: 'intermediate',
    author: 'Equipo Poker Academy',
    publishedAt: '2026-08-11',
    readMinutes: 7,
    tags: ['revisión', 'método', 'mejora'],
    blocks: [
      {
        type: 'paragraph',
        text: 'El sesgo de resultado es el enemigo de la revisión: tendemos a juzgar la decisión por cómo acabó la mano. Pero una buena decisión pierde muchas veces y una mala gana muchas otras.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Revisa la mano tapando el resultado. Decide qué harías con la información que tenías entonces.',
          'Pregunta por el rango del rival, no por sus cartas concretas.',
          'Busca patrones entre manos distintas, no explicaciones para una sola.',
          'Anota una corrección concreta y medible para la siguiente sesión.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Tu historial es reproducible',
        text: 'Cada mano que juegas en la mesa de práctica guarda su semilla. Puedes volver a ella con las mismas cartas y probar una línea distinta: es la forma más directa de comprobar una hipótesis.',
      },
    ],
  },
]

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find(article => article.slug === slug)
}
