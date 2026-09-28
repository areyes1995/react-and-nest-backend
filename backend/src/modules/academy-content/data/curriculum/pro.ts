// ──────────────────────────────────────────────
// Datos semilla — Nivel 4 — Profesional. 3-bet/4-bet/5-bet a fondo, SB vs BB, teoría de juego y el oficio.
// Los carga `prisma/seeders/academy-curriculum.seeder.ts`.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';

export const PRO_LEVEL: LevelSeed = {
  id: 'pro',
  title: 'Profesional',
  subtitle: 'El oficio',
  description:
    'Teoría de juego, explotación consciente, bankroll y mentalidad. Lo que sostiene una carrera, no una sesión.',
  color: 'var(--level-pro)',
  icon: 'Crown',
  courses: [
    {
      id: 'c-reraises',
      slug: 'tres-bet-cuatro-bet-cinco-bet',
      title: '3-bet, 4-bet y 5-bet a fondo',
      summary:
        'Estructuras de rango, squeeze y la escalera de resubidas hasta el all-in preflop.',
      level: 'pro',
      icon: 'ChevronsUp',
      outcomes: [
        'Elegir entre un 3-bet polarizado, lineal o depolarizado',
        'Construir un rango de 4-bet con valor y faroles',
        'Defenderte de un 4-bet sin sobrepagar',
        'Decidir un all-in preflop con matemáticas, no con miedo',
      ],
      lessons: [
        {
          id: 'l-rr-structures',
          slug: 'estructuras-de-3bet',
          title: '3-bet: rangos y estructuras',
          summary:
            'Polarizado, lineal y depolarizado: la forma del rango depende de si puedes pagar.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Dos jugadores pueden resubir el mismo 10% de manos y tener rangos completamente distintos. Lo que cambia es la **estructura**: qué parte de tus manos resube, cuál paga y cuál se retira. Hay tres estructuras, y cada una responde a una situación concreta.',
            },
            {
              type: 'table',
              headers: ['Estructura', 'Qué contiene', 'Cuándo se usa'],
              rows: [
                [
                  'Polarizado',
                  'Lo mejor (valor) y manos de farol con bloqueadores; lo intermedio paga',
                  'Cuando tienes un rango de call: BB contra BTN, BTN contra CO',
                ],
                [
                  'Lineal (merged)',
                  'Las mejores N manos, de arriba abajo, sin huecos',
                  'Cuando no hay call (SB) o contra rivales que pagan demasiado 3-bets',
                ],
                [
                  'Depolarizado (condensado)',
                  'Manos medias-fuertes; los extremos se van a otra acción',
                  'Cuando proteges tu rango de call con monstruos o el rival casi nunca hace 4-bet',
                ],
              ],
            },
            {
              type: 'heading',
              text: 'Polarizado: valor + faroles',
            },
            {
              type: 'paragraph',
              text: 'La BB contra el botón es el ejemplo clásico. Hace 3-bet con 99+, ATs+, KJs+, AJo+, KQo, A5s-A2s, K8s, Q9s, J9s, T8s, 65s. Las manos intermedias (KJo, QTs, 77) pagan: son demasiado buenas para retirarse y no ganan nada resubiendo. Los faroles se eligen por bloqueadores y jugabilidad, no por fuerza.',
            },
            {
              type: 'heading',
              text: 'Lineal: de arriba abajo',
            },
            {
              type: 'paragraph',
              text: 'Desde la SB no hay rango de pago, así que todo lo que continúa resube: contra el botón, 88+, A9s+, KTs+, QJs, JTs, AJo+, KQo, A5s-A2s, K9s, 76s, 65s. También es la estructura correcta contra un rival que paga casi todos los 3-bets: los faroles pierden sentido y manos como AJo, KQo o 99 pasan a ser valor.',
            },
            {
              type: 'heading',
              text: 'Depolarizado: el centro del rango',
            },
            {
              type: 'paragraph',
              text: 'Si pagas algunos AA y KK para que tu rango de call no sea débil (una táctica útil contra jugadores que squeezean mucho), tu 3-bet se queda sin el tope y sin faroles puros: TT-JJ, AQ, AJs, KQs. Es un rango que gana contra lo que paga el rival, pero que sufre mucho frente a un 4-bet. Solo se sostiene contra rivales que hacen 4-bet muy poco.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La pregunta que decide la estructura',
              text: '¿Tengo un rango de call en este spot? Si sí, polariza: lo intermedio ya tiene sitio. Si no, ve lineal: todo lo que continúa tiene que resubir. El depolarizado es una excepción que se elige contra un rival concreto, no un punto de partida.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Estás en la SB y el CO abre. ¿Qué estructura de 3-bet es la natural?',
                  options: ['Polarizada', 'Lineal', 'Depolarizada', 'Da igual'],
                  answerIndex: 1,
                  explanation:
                    'Desde la SB no se paga, así que no hay rango de call que recoja las manos intermedias: todo lo que continúa resube, de arriba abajo.',
                },
                {
                  id: 'q2',
                  question:
                    'El rival paga el 80% de tus 3-bets y nunca hace 4-bet de farol. ¿Cómo ajustas?',
                  options: [
                    'Más faroles',
                    'Rango más lineal: más manos de valor medio, menos faroles',
                    'Dejar de hacer 3-bet',
                    'Solo 3-bet con AA',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Un rival que paga demasiado convierte en valor manos como AJo o KQo, y hace que los faroles pierdan dinero. Contra él, el rango se vuelve lineal.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rr-squeeze',
          slug: 'el-squeeze',
          title: 'El squeeze',
          summary:
            'El 3-bet contra un open y uno o más pagadores: la presión de tener a dos rivales atrapados.',
          kind: 'lesson',
          minutes: 9,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un squeeze es un 3-bet cuando alguien ha abierto y otro jugador ha pagado. Funciona porque el pagador casi nunca tiene una mano fuerte (con ellas habría resubido) y el que abrió tiene que decidir sabiendo que aún queda un rival detrás.',
            },
            {
              type: 'table',
              headers: ['Aspecto', 'Referencia'],
              rows: [
                [
                  'Tamaño en posición',
                  '3 veces el open + 1 open por cada pagador',
                ],
                [
                  'Tamaño desde las ciegas',
                  '4 veces el open + 1 open por cada pagador',
                ],
                [
                  'Valor',
                  'Un poco más estrecho que un 3-bet normal: hay dos rangos por superar',
                ],
                [
                  'Faroles',
                  'Suited con bloqueadores (A5s-A2s, KTs, QTs); nunca offsuit dominados',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El pagador está limitado',
              text: 'El cold call de un buen jugador casi nunca contiene AA, KK o AK. Su rango está "capado": puede tener manos buenas, pero no las mejores. Eso hace que el squeeze funcione más a menudo que un 3-bet heads-up.',
            },
            {
              type: 'spot',
              hole: 'As 4s',
              question:
                'El CO abre a 2,5, el botón paga y estás en la BB con A4s. ¿Qué haces?',
              answer:
                'Squeeze a unas 13 ciegas (4 × 2,5 + 2,5). A4s bloquea los ases de ambos rivales, tiene equity cuando te pagan y el pagador del botón rara vez puede continuar. Pagar te pondría fuera de posición en un bote de tres.',
            },
          ],
        },
        {
          id: 'l-rr-4bet',
          slug: 'cuatro-bet',
          title: '4-bet: valor, farol y defensa',
          summary:
            'Cuándo volver a subir, con qué faroles y cómo no regalar el stack frente a un 4-bet.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'El 4-bet es la respuesta más fuerte a un 3-bet que no es el all-in. A 100 ciegas lleva el bote a unas 22-25 ciegas: a partir de ahí, casi todo lo que no se retira acaba con las fichas dentro.',
            },
            {
              type: 'table',
              headers: ['Parte del rango', 'Manos de referencia', 'Por qué'],
              rows: [
                [
                  '4-bet por valor',
                  'QQ+, AKs, AKo',
                  'Quieren el all-in; contra 3-bets muy anchos se añaden JJ y AQs',
                ],
                [
                  '4-bet de farol',
                  'A5s-A4s',
                  'El as bloquea AA y AK; si te pagan tienes ~30% de equity',
                ],
                [
                  'Pagar el 3-bet en posición',
                  '77-JJ, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo',
                  'Juegan bien postflop y no quieren enfrentarse a un 5-bet',
                ],
                [
                  'Pagar fuera de posición',
                  'TT-JJ, AQs-AJs, KQs',
                  'Fuera de posición el rango de pago se estrecha muchísimo',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Por qué A5s y no AJo como farol',
              text: 'A5s bloquea los ases, hace escalera y color, y cuando te va all-in te retiras sin dolor. AJo está dominada por todo lo que continúa y no gana nada al retirarse. El farol ideal es una mano que no quieres pagar y que bloquea lo que te paga.',
            },
            {
              type: 'range',
              id: 'four-bet',
            },
            {
              type: 'heading',
              text: 'Defensa contra un 4-bet',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Retírate con la mayor parte del rango de 3-bet: tus faroles ya cumplieron su función.',
                '5-bet all-in con el tope: QQ+, AKs, AKo.',
                'Paga solo con manos que aguantan un all-in posterior o juegan bien en botes grandes: JJ, AQs.',
                'Ajusta al rival: contra quien solo hace 4-bet con AA-KK, incluso QQ y AK se pueden retirar.',
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El error más caro del preflop',
              text: 'Pagar un 4-bet con manos como AQo o 99 "para ver el flop". Te quedan 75 ciegas en un bote de 50: casi cualquier flop te obliga a jugar por todo con una mano que va detrás.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Abres desde el CO y la BB te hace 3-bet. Tienes A4s. ¿Qué haces?',
                  options: [
                    'Pagar',
                    '4-bet de farol',
                    'All-in',
                    'Retirarte siempre',
                  ],
                  answerIndex: 1,
                  explanation:
                    'A4s es el 4-bet de farol de manual: bloquea AA y AK, y si te pagan tiene equity. No entra en el rango de pago, ni siquiera en posición, y es demasiado débil para ir all-in directamente.',
                },
                {
                  id: 'q2',
                  question:
                    'Hiciste 3-bet con KQs y el rival te hace 4-bet. ¿Qué haces?',
                  options: ['5-bet all-in', 'Pagar', 'Retirarte', 'Min-raise'],
                  answerIndex: 2,
                  explanation:
                    'KQs está dominada por AK, KK y AA, que son el grueso del valor de un 4-bet. Retirarse es lo estándar: el 3-bet ya cumplió su función.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rr-5bet',
          slug: '5bet-y-all-in-preflop',
          title: '5-bet y all-in preflop',
          summary:
            'El final de la escalera: rangos de all-in y cómo pagarlo con matemáticas.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'A 100 ciegas el 5-bet es, en la práctica, el all-in. Ya no hay juego postflop que planificar: la decisión es puramente matemática. Equity de tu mano contra el rango del rival frente al precio que te dan.',
            },
            {
              type: 'table',
              headers: ['Enfrentamiento', 'Equity aproximada'],
              rows: [
                ['AA contra KK', '82% – 18%'],
                ['KK contra AKo', '70% – 30%'],
                ['QQ contra AKo', '57% – 43%'],
                ['JJ contra AKo', '57% – 43%'],
                ['A5s contra KK', '32% – 68%'],
              ],
            },
            {
              type: 'spot',
              hole: 'Qd Qc',
              question:
                'Hiciste 4-bet a 24 ciegas y el rival va all-in por 100. Su rango de 5-bet es KK+ y AK. ¿Pagas?',
              answer:
                'Sí. Pagas 76 para ganar un bote de 125,5 (sus 100, tus 24 y las ciegas): necesitas un 38% de equity. QQ gana el 18% contra AA y KK (12 combinaciones) y el 57% contra AK (16): en conjunto, alrededor del 40%. Es un pago correcto, aunque justo. Con JJ contra QQ+ y AK baja al 36%: fold.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Combinaciones, no manos',
              text: 'AK tiene 16 combinaciones; cada pareja, solo 6. Por eso los rangos de all-in con AK dentro son mucho más pagables de lo que parece: la mayor parte del rango rival es una mano que va a la par o por detrás de las parejas altas.',
            },
            {
              type: 'heading',
              text: 'La profundidad lo cambia todo',
            },
            {
              type: 'table',
              headers: ['Stack efectivo', 'Qué pasa con el 5-bet'],
              rows: [
                [
                  '40 ciegas o menos',
                  'El 3-bet ya suele ser all-in; el 4-bet y el 5-bet desaparecen',
                ],
                [
                  '100 ciegas',
                  'El 5-bet es all-in; el rango de referencia es QQ+, AKs, AKo',
                ],
                [
                  '200 ciegas o más',
                  'Todo se estrecha: incluso KK sufre contra un 5-bet y los faroles son raros',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'No es valentía, es aritmética',
              text: 'Retirar QQ contra un all-in no es de cobardes si el rival solo tiene AA-KK. Pagar JJ no es de valientes si las cuentas no salen. Haz el cálculo antes de sentarte: en la mesa no hay tiempo.',
            },
          ],
        },
        {
          id: 'l-rr-3bet-drill',
          slug: 'practica-3bet-y-cold-call',
          title: 'Práctica: estructuras de 3-bet',
          summary:
            'Frente a cada open, construye el 3-bet correcto para tu posición.',
          kind: 'drill',
          minutes: 20,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Mesa de 6 contra rivales avanzados. Desde la SB tu rango es lineal (3-bet o fold); desde CO y botón, polarizado con un rango de call. El corrector te dirá cuándo una mano de call se convirtió en un farol caro.',
            },
            {
              type: 'drill',
              mode: 'vs-open',
              seats: 6,
              goal: 'Responde a 40 opens con la estructura de 3-bet de cada posición',
              hands: 40,
            },
          ],
        },
        {
          id: 'l-rr-4bet-drill',
          slug: 'practica-4bet-y-5bet',
          title: 'Práctica: 4-bet, 5-bet y all-in',
          summary: 'Abre, recibe 3-bets y decide hasta el all-in.',
          kind: 'drill',
          minutes: 25,
          xp: 55,
          blocks: [
            {
              type: 'paragraph',
              text: 'Se evalúan las decisiones cuando te resuben después de haber subido: frente a un 3-bet, a un 4-bet o a un all-in. Los rivales avanzados resuben con frecuencia, así que abre tu rango normal y prepárate para defenderlo.',
            },
            {
              type: 'drill',
              mode: 'vs-3bet',
              seats: 6,
              goal: 'Juega 50 manos defendiendo tus opens y tus 3-bets',
              hands: 50,
            },
          ],
        },
      ],
    },
    {
      id: 'c-blind-vs-blind',
      slug: 'sb-vs-bb',
      title: 'SB vs BB',
      summary:
        'La guerra de ciegas: los rangos más anchos del juego y una posición al revés.',
      level: 'pro',
      icon: 'Target',
      outcomes: [
        'Entender por qué el blind vs blind no se parece a ningún otro spot',
        'Elegir entre subir o retirarse y una estrategia de limp desde la SB',
        'Defender la BB contra la SB y castigar su limp',
      ],
      lessons: [
        {
          id: 'l-bvb-why',
          slug: 'por-que-sb-vs-bb-es-distinto',
          title: 'Por qué SB vs BB es un mundo aparte',
          summary:
            'Rangos anchísimos, dinero muerto mínimo y una SB que juega todo fuera de posición.',
          kind: 'lesson',
          minutes: 10,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Cuando todos se retiran hasta la ciega pequeña, empieza una mano distinta a todas: dos jugadores, los rangos más anchos de la partida y una peculiaridad única. **El que abre juega fuera de posición**, y el que defiende ya tiene más fichas dentro que él.',
            },
            {
              type: 'table',
              headers: ['Rasgo', 'Consecuencia'],
              rows: [
                [
                  'Solo queda un rival',
                  'La SB abre cerca del 39% de las manos',
                ],
                [
                  'La BB ya tiene 1 ciega dentro',
                  'Contra un open de 3 ciegas necesita solo un 33% de equity',
                ],
                [
                  'La BB juega en posición',
                  'Defiende más que contra nadie: alrededor del 58%',
                ],
                [
                  'Solo hay 1,5 ciegas en el bote',
                  'Robar no es tan rentable como parece: la SB arriesga mucho por poco',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Por eso merece un capítulo propio',
              text: 'Todo lo que has aprendido sobre posición aquí se invierte: el agresor preflop está en desventaja postflop. Los rangos son tan anchos que casi cualquier par o proyecto tiene valor, y los errores que en otros spots son pequeños aquí se repiten cada vuelta.',
            },
            {
              type: 'heading',
              text: 'Dos estrategias para la SB',
            },
            {
              type: 'table',
              headers: ['Estrategia', 'Cómo es', 'Para quién'],
              rows: [
                [
                  'Subir o retirarse',
                  'Open a 3 ciegas con ~40% de las manos; el resto, fold',
                  'Simple y difícil de explotar: el punto de partida',
                ],
                [
                  'Limp mixto',
                  'Se completa con muchas manos jugables y se sube el valor y algunos faroles',
                  'Más rentable en teoría, pero exige saber jugar botes limpados fuera de posición',
                ],
              ],
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'La SB abre a 3 ciegas. ¿Qué equity necesita la BB para pagar?',
                  options: ['22%', '27%', '33%', '50%'],
                  answerIndex: 2,
                  explanation:
                    'La BB paga 2 para un bote final de 6 (3 de la SB, 1 que ya tenía y los 2 que añade): 2 ÷ 6 = 33%.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-bvb-sb',
          slug: 'la-estrategia-de-la-ciega-pequena',
          title: 'Jugar desde la ciega pequeña',
          summary:
            'Qué abrir, cuándo completar y cómo sobrevivir fuera de posición.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'La estrategia base de este curso es subir o retirarse con el rango de open de la SB: 22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o. Se sube a 3 ciegas: fuera de posición conviene dar peor precio y que más manos se resuelvan preflop.',
            },
            {
              type: 'heading',
              text: 'La estrategia de limp',
            },
            {
              type: 'paragraph',
              text: 'Los jugadores más avanzados completan la ciega con un rango ancho de manos jugables que no quieren un bote grande: offsuit con carta alta (K2o, Q5o, J7o) y suited débiles. Funciona porque la BB no puede subir todo, y ver flops baratos con un rango amplio es rentable. El coste: jugar muchos botes fuera de posición.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El limp necesita un plan',
              text: 'Si completas, decide antes qué haces cuando la BB sube: retira lo peor, paga las manos que juegan y sube de nuevo (limp-raise) con tus trampas. Un limp sin plan frente a la subida es regalar la ciega entera.',
            },
            {
              type: 'heading',
              text: 'Postflop fuera de posición',
            },
            {
              type: 'list',
              items: [
                'En boards altos (A, K, Q) tu rango tiene más cartas altas que el de la BB: c-bet pequeña y frecuente.',
                'En boards bajos y conectados, la BB tiene más dobles parejas y escaleras: pasa más.',
                'No te empeñes en ganar todos los botes: la SB pierde dinero en conjunto, el objetivo es perder lo menos posible.',
              ],
            },
            {
              type: 'spot',
              hole: 'Qs 6d',
              question:
                'Todos se retiran hasta tu SB con Q6o. La BB defiende mucho. ¿Qué haces?',
              answer:
                'En una estrategia de subir o retirarse, fold: Q6o está justo por debajo del rango (Q9o+). En una estrategia de limp, completar es razonable: la mano juega algo contra un rango ancho, pero no quiere un bote grande fuera de posición.',
            },
          ],
        },
        {
          id: 'l-bvb-bb',
          slug: 'defender-la-bb-contra-la-sb',
          title: 'Defender la BB contra la SB',
          summary: 'Defensa ancha, 3-bet en posición y castigar el limp.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Contra la SB, la BB tiene el mejor spot de su vida: un solo rival con un rango ancho y posición durante toda la mano. Aquí se defiende más que contra nadie.',
            },
            {
              type: 'table',
              headers: ['Situación', 'Referencia'],
              rows: [
                ['Defensa total contra open de la SB', '58%'],
                [
                  '3-bet contra la SB',
                  '88+, A8s+, KTs+, QJs, ATo+, KJo+, A5s-A2s, K5s, Q8s, J8s, 64s',
                ],
                [
                  'Subir contra el limp de la SB',
                  '66+, A7s+, K9s+, QTs+, JTs, A9o+, KTo+, QJo, A5s-A2s, K6s, Q8s, J8s, T8s, 97s, 86s, 75s, 64s',
                ],
                ['Nunca pasar tras el limp con', '88+, ATs+, KJs+, AJo+, KQo'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El limp de la SB es una invitación',
              text: 'Si la SB completa, su rango casi nunca tiene manos fuertes: las habría subido. Sube a 3-4 ciegas con el valor y con manos que juegan bien en posición. Con el resto, pasa y ve el flop gratis: nunca te retires si puedes pasar.',
            },
            {
              type: 'heading',
              text: 'Postflop en posición',
            },
            {
              type: 'list',
              items: [
                'Cuando la SB pasa en el flop, apuesta a menudo: su rango está lleno de manos que no ligaron.',
                'En boards bajos y conectados tienes ventaja de rango: presiona.',
                'En boards de as o rey la ventaja es de la SB: paga sus c-bets pequeñas con frecuencia, pero no las subas sin mano.',
              ],
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'La SB completa y estás en la BB con AJo. ¿Qué haces?',
                  options: [
                    'Pasar',
                    'Subir a 3-4 ciegas',
                    'All-in',
                    'Retirarte',
                  ],
                  answerIndex: 1,
                  explanation:
                    'AJo está en el rango de valor contra un limp: la SB tiene un rango débil que pagará con manos peores. Pasar le deja ver el flop gratis con una mano que te paga.',
                },
                {
                  id: 'q2',
                  question: 'La SB completa y tienes 72o. ¿Qué haces?',
                  options: ['Retirarte', 'Pasar', 'Subir de farol', 'All-in'],
                  answerIndex: 1,
                  explanation:
                    'Pasar es gratis: nunca se retira una mano cuando no hay que pagar nada. Y 72o no tiene ni valor ni jugabilidad para subir.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-bvb-drill',
          slug: 'practica-sb-vs-bb',
          title: 'Práctica: la guerra de ciegas',
          summary:
            'Mesa de 3 donde el botón se retira a menudo y las ciegas se enfrentan.',
          kind: 'drill',
          minutes: 22,
          xp: 55,
          blocks: [
            {
              type: 'paragraph',
              text: 'En mesa de 3 jugadores las situaciones de ciega contra ciega llegan constantemente. Se evalúa el open desde la SB cuando el botón se retira, la defensa de la BB contra la SB y la respuesta de la BB a un limp.',
            },
            {
              type: 'drill',
              mode: 'blind-vs-blind',
              seats: 3,
              goal: 'Juega 40 manos de ciega contra ciega',
              hands: 40,
            },
          ],
        },
      ],
    },
    {
      id: 'c-gto',
      slug: 'fundamentos-gto',
      title: 'Fundamentos de teoría de juego',
      summary:
        'Qué significa realmente jugar equilibrado y cuándo vale la pena.',
      level: 'pro',
      icon: 'Scale',
      outcomes: [
        'Entender el equilibrio y sus frecuencias',
        'Aplicar la defensa mínima (MDF)',
        'Saber cuándo alejarse del equilibrio a propósito',
      ],
      lessons: [
        {
          id: 'l-gto-balance',
          slug: 'equilibrio-y-frecuencias',
          title: 'Equilibrio y frecuencias',
          summary:
            'Una estrategia equilibrada no se puede explotar, aunque el rival la conozca.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Jugar en equilibrio significa mezclar valor y faroles en proporciones tales que al rival le da igual pagar o retirarse: ninguna de las dos decisiones le hace ganar dinero contra ti. No es la estrategia que más gana; es la que menos puede perder.',
            },
            {
              type: 'table',
              headers: [
                'Tamaño de apuesta',
                'Faroles por cada mano de valor',
                'Proporción',
              ],
              rows: [
                ['½ bote', '0,33', '3 valor : 1 farol'],
                ['¾ bote', '0,43', '7 valor : 3 faroles'],
                ['Bote', '0,50', '2 valor : 1 farol'],
                ['2× bote', '0,67', '3 valor : 2 faroles'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La lectura correcta',
              text: 'Cuanto más grande apuestas, más faroles puedes permitirte, porque le estás ofreciendo peores odds al rival. Esa es la razón matemática por la que los rangos polarizados usan tamaños grandes.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El equilibrio no es el objetivo',
              text: 'Contra rivales que cometen errores sistemáticos, jugar equilibrado deja dinero sobre la mesa. El equilibrio es tu punto de partida y tu refugio, no tu meta.',
            },
          ],
        },
        {
          id: 'l-gto-mdf',
          slug: 'defensa-minima',
          title: 'Defensa mínima (MDF)',
          summary:
            'Cuánto de tu rango tienes que defender para que el farol del rival no sea gratis.',
          kind: 'lesson',
          minutes: 13,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Si te retiras demasiado a menudo, cualquier rival puede apostar con todas sus manos y ganar sin enseñar cartas. La MDF es el porcentaje mínimo de tu rango que debes seguir jugando para impedirlo.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La fórmula',
              text: 'MDF = bote ÷ (bote + apuesta). Frente a una apuesta del tamaño del bote, debes defender el 50% de tu rango. Frente a media apuesta, el 67%.',
            },
            {
              type: 'table',
              headers: ['Apuesta del rival', 'MDF', 'Te puedes retirar con'],
              rows: [
                ['⅓ del bote', '75%', '25% de tu rango'],
                ['½ del bote', '67%', '33%'],
                ['¾ del bote', '57%', '43%'],
                ['Bote completo', '50%', '50%'],
              ],
            },
            {
              type: 'heading',
              text: 'MDF no es una regla automática',
            },
            {
              type: 'paragraph',
              text: 'La MDF es herramienta teórica, no orden. La defensa real combina: pot odds que te dan, tu equity real contra su rango, ventaja de rango y de nuts, blockers y distribución de combos. Un rival que nunca farolea river te permite retirarte muy por debajo de MDF sin ser explotado.',
            },
            {
              type: 'table',
              headers: ['Herramienta', 'Pregunta que responde', 'Ejemplo'],
              rows: [
                ['Pot odds', '¿Qué equity mínima necesito para pagar?', 'Bote 100 + apuesta 50 → 25%'],
                ['MDF', '¿Cuánto debo defender para que su farol no sea gratis?', 'Vs 50% bote → 67%'],
                ['Equity real', '¿Cuánta tengo vs su rango de value+bluff?', 'AQ vs sets+draws fallidos: 31% real'],
                ['Range/nut advantage', '¿Quién llega con más nuts aquí?', 'Si él tiene ventaja, tu MDF baja'],
                ['Blockers + combos', '¿Cuántos combos de bluffs le quedan?', 'Si bloqueas sus nuts, tu call sube valor'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'La lectura profesional de MDF',
              text: 'No memorices "vs 75% defiendo X%". Usa MDF como espejo: si te retiras más que MDF durante 1000 manos, algún rival ya puede farolearte con cualquier carta y ganar. Si pagas más que MDF contra quien no farolea, financias su value.',
            },
          ],
        },
        {
          id: 'l-gto-math',
          slug: 'ev-pot-odds-implied-y-rake',
          title: 'EV, pot odds, implied y rake',
          summary:
            'Pot odds vs equity vs implied vs reverse implied: el cálculo completo y cómo el rake rompe empates.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Las pot odds miran el bote actual. Las implied añaden lo que cobrarás si ligas. Las reverse implied lo que perderás si ligas segunda mejor. El EV suma las tres, y el rake (comisión) desplaza el umbral de rentabilidad.',
            },
            {
              type: 'table',
              headers: ['Concepto', 'Fórmula', 'Cuándo manda'],
              rows: [
                ['Pot odds', 'Lo que pagas / bote final si pagas', 'Decisión inmediata: ¿tengo precio?'],
                ['Equity', 'Outs ×2 por carta; ×4 solo si ves dos cartas sin más apuestas', 'Probabilidad de mejorar'],
                ['Implied odds', 'Pot odds + fichas futuras que cobrarás', 'Proyectos disimulados (escalera) vs rival que paga'],
                ['Reverse implied', 'Lo que pierdes cuando ligas y aún vas detrás', 'Draw al color bajo vs posible color superior'],
                ['Break-even %', 'Riesgo / (riesgo+recompensa)', 'Farol: ¿cuánto debe retirarse para ser rentable?'],
                ['Fold equity', 'Prob. rival se retire × bote', 'Semibluff: tu apuesta gana también sin ligar'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El rake importa',
              text: 'Una mano marginalmente rentable sin rake (ej. call con 26% equity necesitando 25%) pasa a ser fold con rake 5% cap 3. En micros y zoom, el rake convierte muchos calls de "precio justo" en perdedores. Ajusta tu defensa 2-3% más estricta en rake alto.',
            },
            {
              type: 'spot',
              hole: '7s 6h',
              board: '9c 8d 2s',
              question: 'Tienes escalera abierta (8 outs) y te apuestan 50 en bote 100 (necesitas 25%). ¿Pagas?',
              answer:
                'Cuidado con el 32% de la regla del 4: es hasta el river y solo lo cobras si no hay más apuestas. Pagando esta apuesta ves una carta: 8/47 ≈ 17%, por debajo del 25%. El call depende de las odds implícitas. En posición y contra un rival que paga cuando ligas, es call. Fuera de posición, con rake alto y con el extremo bajo del proyecto (si sale el 10, Q-J y J-7 tienen una escalera mayor: odds implícitas inversas), se vuelve marginal o fold.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Necesitas 25% para pagar y estimas que realizarás un 26% de equity. Juegas micros con rake alto y fuera de posición. ¿Qué haces?',
                  options: ['Pagas: 26% es más que 25%', 'Foldeas: el rake y la posición se comen ese margen', 'Vas all-in', 'Da igual'],
                  answerIndex: 1,
                  explanation:
                    'Con un margen del 1%, el rake (el bote que cobras es menor) y la peor realización fuera de posición convierten el call en perdedor. Pide 2-3% extra de margen en rake alto. Ojo: esto es para calls marginales; un proyecto fuerte como el color al as tiene mucho más margen y sigue siendo call.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'c-exploit',
      slug: 'juego-explotador',
      title: 'Juego explotador',
      summary:
        'Detectar la fuga del rival y desviarte del equilibrio a propósito.',
      level: 'pro',
      icon: 'Crosshair',
      outcomes: [
        'Identificar desviaciones medibles en el rival',
        'Elegir el contraataque de máximo valor',
        'Volver al equilibrio cuando te contraatacan',
      ],
      lessons: [
        {
          id: 'l-exp-detect',
          slug: 'detectar-desviaciones',
          title: 'Detectar desviaciones',
          summary: 'Las cuatro fugas que aparecen en casi cualquier mesa.',
          kind: 'lesson',
          minutes: 10,
          xp: 45,
          blocks: [
            {
              type: 'table',
              headers: ['Fuga del rival', 'Cómo se detecta', 'Explotación'],
              rows: [
                [
                  'Se retira demasiado',
                  'Abandona ante casi cualquier apuesta',
                  'Farolea mucho más de lo equilibrado',
                ],
                [
                  'Paga demasiado',
                  'Llega al showdown con manos débiles',
                  'Elimina faroles, apuesta fino por valor',
                ],
                [
                  'Nunca farolea en el river',
                  'Sus apuestas de river siempre son valor',
                  'Retírate con todo tu rango mediano',
                ],
                [
                  'C-betea el 100%',
                  'Apuesta todos los flops',
                  'Sube con proyectos y manos medianas',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El coste de explotar',
              text: 'Toda explotación te desequilibra y te hace explotable a ti. Contra un rival que no se da cuenta, es dinero gratis. Contra uno que sí, es una trampa. Por eso la explotación exige vigilar la reacción.',
            },
          ],
        },
        {
          id: 'l-exp-drill',
          slug: 'practica-explotadora',
          title: 'Práctica: explotar a la mesa',
          summary:
            'Mesa con perfiles extremos donde cada ajuste se nota en fichas.',
          kind: 'drill',
          minutes: 25,
          xp: 55,
          blocks: [
            {
              type: 'paragraph',
              text: 'Mesa con maniacos y calling stations mezclados. Tu tarea: identificar en las primeras manos quién es quién y aplicar el ajuste extremo contra cada uno, no una estrategia media para todos.',
            },
            {
              type: 'drill',
              mode: 'bluff-catch',
              seats: 9,
              goal: 'Juega 40 manos explotando la fuga de cada rival',
              hands: 40,
            },
          ],
        },
      ],
    },
    {
      id: 'c-craft',
      slug: 'bankroll-y-mentalidad',
      title: 'Bankroll y mentalidad',
      summary:
        'La parte del juego que decide si sigues jugando dentro de un año.',
      level: 'pro',
      icon: 'Brain',
      outcomes: [
        'Elegir límites que tu bankroll aguante',
        'Reconocer y cortar el tilt',
        'Revisar sesiones con un método repetible',
      ],
      lessons: [
        {
          id: 'l-craft-bankroll',
          slug: 'gestion-de-bankroll',
          title: 'Gestión de bankroll',
          summary: 'La varianza no se elimina: se financia.',
          kind: 'lesson',
          minutes: 9,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Incluso jugando perfecto vas a tener rachas perdedoras largas. El bankroll es lo que te permite seguir jugando durante esas rachas sin tomar malas decisiones por miedo.',
            },
            {
              type: 'table',
              headers: ['Formato', 'Bankroll mínimo', 'Bankroll cómodo'],
              rows: [
                ['Cash 6-max', '30 buy-ins', '50 buy-ins'],
                ['Cash mesa completa', '25 buy-ins', '40 buy-ins'],
                ['Torneos multimesa', '150 buy-ins', '300+ buy-ins (campos grandes)'],
                ['Sit & go', '50 buy-ins', '80 buy-ins'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'La regla que nadie cumple',
              text: 'Subir de límite tras una buena racha y no bajar tras una mala es cómo desaparecen la mayoría de los bankrolls. Las reglas de subida y bajada se escriben antes de jugar, no durante.',
            },
          ],
        },
        {
          id: 'l-craft-tilt',
          slug: 'tilt-y-rutinas',
          title: 'Tilt y rutinas',
          summary:
            'Reconocer el estado en el que tus decisiones dejan de ser tuyas.',
          kind: 'lesson',
          minutes: 8,
          xp: 40,
          blocks: [
            {
              type: 'list',
              items: [
                'Señales tempranas: jugar manos que normalmente retirarías, subir de límite, jugar más mesas de las habituales.',
                'Regla de parada: define de antemano cuántos buy-ins perdidos cierran la sesión.',
                'Rutina previa: mismo entorno, mismo tiempo, sin distracciones. Reduce decisiones automáticas.',
                'Después de una mala racha, revisa manos antes de volver a jugar. Separa el error de la varianza.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El tilt no es enfado',
              text: 'La mayoría del tilt no se siente como rabia, sino como prisa. Si estás decidiendo más rápido de lo normal, ya estás en tilt.',
            },
          ],
        },
        {
          id: 'l-craft-review',
          slug: 'revision-de-sesiones',
          title: 'Revisión de sesiones',
          summary:
            'Un método de cuatro pasos para que cada sesión te enseñe algo.',
          kind: 'lesson',
          minutes: 9,
          xp: 40,
          blocks: [
            {
              type: 'list',
              ordered: true,
              items: [
                'Marca durante la sesión las manos que te generaron duda. No las resuelvas en el momento.',
                'Al terminar, revísalas en frío separando decisión de resultado: una buena decisión puede perder.',
                'Busca el patrón: tres manos distintas con el mismo error valen más que treinta manos sueltas.',
                'Escribe una sola corrección para la próxima sesión. Una, no cinco.',
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Usa tu historial',
              text: 'En "Historial de manos" tienes cada mano que has jugado con su semilla, tus cartas, el board y el resultado. Es tu material de revisión y es reproducible.',
            },
          ],
        },
        {
          id: 'l-craft-mental-avanzado',
          slug: 'mental-avanzado',
          title: 'Mental avanzado: del tilt al A-game',
          summary: 'Tilt por pérdidas, bad beats, revenge, entitlement, miedo y fatiga: cada uno pide un antídoto distinto.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'El tilt rara vez es "enfado visible". Más a menudo es prisa, entitlement ("merezco ganar") o miedo a perder. Cada tipo tiene señales y antídoto distintos, y se entrena como la técnica.',
            },
            {
              type: 'table',
              headers: ['Tipo de tilt', 'Señal', 'Antídoto'],
              rows: [
                ['Tilt por pérdidas', 'Subes de límite tras perder', 'Regla de parada: X buy-ins → cierras'],
                ['Bad beat tilt', 'Juegas manos marginales "para recuperar"', 'Pausa 15 min + revisa si la decisión fue correcta'],
                ['Revenge poker', 'Vas contra un rival concreto', 'Cambia de mesa: no es personal'],
                ['Entitlement tilt', '"Con lo bien que juego debería ir ganando"', 'Revisa varianza: winrate no se ve en 5k manos'],
                ['Miedo / nit tilt', 'Pasas manos rentables', 'Baja de límite hasta recuperar agresión'],
                ['Autopilot / fatiga', 'Decides en <3s sin pensar', 'Menos mesas, rutina previa, A/B/C-game check'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'A/B/C-game',
              text: 'A-game: tu mejor poker. B-game: jugable pero con fugas. C-game: peligroso (cansado, emocional). Reconocer en qué juego estás es más rentable que cualquier ajuste técnico. Si estás en C, cierra.',
            },
            {
              type: 'list',
              items: [
                'Fatiga mental: cada decisión consume. Menos mesas + descansos = mejor EV/hora.',
                'Decision fatigue: rutinas reducen decisiones automáticas y preservan energía para las importantes.',
                'Escribe tu regla de parada antes de jugar, no durante.',
              ],
            },
          ],
        },
        {
          id: 'l-craft-hand-review',
          slug: 'como-revisar-una-mano',
          title: 'Cómo revisar una mano: metodología',
          summary: 'Nueve preguntas para que cada mano te enseñe, no solo la que perdiste.',
          kind: 'lesson',
          minutes: 13,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Revisar manos es el multiplicador de estudio. Sin método, revisas resultados. Con método, revisas decisiones. Usa esta checklist en cada mano marcada:',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '¿Cuál era mi rango y cuál el del rival en esa línea?',
                '¿Qué ventaja tenía (rango / nuts / posición / SPR)?',
                '¿Qué tamaños tenía disponibles y qué comunica cada uno?',
                '¿Qué combos llegan así al river (valor vs farol)?',
                '¿Qué cambia en cada street (carta que cambia nuts, blockers)?',
                '¿Cuál era mi objetivo (valor fino, polarizar, bluff, control)?',
                '¿Qué información tenía y cuál me faltaba?',
                '¿Cuál era mi alternativa y su EV estimado?',
                '¿Fue error técnico o varianza (buena decisión que perdió)?',
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'La clase más importante',
              text: 'Tres manos con el mismo error valen más que treinta manos sueltas. Busca el patrón, escribe una sola corrección para la próxima sesión y mide si desaparece.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-winrate',
      slug: 'winrate-varianza-y-bb100',
      title: 'Winrate, bb/100 y varianza',
      summary: 'Lo que miden los profesionales: BB/100, EV bb/100, desviación y sample para no confundir resultado con calidad.',
      level: 'pro',
      icon: 'Activity',
      outcomes: [
        'Distinguir resultado de una sesión y calidad de juego',
        'Interpretar BB/100, All-in EV y desviación estándar',
        'Dimensionar sample y downswings esperados',
      ],
      lessons: [
        {
          id: 'l-winrate-metricas',
          slug: 'metricas-de-resultados',
          title: 'BB/100, EV y varianza',
          summary: 'Winrate, All-in EV, desviación y por qué 50k manos aún es poco.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un jugador que gana 4 bb/100 puede perder 20 buy-ins por varianza. El resultado de una sesión no mide tu juego: lo miden EV bb/100 y la varianza en miles de manos.',
            },
            {
              type: 'table',
              headers: ['Métrica', 'Qué mide', 'Referencia'],
              rows: [
                ['BB/100', 'Ciegas grandes ganadas cada 100 manos', 'Por debajo de 0: pierdes; 2-4 sólido en micros; 6+ crushing'],
                ['EV bb/100', 'BB/100 ajustado a equity all-in', 'Mide decisiones, no cartas ligadas'],
                ['All-in EV diff', 'Diferencia entre resultado y equity', 'Si es negativo mucho tiempo, mala suerte, no mal juego'],
                ['Desviación estándar', 'Dispersión de resultados', '~80-100 bb/100 en 6-max; a más loose, mayor'],
                ['Downswing esperado', 'Caída por varianza pese a ser ganador', '20-30 buy-ins es normal incluso con edge'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Sample importa',
              text: 'Con una desviación típica de 90 bb/100, tras 10k manos tu winrate real puede estar a ±9 bb/100 del que ves (±18 con un 95% de confianza). Con 100k, ±3 (±6). Juzgar tu juego por una semana es ruido, por un mes es señal débil, por un trimestre es dato.',
            },
          ],
        },
        {
          id: 'l-winrate-stakes',
          slug: 'seleccion-de-stakes',
          title: 'Selección de stakes y shot taking',
          summary: 'Cuándo subir, cuándo bajar, bankroll requirements y riesgo de ruina.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Subir de límite no es premio: es cambio de trabajo con rivales más duros y varianza mayor. Baja sin ego cuando tu bankroll cae por debajo del umbral.',
            },
            {
              type: 'table',
              headers: ['Regla', 'Cash 6-max 100bb', 'MTT', 'Sit&Go'],
              rows: [
                ['Bankroll cómodo', '50 buy-ins', '300 buy-ins', '80 buy-ins'],
                ['Shot taking', 'Prueba 5 buy-ins en siguiente nivel', 'Satélites baratos', 'Mismo criterio'],
                ['Bajar obligatorio', 'Si caes a 30 buy-ins del nivel actual', 'Si caes a 150 buy-ins', 'Si caes a 50'],
                ['Riesgo de ruina', 'Con 2 bb/100 y desviación 90: 20 buy-ins → ~37%; 50 → ~8%', 'Alto incluso con 100 buy-ins: la varianza de los torneos es enorme', 'Intermedio'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Winrate honesta',
              text: 'Tu winrate no es la del mejor día: es EV bb/100 en 100k+ manos con rake incluido. Sin esa honestidad, cualquier shot es lotería.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-pool',
      slug: 'estudio-del-pool',
      title: 'Estudio del pool y population reads',
      summary: 'Las tendencias del pool: overfold, overcall, overbluff y cómo convertirlas en exploits.',
      level: 'pro',
      icon: 'BarChart3',
      outcomes: [
        'Leer datos del pool: frecuencias preflop y postflop',
        'Convertir population reads en ajustes explotadores',
        'Saber cuándo el pool te contraexplota',
      ],
      lessons: [
        {
          id: 'l-pool-reads',
          slug: 'lectura-del-pool',
          title: 'Tendencias del pool',
          summary: 'Estadísticas generales que casi siempre se repiten en micros/low stakes.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'table',
              headers: ['Tendencia pool', 'Cómo se detecta', 'Explotación'],
              rows: [
                ['Overfold vs c-bet flop', 'Fold >55% vs 33% bote', 'C-bet pequeña muy frecuente, incluso sin equity'],
                ['Overcall river', 'Paga river >60%', 'Value más fino y grande; elimina faroles'],
                ['Underbluff river', 'Apuesta river = valor 80%+', 'Overfold como bluff-catcher: retira tu rango medio'],
                ['Tamaños pequeños con nuts', 'Bote grande con 33% bote', 'Sube tu defensa vs grande: su pequeño no polariza'],
                ['Preflop: cold call ancho OOP', 'Call >12% vs open', '3-bet lineal más fino: su call deja equity muerta'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'De population read a exploit medible',
              text: 'No ajustes por una mano: ajusta por 500+ situaciones del pool. Tu HUD es tu laboratorio: si el pool foldea 70% a probe, tu probe any-two gana al instante.',
            },
          ],
        },
        {
          id: 'l-pool-mesa',
          slug: 'seleccion-de-mesa',
          title: 'Selección de mesa y asiento',
          summary: 'Dónde te sientas vale BB/100: fish a tu derecha, regs a tu izquierda.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'No todas las mesas valen lo mismo. Una mesa con un jugador recreacional que juega 50% de manos vale más que una llena de regulares tight. Y tu asiento respecto a él importa más que tu carta.',
            },
            {
              type: 'table',
              headers: ['Factor mesa', 'Busca', 'Evita'],
              rows: [
                ['Recreacional', 'VPIP >40%, stack profundo', 'Short stacks sin implied'],
                ['Posición sobre fish', 'Fish a tu derecha (actúas después)', 'Fish a tu izquierda (te aisla)'],
                ['Regs', 'Regs tight a tu izquierda', 'Regs agresivos a tu izquierda que te squeezean'],
                ['Tamaño y lista de espera', 'Mesas llenas con cola', 'Mesas cortas sin acción'],
                ['Cambio de mesa', 'Cambiar si el fish se va', 'Quedarte por "orgullo" vs regs duros'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Selección de mesa es selección de winrate',
              text: 'Un grinder que cambia de mesa cuando el recreacional se va gana 1-2 bb/100 más sin mejorar técnica. Es la ventaja gratuita del online.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-database',
      slug: 'analisis-de-base-de-datos',
      title: 'Análisis de base de datos',
      summary: 'De la mano suelta al patrón: construir drills y estudiar errores con tu historial.',
      level: 'pro',
      icon: 'Database',
      outcomes: [
        'Filtrar tu base de datos para encontrar fugas reales',
        'Construir drills a partir de tus errores más caros',
        'Medir progreso con métricas, no con sensaciones',
      ],
      lessons: [
        {
          id: 'l-db-review',
          slug: 'analisis-de-base-de-datos',
          title: 'Database review: tu base habla',
          summary: 'Filtros que revelan fugas: winrate por posición, fold vs c-bet, WTSD.',
          kind: 'lesson',
          minutes: 11,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Tu base de datos es tu espejo. Con 20k manos ya puedes ver dónde sangras: BB winrate, fold vs c-bet, WTSD, won at showdown. Sin filtros, ves resultados; con filtros, ves decisiones.',
            },
            {
              type: 'table',
              headers: ['Filtro', 'Qué revela', 'Fuga típica', 'Corrección'],
              rows: [
                ['Winrate por posición', 'BB/100 BTN vs UTG vs BB', 'BB -35 bb/100', 'Defensa más ajustada y menos call OOP'],
                ['Fold vs c-bet flop', '¿Te retiras >60%?', 'Overfold: regalas botes', 'Check-raise más, paga con backdoors'],
                ['WTSD / W$SD', '¿Vas mucho al showdown y ganas poco?', 'Calling station: pagas de más river', 'Fold más vs river bet grande'],
                ['3-bet por posición', '¿3-beteas <5% desde BTN?', 'Pasividad', 'Polariza con blockers'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Un filtro, una corrección',
              text: 'No intentes arreglar cinco fugas a la vez. Elige la que más BB/100 te cuesta, corrige una semana y mide de nuevo.',
            },
          ],
        },
        {
          id: 'l-db-drills',
          slug: 'construccion-de-drills',
          title: 'Construcción de drills a partir de errores',
          summary: 'Del patrón detectado al ejercicio repetible en la mesa de práctica.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un drill útil nace de un error repetido. Detectas "fold vs delayed c-bet 68%" → construyes sesión de 30 manos donde solo llegan a turn tras check atrás. Así el error se convierte en entrenamiento.',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '1. Detecta patrón: filtra 3 manos con el mismo error (ej. overfold vs probe).',
                '2. Define regla: "en este spot, paga con X, sube con Y, retira Z".',
                '3. Crea drill: extrae 30 manos similares de tu historial o genera en mesa de práctica.',
                '4. Mide: ¿tu fold bajó de 68% a 55% (cerca de MDF)? Si sí, siguiente fuga.',
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'LESSON → Ejemplo → Drill → Error → 2º Drill → Hand review',
              text: 'Ese es el ciclo que propone la academia: la teoría se fija cuando el error te corrige en el acto y el segundo drill consolida. Cada lección termina en drill y cada drill en revisión.',
            },
          ],
        },
        {
          id: 'l-db-error-study',
          slug: 'estudio-de-errores',
          title: 'Estudio de errores: de la mano a la corrección',
          summary: 'Checklist de 9 preguntas y ciclo semanal de mejora.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'No estudies manos sueltas: estudia errores. Cada semana, filtra tu peor spot (más -EV) y aplica la checklist de hand review sobre 5 manos de ese spot.',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '¿Cuál era mi rango y el del rival? ¿Quién tenía ventaja (rango/nuts/SPR/posición)?',
                '¿Qué tamaños tenía y qué comunica cada uno?',
                '¿Qué combos llegan así (valor vs farol) y qué blockers tenía?',
                '¿Fue error técnico o varianza? Si es varianza, no toques nada.',
                'Escribe UNA corrección y crea un drill de 20 manos para ella.',
              ],
            },
            {
              type: 'spot',
              hole: 'Ah Qc',
              board: 'Qs 7d 2c 4s 9h',
              question: 'En tu base, pagas KQ en Q-7-2-4-9 vs bote y pierdes 2,1 bb de media. ¿Qué filtras?',
              answer:
                'Filtra "call river con top pair kicker medio vs bote". Verás si tu bluff-catcher gana <33% (necesario vs bote). Si gana 28%, tu fuga es overcall: retira tu rango medio y paga solo con top pair top kicker+.',
            },
          ],
        },
        {
          id: 'l-db-drill',
          slug: 'practica-database',
          title: 'Práctica: del filtro al drill',
          summary: 'Elige tu peor filtro y conviértelo en sesión de 30 manos.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Abre tu historial, filtra tu peor spot de la semana y juega 30 manos de ese spot con la corrección escrita delante. No es juego libre: es repetición deliberada del error hasta que desaparece.',
            },
            {
              type: 'drill',
              mode: 'discipline',
              seats: 6,
              goal: 'Juega 30 manos corrigiendo tu fuga #1 de la semana',
              hands: 30,
            },
          ],
        },
      ],
    },
    {
      id: 'c-integral',
      slug: 'todo-junto-el-proceso-de-decision',
      title: 'Todo junto: el proceso de decisión',
      summary:
        'Las preguntas que se hace un jugador profesional en cada momento de la mano, de antes del open al river, y la mesa para practicarlas todas.',
      level: 'pro',
      icon: 'GraduationCap',
      outcomes: [
        'Seguir un proceso de decisión completo en cada calle, sin saltarte pasos',
        'Calcular en la mesa outs, equity (regla del 2 y 4), pot odds y fold equity',
        'Decidir si farolear con criterio: historia, fold equity, rival y bloqueadores',
        'Distinguir lo que haría un profesional equilibrado de lo que haría un explotador contra cada tipo de rival',
      ],
      lessons: [
        {
          id: 'l-int-process',
          slug: 'el-proceso-de-decision-paso-a-paso',
          title: 'El proceso de decisión, paso a paso',
          summary:
            'Qué preguntarte antes de abrir, frente a un open o un 3-bet, en el flop, cuando te apuestan, cuando quieres farolear y en el river.',
          kind: 'lesson',
          minutes: 18,
          xp: 60,
          blocks: [
            {
              type: 'paragraph',
              text: 'Todo lo que has aprendido (rangos, posición, pot odds, outs, faroles, tipos de rival) se reduce a una cosa: **hacerte las preguntas correctas en el orden correcto**. Los buenos jugadores no deciden por intuición; repiten el mismo proceso en cada mano hasta que se vuelve automático. Esta clase es ese proceso, calle a calle. Después lo practicarás en la mesa con preguntas guiadas antes de cada decisión.',
            },
            {
              type: 'heading',
              text: '1. Antes de entrar al bote (nadie ha entrado)',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿En qué posición estoy y cuántos jugadores quedan detrás?** Cuantos más quedan, más probable es que alguien tenga una mano mejor.',
                '**¿Mi mano está en el rango de open de esta posición?** UTG abre ~17%, HJ ~22%, CO ~28%, BTN y SB ~44%. Si una mano mixta se abre menos del 50% de las veces, retírala.',
                '**¿Quiénes están en las ciegas?** Contra ciegas cerradas (nits) roba más; contra ciegas que defienden todo (stations), abre más por valor y menos de farol.',
                '**¿De qué tamaño?** 2,5 bb desde cualquier posición y 3 bb desde la SB. El tamaño es siempre el mismo para no dar pistas.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Nunca limp de entrada',
              text: 'Hacer limp regala la iniciativa y deja entrar a las ciegas baratas. Si una mano no vale una subida, no vale entrar.',
            },
            {
              type: 'heading',
              text: '2. Si alguien hizo limp',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿Quién hizo limp y cómo juega?** El limp suele ser un rango débil y limitado.',
                '**¿Mi mano gana un bote más grande contra ese rango?** Si sí, aísla; si no, retírate.',
                '**Tamaño de aislamiento:** 3 bb + 1 bb por cada limper.',
              ],
            },
            {
              type: 'heading',
              text: '3. Si alguien abrió antes que tú',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿Desde qué posición abrió y qué rango tiene?** No es lo mismo un open de UTG (~17%) que uno del botón (~44%).',
                '**¿Estaré en posición después del flop?** En posición puedes pagar más manos; desde las ciegas, defiende con manos que jueguen bien.',
                '**¿Mi mano es 3-bet por valor, 3-bet de farol, pagar o retirarse?** Los faroles de 3-bet se eligen con bloqueadores (A5s–A4s): quitan ases al rival y tienen equity si te pagan.',
                '**¿Queda alguien detrás que pueda hacer squeeze?** Si pagas con muchos jugadores por hablar, tu call se vuelve vulnerable.',
              ],
            },
            {
              type: 'heading',
              text: '4. Si te resuben (3-bet, 4-bet)',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿Desde dónde me resuben y con qué tamaño?** Un 3-bet desde las ciegas contra tu botón es más ancho que uno de UTG.',
                '**¿Tengo 4-bet por valor (QQ+, AK) o un farol con bloqueador (A5s)?**',
                '**¿Pago en posición o fuera de posición?** Fuera de posición el rango de pago se estrecha muchísimo.',
                '**¿Cuántas ciegas quedan detrás?** Con stacks cortos, un 4-bet es casi un all-in: decide con las matemáticas del all-in.',
              ],
            },
            {
              type: 'heading',
              text: '5. En el flop: lee el board antes que tu mano',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿Quién tiene la iniciativa?** El último que subió preflop representa las manos fuertes.',
                '**¿A qué rango favorece este board?** Un A-K-x favorece al que abrió; un 7-6-5 conectado favorece a quien defendió desde la BB.',
                '**¿Qué tengo?** Mano hecha fuerte, mano media, proyecto o aire. Cada una tiene su plan.',
                '**Si apuesto, ¿para qué?** Valor (me pagan peores), protección, semi-farol (proyecto) o farol (se retiran mejores). Si no sabes para qué apuestas, pasa.',
              ],
            },
            {
              type: 'heading',
              text: '6. Si te apuestan: outs, equity y pot odds',
            },
            {
              type: 'paragraph',
              text: 'Cuenta tus **outs** (cartas que te dan la mano ganadora), conviértelos en equity con la **regla del 2 y 4** (outs × 4 en el flop hasta el river, outs × 2 en el turn) y compáralo con las **pot odds**: lo que pagas / (bote + lo que pagas). Si tu equity supera lo que exigen las pot odds, pagar es rentable.',
            },
            {
              type: 'table',
              headers: ['Proyecto', 'Outs', 'Flop → river (×4)', 'Turn → river (×2)'],
              rows: [
                ['Color', '9', '~36%', '~18%'],
                ['Escalera abierta', '8', '~32%', '~16%'],
                ['Color + escalera abierta', '15', '~54% (real ~54%)', '~30%'],
                ['Gutshot', '4', '~16%', '~8%'],
                ['Dos overcards', '6', '~24%', '~12%'],
                ['Pareja → trío o doble pareja', '5', '~20%', '~10%'],
                ['Pocket pair → set', '2', '~8%', '~4%'],
              ],
            },
            {
              type: 'table',
              headers: ['Apuesta del rival', 'Equity que necesitas para pagar'],
              rows: [
                ['⅓ del bote', '20%'],
                ['½ bote', '25%'],
                ['⅔ del bote', '~29%'],
                ['Bote', '33%'],
                ['2 botes (overbet)', '40%'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Outs limpios e implied odds',
              text: 'Descuenta los outs que también le dan la mano al rival (un color menor, una escalera que empareja el board). Y suma las implied odds: si cuando ligas te pagan mucho más, puedes pagar con algo menos de equity.',
            },
            {
              type: 'heading',
              text: '7. Si quieres farolear',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**¿Mi historia es creíble?** El farol tiene que representar una mano que jugarías igual por valor.',
                '**¿Cuánta fold equity necesito?** Apuesta / (bote + apuesta). Con ⅔ del bote, el rival tiene que retirarse el 40% de las veces; con bote, el 50%.',
                '**¿Este rival puede retirarse?** A una calling station no se le farolea nunca; a un nit, mucho.',
                '**¿Tengo bloqueadores?** Tener el as de color cuando el board tiene tres de ese palo quita al rival las manos que nunca se retiran.',
                '**¿Tengo equity si me pagan?** Un semi-farol con proyecto gana de dos maneras: si se retiran o si ligas.',
              ],
            },
            {
              type: 'heading',
              text: '8. Turn y river: valor o farol, nunca a medias',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**Con mano fuerte: ¿qué manos peores me pagan?** Elige el tamaño que las mantiene dentro.',
                '**Con mano media: ¿me pagan peores si apuesto?** Si solo te pagan las mejores, pasa y gana a los faroles.',
                '**Si me apuestan en el river:** necesito ganar tantas veces como dicen las pot odds. ¿Este rival farolea tanto? ¿Mi mano bloquea sus faroles o su valor?',
              ],
            },
            {
              type: 'heading',
              text: '9. Adapta todo al rival',
            },
            {
              type: 'table',
              headers: ['Rival', 'Cómo juega', 'Cómo lo explota un explotador'],
              rows: [
                ['TAG (sólido, profesional)', 'Selectivo y agresivo, cerca del equilibrio', 'Juega tu estrategia estándar: no hay una fuga grande que atacar'],
                ['Nit (muy cerrado)', 'Pocas manos; sus apuestas son casi siempre valor', 'Róbale ciegas, farolea más, retírate cuando apuesta fuerte'],
                ['LAG (agresivo)', 'Muchas manos, mucha presión', '3-bet de valor más ancho, paga más ligero, deja que farolee'],
                ['Calling station', 'Paga casi todo', 'Nunca farolees; apuesta valor más grande y más fino'],
                ['Maníaco', 'Apuesta y sube casi cualquier cosa', 'Estrecha tu rango, pasa tus manos fuertes y deja que se estrelle'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Profesional o explotador',
              text: 'Un **profesional equilibrado** juega de forma que ningún rival pueda aprovecharse de él. Un **explotador** se desvía a propósito para castigar la fuga concreta de un rival. Empieza por el equilibrio y explota solo cuando tengas información clara.',
            },
            {
              type: 'spot',
              hole: 'Ah 7h',
              board: 'Kh 9h 2c',
              question:
                'Un rival paga tu open, pasa el flop, tú apuestas ½ bote y te sube a 3 veces. ¿Cuántos outs tienes y qué haces?',
              answer:
                '12 outs: 9 de color y 3 ases. Regla del 4: ~48% hasta el river. Pagar exige ~30% de equity, así que pagar es rentable; contra un rival agresivo incluso puedes resubir como semi-farol. Contra un nit que solo sube con sets, basta con pagar.',
            },
            {
              type: 'spot',
              hole: 'Qc Jc',
              board: 'As 8d 3h',
              question:
                'Abriste desde el CO, la BB (una calling station) paga y pasa. ¿Haces c-bet de farol?',
              answer:
                'No. El board favorece tu rango, pero una calling station paga con cualquier as, cualquier 8 y hasta con un 3. El farol necesita que se retire el 40% de las veces con ⅔ de bote: esta rival no lo hará. Pasa y toma la carta gratis.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'En el turn tienes un proyecto de color. ¿Qué equity aproximada tienes para ligarlo en el river?',
                  options: ['~9%', '~18%', '~36%', '~50%'],
                  answerIndex: 1,
                  explanation:
                    '9 outs × 2 (queda una carta) ≈ 18%. La regla del 4 solo vale en el flop, cuando quedan dos cartas por salir.',
                },
                {
                  id: 'q2',
                  question: 'Te apuestan medio bote. ¿Qué equity necesitas para pagar?',
                  options: ['20%', '25%', '33%', '50%'],
                  answerIndex: 1,
                  explanation:
                    'Pagas 0,5 para ganar un bote de 1 + 0,5 + 0,5 = 2: 0,5 / 2 = 25%.',
                },
                {
                  id: 'q3',
                  question:
                    'Quieres farolear con una apuesta del tamaño del bote. ¿Qué % de veces debe retirarse el rival para que el farol gane solo?',
                  options: ['33%', '40%', '50%', '67%'],
                  answerIndex: 2,
                  explanation: 'Apuesta / (bote + apuesta) = 1 / 2 = 50%.',
                },
                {
                  id: 'q4',
                  question: '¿Contra qué rival es peor idea farolear?',
                  options: ['Nit', 'TAG', 'Calling station', 'Da igual'],
                  answerIndex: 2,
                  explanation:
                    'La calling station casi nunca se retira: tu fold equity es casi cero. Contra ella se gana apostando valor, no faroleando.',
                },
              ],
            },
            {
              type: 'drill',
              mode: 'integral',
              seats: 6,
              goal: 'Juega 40 manos respondiendo las preguntas guiadas antes de cada decisión',
              hands: 40,
            },
          ],
        },
        {
          id: 'l-int-drill',
          slug: 'practica-integral',
          title: 'Práctica integral: todo lo aprendido',
          summary:
            'Mesa de 6 con rivales de estilos distintos. Antes de cada decisión, preguntas guiadas: rango, pot odds, outs, fold equity y qué haría un pro.',
          kind: 'drill',
          minutes: 30,
          xp: 80,
          blocks: [
            {
              type: 'paragraph',
              text: 'Aquí se aplica todo. Juegas contra rivales mezclados (sólidos, agresivos, cerrados y calling stations) y, **antes de cada decisión**, se abre un panel con la situación, quién es cada rival, las preguntas que tienes que hacerte y un mini-test con las cuentas del spot: ¿entra en tu rango?, ¿cuántos outs tienes?, ¿qué equity te da la regla del 2 y 4?, ¿qué exigen las pot odds?, ¿cuánta fold equity necesitas para farolear? Al final verás qué haría un profesional equilibrado y qué haría un explotador contra ese rival. Después decides tú en la mesa, y el corrector puntúa la decisión con el criterio del spot.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'No te saltes las preguntas',
              text: 'El objetivo no es acertar la mano, es automatizar el proceso. Cuando respondas las preguntas sin pensar, estarás listo para jugar sin ellas.',
            },
            {
              type: 'drill',
              mode: 'integral',
              seats: 6,
              goal: 'Juega 40 manos siguiendo el proceso completo de decisión',
              hands: 40,
            },
          ],
        },
      ],
    },
  ],
};
