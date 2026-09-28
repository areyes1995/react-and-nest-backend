// ──────────────────────────────────────────────
// Datos semilla — Nivel 2 — Intermedio. Juego postflop, tamaños de apuesta y lectura de rivales.
// Los carga `prisma/seeders/academy-curriculum.seeder.ts`.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';

export const INTERMEDIATE_LEVEL: LevelSeed = {
  id: 'intermediate',
  title: 'Postflop',
  subtitle: 'Construir tu juego',
  description:
    'SPR, flop, c-bet, sizing, IP/OOP, turn, river y multiway. El nivel donde se deja de improvisar postflop.',
  color: 'var(--level-intermediate)',
  icon: 'Layers',
  courses: [
    {
      id: 'c-postflop',
      slug: 'juego-postflop',
      title: 'Juego postflop y continuation bet',
      summary:
        'Leer la textura del flop y decidir si tu historia sigue teniendo sentido.',
      level: 'intermediate',
      icon: 'Layers',
      outcomes: [
        'Clasificar cualquier flop en segundos',
        'Saber cuándo la c-bet gana dinero y cuándo lo quema',
        'Elegir el tamaño según tu ventaja y planear el turn antes de apostar',
        'Frenar a tiempo en lugar de disparar por inercia',
      ],
      lessons: [
        {
          id: 'l-post-texture',
          slug: 'texturas-de-board',
          title: 'Texturas de board',
          summary:
            'Secos, húmedos, altos, bajos y emparejados: cada uno pide una estrategia distinta.',
          kind: 'lesson',
          minutes: 14,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Antes de decidir nada en el flop, clasifícalo. La textura te dice a quién favorece el board: a quien abrió el bote o a quien pagó. Los profesionales no miran "si ligaron": miran tres ejes en dos segundos: altura (cartas altas o bajas), conectividad (separadas o enlazadas) y color (arcoíris, dos del mismo palo o las tres).',
            },
            {
              type: 'table',
              headers: ['Textura', 'Ejemplo', 'Característica', 'Estrategia'],
              rows: [
                [
                  'Seco',
                  'K♠ 7♦ 2♣',
                  'Pocos proyectos posibles',
                  'C-bet pequeña y frecuente',
                ],
                [
                  'Húmedo',
                  'J♥ T♥ 9♠',
                  'Escaleras y colores en camino',
                  'C-bet grande y selectiva',
                ],
                [
                  'Emparejado',
                  '8♠ 8♦ 3♣',
                  'Full y trío posibles',
                  'Botes pequeños, cuidado con los grandes',
                ],
                [
                  'Monocolor',
                  'A♣ 9♣ 4♣',
                  'Color ya completado',
                  'Controlar el bote sin el as de ese palo',
                ],
              ],
            },
            {
              type: 'showcase',
              id: 'board-textures',
            },
            {
              type: 'range',
              id: 'flop-check-765',
            },
            {
              type: 'heading',
              text: 'Alto vs bajo: a quién pertenecen las cartas',
            },
            {
              type: 'paragraph',
              text: 'Quien abre preflop trae cartas altas (A-x, K-x, Q-x y parejas altas); quien defiende la ciega trae de todo, sobre todo cartas medias y bajas del mismo palo y conectores. Por eso los flops altos (A-K-4, K-8-3) pertenecen al agresor y los bajos y conectados (7-6-5, 8-7-6) pertenecen al defensor. Es el detalle que más se pasa por alto: el mismo par de damas vale una apuesta en K-7-2 y un check en 8-7-6.',
            },
            {
              type: 'heading',
              text: 'Emparejados y monocolor: el peligro invisible',
            },
            {
              type: 'paragraph',
              text: 'En un flop emparejado (8-8-3) casi nadie liga trío, así que el agresor puede apostar pequeño con casi todo su rango: el defensor rara vez tiene el 8. Pero cuando la acción se calienta (subida o check-raise), créetelo: a bote grande, alguien tiene el full. En flop monocolor (tres del mismo palo), tu mano hecha sin el as de ese palo pierde la mitad de su valor: cualquier cuarta carta de ese palo te deja en bluff-catcher.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Ventaja de rango',
              text: 'En un flop A-K-4, quien abrió preflop tiene muchas más combinaciones de ases y reyes que quien pagó desde la ciega. Ese board le pertenece, y puede apostar casi siempre. En un flop 7-6-5 ocurre lo contrario.',
            },
            {
              type: 'spot',
              hole: 'As Qd',
              board: 'Kh 8c 3s',
              question:
                'Abriste desde el botón y la ciega grande pagó. Flop K-8-3 arcoíris. ¿Apuestas?',
              answer:
                'Sí, pequeño (un tercio del bote). No tienes mano hecha, pero el rey encaja mucho mejor con tu rango de apertura que con el de la ciega. Además tienes overcards reales: si te pagan, todavía puedes mejorar.',
            },
            {
              type: 'spot',
              hole: '9h 8h',
              board: 'Jh Th 4s',
              question:
                'Defendiste la ciega grande y el flop es J-T-4 con dos corazones. Tienes proyecto de escalera y de color. El agresor apuesta un tercio. ¿Pagas o subes?',
              answer:
                'Las dos valen, pero el check-raise es la jugada profesional aquí: tienes 12+ outs (9 de color + 6 de escalera limpia) y fold equity contra su c-bet pequeña de rango. Pagar también es correcto si el rival nunca se retira: tu equity real justifica ver el turn barato.',
            },
            {
              type: 'spot',
              hole: 'Ad Ks',
              board: '8s 8d 3c',
              question:
                'Abriste UTG, pagó la ciega grande. Flop 8-8-3 arcoíris con A-K sin ligar. ¿Apuestas?',
              answer:
                'Sí, pequeño (un tercio). En flop emparejado el defensor casi nunca tiene el 8, así que tu c-bet de rango gana el bote muy a menudo. Pero si te suben o te pagan y el turn no es un as o un rey, frena: a bote grande en mesa emparejada, alguien tiene el full.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Flop K♠ 7♦ 2♣ arcoíris. ¿De quién es este board?',
                  options: [
                    'Del defensor: tiene más combinaciones de reyes',
                    'Del agresor preflop: concentra más K-x y parejas altas',
                    'De nadie: es un board neutro',
                    'Del que apueste primero',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Board alto y seco: el rango de apertura trae muchos K-x, A-x y overpairs; el defensor trae sobre todo manos medias y bajas. Pertenece al agresor y admite c-bet pequeña con casi todo el rango.',
                },
                {
                  id: 'q2',
                  question: 'Tienes escalera en mesa con tres corazones y sin pareja. ¿Qué debes asumir?',
                  options: [
                    'Que tu escalera es casi siempre la mejor mano',
                    'Que cualquier corazón te gana y debes controlar el bote',
                    'Que debes ir all-in para proteger',
                    'Que el color es imposible',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Mesa con tres del mismo palo: tu escalera pierde contra cualquier color. Es el error de lectura más caro del postflop: bote pequeño y reevalúa, no construyas bote grande sin el color máximo.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-post-cbet',
          slug: 'la-continuation-bet',
          title: 'La continuation bet',
          summary:
            'Cuándo apostar, con qué tamaño y con qué plan para el turn: la c-bet completa.',
          kind: 'lesson',
          minutes: 15,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'La c-bet es la apuesta que haces en el flop después de haber sido el agresor preflop. Funciona porque el rival falla el flop dos de cada tres veces. Pero apostarla siempre y a ciegas es una de las fugas más caras del nivel intermedio. La diferencia profesional no está en apostar o pasar: está en el tamaño y en tener un plan para el turn antes de apostar.',
            },
            {
              type: 'heading',
              text: 'Cuándo sí',
            },
            {
              type: 'list',
              items: [
                'El board favorece a tu rango (cartas altas si tú abriste).',
                'Hay uno o dos rivales, no cuatro.',
                'Tienes equity de respaldo: overcards, proyecto o mano hecha.',
                'El rival es capaz de retirarse.',
              ],
            },
            {
              type: 'heading',
              text: 'Cuándo no',
            },
            {
              type: 'list',
              items: [
                'Board bajo y conectado contra quien defendió la ciega grande.',
                'Tres o más rivales: alguien ha ligado algo.',
                'Rival que nunca se retira: no tiene sentido farolear a quien no sabe pasar.',
                'No tienes ni mano ni proyecto ni un plan para las calles siguientes.',
              ],
            },
            {
              type: 'heading',
              text: 'El tamaño dice qué rango representas',
            },
            {
              type: 'table',
              headers: ['Tamaño', 'Qué comunica', 'Cuándo usarlo'],
              rows: [
                ['25-33% del bote', 'Todo mi rango conecta aquí', 'Board seco con ventaja de rango (A-K-4, K-8-3)'],
                ['50-66% del bote', 'Tengo mano o proyecto serio', 'Board medio con valor y semibluffs con 8+ outs'],
                ['75-100% del bote', 'Polarizado: nuts o farol con blocker', 'Board húmedo donde necesitas negar equity (J-T-9 con color)'],
              ],
            },
            {
              type: 'paragraph',
              text: 'La apuesta pequeña de un tercio solo necesita funcionar el 25% de las veces para ser rentable como farol. Por eso en boards secos puedes apostar con casi todo tu rango: el precio es tan bueno que el rival no puede defenderse de todo. En boards húmedos ocurre lo contrario: apostar pequeño le regala precio a cada proyecto, así que sube el tamaño y baja tu frecuencia de farol.',
            },
            {
              type: 'range',
              id: 'flop-cbet-ak4',
            },
            {
              type: 'heading',
              text: 'Sin plan de turn no hay c-bet',
            },
            {
              type: 'paragraph',
              text: 'El error que casi nadie corrige: apostar el flop sin saber qué harás en el turn. Antes de apostar, responde en una frase: "si me pagan y el turn es una carta mala, ¿disparo de nuevo o abandono?". Si no tienes respuesta, tu c-bet es inercia, no estrategia. Regla práctica: con equity real (8+ outs) planea segundo barrel en muchas cartas; con aire total sin blocker, tu c-bet solo vale si el rival se retira ya.',
            },
            {
              type: 'spot',
              hole: 'Tc 9c',
              board: 'Jc 8h 2s',
              question:
                'Abriste en el botón, flop J-8-2 con dos tréboles. Tienes escalera abierta + proyecto de color. ¿Qué tamaño de c-bet y con qué plan?',
              answer:
                'Grande (66-75% del bote). Board húmedo donde tu mano necesita negar equity y construir bote para cuando ligues: con 12+ outs eres favorito contra casi todo su rango de pago. Plan: segundo barrel en cualquier trébol, cualquier 7 o Q (completas) y en cualquier carta alta que favorezca tu rango.',
            },
            {
              type: 'spot',
              hole: 'Ah 5h',
              board: 'Kh 9h 4c',
              question:
                'Defendiste la ciega grande con A-5 de corazones, flop K-9-4 con dos corazones. El agresor apuesta un tercio. ¿Pagas o subes?',
              answer:
                'Paga la mayoría de las veces. Tienes el proyecto máximo (nut flush draw) con 9 outs limpios más 3 ases que a veces son buenos: tu equity ronda el 40%. El check-raise es válido contra rivales que apuestan pequeño con todo su rango y se retiran ante presión, pero pagar mantiene sus faroles dentro y te deja cobrar cuando ligues.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'La c-bet automática',
              text: 'Si apuestas el 100% de los flops, tus apuestas no significan nada. Un rival atento te subirá una y otra vez sabiendo que casi nunca tienes mano. Los solvers modernos c-betean alrededor del 30-40% en muchos boards conectados: pasar también es jugar.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Abres UTG con A♠K♠, pagan tres jugadores. Flop 6♥5♥4♣. ¿C-bet?',
                  options: [
                    'Sí, bote completo',
                    'Sí, un tercio',
                    'No, pasar',
                    'All-in',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Board bajísimo y conectado, tres rivales, y tú no tienes nada más que dos overcards. Este flop favorece los rangos que pagan. Pasar y ver una carta gratis es lo correcto.',
                },
                {
                  id: 'q2',
                  question: 'Flop A-K-4 arcoíris como agresor. ¿Qué tamaño y por qué?',
                  options: [
                    'Bote completo: hay que proteger',
                    'Un tercio: tu ventaja de rango te deja apostar con casi todo',
                    'Pasar siempre: el as asusta',
                    'All-in: máxima presión',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Board seco con ventaja total de rango y nuts: la apuesta pequeña necesita solo 25% de folds y el rival no puede defenderse de todo tu rango. Apostar grande aquí solo consigue que se retiren las manos que querías que pagaran.',
                },
                {
                  id: 'q3',
                  question: 'Vas a c-betear con aire total sin proyecto. ¿Qué debes tener claro antes?',
                  options: [
                    'Nada: si falla el flop, apuesta',
                    'Que el rival se retira lo suficiente ya y qué harás si te pagan en el turn',
                    'El tamaño exacto del stack del dealer',
                    'Que tu mano es bonita',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Farol sin equity solo gana por fold equity inmediata. Si el rival paga mucho o no tienes plan para el turn (segundo barrel o abandono), esa c-bet quema fichas dos calles en vez de una.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-post-advantage',
          slug: 'ventaja-de-rango-y-nuts',
          title: 'Ventaja de rango, de nuts y de board',
          summary:
            'Range advantage, nut advantage y textura: por qué el mismo flop pide estrategias opuestas según quién es el agresor.',
          kind: 'lesson',
          minutes: 13,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'No todos los flops son iguales para ambos rangos. La **ventaja de rango** es quién tiene más manos que conectan; la **ventaja de nuts** es quién tiene más combinaciones imbatibles. Cuando las dos coinciden, puedes apostar con casi todo tu rango. Cuando se separan, tu rango se divide.',
            },
            {
              type: 'table',
              headers: ['Flop', 'Ventaja de rango', 'Ventaja de nuts', 'Estrategia del agresor'],
              rows: [
                ['A♥ K♦ 4♣', 'Agresor (A-x, K-x)', 'Agresor', 'C-bet pequeña (25-33%) con rango completo'],
                ['7♣ 6♦ 5♥', 'Defensor (conectores)', 'Defensor', 'Check mucho OOP; apuesta selectiva IP'],
                ['K♠ K♦ 8♣ (pareado)', 'Agresor', 'Repartida', 'C-bet pequeña con casi todo el rango; sin overbet'],
                ['A♣ 9♣ 4♣ (monocolor)', 'Agresor (más A-x)', 'Repartida: la tiene quien lleve tréboles altos', 'C-bet pequeña; el color ya puede estar hecho, así que nada de apuestas grandes sin él'],
                ['J♥ T♥ 9♦ (conectado)', 'Repartida', 'Repartida', 'Check-raise OOP rentable; IP controla con manos medias'],
              ],
            },
            {
              type: 'heading',
              text: 'Boards estáticos vs dinámicos',
            },
            {
              type: 'paragraph',
              text: 'Estático (K-7-2 arcoíris): el turn rara vez cambia las nuts, tu apuesta de hoy seguirá siendo buena mañana. Dinámico (J-T-9 con dos tréboles): cualquier corazón o Q/K/8 cambia la mejor mano. En dinámicos, el tamaño sube y el farol baja.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La pregunta profesional antes de apostar',
              text: '¿Quién tiene la ventaja de nuts aquí? Si no eres tú, tu c-bet grande con aire es un regalo. Si la tienes tú, incluso tus faroles tienen respaldo: representas manos que realmente tienes en tu rango.',
            },
            {
              type: 'spot',
              hole: 'As Kd',
              board: 'Ah 8c 3h',
              question: 'UTG abre, BB paga. Flop A-8-3 arcoíris. ¿Quién tiene la ventaja y qué haces IP?',
              answer:
                'UTG tiene ambas ventajas: más A-x y más sets. IP puedes hacer c-bet de un tercio con todo tu rango (AQ, AK y también bluffs con backdoors). OOP, si te toca actuar primero y tienes A-8, es check/call más que bet, porque tu ventaja se diluye sin posición.',
            },
            {
              type: 'heading',
              text: 'Cómo contar la ventaja en la mesa (sin solver)',
            },
            {
              type: 'paragraph',
              text: 'No necesitas combinatoria exacta: cuenta sets y dobles parejas posibles. En A-8-3, ¿quién puede tener A-A, 8-8 o 3-3? El que abrió UTG trae esas parejas siempre; la ciega grande casi nunca (habría resubido preflop con A-A). Tres sets contra cero: ventaja clara. En 7-6-5, el defensor trae 7-6, 6-5, 8-7 y todos los sets; el agresor UTG casi ninguno: ventaja invertida. El que más nuts posibles trae, manda.',
            },
            {
              type: 'spot',
              hole: 'Kd Qd',
              board: 'Ks 7d 2c',
              question:
                'Mismo flop K-7-2 seco, tienes K-Q (top pair). Como agresor IP apuestas un tercio. ¿Y si fueras el defensor OOP con la misma mano tras pasar el agresor?',
              answer:
                'La ventaja de rango es la misma, pero sin posición tu mano pierde valor: apuesta pequeña de torneo (donk) solo con sets y faroles con blocker; con K-Q el check/call es superior. La posición es la tercera ventaja y multiplica o divide las otras dos.',
            },
          ],
        },
        {
          id: 'l-post-cbet-avanzada',
          slug: 'estrategia-avanzada-de-cbet',
          title: 'Estrategia avanzada de c-bet',
          summary:
            'Frecuencia, tamaños, check, check-raise, delayed y ajuste multiway e IP/OOP.',
          kind: 'lesson',
          minutes: 15,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'La c-bet no es "apuesto o paso". Son seis líneas posibles y cada una comunica un rango distinto. La elección depende de textura, número de rivales y, sobre todo, de si te toca actuar en posición o fuera de ella.',
            },
            {
              type: 'table',
              headers: ['Línea', 'Tamaño típico', 'Cuándo usarla'],
              rows: [
                ['C-bet pequeña', '25-33% bote', 'Board seco con ventaja de rango y nuts (A-K-4).'],
                ['C-bet grande', '66-100% bote', 'Board húmedo o con ventaja de nuts pero no de rango.'],
                ['Check', '—', 'Rango medio OOP o board que favorece al defensor (7-6-5).'],
                ['Check-raise OOP', '2,5-3x la apuesta rival', 'Con valor (sets) y semibluffs con 8+ outs.'],
                ['Delayed c-bet IP', '33-50% turn', 'Cuando flop seco y rival pasó atrás: apuestas con retraso tras tu check.'],
                ['Multiway: check mucho', '—', 'Con 3+ jugadores, alguien ha ligado: c-bet solo con valor y draws fuertes.'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Multiway no es heads-up con un espectador',
              text: 'La estrategia GTO heads-up no se traslada a bote multiway. Con tres rivales, tu equity realization baja, tu fold equity se divide y tu top pair deja de ser apuesta automática. Sin nuts o gran proyecto, pasar es el estándar.',
            },
            {
              type: 'heading',
              text: 'IP vs OOP en la c-bet',
            },
            {
              type: 'table',
              headers: ['Factor', 'IP (en posición)', 'OOP (fuera de posición)'],
              rows: [
                ['Frecuencia', 'Más alta: ves reacción antes de comprometerte', 'Más baja: tu check protege tu rango de check'],
                ['Tamaño pequeño', 'Ideal para rango completo', 'También, pero con más checks de manos medias'],
                ['Check-raise rival', 'No te afecta: cierras acción', 'Te amenaza: por eso c-betea menos sin mano'],
                ['Mano media', 'Bet fino o check atrás para controlar', 'Check/call: no construyas bote grande sin nuts'],
              ],
            },
            {
              type: 'spot',
              hole: 'Js Ts',
              board: 'Kc 7d 2c',
              question:
                'Flop seco K-7-2. Tienes J-T suited IP vs OOP como agresor. ¿c-bet?',
              answer:
                'IP: sí, un tercio con J-T (backdoor color + overcards) – tu ventaja de rango te lo permite y si pasas atrás controlas gratis. OOP: check es mejor: tu mano no aguanta un check-raise y no quieres construir bote grande sin posición ni mano hecha.',
            },
            {
              type: 'heading',
              text: 'Cuando te suben la c-bet: defender sin pánico',
            },
            {
              type: 'paragraph',
              text: 'Un check-raise rival no siempre es fuerza: en boards secos muchos defensores lo usan como farol porque tu c-bet de rango es débil por definición. Defiende así: con top pair o mejor y con proyectos de 8+ outs, paga casi siempre (tienes precio directo más implícitas); con overcards sin proyecto, retírate contra ajustados y paga solo contra agresivos que farolean de más; y reserva la resubida para tus nuts y algún semibluff con blocker al color máximo. Lo que nunca haces: pagar con manos medias sin plan para el turn.',
            },
            {
              type: 'spot',
              hole: 'As Ks',
              board: 'Qs 7d 2c',
              question:
                'Flop Q-7-2 arcoíris, haces c-bet pequeña con A-K y la ciega grande te hace check-raise 3x. Sin proyecto, solo dos overcards. ¿Pagas?',
              answer:
                'Contra un rival normal, fold. Necesitas alrededor del 30% de equity y con 6 outs no llegas, y tu mano casi nunca mejora a nuts. Solo continúa contra maniacos que suben cada c-bet: ahí tu A-K bloquea sus pocas Q-x fuertes y tus overcards pueden ser buenas.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Board 9♥8♥7♠, tres jugadores, eres agresor sin nada. ¿C-bet?',
                  options: ['Sí, pequeña', 'Sí, grande', 'No, check', 'All-in'],
                  answerIndex: 2,
                  explanation:
                    'Board conectado y húmedo multiway: tu ventaja de rango desaparece y tu fold equity se diluye. Pasar es el estándar.',
                },
                {
                  id: 'q2',
                  question: '¿Cuándo es mejor delayed c-bet que c-bet inmediata?',
                  options: [
                    'En flop dinámico contra varios rivales',
                    'En flop seco IP cuando el rival pasó y tu mano tiene showdown medio',
                    'Nunca',
                    'Siempre',
                  ],
                  answerIndex: 1,
                  explanation:
                    'En flop seco tu check atrás protege tu rango de check; en turn tu apuesta fina cobra de manos que flotaron una calle. Es la línea profesional IP con manos medias y faroles con blocker.',
                },
                {
                  id: 'q3',
                  question: 'C-beteas K-7-2 seco y te hacen check-raise con A-K sin proyecto. ¿Línea estándar?',
                  options: [
                    'Pagar siempre: tienes dos overcards',
                    'Resubir all-in de farol',
                    'Retirarte contra un rival normal; pagar solo vs quien farolea de más',
                    'Pagar y donkear cualquier turn',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Con 6 outs no tienes precio contra un rango normal de check-raise (sets, K-x y algún farol). Pagar quema fichas dos calles. Solo continúa si el rival sube cada c-bet: ahí tus overcards más blockers justifican el call.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-post-drill',
          slug: 'practica-postflop',
          title: 'Práctica: decisiones de flop',
          summary:
            'Mesa de 6 contra rivales sólidos para poner a prueba tus c-bets.',
          kind: 'drill',
          minutes: 20,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Rivales de nivel intermedio: ya se retiran con manos débiles y castigan las apuestas automáticas. Antes de cada c-bet, pregúntate en voz alta a quién favorece el flop.',
            },
            {
              type: 'drill',
              mode: 'cbet',
              seats: 6,
              goal: 'Juega 30 manos justificando cada c-bet',
              hands: 30,
            },
          ],
        },
        {
          id: 'l-post-drill2',
          slug: 'practica-postflop-2',
          title: 'Práctica: flop — segundo intento con revisión',
          summary: 'Mismo flop, tras ver tu error: decide sizing (check/25%/33%/50%/75%/all-in) y aplica ventaja de nuts.',
          kind: 'drill',
          minutes: 18,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Ciclo LESSON → Ejemplo → Drill → Error → 2º Drill. Tras el primer drill revisas tu tasa de c-bet vs. rango: ¿apostaste 80% en A-K-4 (bien) pero 60% en 7-6-5 (mal)? Este segundo drill te obliga a decir en voz alta "check / 25% / 33% / 50% / 75% / all-in" y por qué (ventaja de rango/nuts, número de rivales, IP/OOP). Hand review integrada: filtra tus folds vs probe y corrige.',
            },
            {
              type: 'drill',
              mode: 'cbet',
              seats: 6,
              goal: 'Juega 25 flops más eligiendo tu sizing y justificando ventaja de nuts',
              hands: 25,
            },
          ],
        },
      ],
    },
    {
      id: 'c-sizing',
      slug: 'tamanos-de-apuesta',
      title: 'Tamaños de apuesta',
      summary: 'Cuánto apostar dice más de tu mano que si apuestas o no.',
      level: 'intermediate',
      icon: 'Scaling',
      outcomes: [
        'Elegir el tamaño según el objetivo de la apuesta',
        'Extraer más valor con manos fuertes',
        'Dejar de usar siempre el mismo tamaño',
      ],
      lessons: [
        {
          id: 'l-size-why',
          slug: 'el-tamano-comunica',
          title: 'El tamaño comunica',
          summary: 'Cada fracción del bote tiene un propósito, una matemática y un rango detrás.',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Antes de elegir un tamaño, responde a una pregunta: ¿qué quiero conseguir con esta apuesta? Que paguen manos peores, que se retiren manos mejores, o negar equity a un proyecto. Cada objetivo tiene su tamaño, y cada tamaño cuenta una historia distinta sobre tu rango.',
            },
            {
              type: 'table',
              headers: ['Tamaño', 'Objetivo', 'Situación típica'],
              rows: [
                [
                  '25-33% del bote',
                  'Que pague todo su rango',
                  'Board seco con ventaja de rango',
                ],
                [
                  '50-66%',
                  'Valor equilibrado',
                  'Mano hecha decente, board normal',
                ],
                [
                  '75-100%',
                  'Negar equity, cobrar caro',
                  'Board húmedo con mano fuerte o proyecto',
                ],
                [
                  '+100%',
                  'Polarizar: nueces o nada',
                  'River con la mejor mano o farol creíble',
                ],
              ],
            },
            {
              type: 'heading',
              text: 'Por qué la apuesta pequeña gana dinero',
            },
            {
              type: 'paragraph',
              text: 'Una apuesta de un tercio necesita solo 25% de folds para ser rentable como farol, y le da al rival 4 a 1 por pagar: no puede retirarse casi nada sin ser explotado. Por eso funciona con tu rango completo en boards secos: obligas al defensor a seguir con manos débiles que luego no saben jugar el turn. La apuesta pequeña no es debilidad: es range-bet, la herramienta central del poker moderno (Acevedo, Clarke).',
            },
            {
              type: 'heading',
              text: 'Por qué la apuesta grande niega equity',
            },
            {
              type: 'paragraph',
              text: 'En boards húmedos cada proyecto tiene 20-30% de equity. Apostar pequeño les regala el precio justo; apostar 75%+ les cobra de más y convierte su call en error matemático. Además la apuesta grande polariza tu rango (nuts + faroles con blocker), lo que te deja jugar el turn con iniciativa y un bote ya construido cuando ligas.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Regla práctica',
              text: 'Cuanto más húmedo el board, más grande la apuesta. Si el rival puede ligar un color o una escalera en la siguiente carta, hazle pagar caro por verla.',
            },
            {
              type: 'spot',
              hole: '9h 9s',
              board: '9d 7h 6h',
              question:
                'Tienes trío máximo en un flop lleno de proyectos. ¿Qué tamaño?',
              answer:
                'Grande: 75-100% del bote. Tu mano es muy fuerte pero vulnerable — hay proyectos de color y de escalera por todas partes. Un bote grande construido ahora te lo llevas más veces y cobras a los proyectos por seguir.',
            },
            {
              type: 'spot',
              hole: 'Ac Qd',
              board: 'Ah 7s 2c',
              question:
                'Top pair top kicker en board seco A-7-2 arcoíris contra un rival pasivo que paga de más. ¿Pequeño o grande?',
              answer:
                'Pequeño (un tercio). Tu ventaja de rango es total y quieres que pague con todo: A-x peores, parejas medias y hasta manos que van drawing dead. Apostar grande solo consigue que foldee lo peor y te pague lo que te gana. Contra quien paga de más, el valor fino y frecuente supera al valor grande y escaso.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Por qué la c-bet de un tercio funciona con casi todo tu rango en A-K-4 seco?',
                  options: [
                    'Porque siempre tienes el as',
                    'Porque necesita solo 25% de folds y el rival no puede defenderse de todo tu rango a ese precio',
                    'Porque el rival nunca tiene nada',
                    'Porque es la apuesta más grande posible',
                  ],
                  answerIndex: 1,
                  explanation:
                    'A ese precio el defensor necesitaría seguir con el 75% de su rango para no ser explotado, y no puede: la mayoría de sus manos son aire. Por eso el range-bet pequeño es rentable incluso con muchas manos débiles.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-size-value',
          slug: 'apuestas-de-valor',
          title: 'Apuestas de valor y apuestas finas',
          summary:
            'El valor no está en tener la mejor mano, sino en que te pague una peor: aprende a medirlo.',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Una apuesta de valor solo es correcta si existen manos peores que la tuya dispuestas a pagar. Esa es toda la definición, y es lo que mucha gente olvida cuando apuesta "porque tiene mano". El profesional no pregunta "¿voy ganando?": pregunta "¿qué peor me paga y cuántas combinaciones son?".',
            },
            {
              type: 'heading',
              text: 'Contando combos: el valor se mide, no se siente',
            },
            {
              type: 'paragraph',
              text: 'Hay 6 combinaciones de cada pareja y 16 de cada mano no emparejada. Si apuestas en river con top pair, cuenta: ¿cuántas segundas parejas y A-x peores puede traer (16 combos cada una) contra cuántas mejores (6 de cada set, 16 de cada two pair superior)? Cuando la lista peor multiplica por 3 a la mejor, apuesta siempre; cuando están parejas, apuesta pequeño o pasa. Este conteo es lo que separa el "creo que voy bien" del value bet profesional.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La pregunta de las dos listas',
              text: 'Antes de apostar en el river haz dos listas: qué manos peores pagarían y qué manos mejores pagarían. Si la segunda lista es mucho más larga, no estás apostando por valor: estás pagando tú.',
            },
            {
              type: 'spot',
              hole: 'Ah Jd',
              board: 'Ac 8s 4h 2d 7c',
              question:
                'Pareja de ases con kicker jota en el river. El rival ha pagado dos calles. ¿Apuestas?',
              answer:
                'Sí, pero pequeño (un tercio). Manos peores que pagan: A-9, A-T, 8-x, parejas medias. Manos mejores que pagan: A-K, A-Q. Hay suficiente lista peor como para apostar, pero no tanto como para apostar grande.',
            },
            {
              type: 'spot',
              hole: 'Ks Qd',
              board: 'Kh 9d 4c 2s 7h',
              question:
                'Top pair con K-Q en river seco. El rival es tight y solo llega con K-x fuerte o parejas medias. ¿Value bet?',
              answer:
                'Check atrás la mayoría de las veces. Su rango de llegada está lleno de K-J+ que te ganan y de parejas medias que no pagan ni un tercio. Apostar aquí convierte tu mano en farol caro contra su rango real. El valor depende del rival, no de tu mano.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'La apuesta fina',
              text: 'Apostar con una mano mediana en el river buscando pago de manos aún peores se llama thin value bet. Es una de las diferencias medibles entre un jugador que empata y uno que gana: los solvers la hacen sin parar y los humanos la evitan por miedo.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Rival tight que nunca paga con peor. Tienes top pair medio en river. ¿Apuestas "por valor"?',
                  options: [
                    'Sí, tengo la mejor mano casi siempre',
                    'No: sin manos peores que paguen no hay value bet, es check',
                    'All-in para proteger',
                    'Sí, pero el bote completo',
                  ],
                  answerIndex: 1,
                  explanation:
                    'El valor lo pone el rango del rival, no tu mano. Si su rango de call son solo manos mejores, tu apuesta es un farol con una mano que gana en showdown: el peor negocio del river.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-size-drill',
          slug: 'practica-de-tamanos',
          title: 'Práctica: elegir el tamaño',
          summary:
            'Usa los presets de bote y observa cómo cambian las respuestas de los rivales.',
          kind: 'drill',
          minutes: 18,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'En la mesa, los botones ½, ¾ y bote no están ahí por comodidad: están para que dejes de pensar en fichas y empieces a pensar en fracciones del bote. Juega 25 manos usando solo los presets.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 25 manos usando solo tamaños por fracción de bote',
              hands: 25,
            },
          ],
        },
      ],
    },
    {
      id: 'c-opponents',
      slug: 'leer-al-rival',
      title: 'Leer al rival',
      summary:
        'Los cuatro arquetipos que te vas a encontrar y el ajuste concreto para cada uno.',
      level: 'intermediate',
      icon: 'Users',
      outcomes: [
        'Clasificar a un rival en pocas manos',
        'Aplicar el ajuste rentable contra cada tipo',
        'Dejar de jugar igual contra todo el mundo',
      ],
      lessons: [
        {
          id: 'l-opp-types',
          slug: 'los-cuatro-arquetipos',
          title: 'Los cuatro arquetipos',
          summary: 'Tight/loose y pasivo/agresivo: dos ejes, cuatro perfiles y sus números.',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Todo rival se sitúa en dos ejes: cuántas manos juega (tight o loose) y con qué agresividad las juega (pasivo o agresivo). Con eso basta para tener un plan. Y en online no hace falta adivinar: el HUD te da los dos ejes en números (VPIP: manos jugadas; PFR: manos subidas; AF: agresividad postflop).',
            },
            {
              type: 'table',
              headers: ['Perfil', 'Cómo juega', 'Su fuga', 'Tu ajuste'],
              rows: [
                [
                  'Nit (tight-pasivo)',
                  'Pocas manos, casi nunca sube',
                  'Demasiado predecible',
                  'Róbale las ciegas sin descanso; cuando suba, créele',
                ],
                [
                  'TAG (tight-agresivo)',
                  'Pocas manos, muy agresivo',
                  'Casi ninguna',
                  'Evita botes grandes sin mano; juega en posición',
                ],
                [
                  'Calling station (loose-pasivo)',
                  'Paga todo, no sube',
                  'Nunca se retira',
                  'Nunca farolees; apuesta por valor una y otra vez',
                ],
                [
                  'Maniac (loose-agresivo)',
                  'Juega y sube todo',
                  'Sobrevalora manos débiles',
                  'Paga más ancho, deja que se estrelle contra tus manos fuertes',
                ],
              ],
            },
            {
              type: 'table',
              headers: ['Stat HUD', 'Nit', 'TAG', 'Station', 'Maniac'],
              rows: [
                ['VPIP / PFR', '12/8', '22/18', '40/8', '45/35'],
                ['3-bet', '3%', '7%', '2%', '12%+'],
                ['Fold a c-bet', '60%+', '45%', '30%', '40%'],
                ['Manos para fiarte', '100+', '200+', '100+', '150+'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El ajuste más rentable de todos',
              text: 'Contra una calling station, deja de farolear por completo. Es aburrido y es dinero. Contra un nit, ataca cada bote que abandone. Esos dos ajustes solos ya cambian tu resultado.',
            },
            {
              type: 'spot',
              hole: 'As 9d',
              board: 'Ac 7s 2c',
              question:
                'Tienes top pair flojo en A-7-2. Contra un nit que nunca paga de más, ¿apuestas? ¿Y contra una calling station?',
              answer:
                'Contra el nit: check atrás o apuesta mínima; su rango de call son solo A-x mejores y sets, así que no hay valor. Contra la station: apuesta las tres calles por valor, incluso grande; paga con A-x peores, sietes y parejas de bolsillo que ningún otro rival pagaría.',
            },
            {
              type: 'paragraph',
              text: 'En la mesa de práctica cada rival lleva su etiqueta visible. No es un atajo: es entrenamiento. El objetivo es que tu cerebro asocie un patrón de acciones a un perfil hasta que la etiqueta sobre.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Rival 45/35 con 3-bet 12% en 200 manos. ¿Qué es y cómo juegas tus manos fuertes?',
                  options: [
                    'Nit: roba y cree sus subidas',
                    'Maniac: deja que construya el bote, paga ancho y no farolees de vuelta',
                    'Calling station: apuesta fino tres calles',
                    'TAG: evita botes grandes',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Juega casi la mitad de las manos y resube el 12%: maniac clásico. Contra él tus manos fuertes se juegan pasivas para dejarle farolear, y tus bluff-catchers se ensanchan muchísimo.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-opp-adjust',
          slug: 'ajustes-en-la-practica',
          title: 'Ajustes en la práctica',
          summary:
            'Qué cambia exactamente en tu juego calle por calle según quién esté al otro lado.',
          kind: 'lesson',
          minutes: 11,
          xp: 35,
          blocks: [
            {
              type: 'list',
              ordered: true,
              items: [
                'Contra pasivos: amplía tu rango de valor y reduce faroles a cero.',
                'Contra agresivos: reduce tu rango de apertura y paga más ancho en el river.',
                'Contra tights: abre muchas más manos desde posición tardía.',
                'Contra loose: espera manos fuertes y deja que ellos construyan el bote.',
              ],
            },
            {
              type: 'heading',
              text: 'El ajuste cambia en cada calle',
            },
            {
              type: 'table',
              headers: ['Calle', 'Vs station (paga todo)', 'Vs nit (foldea todo)', 'Vs maniac (sube todo)'],
              rows: [
                ['Preflop', 'Aísla ancho por valor; nunca farolees 3-bet', 'Roba cualquier botón; fold a su 3-bet', '4-bet solo valor; paga sus 3-bets en posición'],
                ['Flop', 'C-bet grande solo con valor y draws fuertes', 'C-bet pequeña con todo tu rango', 'Pasa para inducir; no apuestes manos medias'],
                ['Turn', 'Doble barrel de valor fino; cero faroles', 'Segundo barrel con cualquier equity', 'Paga sus apuestas con más ancho del normal'],
                ['River', 'Value bet hasta delgada; nunca bluff-catchees fino', 'Farolea sus checks; foldea ante su apuesta', 'Bluff-catch ancho: su rango está lleno de aire'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'No sobreajustes',
              text: 'Dos manos no son una lectura. Necesitas ver un patrón repetido antes de cambiar tu estrategia. Ajustar por una sola mano es cómo se entra en tilt.',
            },
            {
              type: 'spot',
              hole: 'Kh Qh',
              board: 'Ks 7d 2c 4s',
              question:
                'Turn K-7-2-4 con top pair. El rival es un maniac que apuesta cada calle. ¿Subes para "proteger"?',
              answer:
                'No: paga y deja que siga faroleando. Subir solo consigue que foldee su aire (que ibas a ganar igual) y que continúe lo que te gana. Contra maniacos las manos fuertes se juegan pasivas y los bluff-catchers se ensanchan: tu K-Q aquí es call hasta el river.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Un rival ha pagado tres calles con pareja baja dos veces seguidas. ¿Qué haces en la siguiente?',
                  options: [
                    'Farolear más grande',
                    'Apostar más fino por valor',
                    'Pasar siempre',
                    'Retirarte ante sus apuestas',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Es una calling station. El farol no funciona contra quien no se retira nunca, pero puedes apostar por valor con manos que contra otros rivales no apostarías.',
                },
                {
                  id: 'q2',
                  question: 'El maniac de tu izquierda apuesta bote en river y tienes segunda pareja. ¿Línea?',
                  options: [
                    'Fold: nunca tienes nada contra agresión',
                    'Call: su rango tiene tanto aire que tu segunda pareja va por delante',
                    'Subir de farol',
                    'Pagar solo con nuts',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Contra quien apuesta todo, tu umbral de call baja muchísimo: necesita farolear poco para que tu bluff-catch sea rentable. Pagar solo con nuts contra un maniac es overfold y regala tu winrate.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-opp-drill',
          slug: 'practica-contra-perfiles',
          title: 'Práctica: mesa mixta',
          summary: 'Nueve jugadores con perfiles distintos en la misma mesa.',
          kind: 'drill',
          minutes: 20,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Mesa completa con perfiles variados. Tu tarea: antes de cada decisión, mira contra quién estás jugando y aplica el ajuste correspondiente.',
            },
            {
              type: 'drill',
              mode: 'discipline',
              seats: 9,
              goal: 'Juega 30 manos ajustando tu estrategia a cada perfil',
              hands: 30,
            },
          ],
        },
      ],
    },
    {
      id: 'c-spr',
      slug: 'spr-stack-to-pot-ratio',
      title: 'SPR: Stack-to-Pot Ratio',
      summary:
        'El número que decide si tu mano va all-in, se juega con control o se retira antes del flop.',
      level: 'intermediate',
      icon: 'Ratio',
      outcomes: [
        'Calcular el SPR efectivo en cualquier bote',
        'Decidir compromiso del stack según SPR bajo, medio y alto',
        'Planificar turn y river desde el flop usando el SPR',
      ],
      lessons: [
        {
          id: 'l-spr-concepto',
          slug: 'que-es-el-spr',
          title: 'Qué es el SPR y por qué manda',
          summary: 'SPR = stack efectivo / bote. Del flop en adelante, es tu plan de mano.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'El **SPR (Stack-to-Pot Ratio)** se calcula en el flop: divides el stack efectivo más corto entre el bote. Ejemplo clásico: bote 10, stack efectivo 40 → SPR 4. Ese número te dice cuántas apuestas quedan hasta el all-in y, por tanto, qué manos están comprometidas.',
            },
            {
              type: 'heading',
              text: 'El SPR no cae del cielo: se crea preflop',
            },
            {
              type: 'paragraph',
              text: 'Cada decisión preflop fija tu SPR del flop. Abrir y que pague una ciega: bote ~5bb con 100bb detrás → SPR ~20 (profundo). Hacer 3-bet y que paguen: bote ~20bb con 90bb detrás → SPR ~4 (medio). Por eso la 3-bet no solo aísla: baja el SPR y compromete tus overpairs. Los profesionales eligen preflop el SPR que quieren jugar postflop: con J-T suited quieren SPR alto (implied), con A-K quieren SPR medio-bajo (top pair comprometido).',
            },
            {
              type: 'table',
              headers: ['SPR', 'Lectura', 'Qué significa para tu compromiso'],
              rows: [
                ['SPR 1', 'Muy bajo', 'Cualquier top pair decente va all-in. No hay margen para retirarse.'],
                ['SPR 2-3', 'Bajo', 'Overpairs y top pair buen kicker comprometidos; proyectos necesitan fold equity.'],
                ['SPR 4-6', 'Medio', 'Dos calles de valor con mano fuerte; no te atas con una pareja media.'],
                ['SPR 8+', 'Alto / profundo', 'Sin compromiso: necesitas dos parejas+ para jugar bote grande. Control y implied odds mandan.'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'SPR es tu contrato postflop',
              text: 'A SPR bajo, la mano se juega sola. A SPR alto, cada calle es una decisión nueva. Los errores caros nacen de jugar SPR alto como si fuera bajo: comprometerte con una pareja cuando aún quedan 70 ciegas por hablar.',
            },
            {
              type: 'spot',
              hole: 'Qs Qd',
              board: 'Qh 7s 2c',
              question: 'Bote 10, stack efectivo 12 (SPR 1,2). Tienes trío de damas. ¿Plan?',
              answer:
                'Compromiso total: con SPR 1 cualquier mano fuerte va all-in. Si pasas o apuestas pequeño regalas carta gratis a proyectos. Apuesta grande y prepárate para pagar el all-in si te toca actuar tras una subida rival.',
            },
            {
              type: 'heading',
              text: 'Stack efectivo: el corto manda',
            },
            {
              type: 'paragraph',
              text: 'El SPR usa el stack más corto de los implicados, no el tuyo. Si tienes 200bb pero el rival 30bb, juegas SPR de bote pequeño: tus implied odds mueren y tus manos especulativas (parejas bajas, suited connectors) pierden valor. Regla: con stacks dispares, juega el rango del corto.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Bote 20, stack efectivo 80. ¿SPR?',
                  options: ['2', '4', '8', '1'],
                  answerIndex: 1,
                  explanation: '80 / 20 = 4. SPR medio: dos calles de valor con mano fuerte, pero sin compromiso automático con top pair.',
                },
                {
                  id: 'q2',
                  question: 'Tienes 100bb y el rival 25bb. Abres y paga. ¿Qué SPR juegas y qué manos pierden valor?',
                  options: [
                    'SPR alto: juegas profundo con todo',
                    'SPR bajo (~4): las manos especulativas pierden implied; juega el rango del corto',
                    'SPR 1: compromiso total',
                    'Da igual quién sea el corto',
                  ],
                  answerIndex: 1,
                  explanation:
                    'El stack efectivo es el corto: 25bb. Bote ~5bb → SPR ~4-5, y sin stacks profundos detrás no hay implied odds para sets ni proyectos. Parejas bajas y suited connectors se foldean más; manos altas que hacen top pair suben de valor.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-spr-compromiso',
          slug: 'spr-y-compromiso-del-stack',
          title: 'SPR y compromiso: cuándo tu stack ya no se retira',
          summary: 'Umbral de compromiso, manos que lo cruzan y cómo cambia OOP vs IP.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'A SPR bajo, tu mano supera el **umbral de compromiso**: si apuestas una vez y te suben, ya no puedes retirarte dando buen precio. IP ese umbral es más permisivo porque controlas la siguiente calle; OOP es más estricto porque te pueden apostar tras tu check.',
            },
            {
              type: 'table',
              headers: ['Mano en flop seco Q-7-2', 'SPR 2', 'SPR 5', 'SPR 10'],
              rows: [
                ['AQ (top pair)', 'Comprometido: bet/call all-in', 'Apuesta una calle, reevalúa turn', 'Check atrás IP / check OOP: bote pequeño'],
                ['QQ (overpair)', 'Comprometido', 'Comprometido', 'Una calle de valor, no bote grande'],
                ['A-K (overcards)', 'No comprometido', 'No', 'No: solo como semifarol'],
                ['Set', 'Nuts comprometido siempre', 'Nuts', 'Juega por stacks aunque SPR sea alto'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'OOP, baja un nivel tu compromiso',
              text: 'Fuera de posición necesitas una mano más fuerte para comprometerte al mismo SPR. Top pair OOP a SPR 4 es check con intención de pagar una apuesta, no bet/3-bet.',
            },
            {
              type: 'spot',
              hole: 'As Ks',
              board: 'Kh 9d 4c',
              question: 'Abres, te pagan, flop K-9-4, Bote 8, stack 32 (SPR 4). Tienes TPTK. IP vs OOP, ¿misma línea?',
              answer:
                'No. IP: apuestas pequeño (33%) y pagas una subida porque ves river con posición. OOP: pasar (check) es superior: te proteges del raise rival y mantienes el bote manejable; si apuestas y te suben fuera de posición, tu mano se vuelve un bluff-catcher forzado.',
            },
            {
              type: 'heading',
              text: 'El error de compromiso: pagar el raise que te ata',
            },
            {
              type: 'paragraph',
              text: 'El fallo clásico a SPR 3-5: apuestas con top pair, te suben, y "ya no puedes foldear por precio". El error no fue pagar la subida: fue apostar sin plan. Si tu mano no aguanta un raise a ese SPR, la línea correcta era check/call (mantienes bote pequeño y ves cartas) o check/fold, nunca bet/call resignado. Decide el compromiso antes de apostar, no después de que te suban.',
            },
          ],
        },
        {
          id: 'l-spr-drill',
          slug: 'practica-spr',
          title: 'Práctica: planifica por SPR',
          summary: 'Clasifica cada flop por SPR y decide si tu mano está comprometida.',
          kind: 'drill',
          minutes: 18,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'En cada mano verás bote y stack efectivo antes del flop. Calcula el SPR y decide: ¿vas a jugar por stacks, por dos calles o con control? El corrector compara tu línea con el compromiso teórico según posición.',
            },
            {
              type: 'drill',
              mode: 'pot-odds',
              seats: 6,
              goal: 'Juega 30 manos clasificando cada flop por SPR y ajustando tu compromiso',
              hands: 30,
            },
          ],
        },
      ],
    },
    {
      id: 'c-turn',
      slug: 'el-juego-del-turn',
      title: 'El juego del turn',
      summary: 'La calle más honesta: las cartas que cambian el rango, el barrel y la defensa.',
      level: 'intermediate',
      icon: 'Repeat',
      outcomes: [
        'Leer qué turn cambia el nut y cuál no cambia nada',
        'Decidir cuándo disparar segundo barrel y cuándo abandonar',
        'Usar probe y delayed c-bet en vez de apostar por inercia',
      ],
      lessons: [
        {
          id: 'l-turn-cartas',
          slug: 'cartas-que-cambian-el-rango',
          title: 'Las cartas que cambian el rango',
          summary: 'Overcards, completaciones, dobladas y cartas que cambian las nuts.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'El turn es la calle que más estrecha los rangos. Una sola carta puede convertir tu ventaja en desventaja: una overcard que completa tu rango, una carta que completa color o escalera, una que dobla el board o una que cambia quién tiene las nuts.',
            },
            {
              type: 'table',
              headers: ['Tipo de turn', 'Ejemplo', 'Efecto', 'Ajuste'],
              rows: [
                ['Overcard', 'A en K-7-2', 'Favorece al agresor preflop (más A-x)', 'Segundo barrel frecuente IP'],
                ['Completa draw', 'Corazón en flop con dos corazones', 'Favorece al defensor si tenía proyecto', 'Menos barrel sin nuts; más check atrás'],
                ['Empareja board', '4 en K-9-4', 'Favorece al defensor: tiene más manos con 4 y con 9-4', 'Chequea más tu rango medio'],
                ['Cambia nuts', 'T que completa escalera', 'Quien tenía escalera ahora pierde contra superior', 'No apuestes grande con la ex-nuts'],
                ['Blanca total', '2 offsuit', 'No cambia nada', 'Mantén tu plan de flop'],
              ],
            },
            {
              type: 'spot',
              hole: 'As Kd',
              board: 'Qh 9c 2h 3h',
              question: 'Flop Q-9-2 con dos corazones, tenías c-bet con AK. Turn 3♥ completa color. ¿Barrel?',
              answer:
                'No. El 3♥ es una de las peores cartas para tu rango: el defensor tiene muchos corazones (defiende suited) y tu AK sin corazón queda como bluff sin equity. Pasar y retirarte ante apuesta es más rentable que segundo barrel.',
            },
            {
              type: 'spot',
              hole: 'Qd Qs',
              board: 'Qh 9c 2d Ac',
              question: 'Flop Q-9-2, c-beteaste tu trío y pagaron. Turn A. ¿Frenas porque "llegó el as"?',
              answer:
                'No: el as es una de las mejores cartas para tu rango. El defensor casi nunca tiene A-x fuerte (habría resubido preflop o flop) y tu trío sigue siendo nuts la mayoría de las veces. Segundo barrel grande por valor; solo frena si el rival es de los que nunca paga sin el as.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'C-beteaste K-7-2 seco y el turn es un 7. ¿Qué cambia?',
                  options: [
                    'Nada: es carta blanca',
                    'Empareja el board: favorece al defensor (más 7-x) y tu top pair pierde valor relativo',
                    'Siempre debes apostar más grande',
                    'El bote se reparte',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Board emparejado en turn: el defensor trae muchos 7-x y K-7 que ahora te ganan o empatan mejor. Chequea tu rango medio y apuesta solo polarizado (K-x fuerte que cobra de 7-x, y faroles con blocker).',
                },
              ],
            },
          ],
        },
        {
          id: 'l-turn-barrel',
          slug: 'barreling-y-equity',
          title: 'Barreling: cuándo disparar el segundo tiro',
          summary: 'Equity, fold equity y blockers: las tres preguntas antes del segundo barrel.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un segundo barrel (apostar turn tras apostar flop) cuesta caro y define si vas a jugar un bote grande en river. Antes de hacerlo, responde: ¿tengo equity si me pagan?, ¿tengo fold equity si me retiro?, ¿bloqueo manos fuertes del rival?',
            },
            {
              type: 'list',
              items: [
                'Equity: ¿cuántos outs reales te quedan si pagas? Con 8+ outs, semibluff es rentable.',
                'Fold equity: ¿se retira el rival con sus parejas medias y draws fallidos? Contra calling station, cero barrel de farol.',
                'Blockers: ¿bloqueas las nuts que te pagan? Con el as del color, tu farol tiene más éxito.',
                'SPR y posición: IP puedes apostar más fino; OOP necesitas más equity porque no ves river gratis.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Check atrás también es una decisión',
              text: 'No disparar segundo barrel no es rendirse: es controlar bote con manos de showdown medio y realizar equity gratis con draws. El turn pasado IP a menudo gana más que un barrel mal elegido OOP.',
            },
            {
              type: 'table',
              headers: ['Tu mano en turn', 'IP', 'OOP'],
              rows: [
                ['Top pair buen kicker', 'Barrel pequeño 50-66%', 'Check más frecuente; apuesta solo si pagarán peor'],
                ['Proyecto 8+ outs', 'Barrel grande como semifarol', 'Check-raise si el rival apuesta, si no check atrás'],
                ['Aire sin blocker', 'Abandona: check atrás', 'Abandona: check/fold'],
                ['Nuts o cerca', 'Barrel grande 66-100%', 'Barrel grande o check-raise si te toca actuar después de su apuesta'],
              ],
            },
            {
              type: 'heading',
              text: 'Las cartas que disparan solas (scare cards)',
            },
            {
              type: 'paragraph',
              text: 'Hay turns que barrellean casi solos: overcards que completan tu rango (el as en K-7-2), cartas que completan proyectos que tú bloqueas (el tercer corazón cuando tienes el as de corazones) y cartas que doblan el board bajo. Representan tantas nuts de tu rango que el rival debe foldear sus parejas medias aunque sospeche. El profesional planea su c-bet de flop pensando en estas cartas: apuesta hoy lo que va a barrellear mañana.',
            },
            {
              type: 'spot',
              hole: 'Js Ts',
              board: 'Ks 7d 2c Qh',
              question:
                'Flop K-7-2 c-beteaste J-T suited (backdoors). Turn Q: tienes proyecto de escalera real + overcards. ¿Barrel o check atrás?',
              answer:
                'Barrel grande (66-75%). La Q es scare card perfecta: completa tu rango (K-Q, Q-Q, escaleras) y te da 10 outs reales si te pagan. Es el semibluff de manual: fold equity alta más equity real. Pasar aquí sería regalar la mejor carta de tu mazo.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Tienes proyecto de color al as en turn y el rival es calling station. ¿Segundo barrel de farol?',
                  options: [
                    'Sí, grande: hay que proteger',
                    'No como farol: sin folds tu equity no basta; apuesta solo si el precio y las implied lo justifican por valor de proyecto',
                    'All-in siempre',
                    'Pasar y foldear ante cualquier apuesta',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Contra quien no foldea, el barrel solo gana ligando. Con 9 outs (~18% a una carta) necesitas precio directo o implied enorme. El semibluff necesita folds; sin ellos es solo un draw caro.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-turn-probe-delayed',
          slug: 'probe-y-delayed-cbet',
          title: 'Probe, delayed c-bet y check-raise de turn',
          summary: 'Las líneas que no son "apostar porque toca".',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Cuando ambos pasan en flop, el turn pide una apuesta "probe" del defensor. Cuando tú pasas con ventaja y el rival pasa atrás, el turn te regala la "delayed c-bet". Y cuando pasas OOP con mano fuerte, el check-raise de turn es más fuerte que el de flop porque queda menos equity por realizar.',
            },
            {
              type: 'table',
              headers: ['Línea', 'Cuándo existe', 'Con qué manos'],
              rows: [
                ['Probe (OOP tras check-check flop)', 'Rival mostró debilidad; board húmedo que completa tu rango', 'Top pair, draws que no quisieron c-bet'],
                ['Delayed c-bet (IP tras check atrás flop)', 'Flop seco donde tu check protegió tu rango', 'Valor fino + faroles con blocker; tamaño 25-50%'],
                ['Check-raise turn OOP', 'Rival apuesta turn tras tu check', 'Valor (sets, dobles) + semibluffs con 8+ outs'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Posición dicta la línea',
              text: 'La delayed c-bet solo existe IP: necesitas que te hayan cedido la iniciativa. El probe solo existe OOP. Confundirlas es el tell de un jugador que no distingue quién tiene la acción.',
            },
            {
              type: 'spot',
              hole: 'Jh Th',
              board: 'Qh 9c 2d Ks',
              question: 'Flop Q-9-2, pasaste atrás IP con proyecto escalera; turn K. Rival pasa de nuevo. ¿Juegas?',
              answer:
                'Sí, delayed c-bet pequeño. El rey es overcard que favorece tu rango de check atrás (muchas Kx), el rival mostró debilidad dos veces y aún tienes outs si te pagan. Si apuestas y te suben, aún puedes retirarte barato.',
            },
            {
              type: 'spot',
              hole: '9d 8d',
              board: 'Kh 7d 2c 6d',
              question:
                'Defendiste BB, flop K-7-2 y ambos pasaron. Turn 6♦: tienes proyecto de color + pareja. El agresor pasa de nuevo. ¿Probe?',
              answer:
                'Sí, probe de medio bote. El 6♦ completa tu rango (proyectos, 6-x, dobles) y el agresor mostró debilidad dos veces en un board que ya no le favorece tanto. Tu mano tiene equity + fold equity: la probe cobra de sus manos medias y construye bote para cuando ligues.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'OOP, flop seco con ventaja de rango rival, ambos pasan. Turn completa tu proyecto. ¿Línea?',
                  options: [
                    'Check-raise siempre, sin importar su apuesta',
                    'Probe: el rival mostró debilidad y la carta favorece tu rango',
                    'Check/fold: nunca apuestes sin nuts',
                    'Overbet all-in',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Dos checks del agresor en board que completa tu rango es la receta de la probe: su rango está lleno de manos medias que foldean o pagan mal. El check-raise solo existe si él apuesta; si pasa, la probe toma la iniciativa.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-turn-drill',
          slug: 'practica-turn',
          title: 'Práctica: decisiones de turn',
          summary: 'Elige entre barrel, check atrás, probe y check-raise según la carta caída.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Mesa 6-max con HUD simplificado. Cada turn muestra cómo cambia la ventaja de rango. Decide tu línea y explica si es por valor, como farol con blockers o para controlar bote fuera de posición.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 30 turns decidiendo barrel, probe o delayed c-bet',
              hands: 30,
            },
          ],
        },
        {
          id: 'l-turn-drill2',
          slug: 'practica-turn-2',
          title: 'Práctica: turn — revisión + segundo drill',
          summary: 'Revisa tu error de barrel y repite el spot con sizing distinto.',
          kind: 'drill',
          minutes: 18,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Tras el primer drill de turn, filtra "segundo barrel sin equity" vs "check atrás con showdown medio perdido". Este segundo drill te obliga a decir "barrel 50% por equity+blocker / check atrás por control OOP" antes de que te toque actuar, y cierra con hand review de 5 manos del filtro.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 25 turns corrigiendo tu error de barrel vs check atrás',
              hands: 25,
            },
          ],
        },
      ],
    },
  ],
};
