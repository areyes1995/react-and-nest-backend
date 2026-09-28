// ──────────────────────────────────────────────
// Datos semilla — Nivel 1 — Principiante. Reglas, posición y las matemáticas mínimas.
// Los carga `prisma/seeders/academy-curriculum.seeder.ts`.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';

export const BEGINNER_LEVEL: LevelSeed = {
  id: 'beginner',
  title: 'Fundamentos',
  subtitle: 'Los cimientos',
  description:
    'Reglas, posición y las matemáticas mínimas. Al terminar puedes sentarte en cualquier mesa y saber qué estás haciendo.',
  color: 'var(--level-beginner)',
  icon: 'Sprout',
  courses: [
    {
      id: 'c-rules',
      slug: 'reglas-del-holdem',
      title: "Cómo se juega al Hold'em",
      summary:
        'Las reglas completas en cuatro clases: estructura de la mano, ranking, calles y acciones.',
      level: 'beginner',
      icon: 'BookOpen',
      outcomes: [
        'Seguir una mano completa sin perderte',
        'Reconocer al instante qué mano gana',
        'Saber qué significa cada acción y cuándo está disponible',
      ],
      lessons: [
        {
          id: 'l-rules-anatomy',
          slug: 'anatomia-de-una-mano',
          title: 'Anatomía de una mano',
          summary:
            'Qué ocurre desde que se reparten las cartas hasta que alguien se lleva el bote.',
          kind: 'lesson',
          minutes: 7,
          xp: 20,
          blocks: [
            {
              type: 'paragraph',
              text: "El Texas Hold'em es un juego de información incompleta. Cada jugador recibe dos cartas que solo él ve, y sobre la mesa se van descubriendo cinco cartas comunitarias que todos comparten. Tu mano final son las cinco mejores cartas que puedas formar combinando ambas fuentes.",
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La idea central',
              text: 'No ganas el bote por tener buenas cartas. Lo ganas porque los demás se retiran, o porque llegas al final con la mejor mano. Son dos caminos distintos y ambos se entrenan.',
            },
            {
              type: 'heading',
              text: 'Las cuatro rondas de apuestas',
            },
            {
              type: 'table',
              headers: ['Calle', 'Cartas en mesa', 'Qué se decide'],
              rows: [
                ['Preflop', 'Ninguna', 'Si entras al bote y por cuánto'],
                ['Flop', '3 cartas', 'Si tu mano encaja con la mesa'],
                ['Turn', '4 cartas', 'Si sigues invirtiendo o abandonas'],
                [
                  'River',
                  '5 cartas',
                  'Cuánto valor extraes o cuánto arriesgas en un farol',
                ],
              ],
            },
            {
              type: 'paragraph',
              text: 'En cada calle hay una ronda de apuestas. Si en algún momento todos menos uno se retiran, la mano acaba ahí: el último que queda se lleva el bote sin enseñar las cartas. Si al menos dos jugadores siguen después de la última apuesta del river, o si alguien va all-in y le pagan, hay **showdown**: se reparten las cartas que falten y se comparan las manos.',
            },
            {
              type: 'heading',
              text: 'Las ciegas',
            },
            {
              type: 'paragraph',
              text: 'Para que siempre haya algo que ganar, dos jugadores ponen fichas obligatorias antes de ver sus cartas: la **ciega pequeña** y la **ciega grande**. En cada mano el botón avanza una silla a la izquierda y las ciegas se mueven con él, de modo que todos pasan por todas las posiciones.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Por qué importan las ciegas',
              text: 'Las ciegas son el motor del juego: sin ellas nadie tendría incentivo para jugar una mano. Robarlas de forma sistemática es una de las primeras fuentes de beneficio de un jugador competente.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Cuántas cartas forman tu mano final?',
                  options: [
                    'Las 2 tuyas',
                    'Las 5 mejores entre tus 2 y las 5 comunitarias',
                    'Las 5 comunitarias',
                    'Las 7 cartas',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Se usan siempre exactamente cinco cartas. Pueden ser tus dos más tres de la mesa, una más cuatro, o incluso las cinco de la mesa si eso te da la mejor combinación.',
                },
                {
                  id: 'q2',
                  question:
                    'Si todos se retiran ante tu apuesta en el flop, ¿qué pasa?',
                  options: [
                    'Se reparten turn y river igualmente',
                    'Ganas el bote sin enseñar las cartas',
                    'Tienes que enseñar tu mano',
                    'El bote se divide',
                  ],
                  answerIndex: 1,
                  explanation:
                    'La mano termina en el momento en que solo queda un jugador. No hay showdown y nadie ve tus cartas: por eso el farol funciona.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rules-ranking',
          slug: 'ranking-de-manos',
          title: 'El ranking de manos',
          summary:
            'Qué mano tienes realmente, por qué ese es el orden, cómo se desempata y cómo saber en cada calle cuál es la mejor mano posible.',
          kind: 'lesson',
          minutes: 18,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'El ranking de manos es la única tabla del poker que no se interpreta: se sabe de memoria. Decide quién gana cuando dos o más jugadores llegan al final con cartas distintas. Todo lo demás (posición, tamaños de apuesta, faroles) se construye encima, y si dudas aquí, cada decisión posterior sale mal. En esta clase vas a ver, por este orden: qué cartas cuentan, la tabla, ejemplos con cartas reales, cómo se desempata y cómo usar la tabla durante la mano, no solo al final.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Cuándo se usa',
              text: 'Las manos se comparan en el **showdown**: cuando al menos dos jugadores siguen en la mano después de la última apuesta del river, o antes si alguien va all-in y le pagan (entonces se reparten las cartas que falten y se enseñan). Gana la mano más alta según la tabla, sin importar cuánto apostó cada uno. Si todos se retiran menos uno, no se compara nada: gana el que queda.',
            },
            {
              type: 'heading',
              text: 'Primero: tu mano son siempre 5 cartas',
            },
            {
              type: 'paragraph',
              text: "En Hold'em ves 7 cartas: tus 2 y las 5 comunitarias. Pero tu mano final son siempre las **5 mejores** de esas 7. Ni 2, ni 6, ni 7: cinco. Puedes usar tus dos cartas, solo una o ninguna (si las cinco de la mesa son lo mejor que tienes, se dice que «juega el board»). Las dos cartas que sobran no cuentan para nada, ni siquiera para desempatar.",
            },
            {
              type: 'spot',
              hole: 'Ah Qd',
              board: 'Ad 7s 4h 2c Jd',
              question: '¿Qué mano tienes aquí?',
              answer:
                'Pareja de ases con Q-J-7 de acompañantes: tus cinco mejores son A-A-Q-J-7. El 4 y el 2 sobran. Si el rival tiene A-9, también tiene pareja de ases, pero sus cinco son A-A-J-9-7: tu dama gana a su nueve. A esa carta que desempata se le llama **kicker** y la verás a fondo más abajo.',
            },
            {
              type: 'heading',
              text: 'La tabla completa: de la más fuerte a la más débil',
            },
            {
              type: 'table',
              headers: ['Puesto', 'Mano', 'Qué es', 'Si dos la tienen, gana…'],
              rows: [
                ['1', 'Escalera de color', 'Cinco consecutivas del mismo palo (la de 10 a as se llama escalera real)', 'La de carta más alta'],
                ['2', 'Póker', 'Cuatro cartas iguales + una', 'El póker más alto; luego la quinta carta'],
                ['3', 'Full', 'Trío + pareja', 'El trío más alto; luego la pareja'],
                ['4', 'Color', 'Cinco del mismo palo, en cualquier orden', 'La carta más alta; si empatan, la siguiente, y así'],
                ['5', 'Escalera', 'Cinco consecutivas de palos mezclados', 'La de carta más alta'],
                ['6', 'Trío', 'Tres cartas iguales + dos', 'El trío más alto; luego las otras dos'],
                ['7', 'Doble pareja', 'Dos parejas + una', 'La pareja alta; luego la baja; luego la quinta'],
                ['8', 'Pareja', 'Dos cartas iguales + tres', 'La pareja más alta; luego las otras tres'],
                ['9', 'Carta alta', 'Ninguna de las anteriores', 'La carta más alta; luego la siguiente, y así'],
              ],
            },
            {
              type: 'paragraph',
              text: 'Léela de arriba abajo: **cada fila gana a todas las de abajo**, sean cuales sean las cartas. Un color con cartas bajas gana a cualquier escalera, y la doble pareja más pequeña gana a la mejor pareja. La categoría manda; las cartas concretas solo sirven para desempatar dentro de la misma fila.',
            },
            {
              type: 'heading',
              text: 'Las manos de todos los días',
            },
            {
              type: 'paragraph',
              text: 'Carta alta, pareja, doble pareja y trío. Son las que vas a ver en la inmensa mayoría de las manos: con 7 cartas al azar, más de 8 de cada 10 veces tu mejor jugada es carta alta, pareja o doble pareja. Por eso casi todo el dinero del poker se decide entre ellas.',
            },
            {
              type: 'hands',
              items: [
                {
                  cards: 'As 9h 7d 5c 3s',
                  label: 'Carta alta',
                  note: 'No hay nada: se compara la carta más alta, luego la segunda, y así.',
                },
                {
                  cards: 'Ks Kh 9d 5c 3s',
                  label: 'Pareja',
                  note: 'Dos cartas del mismo valor. Las otras tres son los kickers.',
                },
                {
                  cards: 'Ks Kh 7d 7c 2s',
                  label: 'Doble pareja',
                  note: 'Dos parejas. Manda la pareja más alta.',
                },
                {
                  cards: 'Qs Qh Qd 9s 5c',
                  label: 'Trío',
                  note: 'Tres iguales. Con una pareja en la mano y la tercera en la mesa se llama set y está muy disimulado; con la pareja en la mesa, el rival lo ve venir.',
                },
              ],
            },
            {
              type: 'heading',
              text: 'Las manos que exigen que las 5 cartas encajen',
            },
            {
              type: 'paragraph',
              text: 'Escalera, color y full necesitan que las cinco cartas encajen entre sí: consecutivas, del mismo palo, o trío más pareja. Son más difíciles de ligar y por eso ganan a todas las anteriores. Entre ellas también manda la rareza: el color sale menos que la escalera, así que el **color gana a la escalera**, y el full sale menos que el color, así que el **full gana al color**.',
            },
            {
              type: 'hands',
              items: [
                {
                  cards: '5s 6h 7d 8c 9s',
                  label: 'Escalera',
                  note: 'Cinco valores seguidos, palos mezclados.',
                },
                {
                  cards: '2s 7s 9s Js As',
                  label: 'Color',
                  note: 'Cinco cartas del mismo palo, sin importar el orden.',
                },
                {
                  cards: 'Ts Th Td 4c 4s',
                  label: 'Full',
                  note: 'Trío + pareja. Se dice «full de dieces con cuatros»: primero el trío.',
                },
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Los dos errores de lectura más caros',
              text: 'Primero: ves tu color en una mesa emparejada (por ejemplo K-K-7-4-2 con tres corazones) y no ves que cualquier rival con un rey o con 7-7 ya tiene full. Segundo: ves tu escalera en una mesa con tres cartas del mismo palo y no ves que cualquier color te gana. Regla rápida: **mesa emparejada, desconfía de tu color; tres del mismo palo, desconfía de tu escalera**.',
            },
            {
              type: 'heading',
              text: 'Mesa emparejada: tu color está en peligro',
            },
            {
              type: 'paragraph',
              text: 'Tu color deja de mandar en cuanto la mesa se empareja. Con K-K-7-4-2 y tres corazones, cualquier rey o cualquier 7-7 del rival ya es full, y eso supera a tu color. Regla: **mesa emparejada, desconfía de tu color**. Míralo en la mesa de abajo: el color llega hecho al river y aun así pierde.',
            },
            {
              type: 'heading',
              text: 'Las manos que casi nunca verás',
            },
            {
              type: 'paragraph',
              text: 'El póker y las cinco seguidas del mismo palo cierran la tabla. La escalera real no es una categoría aparte: es la más alta de esas jugadas, la de 10 a as.',
            },
            {
              type: 'hands',
              items: [
                {
                  cards: '8s 8h 8d 8c Ks',
                  label: 'Póker',
                  note: 'Cuatro cartas del mismo valor y una más.',
                },
                {
                  cards: '5d 6d 7d 8d 9d',
                  label: 'Escalera de color',
                  note: 'Cinco seguidas del mismo palo. Desempata la carta más alta.',
                },
                {
                  cards: 'Ts Js Qs Ks As',
                  label: 'Escalera real',
                  note: 'La escalera de color de 10 a as. Nada la supera.',
                },
              ],
            },
            {
              type: 'heading',
              text: 'Por qué este orden: cuanto más rara, más fuerte',
            },
            {
              type: 'paragraph',
              text: "El orden sale de la probabilidad: cuanto más difícil es formar una mano, más alta está. Esta es la frecuencia real con la que cada jugada es la mejor de un jugador con sus 7 cartas en Hold'em:",
            },
            {
              type: 'table',
              headers: ['Mano', 'Frecuencia', 'Aproximadamente'],
              rows: [
                ['Escalera de color', '0,03%', '1 de cada 3.200 manos'],
                ['Póker', '0,17%', '1 de cada 600'],
                ['Full', '2,6%', '1 de cada 38'],
                ['Color', '3,0%', '1 de cada 33'],
                ['Escalera', '4,6%', '1 de cada 22'],
                ['Trío', '4,8%', '1 de cada 21'],
                ['Doble pareja', '23,5%', 'Casi 1 de cada 4'],
                ['Pareja', '43,8%', 'Casi 1 de cada 2'],
                ['Carta alta', '17,4%', 'Algo más de 1 de cada 6'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Un detalle curioso',
              text: "Con 7 cartas, quedarte solo con carta alta es más raro que ligar pareja o doble pareja. El ranking se fijó para manos de 5 cartas, donde sí es la más común, y nunca se cambió: carta alta sigue siendo la más débil. No afecta a nada en la mesa, pero explica por qué en Hold'em una simple pareja vale menos de lo que parece.",
            },
            {
              type: 'heading',
              text: 'La escalera más olvidada: la rueda',
            },
            {
              type: 'spot',
              hole: 'As 2h',
              board: '3d 4c 5s Kh 9d',
              question: '¿Tienes escalera con A-2 en esta mesa?',
              answer:
                'Sí. El as puede valer como la carta más baja además de como la más alta, así que A-2-3-4-5 es escalera: la «rueda». Es la escalera más baja y pierde contra cualquier otra, por ejemplo 2-3-4-5-6. Lo que no vale es dar la vuelta: Q-K-A-2-3 no es escalera.',
            },
            {
              type: 'heading',
              text: 'Cuando parecen iguales: las reglas del desempate',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**Manda la categoría.** Un trío gana a cualquier doble pareja, sean cuales sean los valores.',
                '**Luego la parte principal de la mano.** Dos escaleras: gana la de carta más alta. Dos fulles: gana el del trío más alto. Dos dobles parejas: gana la de pareja alta más alta.',
                '**Luego los kickers, uno a uno.** Misma pareja de ases: se comparan las otras tres cartas de mayor a menor.',
                '**Solo cuentan 5 cartas.** Un kicker que no entra en tus cinco mejores no desempata nada.',
                '**Los palos nunca desempatan.** No hay palos mejores que otros: si las cinco cartas empatan en valor, el bote se reparte (split).',
              ],
            },
            {
              type: 'spot',
              hole: 'Jh Tc',
              board: 'As Ad Kh Kc Qs',
              question: 'Tienes J-10 y el rival tiene 3-2. La mesa es A-A-K-K-Q. ¿Quién gana?',
              answer:
                'Nadie: split. Las cinco mejores de los dos son A-A-K-K-Q, todas de la mesa. Tu jota no entra porque la dama de la mesa es más alta: el kicker solo cuenta si forma parte de tus cinco cartas.',
            },
            {
              type: 'spot',
              hole: 'Ks Qd',
              board: 'As Kd Qh Jh Ts',
              question: 'Tienes K-Q y la mesa es A-K-Q-J-10. ¿Ganas?',
              answer:
                'Ni ganas ni pierdes: la escalera más alta posible ya está en la mesa. Tú juegas esas cinco cartas y cualquier rival también, así que el bote se reparte.',
            },
            {
              type: 'paragraph',
              text: 'El kicker decide muchísimo dinero antes del flop. Con A-K contra A-7 los dos tenéis un as, pero si sale otro as tu rey gana a su siete. Por eso A-7 contra A-K solo gana una de cada cuatro veces (alrededor del 24%, más un 5% de empates). A esto se le llama estar **dominado**: compartes una carta con el rival y la otra es peor.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Ases débiles: el palo lo cambia todo',
              text: 'Los ases con kicker bajo de distinto palo (A-7, A-4 offsuit) son una fuga clásica desde las primeras posiciones: cuando ligas el as sueles ir dominado, ganas botes pequeños y pierdes los grandes. Los ases pequeños del mismo palo, sobre todo del A-5 al A-2, sí se abren desde casi cualquier posición en los rangos modernos: pueden ligar el color máximo y la rueda, así que no dependen del kicker para ganar un bote grande.',
            },
            {
              type: 'heading',
              text: 'Del ranking a la mesa: ¿cuál es la mejor mano posible?',
            },
            {
              type: 'paragraph',
              text: 'El ranking te dice quién gana al final, pero durante la mano la pregunta útil es otra: **¿cuál es la mejor mano posible con esta mesa?** Esa mano se llama las **nuts**. Saber cuáles son te dice qué te puede ganar y cuánto vale de verdad lo que tienes.',
            },
            {
              type: 'table',
              headers: ['Mesa', 'Las nuts', 'Qué debes vigilar'],
              rows: [
                ['K♠ 7♦ 2♣ (seca)', 'Trío de reyes (K-K en la mano)', 'Poca cosa: una pareja de reyes es muy fuerte aquí'],
                ['9♥ 8♥ 7♣ (conectada)', 'Escalera (J-10 en la mano)', 'Escaleras, dobles parejas y proyectos de color'],
                ['K♠ K♦ 7♣ (emparejada)', 'Póker de reyes (K-K en la mano)', 'Fulles y tríos: tu color o tu escalera valen menos'],
                ['Q♥ 8♥ 4♥ 2♠ (tres del mismo palo)', 'Color al as (el A♥ y otro corazón)', 'Cualquier corazón: tu escalera o tu trío ya pueden ir perdiendo'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Fuerza absoluta y fuerza relativa',
              text: 'Una pareja de reyes no vale lo mismo en todas las mesas. En K-7-2 es casi siempre la mejor mano; con K-K en la mano en 9-8-7 con dos corazones, pierde contra escaleras, dobles parejas y tríos, y muchas cartas del turn la empeoran. La teoría moderna, la de los solvers y libros como Modern Poker Theory de Michael Acevedo, no evalúa tu mano aislada: la compara con todas las que puede tener el rival, su **rango**. Lo trabajarás más adelante. Por ahora, crea el hábito: en cada calle, localiza las nuts y pregúntate cuántas manos te ganan.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Mesa: K♠ K♥ 7♦ 4♣ 2♠. Tú tienes 7♠7♥, el rival A♠K♦. ¿Quién gana?',
                  options: [
                    'Tú, con full de sietes',
                    'El rival, con trío de reyes',
                    'Empate',
                    'El rival, con doble pareja',
                  ],
                  answerIndex: 0,
                  explanation:
                    'Tus cinco mejores son 7-7-7-K-K: full de sietes con reyes. El rival tiene K-K-K-A-7, un trío. La categoría manda: el full gana al trío.',
                },
                {
                  id: 'q2',
                  question: '¿Qué gana: una escalera al 9 o un color de cartas bajas?',
                  options: [
                    'La escalera',
                    'El color',
                    'Depende de la carta alta',
                    'Empatan',
                  ],
                  answerIndex: 1,
                  explanation:
                    'El color gana siempre a la escalera, sean cuales sean las cartas. La categoría manda por encima de los valores concretos.',
                },
                {
                  id: 'q3',
                  question: 'Tienes A♠2♥ y la mesa es 3♦ 4♣ 5♠ K♥ 9♦. ¿Qué tienes?',
                  options: [
                    'Solo as alto',
                    'Pareja de ases',
                    'Escalera: la rueda',
                    'Nada: el as solo vale como carta alta',
                  ],
                  answerIndex: 2,
                  explanation:
                    'El as también puede ser la carta más baja: A-2-3-4-5 es escalera. Es la más baja de todas y pierde contra cualquier otra.',
                },
                {
                  id: 'q4',
                  question:
                    'Los dos tenéis pareja de ases en A-J-7-4-2. Tú A-K, el rival A-Q. ¿Qué pasa?',
                  options: [
                    'Split: los dos tenéis la misma pareja',
                    'Ganas tú por el kicker rey',
                    'Gana el rival',
                    'Gana quien apostó más',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Misma categoría y misma pareja: deciden los kickers de mayor a menor. Tu mano es A-A-K-J-7 y la suya A-A-Q-J-7. Lo apostado no influye en el showdown.',
                },
                {
                  id: 'q5',
                  question:
                    'Mesa: Q♠ J♦ 7♣ 4♥ 2♠. Tú tienes A♠K♦ y el rival A♥K♣. ¿Quién gana?',
                  options: [
                    'Tú, porque tu as es de picas',
                    'Se reparte: los palos no desempatan',
                    'Quien apostó primero',
                    'El rival, porque los corazones valen más',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Los dos tenéis A-K-Q-J-7, carta alta con los mismos valores. En el poker no hay un palo mejor que otro, así que el bote se reparte.',
                },
                {
                  id: 'q6',
                  question: 'Mesa: Q♥ 8♥ 4♥ 2♠. ¿Cuáles son las nuts?',
                  options: [
                    'Trío de damas',
                    'Escalera',
                    'Color al as: el A♥ con otro corazón',
                    'Doble pareja',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Con tres corazones en la mesa, dos corazones en la mano hacen color, y el más alto es el que lleva el as. Con estas cartas no se puede formar escalera de color ni full (la mesa no está emparejada), así que nada le gana.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rules-actions',
          slug: 'acciones-y-apuestas',
          title: 'Acciones y estructura de apuestas',
          summary:
            'Pasar, apostar, igualar, subir y retirarse: cuándo está disponible cada una y qué comunica.',
          kind: 'lesson',
          minutes: 8,
          xp: 20,
          blocks: [
            {
              type: 'paragraph',
              text: 'En tu turno solo existen cinco acciones posibles, y cuáles tienes disponibles depende de si alguien ha apostado antes que tú en esa calle.',
            },
            {
              type: 'table',
              headers: ['Acción', 'Disponible cuando', 'Qué significa'],
              rows: [
                [
                  'Pasar (check)',
                  'Nadie ha apostado',
                  'Sigues en la mano sin poner fichas',
                ],
                [
                  'Apostar (bet)',
                  'Nadie ha apostado',
                  'Abres la ronda y obligas a los demás a decidir',
                ],
                [
                  'Igualar (call)',
                  'Hay una apuesta',
                  'Pagas lo mismo para seguir viendo cartas',
                ],
                [
                  'Subir (raise)',
                  'Hay una apuesta',
                  'Aumentas el precio y vuelves a poner a todos a decidir',
                ],
                [
                  'Retirarse (fold)',
                  'Siempre',
                  'Abandonas la mano y pierdes lo ya apostado',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Subir es la acción con más poder',
              text: 'Igualar solo puede ganar si tienes la mejor mano. Subir puede ganar de dos formas: teniendo la mejor mano o haciendo que el rival se retire. Esa segunda vía es la que explica por qué los jugadores agresivos ganan más.',
            },
            {
              type: 'heading',
              text: 'La subida mínima',
            },
            {
              type: 'paragraph',
              text: 'Una subida debe ser al menos del tamaño de la subida anterior. Si el rival apuesta 100 en un bote de 150, tu subida mínima es a 200: igualas sus 100 y añades otros 100. No existe "subir un poquito".',
            },
            {
              type: 'heading',
              text: 'All-in y botes laterales',
            },
            {
              type: 'paragraph',
              text: 'Si no te llegan las fichas para igualar, puedes ir **all-in** con lo que tengas. Solo compites por la parte del bote que has podido cubrir; el resto forma un **bote lateral** que se disputan los jugadores con más fichas. Nadie puede sacarte de una mano solo por tener un stack mayor.',
            },
            {
              type: 'spot',
              hole: 'Qs Qd',
              question:
                'Tienes 400 fichas. Un rival abre a 150 y otro sube a 600 all-in. ¿Puedes jugar?',
              answer:
                'Sí. Vas all-in con tus 400 y compites por el bote principal (400 de cada jugador implicado). Los 200 extra del rival forman un bote lateral que se disputan solo los que tienen fichas para cubrirlo.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Cuándo puedes pasar (check)?',
                  options: [
                    'Siempre',
                    'Solo preflop',
                    'Solo si nadie ha apostado en esa calle',
                    'Solo en el river',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Pasar significa "sigo sin pagar". Si hay una apuesta pendiente, tus opciones son igualar, subir o retirarte.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rules-drill',
          slug: 'primera-sesion',
          title: 'Tu primera sesión en la mesa',
          summary:
            'Veinte manos contra rivales pasivos para aplicar las reglas sin presión.',
          kind: 'drill',
          minutes: 15,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Las reglas se fijan jugando, no leyendo. Esta práctica te sienta en una mesa de 6 contra rivales pasivos: pagan demasiado y casi nunca farolean. Es el entorno ideal para acostumbrarte al ritmo sin que te castiguen los errores.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Qué observar',
              text: 'Deja el modo entrenamiento activado. Tras cada decisión verás tu equity real y las pot odds que te ofrecía la apuesta. No intentes ganar: intenta entender por qué el panel dice lo que dice.',
            },
            {
              type: 'drill',
              mode: 'pot-odds',
              seats: 6,
              goal: 'Juega 20 manos con el modo entrenamiento activado',
              hands: 20,
            },
          ],
        },
      ],
    },
    {
      id: 'c-position',
      slug: 'posicion-y-manos-iniciales',
      title: 'Posición y manos iniciales',
      summary:
        'La decisión más rentable del poker ocurre antes del flop: qué jugar y desde dónde.',
      level: 'beginner',
      icon: 'Compass',
      outcomes: [
        'Saber qué es cada posición de la mesa y en qué orden actúa',
        'Entender por qué actuar el último vale dinero',
        'Tener un rango de apertura por posición',
        'Dejar de jugar manos que solo traen problemas',
      ],
      lessons: [
        {
          id: 'l-pos-seats',
          slug: 'las-posiciones-de-la-mesa',
          title: 'Las posiciones de la mesa: quién es quién',
          summary:
            'El botón, las ciegas, UTG, hijack y cutoff: qué es cada asiento y en qué orden actúa.',
          kind: 'lesson',
          minutes: 8,
          xp: 20,
          blocks: [
            {
              type: 'paragraph',
              text: 'Antes de hablar de estrategia hay que saber quién es quién en la mesa. Cada asiento tiene un nombre según dónde está respecto al botón del dealer, y ese nombre te dice cuándo te toca actuar. En esta clase aprendes las seis posiciones de una mesa de 6 jugadores, el formato más habitual online, y el orden en que actúa cada una.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La idea central',
              text: 'Las posiciones no son sillas fijas: se cuentan desde el botón. Como el botón avanza un asiento a la izquierda en cada mano, todos los jugadores pasan por todas las posiciones.',
            },
            {
              type: 'heading',
              text: 'El botón y las ciegas',
            },
            {
              type: 'paragraph',
              text: 'El **botón** es el jugador que tiene la ficha del dealer, la «D». En un casino no reparte las cartas, pero marca desde dónde se cuenta todo. Justo a su izquierda está la **ciega pequeña**, que pone media apuesta obligatoria antes de ver cartas, y a la izquierda de esta, la **ciega grande**, que pone la apuesta obligatoria completa.',
            },
            {
              type: 'table',
              headers: ['Posición', 'Abreviatura', 'Dónde se sienta', 'Qué la hace especial'],
              rows: [
                ['Botón', 'BTN', 'Tiene la «D»', 'Actúa el último después del flop'],
                ['Ciega pequeña', 'SB', 'A la izquierda del botón', 'Pone media ciega obligatoria'],
                ['Ciega grande', 'BB', 'A la izquierda de la ciega pequeña', 'Pone la ciega completa obligatoria'],
              ],
            },
            {
              type: 'heading',
              text: 'Las seis posiciones de una mesa de 6',
            },
            {
              type: 'paragraph',
              text: 'Siguiendo el sentido de las agujas del reloj desde la ciega grande vienen las demás. Con seis jugadores, las posiciones se llaman así, en el orden en que actúan antes del flop:',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**UTG** (under the gun, «bajo la pistola»): el primero a la izquierda de la ciega grande. Es el primero en actuar antes del flop.',
                '**HJ** (hijack): el siguiente. En mesas más grandes esta zona se llama también posición media (MP).',
                '**CO** (cutoff): el asiento justo antes del botón.',
                '**Botón**: el último en actuar antes de que les toque a las ciegas.',
                '**Ciega pequeña y ciega grande**: cierran la acción antes del flop, porque ya han puesto su apuesta obligatoria.',
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Posiciones tempranas y tardías',
              text: 'A UTG y HJ se les llama posiciones **tempranas**: actúan con mucha gente detrás. CO y el botón son las posiciones **tardías**: actúan con más información. Las ciegas son un caso aparte, porque juegan con dinero ya puesto.',
            },
            {
              type: 'heading',
              text: 'El orden de actuación',
            },
            {
              type: 'table',
              headers: ['Ronda', 'Empieza', 'Termina'],
              rows: [
                ['Preflop', 'UTG, a la izquierda de la ciega grande', 'La ciega grande'],
                ['Flop, turn y river', 'El primero que siga en la mano a la izquierda del botón', 'El botón, si sigue en la mano'],
              ],
            },
            {
              type: 'paragraph',
              text: 'Antes del flop las ciegas actúan al final porque ya han puesto su apuesta obligatoria. A partir del flop el orden vuelve a empezar a la izquierda del botón: las ciegas pasan a actuar primero y el botón, el último. Por eso el botón es la mejor posición de la mesa, y la ciega pequeña, la más difícil.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Con menos jugadores',
              text: 'Si faltan jugadores se quitan posiciones empezando por las tempranas: con 3 jugadores solo quedan el botón, la ciega pequeña y la ciega grande. En heads-up, con dos jugadores, el botón es a la vez la ciega pequeña: actúa primero antes del flop y el último después.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Quién pone la ciega pequeña?',
                  options: [
                    'El botón',
                    'El jugador a la izquierda del botón',
                    'El jugador a la derecha del botón',
                    'UTG',
                  ],
                  answerIndex: 1,
                  explanation:
                    'La ciega pequeña se sienta justo a la izquierda del botón, y la ciega grande, a la izquierda de la ciega pequeña.',
                },
                {
                  id: 'q2',
                  question: 'En una mesa de 6, ¿quién actúa primero antes del flop?',
                  options: ['La ciega pequeña', 'El botón', 'UTG', 'La ciega grande'],
                  answerIndex: 2,
                  explanation:
                    'UTG es el primero a la izquierda de la ciega grande: abre la acción antes del flop. Las ciegas la cierran.',
                },
                {
                  id: 'q3',
                  question: 'Después del flop, ¿quién actúa el último?',
                  options: ['La ciega grande', 'El botón', 'UTG', 'El cutoff'],
                  answerIndex: 1,
                  explanation:
                    'A partir del flop se empieza por la izquierda del botón, así que el botón, si sigue en la mano, siempre cierra la acción.',
                },
                {
                  id: 'q4',
                  question: '¿Cómo se llama el asiento justo antes del botón?',
                  options: ['Hijack', 'Cutoff', 'UTG', 'Ciega grande'],
                  answerIndex: 1,
                  explanation:
                    'El cutoff (CO) está a la derecha del botón. Es la segunda mejor posición de la mesa.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pos-why',
          slug: 'por-que-la-posicion-lo-cambia-todo',
          title: 'Por qué la posición lo cambia todo',
          summary:
            'Actuar con información es la ventaja estructural más grande del juego.',
          kind: 'lesson',
          minutes: 7,
          xp: 20,
          blocks: [
            {
              type: 'paragraph',
              text: 'La posición es el orden en el que actúas dentro de la ronda de apuestas. Quien actúa último ha visto lo que han hecho todos los demás antes de decidir. Esa información no es un detalle: es la diferencia entre adivinar y calcular.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La misma mano, dos valores',
              text: 'K-J desde la primera posición es una mano problemática: si alguien te sube, casi nunca estás delante. La misma K-J desde el botón, con todos retirados, es una apertura clara. No ha cambiado la mano: ha cambiado la información.',
            },
            {
              type: 'heading',
              text: 'Las posiciones de una mesa de 6',
            },
            {
              type: 'table',
              headers: [
                'Posición',
                'Abreviatura',
                'Cuándo actúa',
                'Manos jugables',
              ],
              rows: [
                [
                  'Primera posición',
                  'UTG',
                  'Primero preflop',
                  'Muy pocas, solo fuertes',
                ],
                ['Posición media', 'MP', 'Segundo', 'Pocas'],
                ['Cutoff', 'CO', 'Penúltimo', 'Bastantes'],
                ['Botón', 'BTN', 'Último preflop y postflop', 'Muchas'],
                [
                  'Ciega pequeña',
                  'SB',
                  'Primero postflop',
                  'Selectivo: mala posición',
                ],
                [
                  'Ciega grande',
                  'BB',
                  'Último preflop, casi primero postflop',
                  'Defiende ancho por descuento',
                ],
              ],
            },
            {
              type: 'paragraph',
              text: 'Ojo con las ciegas: preflop actúan al final, lo que engaña. A partir del flop son de las primeras a las que les toca actuar durante el resto de la mano. Por eso son las posiciones donde más dinero se pierde.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Cuál es la mejor posición en la mesa?',
                  options: ['Ciega grande', 'UTG', 'Botón', 'Ciega pequeña'],
                  answerIndex: 2,
                  explanation:
                    'El botón actúa el último en todas las calles postflop. Es la única posición que mantiene la ventaja de información durante toda la mano.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pos-ranges',
          slug: 'rangos-de-apertura',
          title: 'Rangos de apertura por posición',
          summary: 'Una tabla concreta para dejar de improvisar preflop.',
          kind: 'lesson',
          minutes: 10,
          xp: 30,
          blocks: [
            {
              type: 'paragraph',
              text: 'Antes de memorizar manos, mira en la mesa qué significa abrir: ser el primero en subir con un open raise cuando nadie ha entrado al bote. La apertura se ensancha cuanto más tarde hablas.',
            },
            {
              type: 'paragraph',
              text: 'Un rango es el conjunto de manos con las que abres desde una posición. Tener uno escrito convierte decenas de microdecisiones en una sola decisión ya tomada. Esta tabla es una versión simplificada de lo que abren los solvers en una mesa de 6 con 100 ciegas: redondea las manos que ellos mezclan para que puedas memorizarla.',
            },
            {
              type: 'table',
              headers: ['Posición', '% de manos', 'Rango recomendado'],
              rows: [
                ['UTG', '16%', '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo'],
                ['HJ (MP)', '20%', '22+, A2s+, K8s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo'],
                ['CO', '28%', '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo'],
                [
                  'BTN',
                  '46%',
                  '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T8o+, 98o, 87o',
                ],
                [
                  'SB',
                  '39%',
                  '22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o (subiendo a 3 ciegas: jugarás fuera de posición)',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Cómo leer la notación',
              text: '"AJs+" significa AJ, AQ y AK del mismo palo. "77+" son todas las parejas de sietes para arriba. La "s" es suited (mismo palo) y la "o" es offsuit (distinto palo).',
            },
            {
              type: 'range',
              id: 'open-utg',
            },
            {
              type: 'range',
              id: 'open-btn',
            },
            {
              type: 'heading',
              text: 'Manos que parecen buenas y no lo son',
            },
            {
              type: 'hands',
              items: [
                {
                  cards: 'As 7h',
                  label: 'A7 offsuit',
                  note: 'Cuando liga el as, suele estar dominado por A-K, A-Q, A-J.',
                },
                {
                  cards: 'Ks Jd',
                  label: 'KJ offsuit',
                  note: 'Mano de kicker: gana botes pequeños y pierde los grandes.',
                },
                {
                  cards: 'Qs 9h',
                  label: 'Q9 offsuit',
                  note: 'Ni escalera fácil ni color: casi siempre segunda mejor.',
                },
                {
                  cards: 'Js Th',
                  label: 'JT offsuit',
                  note: 'Jugable en posición tardía, problemática desde UTG.',
                },
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El concepto de dominación',
              text: 'Una mano está dominada cuando comparte una carta con la del rival y pierde el kicker. A-7 contra A-K gana solo alrededor del 24% de las veces (y empata un 5%). No es mala suerte: es matemática.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Estás UTG en mesa de 6 con K♦J♣. ¿Qué haces?',
                  options: [
                    'Abrir con subida',
                    'Igualar la ciega grande',
                    'Retirarte',
                    'Ir all-in',
                  ],
                  answerIndex: 2,
                  explanation:
                    'KJ offsuit no entra en el rango de UTG (16%): de los broadways de distinto palo, desde ahí solo se abren AJo+ y KQo. Quedan cinco jugadores por actuar detrás de ti y la mano se domina con facilidad. Desde el hijack ya entra, y desde el botón es una apertura clara.',
                },
                {
                  id: 'q2',
                  question: '¿Qué significa A5s?',
                  options: [
                    'As y cinco de distinto palo',
                    'As y cinco del mismo palo',
                    'As, cinco y una tercera carta',
                    'Cualquier as con cinco',
                  ],
                  answerIndex: 1,
                  explanation:
                    'La "s" indica suited: ambas cartas del mismo palo. Esa diferencia añade posibilidad de color y sube bastante el valor de la mano.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pos-rfi-moderno',
          slug: 'rfi-moderno',
          title: 'RFI moderno: frecuencias de apertura, rake y tamaños',
          summary: 'Tu tabla no se juega al 100%: frecuencias, rake, tamaños y stacks.',
          kind: 'lesson',
          minutes: 12,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Ya tienes tu tabla de apertura. Ahora viene la parte moderna: esa tabla no se juega al 100%: los solvers mezclan manos, el rake la estrecha y el tamaño cambia por posición. Míralo en la mesa antes de memorizar nada.',
            },
            {
              type: 'heading',
              text: 'Tu tabla no se juega al 100%: frecuencias',
            },
            {
              type: 'paragraph',
              text: 'Los solvers no dicen "abre o foldea": dicen "abre el 60%". A5o en BTN abre unas veces sí y otras no; 77 en UTG abre siempre. Regla práctica: frecuencia mayor del 70%, juégala siempre; menor del 30%, fóldela de base.',
            },
            {
              type: 'table',
              headers: ['Mano', 'Solver', 'Tú'],
              rows: [
                ['A5s BTN', 'Abre ~85%', 'Ábrela siempre'],
                ['A5o BTN', 'Abre ~60%', 'Ábrela si las ciegas foldean mucho'],
                ['K9o CO', 'Abre ~25%', 'Fóldela de base'],
                ['77 UTG', 'Abre ~100%', 'Ábrela siempre'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'El mix es indiferencia',
              text: 'Cuando el solver mezcla, abrir y foldear rinden casi lo mismo. No intentes aleatorizar con el reloj: elige la opción simple según tus ciegas.',
            },
            {
              type: 'heading',
              text: 'Qué es un solver (y cuáles hay)',
            },
            {
              type: 'paragraph',
              text: "Un **solver** calcula con teoría de juegos cómo jugar cada mano sin ser explotable: qué abrir, cuánto apostar y con qué frecuencia. Se usa **fuera de la mesa** para estudiar: revisas un spot, memorizas la idea (no la solución exacta) y la aplicas jugando.",
            },
            {
              type: 'table',
              headers: ['Solver', 'Para qué sirve', 'Enlace'],
              rows: [
                ['PioSolver', 'El clásico de escritorio: rápido, para Hold\u2019em', 'https://piosolver.com/'],
                ['GTO Wizard', 'Plataforma web: solver, entrenador y analizador de manos', 'https://gtowizard.com/'],
                [
                  'HoldemResources Calculator',
                  'Preflop y postflop para torneos y cash, con Nash e ICM',
                  'https://holdemresources.net/',
                ],
                [
                  'DTO Poker',
                  'Entrenador GTO de cash y torneos con soluciones simplificadas',
                  'https://www.dto.poker/',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Solo fuera de la mesa',
              text: 'Usar un solver (o sus tablas) mientras juegas es RTA y las salas cierran cuentas por ello. El solver es para estudiar; a la mesa juegas tú.',
            },
            {
              type: 'heading',
              text: 'El rake estrecha tu tabla',
            },
            {
              type: 'paragraph',
              text: 'Tus charts asumen rake bajo. En micros con rake alto, cada mano marginal pierde dinero: quita primero los broadways offsuit en UTG-MP y los conectores bajos del mismo palo. En rake bajo, juega la tabla tal cual.',
            },
            {
              type: 'table',
              headers: ['Con rake alto, quita primero', 'Por qué'],
              rows: [
                ['KJo, QJo y ATo en HJ', 'Se dominan y pagan rake en cada bote'],
                ['22-44 en UTG', 'Ligan set pocas veces y el rake se come lo que ganan'],
                ['J9s, 98s, 87s en HJ', 'Necesitan botes grandes que el rake se come'],
              ],
            },
            {
              type: 'heading',
              text: 'El tamaño de apertura también es rango',
            },
            {
              type: 'table',
              headers: ['Posición', 'Size moderno', 'Por qué'],
              rows: [
                ['UTG-MP', '2.2-2.5x', 'Rango fuerte, precio estándar'],
                ['CO', '2.2x', 'Empiezas a robar'],
                ['BTN', '2x o min-raise', 'Rango amplísimo: arriesga menos'],
                ['SB', '3x', 'Juegas fuera de posición: cóbrale caro a la BB'],
              ],
            },
            {
              type: 'heading',
              text: 'No todo es 100 ciegas',
            },
            {
              type: 'list',
              items: [
                'Con 20-40 ciegas: quita manos especulativas (parejas bajas y conectores necesitan stacks profundos para cobrar cuando ligan) y abre más pequeño.',
                'Por debajo de 15-20 ciegas: muchas manos pasan a jugarse all-in o fold en lugar de con una subida normal.',
                'Con 100: tu tabla base.',
                'Con 150 o más: ganan valor las parejas bajas y los conectores del mismo palo; pierden valor los broadways offsuit que se dominan.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Por qué los Ax abren',
              text: 'A5s-A2s abren desde casi todas las posiciones por tres motivos: ligan el color máximo, ligan la rueda (A-2-3-4-5) y el as en tu mano bloquea AA y AK, así que el rival tiene menos manos con las que resubirte. No dependen del kicker: cuando ganan un bote grande es con color o escalera, no con pareja de ases.',
            },
            {
              type: 'spot',
              hole: 'Kd 9h',
              question: 'CO, 100 ciegas, el botón y las ciegas foldean mucho al robo. ¿Abres K9o?',
              answer: 'Sí: de base es fold (el solver la abre ~25%), pero contra jugadores que se retiran de más detrás de ti el robo pasa a rentable. La tabla es el punto de partida; los rivales deciden. Desde el botón, K9o ya está en la tabla base.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'A5o en BTN abre el 60% según el solver y las ciegas son normales. ¿Qué haces?',
                  options: [
                    'Abrirla siempre',
                    'Foldearla siempre',
                    'Abrirla si las ciegas foldean mucho; si no, fold',
                    'Igualar la ciega grande',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Al 60% no hay obligación: es una mezcla. Con ciegas normales elige según el pool; la regla del 70/30 la deja fuera de la apertura automática.',
                },
                {
                  id: 'q2',
                  question: 'Micros con rake alto, UTG con KJo. ¿Qué haces?',
                  options: ['Abrir 2.5x', 'Foldear', 'Abrir min-raise', 'Igualar'],
                  answerIndex: 1,
                  explanation:
                    'KJo en UTG es la primera víctima del rake alto: se domina con facilidad y cada bote que juega paga comisión. Fuera.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pos-ip-oop',
          slug: 'en-posicion-vs-fuera-de-posicion',
          title: 'En posición vs fuera de posición (IP vs OOP)',
          summary:
            'Situaciones concretas donde gana quien juega en posición y otras donde quien juega fuera de posición le da la vuelta con check-raise, ventaja de tablero, probe bets y 3-bets.',
          kind: 'lesson',
          minutes: 14,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Estar **en posición (IP)** es actuar después del rival en flop, turn y river; estar **fuera de posición (OOP)** es actuar antes. En la clase anterior viste por qué actuar el último da información. Aquí lo vas a ver en manos concretas: en unas gana quien está en posición, y en otras quien está fuera de posición le da la vuelta con una buena estrategia.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Una ventaja enorme, no una sentencia',
              text: 'En posición se gana con información: decides después de ver qué hizo el rival. Fuera de posición no tienes esa información, así que se lucha con herramientas: el check-raise, los tableros que favorecen a tu rango, las probe bets y el 3-bet preflop. Conocer las dos caras es lo que separa a un jugador que sufre fuera de posición de uno que sabe defenderse.',
            },
            {
              type: 'heading',
              text: 'Cuándo gana quien está en posición',
            },
            {
              type: 'paragraph',
              text: 'En posición la clave es siempre la misma: decides después de ver qué ha hecho el rival. Estas son tres manos típicas en las que esa información se convierte en fichas.',
            },
            {
              type: 'spot',
              hole: 'Ah 5h',
              board: 'Kh 9h 3c 2s',
              question:
                'Estás en posición, en el botón, con proyecto de color al as. Pagaste la apuesta del flop y en el turn la ciega grande pasa. ¿Qué te permite hacer la posición?',
              answer:
                'Pasar detrás y ver el river gratis. Si ligas el color, cobras; si no, no has puesto ni una ficha más. Fuera de posición no tendrías esa opción: si pasas, es el rival quien decide si te cobra por ver el river, y si apuestas, arriesgas fichas con una mano que todavía no ha ligado. Carta gratis = equity que realizas sin pagar.',
            },
            {
              type: 'spot',
              hole: 'Kc Qd',
              board: 'Qh 7d 2c 9s',
              question:
                'Estás en posición con pareja de damas y kicker rey. Apostaste en el flop, te pagaron, y en el turn el rival pasa. ¿Tienes que volver a apostar?',
              answer:
                'No: en posición puedes pasar detrás y mantener el bote pequeño con una mano que gana a muchas, pero no a todas. Si el rival apuesta en el river, decides viendo ya su apuesta. Fuera de posición te tocaría elegir a ciegas entre apostar, y quizás recibir una subida que no sabes pagar, o pasar, y quizás enfrentarte a una apuesta grande. En posición eres tú quien decide el tamaño del bote.',
            },
            {
              type: 'spot',
              hole: 'Jh Th',
              board: 'Ac 7s 3d 2h',
              question:
                'UTG abre, pagas en posición desde el botón y en el flop pagas su apuesta. En el turn UTG pasa. No tienes pareja. ¿Qué haces?',
              answer:
                'Apostar como farol. Quien subió preflop y apostó en el flop suele volver a apostar con sus manos fuertes; si pasa, muchas veces es porque no tiene nada que quiera defender. En posición ves esa debilidad antes de decidir y la castigas: tu apuesta tiene muchas opciones de llevarse el bote. Fuera de posición tendrías que apostar antes de saber si el rival iba a rendirse.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Lo que tienen en común',
              text: 'En las tres manos la ventaja es la misma: ver la acción del rival antes de decidir. Carta gratis, control del bote y faroles contra debilidad son las tres formas más habituales en que la posición se convierte en fichas.',
            },
            {
              type: 'heading',
              text: 'Cuándo le da la vuelta quien está fuera de posición: check-raise, tableros bajos, probe bet y 3-bet',
            },
            {
              type: 'paragraph',
              text: 'Fuera de posición no puedes esperar a ver qué hace el rival, pero tienes cuatro herramientas para compensarlo: el check-raise, los tableros que favorecen a tu rango, la probe bet en el turn y el 3-bet antes del flop. Estas son las situaciones en las que funcionan.',
            },
            {
              type: 'spot',
              hole: '7h 6h',
              board: '7s 6d 2c',
              question:
                'Defiendes la ciega grande con siete seis de corazones contra una apertura del botón y ligas doble pareja en 7-6-2. Te toca actuar primero. ¿Cómo sacas más fichas?',
              answer:
                'Pasas y dejas que el botón haga su c-bet, que en este tablero hará muy a menudo y con casi todo su rango. Entonces subes: check-raise. Usas justo lo que te pone en desventaja, actuar primero, para que el rival meta fichas antes que tú. Si apostaras tú, muchas manos peores se retirarían sin pagar nada.',
            },
            {
              type: 'spot',
              hole: '6c 5c',
              board: '6h 5d 4s',
              question:
                'UTG abre y defiendes la ciega grande. El flop es 6-5-4. Estás fuera de posición, pero ¿quién tiene ventaja en este tablero?',
              answer:
                'Tú. El rango de UTG son sobre todo parejas altas y cartas grandes (A-A, K-K, A-K, A-Q), que en un 6-5-4 no ligan nada o solo una pareja por encima. El tuyo tiene muchas parejas pequeñas y conectores que ligan tríos, dobles parejas y escaleras. En tableros así puedes apostar tú primero, una donk bet, o hacer check-raise a menudo: la ventaja de tablero compensa la de posición.',
            },
            {
              type: 'spot',
              hole: 'Ts 9s',
              board: 'Ks 8d 3c 2h',
              question:
                'Defiendes la ciega grande contra el botón. En el flop pasas y el botón también pasa, sin hacer c-bet. En el turn te toca a ti primero y no tienes pareja. ¿Qué haces?',
              answer:
                'Apostar: es una probe bet. Con una mano fuerte el botón casi siempre habría apostado en el flop, así que su pase indica que muchas veces tiene poco. Apostar primero en el turn le cobra por esa debilidad y a menudo se retira. Aquí la información la tienes tú: te la dio él al pasar en el flop.',
            },
            {
              type: 'spot',
              hole: 'Ad Qs',
              question:
                'El botón abre y estás en la ciega pequeña con as dama. Si solo pagas, jugarás toda la mano fuera de posición. ¿Qué hace un buen jugador?',
              answer:
                'Resubir: un 3-bet. Con un bote más grande antes del flop, la relación entre tu stack y el bote baja y quedan menos decisiones difíciles en turn y river, que es donde más pesa la posición. Además te quedas la iniciativa: el rival tiene que respetar tu subida y muchas veces se retira antes del flop. Pagar, en cambio, es la forma más cara de jugar fuera de posición.',
            },
            {
              type: 'heading',
              text: 'Resumen: quién tiene ventaja en cada situación',
            },
            {
              type: 'table',
              headers: ['Situación', 'Ventaja', 'Por qué'],
              rows: [
                ['Tienes un proyecto y el rival pasa', 'En posición', 'Ves la siguiente carta gratis'],
                ['Mano media en el turn', 'En posición', 'Controlas el tamaño del bote'],
                ['El agresor pasa en el turn', 'En posición', 'Faroleas después de ver su debilidad'],
                ['El rival hace c-bet en un tablero que ligaste', 'Fuera de posición', 'Check-raise: el rival mete fichas primero'],
                ['Tablero bajo y conectado contra una apertura de UTG', 'Fuera de posición', 'Tu rango liga mucho más que el suyo'],
                ['El rival no apostó en el flop', 'Fuera de posición', 'Probe bet en el turn contra un rango débil'],
                ['Mano fuerte en las ciegas antes del flop', 'Fuera de posición', '3-bet: bote grande y menos calles difíciles'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Aun así, la posición manda',
              text: 'Estas herramientas no convierten la ciega grande en el botón: solo reducen la desventaja. A la larga, con las mismas cartas, quien juega en posición gana más. Por eso la regla de oro no cambia: juega más manos en posición y, fuera de ella, entra con manos fuertes y un plan claro.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Tienes proyecto de color en el botón y en el turn la ciega grande pasa. ¿Qué te da la posición?',
                  options: [
                    'Ver el river gratis si pasas detrás',
                    'Una carta extra',
                    'La obligación de apostar',
                    'Nada: la posición no importa con proyectos',
                  ],
                  answerIndex: 0,
                  explanation:
                    'Actuando el último puedes pasar detrás y ver la siguiente carta sin pagar. Fuera de posición sería el rival quien decide si te cobra por verla.',
                },
                {
                  id: 'q2',
                  question:
                    'Defiendes la ciega grande contra una apertura de UTG y el flop es 6-5-4. ¿Quién suele tener ventaja?',
                  options: [
                    'UTG, porque abrió el bote',
                    'Tú, porque tu rango liga mucho más en ese tablero',
                    'Nadie: en el flop todo está igualado',
                    'Siempre quien está en posición',
                  ],
                  answerIndex: 1,
                  explanation:
                    'UTG abre sobre todo con parejas altas y cartas grandes, que no ligan en un 6-5-4. La ciega grande tiene muchas manos pequeñas que ligan tríos, dobles parejas y escaleras.',
                },
                {
                  id: 'q3',
                  question: '¿Qué es una probe bet?',
                  options: [
                    'Una apuesta de valor en el river',
                    'Apostar primero en el turn después de que el rival pasara detrás en el flop',
                    'Un all-in antes del flop',
                    'Subir la apuesta del rival en el flop',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Si el rival en posición no apostó en el flop, suele tener un rango débil. Quien está fuera de posición aprovecha y apuesta primero en el turn.',
                },
                {
                  id: 'q4',
                  question: '¿Por qué hacer 3-bet desde las ciegas ayuda a jugar fuera de posición?',
                  options: [
                    'Porque así pasas a actuar el último',
                    'Porque el bote crece antes del flop, quedan menos decisiones difíciles después y te quedas la iniciativa',
                    'Porque cambias de asiento',
                    'Porque las ciegas ya no cuentan',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Seguirás fuera de posición, pero con un bote grande y poco stack por detrás las calles finales pesan menos, y el rival tiene que respetar tu subida.',
                },
                {
                  id: 'q5',
                  question:
                    'Aunque tengas buenas herramientas fuera de posición, ¿desde dónde conviene jugar más manos?',
                  options: ['Desde las ciegas', 'En posición', 'Igual desde todas', 'Desde UTG'],
                  answerIndex: 1,
                  explanation:
                    'Las herramientas fuera de posición reducen la desventaja, pero no la eliminan. Con las mismas cartas se gana más en posición.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pos-drill',
          slug: 'practica-de-apertura',
          title: 'Práctica: abrir solo en posición',
          summary:
            'Mesa de 9 para notar en el cuerpo lo que cuesta jugar fuera de posición.',
          kind: 'drill',
          minutes: 15,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'En una mesa de 9 jugadores hay más jugadores por actuar detrás de ti, así que la posición pesa todavía más. Juega 25 manos con una única regla: solo entras al bote desde CO, BTN o con una mano del rango de UTG.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'La disciplina es el ejercicio',
              text: 'Vas a retirar muchas manos seguidas. Eso es exactamente lo que se entrena aquí: el aburrimiento es parte del juego ganador.',
            },
            {
              type: 'drill',
              mode: 'preflop-position',
              seats: 9,
              goal: 'Juega 25 manos abriendo solo desde posición tardía',
              hands: 25,
            },
          ],
        },
      ],
    },
    {
      id: 'c-math',
      slug: 'matematicas-esenciales',
      title: 'Las matemáticas que sí necesitas',
      summary:
        'Outs, pot odds y equity. Tres conceptos y ninguna fórmula complicada.',
      level: 'beginner',
      icon: 'Calculator',
      outcomes: [
        'Contar tus outs en segundos',
        'Calcular si una apuesta te ofrece buen precio',
        'Tomar decisiones de pago sin dudar',
      ],
      lessons: [
        {
          id: 'l-math-outs',
          slug: 'outs-y-la-regla-del-2-y-4',
          title: 'Outs y la regla del 2 y 4',
          summary: 'Cómo estimar tu probabilidad de mejorar sin calculadora.',
          kind: 'lesson',
          minutes: 8,
          xp: 25,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un **out** es una carta que todavía está en la baraja y que convierte tu mano en ganadora. Contarlos es el primer paso de cualquier decisión postflop.',
            },
            {
              type: 'spot',
              hole: 'As Ks',
              board: '7s 2s 9h',
              question: '¿Cuántos outs tienes para ligar color?',
              answer:
                'Nueve. Hay 13 picas en la baraja; tú tienes dos y hay dos en la mesa, así que quedan 9 por salir. Esas 9 cartas te dan el color máximo.',
            },
            {
              type: 'heading',
              text: 'La regla del 2 y el 4',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'En el turn, con una carta por venir: multiplica tus outs por 2.',
                'En el flop, solo si vas a ver las dos cartas sin pagar más (por ejemplo, porque estás all-in): multiplica tus outs por 4. Si te pueden volver a apostar en el turn, usa ×2: estás pagando por ver una sola carta.',
                'Con más de 8 outs, el ×4 exagera: réstale lo que pases de 8 (con 15 outs, 60 − 7 = 53%).',
              ],
            },
            {
              type: 'table',
              headers: [
                'Proyecto',
                'Outs',
                'En el flop, hasta el river (×4 · real)',
                'En el turn (×2 · real)',
              ],
              rows: [
                ['Color', '9', '36% · 35%', '18% · 20%'],
                ['Escalera abierta', '8', '32% · 31%', '16% · 17%'],
                ['Escalera interior', '4', '16% · 17%', '8% · 9%'],
                ['Pareja a trío', '2', '8% · 8%', '4% · 4%'],
                ['Color + escalera abierta', '15', '53% · 54%', '30% · 33%'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Outs limpios y outs sucios',
              text: 'No todos los outs valen igual. Si ligas tu escalera pero el board completa un color, tu "out" te costó dinero. Cuenta solo las cartas que te dan la mejor mano de verdad.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Tienes escalera abierta en el flop (8 outs). ¿Probabilidad aproximada de ligarla antes del river?',
                  options: ['16%', '24%', '32%', '50%'],
                  answerIndex: 2,
                  explanation:
                    '8 outs × 4 = 32% (el cálculo exacto da 31,5%). Ojo: es la probabilidad de ligar en turn o river viendo las dos cartas. Si te apuestan otra vez en el turn, para esa decisión cuenta solo una carta: 8 × 2 = 16%.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-math-potodds',
          slug: 'pot-odds',
          title: 'Pot odds: el precio de seguir',
          summary:
            'La única cuenta que necesitas hacer en la mesa, y se hace en cinco segundos.',
          kind: 'lesson',
          minutes: 9,
          xp: 30,
          blocks: [
            {
              type: 'paragraph',
              text: 'Las pot odds comparan lo que tienes que pagar con lo que puedes ganar. Te dan el porcentaje mínimo de veces que necesitas ganar para que pagar sea rentable.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La fórmula',
              text: 'Equity necesaria = lo que pagas ÷ el bote final si pagas. Si el bote tiene 100 y te apuestan 50, pagas 50 por un bote final de 200 (100 + 50 del rival + tus 50): necesitas 50 ÷ 200 = 25%.',
            },
            {
              type: 'table',
              headers: ['Apuesta del rival', 'Equity que necesitas'],
              rows: [
                ['¼ del bote', '17%'],
                ['⅓ del bote', '20%'],
                ['½ del bote', '25%'],
                ['¾ del bote', '30%'],
                ['Bote completo', '33%'],
                ['Doble del bote', '40%'],
              ],
            },
            {
              type: 'paragraph',
              text: 'Fíjate en lo importante: **cuanto más grande es la apuesta, más equity necesitas**. Por eso los buenos jugadores apuestan grande con manos fuertes y con faroles, y pequeño cuando quieren que pagues.',
            },
            {
              type: 'spot',
              hole: 'As Ks',
              board: '7s 2s 9h',
              question:
                'Bote 100, el rival apuesta 50 en el flop. Tienes proyecto de color al as con as rey. ¿Pagas?',
              answer:
                'Sí, y con holgura. Necesitas 25%. Solo con el color, para ver el turn tienes 9 outs × 2 ≈ 19%: no bastaría. Pero no solo ligas color: un as o un rey también te dan probablemente la mejor mano (6 outs más), y contra una pareja de nueves tu equity real hasta el river pasa del 50%. Súmale lo que cobrarás cuando ligues (odds implícitas) y pagar es claro.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Odds implícitas',
              text: 'Las pot odds solo miran el bote actual. Las odds implícitas añaden lo que esperas ganar en calles futuras si ligas. Con proyectos disimulados (escalera) suelen justificar pagos que las pot odds puras rechazarían.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Bote 200, el rival apuesta 200. ¿Qué equity necesitas para pagar?',
                  options: ['25%', '33%', '40%', '50%'],
                  answerIndex: 1,
                  explanation:
                    'Pagas 200 por un bote final de 600 (200 + 200 del rival + tus 200): 200 ÷ 600 = 33%. Una apuesta del tamaño del bote siempre exige un tercio de equity.',
                },
                {
                  id: 'q2',
                  question:
                    'Tienes escalera interior (4 outs) en el turn y te apuestan medio bote. ¿Pagas?',
                  options: [
                    'Sí, siempre',
                    'No: 8% de equity frente al 25% que necesitas',
                    'Solo si tienes as',
                    'Da igual',
                  ],
                  answerIndex: 1,
                  explanation:
                    '4 outs × 2 = 8% de equity contra un 25% exigido. Es un pago perdedor a largo plazo, por muy tentador que parezca el proyecto.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-math-decision',
          slug: 'de-la-teoria-a-la-mesa',
          title: 'De la teoría a la mesa',
          summary:
            'Práctica guiada: cada decisión te enseña tu equity real frente a la exigida.',
          kind: 'drill',
          minutes: 20,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Ya sabes contar outs y calcular pot odds. Ahora toca hacerlo bajo presión. En esta práctica, cada vez que tomes una decisión el panel de entrenamiento te enseñará tu equity real calculada por simulación y el porcentaje que exigía la apuesta.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El objetivo no es ganar manos',
              text: 'Es que tu estimación mental se acerque cada vez más al número real. Cuando falles, mira la diferencia: ahí está la lección.',
            },
            {
              type: 'drill',
              mode: 'pot-odds',
              seats: 6,
              goal: 'Juega 30 manos comparando tu estimación con la equity real',
              hands: 30,
            },
          ],
        },
      ],
    },
  ],
};
