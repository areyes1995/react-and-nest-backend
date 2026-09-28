// ──────────────────────────────────────────────
// Datos semilla — Nivel 3 — Avanzado. Rangos, faroles construidos y la arquitectura preflop.
// Los carga `prisma/seeders/academy-curriculum.seeder.ts`.
// ──────────────────────────────────────────────

import type { LevelSeed } from './curriculum.types';

export const ADVANCED_LEVEL: LevelSeed = {
  id: 'advanced',
  title: 'Rangos y estrategia',
  subtitle: 'Pensar en rangos',
  description:
    'Combo counting, construcción de rangos, blockers/unblockers, 3-bet/4-bet/5-bet, BB defense y SB vs BB. De "tengo top pair" a "así se distribuye mi rango".',
  color: 'var(--level-advanced)',
  icon: 'Swords',
  courses: [
    {
      id: 'c-ranges',
      slug: 'rangos-y-equity',
      title: 'Pensar en rangos',
      summary:
        'Dejar de preguntarte qué tiene el rival y empezar a preguntarte qué puede tener.',
      level: 'advanced',
      icon: 'Grid3x3',
      outcomes: [
        'Construir el rango del rival calle a calle',
        'Entender la equity realization',
        'Usar bloqueadores en decisiones ajustadas',
      ],
      lessons: [
        {
          id: 'l-rng-thinking',
          slug: 'pensar-en-rangos',
          title: 'Pensar en rangos, no en manos',
          summary:
            'El salto mental que separa al jugador intermedio del avanzado.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Preguntarse "¿tendrá as?" no lleva a ninguna parte. La pregunta útil es: "de todas las manos con las que habría jugado así, ¿cuántas me ganan y cuántas no?". Eso es pensar en rangos.',
            },
            {
              type: 'heading',
              text: 'Cómo se estrecha un rango',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                'Preflop: su posición y su acción definen el rango inicial.',
                'Flop: lo que apuesta o paga elimina combinaciones.',
                'Turn: la agresión sostenida deja fuera casi todas las manos débiles.',
                'River: lo que queda es un rango pequeño y muy concreto.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Rango polarizado vs. lineal',
              text: 'Un rango polarizado son manos muy fuertes y faroles, sin nada en medio: típico de apuestas grandes en el river. Un rango lineal es "todo lo decente hacia arriba": típico de apuestas pequeñas. El tamaño del rival te dice cuál de los dos está usando.',
            },
            {
              type: 'spot',
              hole: 'Ks Qs',
              board: 'Kh 9d 4c 2s As',
              question:
                'El rival, un TAG, apuesta el bote en el river tras pasar en el turn. ¿Qué rango tiene?',
              answer:
                'Polarizado: A-K, A-A, K-K, 9-9 por valor, y proyectos fallados de color como Q♠J♠ por farol. Tu pareja de reyes con kicker dama gana a los faroles y pierde contra todo el valor. La decisión depende de cuántos faroles creas que tiene ese jugador concreto.',
            },
          ],
        },
        {
          id: 'l-rng-realization',
          slug: 'equity-realization',
          title: 'Equity realization',
          summary: 'Tener equity no es lo mismo que poder usarla.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Una mano puede tener un 40% de equity contra el rango del rival y aun así perder dinero. El motivo: no siempre puedes llegar al showdown para cobrar esa equity. A eso se le llama equity realization.',
            },
            {
              type: 'table',
              headers: ['Factor', 'Efecto sobre la realización'],
              rows: [
                [
                  'Estar en posición',
                  'Sube mucho: controlas el tamaño del bote',
                ],
                [
                  'Fuera de posición',
                  'Baja: te apuestan y tienes que abandonar',
                ],
                [
                  'Mano con proyecto',
                  'Sube: puedes seguir apostando con credibilidad',
                ],
                [
                  'Mano mediana sin proyecto',
                  'Baja: no puedes pagar tres calles',
                ],
                [
                  'Rival muy agresivo',
                  'Baja: te expulsa de botes donde ibas por delante',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La consecuencia práctica',
              text: 'Por eso las manos suited y conectadas valen más que su equity bruta: realizan bien. Y por eso las manos de kicker fuera de posición valen menos de lo que parecen.',
            },
          ],
        },
        {
          id: 'l-rng-blockers',
          slug: 'bloqueadores',
          title: 'Bloqueadores',
          summary:
            'Las cartas que tienes en la mano cambian lo que puede tener el rival.',
          kind: 'lesson',
          minutes: 8,
          xp: 30,
          blocks: [
            {
              type: 'paragraph',
              text: 'Si tienes el as de picas, el rival no puede tener el color máximo de picas. Esa información, en decisiones ajustadas del river, decide la mano.',
            },
            {
              type: 'spot',
              hole: 'As 5h',
              board: 'Ks 9s 4h 2d 7s',
              question:
                'Buscabas la rueda (te faltaba el 3) y no ha llegado. El river trae la tercera pica y el rival pasa. ¿Faroleas?',
              answer:
                'Sí, es un farol excelente. Con as alto casi nunca ganas en showdown, así que no pierdes nada al apostar. Y tienes el as de picas: el rival no puede tener el color máximo, solo colores más débiles que le cuesta pagar ante una apuesta grande. Además, tu apuesta cuenta una historia creíble: el color que acaba de llegar.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'El criterio del farol',
              text: 'Los mejores faroles se hacen con manos que no ganan nunca en showdown y que bloquean las manos fuertes del rival. Farolear con la peor mano de tu rango, no con la segunda mejor.',
            },
          ],
        },
        {
          id: 'l-rng-unblockers',
          slug: 'blockers-vs-unblockers',
          title: 'Blockers vs Unblockers',
          summary:
            'No basta con bloquear las nuts: hay que no bloquear los folds del rival.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un **blocker** reduce las combos fuertes del rival. Un **unblocker** evita reducir las combos débiles que quieres que se retire. El farol perfecto bloquea lo que te paga y no bloquea lo que se retira.',
            },
            {
              type: 'table',
              headers: ['Tu mano en K♠ 9♠ 4♥ 2♦ 7♠', 'Bloquea', 'No bloquea', 'Conclusión'],
              rows: [
                ['A♠5♥', 'El color máximo (A♠ con otra pica), que nunca se retira', 'Sus parejas medias y sus proyectos de escalera fallidos', 'Excelente farol: quita pagos y deja intactos sus folds'],
                ['8♥6♥', 'Sus proyectos de escalera fallidos (T-8, 8-6, 6-5), que ya se retirarían', 'Ninguna mano fuerte', 'Malo: bloqueas sus folds'],
                ['Q♣J♣', 'K-Q y K-J, que pagan con top pair', 'Sus colores y sus proyectos fallidos', 'Buen farol aunque no tenga el A♠: quita pagos'],
              ],
            },
            {
              type: 'spot',
              hole: 'As 5h',
              board: 'Ks 9s 4h 2d 7s',
              question: '¿Por qué A♠5♥ es mejor farol que 8♥6♥ en esta mesa?',
              answer:
                'Ninguna de las dos gana en showdown, pero no bloquean lo mismo. A♠5♥ quita del rango del rival el color máximo, la mano que nunca se retira, y deja intactos sus proyectos fallidos, que se retiran. 8♥6♥ hace justo lo contrario: no quita ningún pago y bloquea los proyectos de escalera fallidos (T-8, 8-6, 6-5) que querías que se retiraran.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Pregunta profesional',
              text: 'Antes de farolear pregúntate: ¿qué parte del rango de call bloqueo y qué parte del rango de fold bloqueo? Si bloqueas más folds que calls, ese farol es perdedor aunque "tengas blocker".',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'River farol, tu mano tiene el A♥ y el board tiene tres corazones. ¿Es buen blocker?',
                  options: [
                    'Sí: bloquea el nuts rival y no bloquea sus folds',
                    'No: bloquea los folds',
                    'Da igual',
                    'Solo si tienes pareja',
                  ],
                  answerIndex: 0,
                  explanation:
                    'El as del color bloquea la mano que nunca se retira y deja intactas las manos que sí lo hacen. Es el blocker ideal.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-rng-construction',
          slug: 'construccion-de-rangos',
          title: 'Construcción de rangos',
          summary:
            'De "tengo top pair" a "así se distribuye mi rango completo aquí".',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un rango no es una lista de manos: es una distribución. En cada calle tu rango tiene una parte de valor, una de farol/semifarol y una de control (check atrás o check/call). Una apuesta sin pensar en esas tres partes desbalancea todo lo demás.',
            },
            {
              type: 'table',
              headers: ['Tipo de rango', 'Composición', 'Ejemplo en river'],
              rows: [
                ['Polarizado', 'Nuts + aire, nada medio', 'Overbet: sets + faroles con A♠ blocker'],
                ['Lineal (merged)', 'De lo mejor hacia abajo, continuo', 'Apuesta pequeña 33% con top pair + segunda pareja'],
                ['Condensado (capped)', 'Sin nuts; techo limitado', 'Check tras pasar flop/turn: no tienes A-A ni sets'],
                ['Uncapped', 'Con nuts incluidas', 'Apuesta grande: aún puedes tener todo'],
              ],
            },
            {
              type: 'paragraph',
              text: 'Un rango **capado** es el que, por tu línea, ya no puede tener las mejores manos. Ejemplo: pagas preflop, pasas flop y turn: tu rango ya no tiene sets. Un rival atento lo ataca con overbets. Por eso a veces se mezcla (slowplay) alguna mano fuerte en líneas pasivas.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El error de construir mano a mano',
              text: 'Pensar "aquí tengo top pair, apuesto" sin mirar tu rango te lleva a apostar siempre con manos medias y nunca tener manos medias al pasar. Tu rango de check queda tan débil que cualquier apuesta rival te explota.',
            },
            {
              type: 'spot',
              hole: 'Kh Qh',
              board: 'Ks 7d 2c 4s 9h',
              question: 'River K-7-2-4-9. Tienes KQ y tu rango aún tiene AA, sets y KQ. ¿Apuestas pequeño o grande?',
              answer:
                'Pequeño (33-50%) como rango lineal: tu valor es top pair, no nuts; tu farol son draws fallidos con Q♠. Overbet aquí polarizaría y dejaría fuera a las manos medias que sí pagan fino. Reserva overbet para cuando tu rango aún contiene sets/nuts.',
            },
          ],
        },
        {
          id: 'l-rng-combos',
          slug: 'conteo-de-combos',
          title: 'Combo counting: contando combinaciones',
          summary:
            'De las "manos que puede tener" a los "16 de AK, 6 de cada pareja" y la decisión final.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Cada mano tiene un número fijo de combos: 6 por pareja, 4 por suited, 12 por offsuit (16 si juntas ambas). Contar combos convierte "¿tendrá set?" en "tiene 6 combos de sets, 12 de top pair, 8 de draws fallidos: ¿con qué frecuencia estoy delante?".',
            },
            {
              type: 'table',
              headers: ['Mano rival posible', 'Combos sin bloqueo', 'Con tu blocker', 'Pesa en su rango'],
              rows: [
                ['Sets (88, 44)', '6+6=12', 'Si tienes 8♣, 44 queda en 3', 'Valor que nunca se retira'],
                ['Top pair A-Q', '12 (AQo)', 'Si tienes Q, baja a ~9', 'Valor que paga fino'],
                ['Draws fallidos corazón', '8', 'Si tienes A♠, no cambia mucho', 'Faroles que se retiran vs tu bet'],
              ],
            },
            {
              type: 'spot',
              hole: 'Ad Qc',
              board: 'Qs 7h 5c 2d 9s',
              question:
                'River Q-7-5-2-9. Rival apuesta bote. Estimas que llega con 6 combos de sets, 12 de top pair y 8 de draws fallidos. ¿Pagas con AQ?',
              answer:
                'Su valor son 18 combos (6 sets + 12 top pair) y sus bluffs 8. Ganarás a 8 de 26 combos ~31%. Necesitas pagar 100 para ganar 200 → 33% requerido. Es fold ajustado. Si además bloqueas Q (tienes Q), su valor baja a ~14 combos y el call mejora: ese es el efecto del blocker en el conteo.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'MDF + combos = defensa real',
              text: 'La MDF te dice cuánto defender en teoría (50% vs bote). El conteo de combos te dice contra quién: si su rango tiene pocos bluffs, defiende menos que MDF; si tiene muchos, defiende más. La teoría guía, los combos deciden.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-bluff',
      slug: 'farol-y-semifarol',
      title: 'Farol y semifarol',
      summary:
        'El farol no es intuición: es una decisión con frecuencia, historia y bloqueadores.',
      level: 'advanced',
      icon: 'Drama',
      outcomes: [
        'Construir faroles creíbles calle a calle',
        'Distinguir farol puro de semifarol',
        'Elegir qué manos convertir en farol',
      ],
      lessons: [
        {
          id: 'l-bluff-anatomy',
          slug: 'anatomia-de-un-farol',
          title: 'Anatomía de un buen farol',
          summary: 'Las cuatro condiciones que deben cumplirse a la vez.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'list',
              ordered: true,
              items: [
                'Tu historia es coherente: las cartas que representas encajan con cómo has jugado desde preflop.',
                'El rival puede retirarse: nunca farolees a quien paga todo.',
                'El board permite manos fuertes: si nada mejoró, tu apuesta no representa nada.',
                'Tienes bloqueadores o ninguna opción de ganar en showdown.',
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'El farol sin historia',
              text: 'Pasar en flop y turn y de repente apostar el bote en el river casi nunca funciona contra un jugador competente: ninguna mano fuerte se juega así. El farol se construye desde preflop, no se improvisa en el river.',
            },
          ],
        },
        {
          id: 'l-bluff-semi',
          slug: 'el-semifarol',
          title: 'El semifarol',
          summary:
            'Apostar con una mano que todavía puede mejorar: dos formas de ganar en una.',
          kind: 'lesson',
          minutes: 8,
          xp: 30,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un semifarol es una apuesta con una mano que ahora mismo no gana, pero que tiene outs para convertirse en la mejor. Gana si el rival se retira, y también si liga. Por eso es la apuesta más rentable del juego.',
            },
            {
              type: 'spot',
              hole: 'Jh Th',
              board: 'Qh 9c 2h',
              question:
                'Proyecto de color más escalera abierta. ¿Apuestas o pasas?',
              answer:
                'Apuestas, y grande. Tienes 15 outs (54% de ligar antes del river). Si el rival se retira, ganas ya. Si paga, sigues siendo casi favorito. Es el semifarol de manual.',
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Orden de preferencia para farolear',
              text: '1) Proyectos fuertes (semifarol). 2) Manos sin showdown con bloqueadores. 3) Nada más. Las manos medianas se pasan: tienen algo de valor y no necesitan farolear.',
            },
          ],
        },
        {
          id: 'l-bluff-drill',
          slug: 'practica-de-agresion',
          title: 'Práctica: agresión controlada',
          summary: 'Mesa dura donde los faroles automáticos se castigan.',
          kind: 'drill',
          minutes: 22,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Rivales de nivel avanzado: TAGs y LAGs que pagan con manos medianas y suben tus apuestas débiles. Cada farol tiene que cumplir las cuatro condiciones.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 30 manos faroleando solo con historia coherente',
              hands: 30,
            },
          ],
        },
      ],
    },
    {
      id: 'c-river',
      slug: 'juego-de-river',
      title: 'Juego de river',
      summary:
        'La calle final: valor fino, faroles con blockers y cómo defender sin regalar.',
      level: 'advanced',
      icon: 'Waves',
      outcomes: [
        'Elegir entre valor fino, polarizar y pasar',
        'Seleccionar faroles con blockers y unblockers',
        'Pagar como bluff-catcher con pot odds y frecuencia rival',
      ],
      lessons: [
        {
          id: 'l-river-value',
          slug: 'value-betting-river',
          title: 'Value betting en river',
          summary: 'Thin value, polarización y value targeting: qué manos cobran y a quién.',
          kind: 'lesson',
          minutes: 10,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'En river ya no hay cartas por venir: tu apuesta solo cobra si una mano peor paga. Antes de apostar haz dos listas: qué manos peores te pagan y qué manos mejores te pagan. Si la primera no compensa, tu "value bet" es un bluff caro.',
            },
            {
              type: 'table',
              headers: ['Tipo de value', 'Tamaño', 'Cuándo'],
              rows: [
                ['Thin value', '33-50% bote', 'Tu mano gana a más de la mitad del rango de pago rival (ej. AQ en Q-7-2-4-9 vs A-T, 8-8)'],
                ['Value polarizado', '75-150% bote', 'Tienes nuts o casi: quieres que paguen manos fuertes de segundo nivel'],
                ['Value targeting', 'Ajustado al rival', 'Contra calling station: más fino y más grande; contra nit: solo nuts'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El test de las dos listas',
              text: 'Si no puedes nombrar al menos 3 combos peores que pagan, no es apuesta de valor. Pasar y llegar a showdown es más rentable que convertir tu mano media en farol sin querer.',
            },
            {
              type: 'spot',
              hole: 'Ah Jd',
              board: 'Ac 8s 4h 2d 7c',
              question: 'River A-8-4-2-7. Tienes AJ, rival pagó dos calles. ¿Apuestas?',
              answer:
                'Sí, pero pequeño (un tercio). Te pagan A-9, A-T, 8-x y parejas medias. A-K/A-Q te ganan pero son menos combos que los peores que sí pagan. Apostar grande solo aísla contra mejor.',
            },
          ],
        },
        {
          id: 'l-river-bluff',
          slug: 'farol-en-river',
          title: 'Farol en river: selección con blockers',
          summary: 'Qué faroles elegir, por qué los draws fallidos no son todos iguales y el papel del blocker.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Casi todos los buenos faroles de river son proyectos fallidos, pero no todos valen igual. Elige los que bloquean el rango de call fuerte y no bloquean el rango de fold.',
            },
            {
              type: 'table',
              headers: ['Candidato a farol', 'Bloquea', 'No bloquea', 'Veredicto'],
              rows: [
                ['A♠5♥ en K♠9♠4♥2♦7♠', 'El color máximo', 'Sus proyectos fallidos', 'Excelente farol'],
                ['8♥6♥ en la misma mesa', 'Proyectos de escalera fallidos que ya se retirarían', 'Sus colores', 'Malo: bloqueas sus folds'],
                ['Q♣J♣ en la misma mesa', 'K-Q y K-J, que pagan', 'Sus proyectos fallidos', 'Bueno: quita pagos sin quitar folds'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Missed draws con blocker',
              text: 'Los mejores faroles combinan: mano que nunca gana en showdown + blocker de nuts rival + unblocker de sus folds. Farolear con segunda pareja es quemar valor.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Tienes segunda pareja en river y la conviertes en farol. ¿Es buena idea?',
                  options: ['Sí, siempre', 'No: esa mano gana a veces en showdown, no la conviertas', 'Solo si es suited', 'Solo OOP'],
                  answerIndex: 1,
                  explanation:
                    'Una mano con showdown medio no necesita farolear: ya gana contra parte de su rango. Farolea con aire que nunca gana, no con valor medio.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-river-catch',
          slug: 'bluff-catching',
          title: 'Bluff catching: cuándo pagar',
          summary: 'Pot odds, combos rivales y frecuencia de farol: la defensa matemática.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Pagar como bluff-catcher es una decisión de pot odds contra su frecuencia de farol. Calcula: precio que te dan vs. cuántos combos de valor y cuántos de farol tiene. Sin esa cuenta, pagar es adivinar.',
            },
            {
              type: 'table',
              headers: ['Apuesta rival', 'Precio a pagar', 'Faroles necesarios para pagar'],
              rows: [
                ['33% bote', '20%', 'Necesita 1 farol por cada 4 valor'],
                ['66% bote', '28%', '1 farol por cada 2,5 valor'],
                ['Bote completo', '33%', '1 farol por cada 2 valor'],
                ['Overbet 150%', '37%', 'Casi 1 farol por cada 1,5 valor'],
              ],
            },
            {
              type: 'spot',
              hole: 'Kc Qc',
              board: 'Kh 9d 4c 2s As',
              question: 'River A, rival TAG apuesta bote tras pasar turn. ¿Pagas KQ?',
              answer:
                'Es rango polarizado: AK, AA, KK, 99 por valor y QJ de corazones fallido como farol. Tu KQ gana a faroles y pierde contra todo valor. Si estimas que tiene pocos faroles aquí, es fold; si tiene muchos, es call. Sin lectura, la cuenta de combos manda.',
            },
          ],
        },
        {
          id: 'l-river-overbet',
          slug: 'overbet-y-river-raises',
          title: 'Overbets y river raises',
          summary: '125-200%+ del bote, por qué polariza y cómo defender.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un overbet polariza: son nuts o aire, sin manos medias. Funciona cuando tienes gran ventaja de nuts (ej. tu rango tiene todos los colores y el rival ninguno) y quieres cobrar máximo o farolear con respaldo de blocker.',
            },
            {
              type: 'table',
              headers: ['Situación de overbet', 'Quién lo usa', 'Cómo defender'],
              rows: [
                ['Board A♠K♠Q♥J♦2♠: tu rango tiene todos los colores', 'Agresor con nut advantage', 'Retírate con bluff-catchers medios; paga con nuts y blocker'],
                ['River raise como farol', 'Rival que nunca farolea river', 'Fold más que MDF: su raise es valor casi siempre'],
                ['River raise por valor', 'Tienes nuts vs top pair rival', 'Raise pequeño 2,2x si quieres pago; grande si polarizas'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'No overbetees sin nut advantage',
              text: 'Sin ventaja de nuts, tu overbet es transparente: el rival paga con manos fuertes y se retira con todo lo que querías que pagara pequeño. El tamaño debe contar una historia que tu rango respalde.',
            },
          ],
        },
        {
          id: 'l-river-drill',
          slug: 'practica-river',
          title: 'Práctica: river complejo',
          summary: 'Decide entre thin value, farol con blocker, bluff-catch y overbet.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Mesa 6-max con rivales polarizados. Cada river te da pot odds, lectura de nut advantage y tu mano con o sin blocker. Elige la línea que tu rango respalde, no la que tu mano sugiere aislada.',
            },
            {
              type: 'drill',
              mode: 'bluff-catch',
              seats: 6,
              goal: 'Juega 30 rivers eligiendo valor fino, farol, bluff-catch u overbet',
              hands: 30,
            },
          ],
        },
      ],
    },
    {
      id: 'c-lines',
      slug: 'lineas-avanzadas',
      title: 'Líneas avanzadas: donk, check-raise y overbet',
      summary: 'Las líneas que rompen el guion: donk, check-raise en las tres calles y overbet teórico.',
      level: 'advanced',
      icon: 'Zap',
      outcomes: [
        'Usar check-raise en flop, turn y river con valor y semibluff',
        'Saber cuándo el donk bet tiene sentido teórico',
        'Construir y defender overbets con nut advantage',
      ],
      lessons: [
        {
          id: 'l-lines-checkraise',
          slug: 'check-raise',
          title: 'Check-raise en flop, turn y river',
          summary: 'No es solo flop: el check-raise de turn y river es más fuerte porque queda menos equity por realizar.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'El check-raise es pasar con intención de subir si el rival apuesta. Es la línea defensiva de OOP por excelencia: niega la apuesta gratis de IP y construye bote con tus manos fuertes.',
            },
            {
              type: 'table',
              headers: ['Calle', 'Con valor', 'Como farol/semifarol', 'Tamaño'],
              rows: [
                ['Flop', 'Sets, dobles, overpairs', 'Proyectos 8+ outs, backdoors con overcard', '2,5-3x la apuesta rival'],
                ['Turn', 'Dobles+, sets', 'Proyectos que mantienen equity (15 outs)', '2,2-2,8x; más fold equity'],
                ['River', 'Nuts o cerca', 'Aire con blocker que nunca gana en showdown', '2,5x o all-in si polarizas'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Check-raise OOP es obligatorio',
              text: 'Si nunca haces check-raise, IP apuesta cada vez que pasas y tu rango de check se vuelve explotable. Necesitas al menos 10-15% de check-raises con valor y bluffs balanceados.',
            },
            {
              type: 'spot',
              hole: '9h 8h',
              board: '7s 6h 2c',
              question: 'Flop 7-6-2, tienes proyecto escalera abierta + backdoor color. Rival IP apuesta 33%. ¿Check-raise?',
              answer:
                'Sí, como semibluff OOP. Tienes 8 outs directos + overcards, blockers de escalera rival y fold equity alta en board bajo que favorece tu rango de defensa de ciega. Si te pagan, aún ligas 30%+.',
            },
          ],
        },
        {
          id: 'l-lines-donk',
          slug: 'donk-bet',
          title: 'Donk bet: cuándo liderar fuera de posición',
          summary: 'Históricamente mal visto, hoy tiene nichos donde es la mejor línea.',
          kind: 'lesson',
          minutes: 9,
          xp: 30,
          blocks: [
            {
              type: 'paragraph',
              text: 'Donk bet es apostar fuera de posición contra quien fue el agresor de la calle anterior. La mayoría de boards es check, pero en algunos tu rango tiene tanta ventaja que liderar es superior.',
            },
            {
              type: 'table',
              headers: ['Board', 'Ventaja', 'Donk tiene sentido', 'Ejemplo'],
              rows: [
                ['7♣6♦5♥', 'Defensor (conectado)', 'Sí: tienes muchas escaleras y dobles', 'BB defiende y lidera: protege equity'],
                ['A♣9♣4♣ (monocolor)', 'Defensor si tiene muchos suited', 'Sí, pequeño', 'Donk 33% con color y draws'],
                ['A♥K♦4♣', 'Agresor', 'No: tu rango no tiene ventaja', 'Check todo tu rango'],
                ['K♠K♦8♣ (pareado alto)', 'Repartida', 'Raro: mejor check-raise que donk', 'Donk solo vs rival que pasa atrás mucho'],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Solver vs exploit',
              text: 'Los solvers donkean poco y pequeño. En vivo/online micro, muchos IP pasan atrás demasiado: el donk fino roba equity. Ajusta a la tendencia del pool, no a la teoría pura.',
            },
          ],
        },
        {
          id: 'l-lines-overbet',
          slug: 'overbet',
          title: 'Overbet: polarización máxima',
          summary: '125%, 150%, 200%+: boards, nut advantage y construcción de rango overbet.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Overbet es apostar más que el bote. Solo lo hace un rango polarizado: nuts o aire. Necesitas gran ventaja de nuts para que el rival no pueda pagar con manos medias.',
            },
            {
              type: 'table',
              headers: ['Overbet', 'Necesita', 'Ejemplo de board', 'Manos'],
              rows: [
                ['125% bote', 'Buena nut advantage', 'Q♥J♦T♠K♣: tu rango tiene todas las escaleras altas', 'Escalera nuts + faroles con blocker de color'],
                ['150-200%', 'Gran nut advantage', 'A♠9♠4♠2♦: tu rango tiene todos los colores nuts', 'Color nuts + bluffs con A♠'],
                ['Defensa vs overbet', 'No pagues bluff-catchers medios', 'Retírate más que MDF', 'Paga solo nuts y blockers que reducen valor rival'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Defensa contra overbet',
              text: 'Frente a overbet, tu MDF baja (vs 150% bote necesitas defender 40%). Pero si tu mano no bloquea sus nuts y sí bloquea sus faroles, retírate incluso más: el sizing grande ya te dice que su rango está polarizado.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-multiway',
      slug: 'juego-multiway',
      title: 'Juego multiway',
      summary: '3+ jugadores: por qué la estrategia heads-up no sirve y cómo ajustar sizing, valor y farol.',
      level: 'advanced',
      icon: 'Users2',
      outcomes: [
        'Entender por qué equity y fold equity se diluyen multiway',
        'Ajustar c-bet, value betting y faroles a bote multiway',
        'Jugar posición y SPR multiway',
      ],
      lessons: [
        {
          id: 'l-multi-concept',
          slug: 'multiway-concepto',
          title: 'Multiway no es heads-up con público',
          summary: 'Cada rival extra multiplica la probabilidad de que alguien haya ligado.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Con un solo rival, top pair es nuts a menudo. Con dos, alguien tiene dos parejas o set con frecuencia creciente. Tu equity baja, tu fold equity se reparte entre varios y tu realización empeora: necesitas manos más fuertes para apostar.',
            },
            {
              type: 'table',
              headers: ['Concepto heads-up', 'Ajuste multiway'],
              rows: [
                ['C-bet 66% flop con aire', 'Check: alguien ha ligado o tiene proyecto fuerte'],
                ['Semibluff 15 outs', 'Check o apuesta pequeña: necesitas que se retiren varios'],
                ['Thin value 50% river', 'Check atrás: el segundo rival paga con mejor'],
                ['Bluff catch vs bote', 'Fold más: dos rangos tienen menos faroles combinados'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Regla de oro multiway',
              text: 'Sin nuts o proyecto con 12+ outs, tu mano es bluff-catcher. No construyas bote grande multiway con una pareja, por muy bonita que parezca.',
            },
          ],
        },
        {
          id: 'l-multi-sizing',
          slug: 'sizing-multiway',
          title: 'Sizing y posición multiway',
          summary: 'Botes más grandes, tamaños más grandes y la posición multiplica su valor.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Multiway el bote ya es grande preflop, así que SPR baja y el compromiso sube. IP multiway es oro: ves acción de varios antes de decidir. OOP multiway es el peor spot del poker: check con casi todo tu rango medio.',
            },
            {
              type: 'table',
              headers: ['Spot multiway', 'IP', 'OOP'],
              rows: [
                ['Top pair buen kicker', 'Bet pequeño por valor/cargo a draws', 'Check/call una calle, reevalúa'],
                ['Proyecto nuts', 'Bet grande como semibluff con fold equity real', 'Check-raise si alguien apuesta'],
                ['Mano sin equity', 'Check atrás gratis; no bluffees a varios', 'Check/fold'],
              ],
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Flop K♥7♦2♠, 3 jugadores, tienes KQ. Eres agresor OOP. ¿C-bet?',
                  options: ['Sí, bote', 'Sí, un tercio', 'Check', 'All-in'],
                  answerIndex: 2,
                  explanation:
                    'Multiway y OOP con top pair es check: alguien tiene set o dos parejas más a menudo, y construir bote grande sin posición es el error más caro multiway.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'c-ip-oop',
      slug: 'juego-en-posicion-vs-fuera',
      title: 'Juego en posición vs fuera (IP vs OOP) avanzado',
      summary: 'Pot control, rango de check y agresión retrasada: la posición como plan completo.',
      level: 'advanced',
      icon: 'Compass',
      outcomes: [
        'Construir rango de check OOP que no sea explotable',
        'Ejecutar pot control, delayed c-bet y probes con criterio',
        'Ajustar frecuencias según SPR y textura',
      ],
      lessons: [
        {
          id: 'l-ip-oop-adv',
          slug: 'ip-vs-oop-avanzado',
          title: 'IP vs OOP: el plan de las tres calles',
          summary: 'Check range, pot control y por qué OOP necesita un rango de check fuerte.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'IP decides el precio final: puedes pasar atrás, apostar pequeño o grande tras ver acción. OOP decides sin información. Por eso OOP tu rango de check debe contener manos fuertes, medias y draws: si solo pasas con manos débiles, IP apuesta cada vez.',
            },
            {
              type: 'table',
              headers: ['Concepto', 'IP (en posición)', 'OOP (fuera de posición)'],
              rows: [
                ['Pot control', 'Pasar atrás con showdown medio', 'Check/call con showdown medio; no bet/fold'],
                ['Thin value', 'Apuesta fina tras check rival', 'Check/raise fino si el rival apuesta; si no, check atrás IP'],
                ['Delayed aggression', 'Delayed c-bet turn tras check flop', 'Probe turn tras check-check flop'],
                ['Protección', 'Menos necesaria: ves antes', 'Check-raise con draws para negar equity gratis'],
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Donkear por "proteger" es el error OOP más común',
              text: 'Apostar OOP "para que no ligue" con pareja media solo te aísla contra mejor y tiras a peor. Protege con check-raise, no con donk pequeño sin rango detrás.',
            },
            {
              type: 'spot',
              hole: 'Jd Th',
              board: 'Qh 9c 2d Ks',
              question: 'Flop Q-9-2, check atrás IP con proyecto; turn K. Rival OOP pasa. ¿Juegas como IP?',
              answer:
                'Sí, delayed c-bet pequeño. El K es overcard que favorece tu rango de check atrás y el rival mostró debilidad dos veces. OOP, la misma situación sería probe: tu check flop no mostró debilidad, ahora lideras turn.',
            },
          ],
        },
      ],
    },
    {
      id: 'c-preflop-arch',
      slug: 'arquitectura-preflop',
      title: 'Arquitectura preflop',
      summary:
        'Un sistema para cada decisión antes del flop: quién abre, quién defiende y con qué.',
      level: 'advanced',
      icon: 'Network',
      outcomes: [
        'Abrir el rango correcto desde cada posición',
        'Defender la ciega grande según quién abre y con qué tamaño',
        'Decidir entre cold call, 3-bet y fold frente a un open',
        'Castigar a los limpers con un iso-raise',
      ],
      lessons: [
        {
          id: 'l-pfa-architecture',
          slug: 'arquitectura-preflop',
          title: 'Arquitectura preflop',
          summary:
            'El preflop no son manos sueltas: es un árbol de decisiones con rangos en cada rama.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Casi todo el dinero que se gana o se pierde postflop se decide antes: con qué manos entras, desde dónde y contra quién. La arquitectura preflop es el mapa de esas decisiones. Cada situación tiene un rango asignado, y cada rango se construye pensando en lo que puede venir después.',
            },
            {
              type: 'heading',
              text: 'El árbol de decisiones',
            },
            {
              type: 'list',
              ordered: true,
              items: [
                '**Nadie ha entrado (RFI):** subir o retirarse. El open limp no forma parte del sistema.',
                '**Hay limpers:** aislar con una subida, pagar detrás con manos especulativas en posición, o retirarse.',
                '**Hay un open:** pagar (cold call), resubir (3-bet) o retirarse.',
                '**Te hacen 3-bet:** 4-bet, pagar o retirarse.',
                '**Te hacen 4-bet:** 5-bet (normalmente all-in), pagar o retirarse.',
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Cada nodo tiene tres salidas',
              text: 'En todas las ramas hay una opción agresiva, una pasiva y el fold. Un rango sano reparte sus manos entre las tres: si una de ellas está vacía, el rival lo nota y te explota por ahí.',
            },
            {
              type: 'heading',
              text: 'Los tamaños de referencia',
            },
            {
              type: 'table',
              headers: ['Situación', 'Tamaño habitual (100 ciegas)', 'Por qué'],
              rows: [
                [
                  'Open desde UTG-BTN',
                  '2,2–2,5 ciegas',
                  'Arriesgas poco para robar las ciegas',
                ],
                [
                  'Open desde la SB',
                  '3 ciegas',
                  'Juegas fuera de posición: le das peor precio a la BB',
                ],
                [
                  'Iso-raise contra limpers',
                  '3 ciegas + 1 por limper',
                  'Los limpers pagan: el bote tiene que valer la pena',
                ],
                [
                  '3-bet en posición',
                  '3 veces el open',
                  'La posición compensa un tamaño menor',
                ],
                [
                  '3-bet fuera de posición',
                  '4 veces el open',
                  'Quieres menos pagos y botes que se deciden antes',
                ],
                [
                  '4-bet',
                  '2,2–2,5 veces el 3-bet',
                  'Deja espacio para retirarse sin comprometer el stack',
                ],
                [
                  '5-bet',
                  'All-in',
                  'A 100 ciegas ya no queda margen para otra cosa',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'La profundidad cambia el árbol',
              text: 'Todo este bloque asume 100 ciegas efectivas. Con 40 ciegas el 3-bet suele ser all-in y desaparece el 4-bet de farol; con 200 ciegas los 4-bets se estrechan y las manos suited ganan valor porque hay más fichas que cobrar cuando ligan.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Te llega la acción en el cutoff y todos se han retirado. ¿Qué opciones contempla la arquitectura preflop?',
                  options: [
                    'Subir, pagar o retirarse',
                    'Subir o retirarse',
                    'Solo subir',
                    'Pagar o retirarse',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Con el bote sin abrir, la estrategia es subir o retirarse. Entrar pagando (open limp) te quita la iniciativa, invita a las ciegas a jugar baratas y hace transparente tu rango.',
                },
                {
                  id: 'q2',
                  question:
                    '¿Por qué el 3-bet fuera de posición es más grande que en posición?',
                  options: [
                    'Porque así se gana más cuando te pagan',
                    'Porque fuera de posición quieres menos pagos y que el bote se decida antes del flop',
                    'Porque las ciegas obligan a subir más',
                    'No hay diferencia de tamaño',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Fuera de posición realizas peor tu equity. Un tamaño mayor reduce las manos con las que el rival te paga en posición y hace que más botes se resuelvan preflop, donde la posición no importa.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pfa-open',
          slug: 'rango-de-open-raise',
          title: 'Rango de open raise por posición',
          summary:
            'UTG, HJ, CO, BTN y SB: cuánto se abre desde cada asiento y por qué.',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'El open raise (o RFI, raise first in) es la primera subida de la mano. Su rango depende de una sola cosa: **cuántos jugadores quedan por actuar detrás de ti**. Cada jugador extra es una probabilidad más de que alguien tenga una mano mejor, y una posibilidad más de acabar jugando fuera de posición (OOP).',

            },
            {
              type: 'table',
              headers: ['Posición', 'Rango', '% de manos', 'Idea'],
              rows: [
                [
                  'UTG',
                  '22+, A2s+, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo',
                  '16%',
                  'Quedan cinco jugadores detrás: el rango más estrecho',
                ],
                [
                  'HJ',
                  '22+, A2s+, K8s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, ATo+, KJo+, QJo',
                  '20%',
                  'Entran conectores suited y broadways offsuit',
                ],
                [
                  'CO',
                  '22+, A2s+, K5s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, 65s, 54s, A8o+, KTo+, QTo+, JTo',
                  '28%',
                  'Solo quedan botón y ciegas: se abre un tercio largo',
                ],
                [
                  'BTN',
                  '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K8o+, Q9o+, J9o+, T8o+, 98o, 87o',
                  '46%',
                  'Posición garantizada postflop: casi la mitad de las manos',
                ],
                [
                  'SB',
                  '22+, A2s+, K3s+, Q5s+, J7s+, T7s+, 97s+, 86s+, 75s+, 64s+, 54s, A2o+, K9o+, Q9o+, J9o+, T9o',
                  '39%',
                  'Solo queda la BB, pero juegas fuera de posición',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Del UTG al botón, el rango se triplica',
              text: 'No es que en el botón las manos sean mejores: es que hay menos gente para despertar con una mano fuerte y, si te pagan, jugarás en posición toda la mano. Las manos que se añaden son las que más dependen de la posición: suited conectadas, ases débiles y broadways offsuit.',
            },
            {
              type: 'range',
              id: 'open-co',
            },
            {
              type: 'heading',
              text: 'Manos frontera',
            },
            {
              type: 'hands',
              items: [
                {
                  cards: 'Ks 9s',
                  label: 'K9s',
                  note: 'Open desde UTG: la última suited con rey que aguanta cinco jugadores detrás.',
                },
                {
                  cards: 'Ad Th',
                  label: 'ATo',
                  note: 'Fold en UTG, open desde HJ: dominada por AJ+ cuando te pagan desde atrás.',
                },
                {
                  cards: '7h 5h',
                  label: '75s',
                  note: 'Entra desde el CO: realiza bien su equity en posición.',
                },
                {
                  cards: 'Kc 8d',
                  label: 'K8o',
                  note: 'Solo desde el botón: offsuit y sin conexión necesita la posición garantizada.',
                },
              ],
            },
            {
              type: 'spot',
              hole: 'Qh 9h',
              question: 'Estás en UTG en una mesa de 6 y te llega Q9s. ¿Abres?',
              answer:
                'No. Q9s entra a partir del HJ. Desde UTG quedan cinco jugadores detrás, y cuando te pagan o te resuben lo hacen con rangos que dominan a Q9: QJ, QT, KQ, AQ. En el HJ ya es un open estándar.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'La SB no es "una posición tardía más"',
              text: 'Desde la SB solo queda la BB, así que el rango es ancho, pero no tanto como en el botón: jugarás todo el postflop fuera de posición. Por eso se abre más grande (3 ciegas) y algo más estrecho. El capítulo «SB vs BB» lo desarrolla a fondo.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Qué mano abres desde el CO pero NO desde el HJ?',
                  options: ['AJo', '76s', 'K6s', 'QJo'],
                  answerIndex: 2,
                  explanation:
                    'K6s entra en el rango del CO (K5s+) pero no en el del HJ (K8s+). AJo, 76s y QJo ya se abren desde el HJ.',
                },
                {
                  id: 'q2',
                  question:
                    'Abres desde el botón y la ciega grande te paga. ¿Qué ventaja tienes durante toda la mano?',
                  options: [
                    'Mejor mano',
                    'Iniciativa y posición',
                    'Pot odds',
                    'Ninguna',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Llevas la iniciativa de la subida y actuarás último en flop, turn y river. Esa combinación es la que permite abrir casi la mitad de las manos desde el botón.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pfa-open-drill',
          slug: 'practica-open-raise',
          title: 'Práctica: open raise por posición',
          summary:
            'Botes sin abrir en mesa de 6: sube el rango de tu posición, retira el resto.',
          kind: 'drill',
          minutes: 18,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'El corrector solo mira los botes que nadie ha abierto antes que tú. Cada decisión se compara con la tabla de la clase: abrir fuera de rango, retirar una mano del rango y entrar pagando cuentan como error.',
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'Antes de mirar las cartas',
              text: 'Mira primero tu posición. Decide qué rango te toca y solo entonces comprueba si tu mano está dentro. Es el hábito que se está entrenando.',
            },
            {
              type: 'drill',
              mode: 'open-raise',
              seats: 6,
              goal: 'Juega 40 manos abriendo solo el rango de cada posición',
              hands: 40,
            },
          ],
        },
        {
          id: 'l-pfa-bb',
          slug: 'defensa-de-la-ciega-grande',
          title: 'Rango de defensa de la BB',
          summary:
            'Contra el botón, el cutoff y la ciega pequeña, y cómo cambia con el tamaño del open.',
          kind: 'lesson',
          minutes: 12,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'La ciega grande es la posición desde la que más se pierde, y es inevitable: pagas una ciega a ciegas cada vuelta. El objetivo no es ganar desde la BB, sino **perder lo menos posible**. Y eso se consigue defendiendo mucho más de lo que parece natural.',
            },
            {
              type: 'heading',
              text: 'Por qué se defiende tan ancho',
            },
            {
              type: 'list',
              items: [
                'Ya tienes una ciega dentro: pagar un open de 2,5 ciegas cuesta solo 1,5 más.',
                'Cierras la acción: nadie puede resubir detrás de ti.',
                'El que abre desde el botón arriesga 2,5 ciegas para ganar 1,5: necesita que las ciegas se retiren más del 62% de las veces. Si defiendes poco, cualquier mano le da beneficio.',
              ],
            },
            {
              type: 'table',
              headers: ['Open de', 'Defensa total', '3-bet', 'Idea'],
              rows: [
                [
                  'BTN',
                  '54%',
                  '99+, ATs+, KJs+, AJo+, KQo, A5s-A2s, K8s, Q9s, J9s, T8s, 65s',
                  'Rango de open muy ancho: defiende más de la mitad',
                ],
                [
                  'CO',
                  '38%',
                  'TT+, AJs+, AQo+, KQs, A5s-A3s, K9s, Q9s, 76s',
                  'Algo más fuerte que el botón: se caen los offsuit débiles',
                ],
                [
                  'SB',
                  '58%',
                  '88+, A8s+, KTs+, QJs, ATo+, KJo+, A5s-A2s, K5s, Q8s, J8s, 64s',
                  'Solo compites con él y juegas en posición',
                ],
                [
                  'UTG / HJ',
                  '23%',
                  'QQ+, AKs, AKo, A5s',
                  'Rango fuerte: defiende sobre todo manos suited y parejas',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Pagar es la acción principal',
              text: 'La mayor parte de la defensa es call. El 3-bet se reserva para el valor claro y para manos que bloquean y juegan bien si te pagan (A5s-A2s, suited conectadas). Todo lo demás que tenga precio, se paga.',
            },
            {
              type: 'range',
              id: 'bb-vs-btn',
            },
            {
              type: 'heading',
              text: 'Efectos del sizing',
            },
            {
              type: 'paragraph',
              text: 'Cuanto más grande es el open, peor precio recibes y más estrecho defiendes. Con ciegas de 0,5 y 1, estas son las pot odds de la BB contra un solo rival:',
            },
            {
              type: 'table',
              headers: ['Open', 'Pagas', 'Equity mínima', 'Ajuste'],
              rows: [
                [
                  '2 ciegas',
                  '1',
                  '22%',
                  'Defiende muy ancho: casi cualquier suited y conectores offsuit',
                ],
                ['2,5 ciegas', '1,5', '27%', 'La tabla de referencia'],
                ['3 ciegas', '2', '31%', 'Se caen los offsuit más débiles'],
                [
                  '4 ciegas',
                  '3',
                  '35%',
                  'Defiende como si abriera una posición más temprana',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'tip',
              title: 'La equity mínima no es la historia completa',
              text: 'Fuera de posición no realizas toda tu equity: una mano con 30% contra el rango del rival puede ganar solo el 22% en la práctica. Por eso las manos offsuit sin conexión se retiran aunque tengan precio, y las suited se defienden aunque vayan justas.',
            },
            {
              type: 'spot',
              hole: 'Kc 7d',
              question:
                'El botón abre a 2,2 ciegas y estás en la BB con K7o. ¿Defiendes?',
              answer:
                'Sí, pagando. Contra un open pequeño del botón necesitas solo un 24% de equity, y K7o está por encima contra un rango del 45%. Contra un open de UTG, en cambio, la misma mano es un fold claro: está dominada por KJ, KQ y AK.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'El cutoff abre a 4 ciegas en lugar de a 2,5. ¿Cómo ajustas la defensa de la BB?',
                  options: [
                    'Defiendo igual, el rango del cutoff no cambia',
                    'Defiendo más ancho, hay más dinero en el bote',
                    'Defiendo más estrecho: pago más para ganar lo mismo',
                    'Solo hago 3-bet o fold',
                  ],
                  answerIndex: 2,
                  explanation:
                    'Contra 4 ciegas necesitas un 35% de equity en lugar de un 27%. Una regla práctica: defiende como si el open viniera de una posición más temprana.',
                },
                {
                  id: 'q2',
                  question: '¿Contra qué open defiende más ancho la BB?',
                  options: ['UTG', 'CO', 'BTN', 'SB'],
                  answerIndex: 3,
                  explanation:
                    'Contra la SB: su rango es muy ancho, solo compites con él y, por primera vez en la mano, eres tú quien juega en posición.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pfa-bb-drill',
          slug: 'practica-defensa-bb',
          title: 'Práctica: defensa de la ciega grande',
          summary:
            'Cada open contra tu BB: pagar, 3-bet o fold según quién abre y cuánto.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Se evalúan las manos en las que estás en la BB y un solo rival abre sin pagadores en medio. El corrector usa la tabla de la clase y la estrecha cuando el open es grande (3,5 ciegas o más; 4 o más desde la SB).',
            },
            {
              type: 'drill',
              mode: 'bb-defense',
              seats: 6,
              goal: 'Defiende 40 manos desde la BB ajustando al tamaño del open',
              hands: 40,
            },
          ],
        },
        {
          id: 'l-pfa-cold',
          slug: 'cold-calling',
          title: 'Cold calling: pagar, 3-betear o foldear',
          summary:
            'Frente a un open desde fuera de las ciegas, cuándo tiene sentido cada respuesta.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un cold call es pagar una subida sin tener fichas dentro del bote. Es la opción más cómoda y, por eso, la más abusada: el jugador que paga "para ver" acaba en botes grandes con manos dominadas. El cold call tiene su sitio, pero es un sitio pequeño.',
            },
            {
              type: 'heading',
              text: 'Cuándo hacer call',
            },
            {
              type: 'list',
              items: [
                'Estás **en posición** respecto al que abrió: HJ, CO o botón.',
                'El open viene de una posición temprana: su rango es fuerte y resubirle de farol sale caro.',
                'Tu mano juega bien postflop y no sufre dominación: parejas, suited conectadas, suited broadways.',
                'Las ciegas no son agresivas: cada cold call invita a un squeeze desde detrás.',
              ],
            },
            {
              type: 'heading',
              text: 'Cuándo 3-betear',
            },
            {
              type: 'list',
              items: [
                'El open viene de CO o del botón: su rango es ancho y tu mano está por delante.',
                'Tienes manos que sufren si pagas y alguien entra: AJo o KQo contra un CO se juegan mejor como 3-bet que como call.',
                'Estás en la SB: el cold call ahí te deja fuera de posición con la BB detrás. 3-bet o fold.',
                'Quieres aislar al que abrió y jugar el bote contra un solo rival, con iniciativa.',
              ],
            },
            {
              type: 'heading',
              text: 'Cuándo foldear',
            },
            {
              type: 'list',
              items: [
                'Manos offsuit dominables contra rangos fuertes: KJo, QJo o ATo contra un UTG.',
                'Suited débiles fuera de posición: no realizan su equity.',
                'Cualquier mano que no quieras jugar en un bote de tres jugadores.',
              ],
            },
            {
              type: 'table',
              headers: ['Open de', 'Cold call (en posición)', '3-bet'],
              rows: [
                [
                  'UTG',
                  '22-JJ, AQs-ATs, KQs, KJs, QJs, JTs, T9s, 98s, AQo',
                  'QQ+, AKs, AKo, A5s-A4s',
                ],
                [
                  'HJ',
                  '22-TT, AJs-ATs, KJs, KTs, QJs, QTs, JTs, T9s, 98s, 87s',
                  'JJ+, AQs+, AQo+, KQs, A5s-A3s, K9s',
                ],
                [
                  'CO',
                  '22-99, ATs, KTs, QTs, JTs, T9s, 98s, 87s',
                  'TT+, AJs+, KJs+, QJs, AJo+, KQo, A5s-A2s, K9s, 76s, 65s',
                ],
              ],
            },
            {
              type: 'table',
              headers: ['Desde la SB contra', '3-bet (el resto, fold)'],
              rows: [
                ['UTG', 'JJ+, AQs+, AKo, A5s'],
                ['HJ', 'TT+, AJs+, KQs, AQo+, A5s-A4s'],
                ['CO', '99+, ATs+, KJs+, QJs, AQo+, A5s-A3s, K9s'],
                [
                  'BTN',
                  '88+, A9s+, KTs+, QJs, JTs, AJo+, KQo, A5s-A2s, K9s, 76s, 65s',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Cuanto más tarde abre el rival, menos cold call',
              text: 'Contra UTG el rango de call es más ancho que el de 3-bet. Contra el CO se invierte: el 3-bet pasa a ser la respuesta principal, porque su rango es débil y pagar deja a las ciegas un squeeze perfecto.',
            },
            {
              type: 'range',
              id: 'cold-vs-ep',
            },
            {
              type: 'spot',
              hole: 'Ah Jc',
              question:
                'El CO abre y estás en el botón con AJo. ¿Call, 3-bet o fold?',
              answer:
                '3-bet. Contra el rango ancho del CO, AJo está por delante; pagando invitas a las ciegas a entrar y juegas un bote multiway con una mano que no liga fácil. Contra un open de UTG, la misma mano es fold: la dominan AQ, AK y los ases.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Estás en la SB con 99 y el HJ abre. ¿Qué haces?',
                  options: ['Pagar', '3-bet', 'Retirarte', 'All-in'],
                  answerIndex: 2,
                  explanation:
                    'Desde la SB se juega 3-bet o fold, y contra un HJ el 3-bet empieza en TT. 99 es demasiado débil para resubir y pagar te deja fuera de posición con la BB detrás. Contra un open del CO, 99 ya es 3-bet.',
                },
                {
                  id: 'q2',
                  question:
                    '¿Qué mano prefiere cold call a 3-bet contra un open de UTG desde el botón?',
                  options: ['AKo', '77', 'A5s', 'QQ'],
                  answerIndex: 1,
                  explanation:
                    '77 juega bien en posición y busca ligar trío: pagar es perfecto. AKo y QQ son 3-bet por valor y A5s es el 3-bet de farol con bloqueador.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-pfa-iso',
          slug: 'aislar-limpers',
          title: 'Contra limpers: el iso-raise',
          summary: 'Cómo castigar a quien entra pagando la ciega sin subir.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un limper es quien entra pagando la ciega grande sin subir. En mesas de nivel bajo es el error preflop más común, y castigarlo es una de las fuentes de beneficio más fiables. La herramienta es el iso-raise: subir para quedarte a solas con él, con iniciativa y, si puede ser, en posición.',
            },
            {
              type: 'table',
              headers: ['Pregunta', 'Respuesta'],
              rows: [
                [
                  '¿De qué tamaño?',
                  '3 ciegas + 1 por cada limper; 1 más si subes desde las ciegas',
                ],
                [
                  '¿Con qué rango?',
                  'Lineal: las mejores manos de tu rango de open, sin faroles puros',
                ],
                [
                  '¿Por qué lineal?',
                  'El limper paga mucho: las manos fuertes cobran y los faroles no funcionan',
                ],
                [
                  '¿Y las manos especulativas?',
                  'Parejas pequeñas y suited conectadas pagan detrás (overlimp) en posición',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'El objetivo es jugar contra uno',
              text: 'Contra un limper, tu mano gana mucho valor si el bote es heads-up y en posición. Un iso-raise pequeño no aísla a nadie: con varios limpers hay que subir más, o las ciegas y el resto entrarán con el precio.',
            },
            {
              type: 'spot',
              hole: 'Kd Jh',
              question:
                'Un jugador pasivo hace limp desde UTG y tú estás en el CO con KJo. ¿Qué haces?',
              answer:
                'Iso-raise a 4 ciegas. El rango de limp de un jugador pasivo está lleno de manos peores que KJ (Kx débiles, Jx, suited aleatorias), y te pagará sin iniciativa y fuera de posición. Pagar detrás o retirarse desperdicia la ventaja.',
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Cuidado con el limp-raise',
              text: 'Algunos jugadores hacen limp con ases y reyes esperando que alguien suba. Si un limper vuelve a subir tu iso-raise, su rango es muy fuerte: continúa solo con el tope de tu mano.',
            },
          ],
        },
        {
          id: 'l-pfa-cold-drill',
          slug: 'practica-cold-calling',
          title: 'Práctica: cold call o 3-bet',
          summary:
            'Frente a cada open, elige entre pagar, resubir o retirarte.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Se evalúan las manos en las que un rival abre y te toca actuar desde HJ, CO, botón o SB, sin pagadores en medio. Desde la SB, hacer call cuenta como error: ahí se juega 3-bet o fold.',

            },
            {
              type: 'drill',
              mode: 'vs-open',
              seats: 6,
              goal: 'Responde a 40 opens eligiendo entre cold call, 3-bet y fold',
              hands: 40,
            },
          ],
        },
      ],
    },
    {
      id: 'c-3bet',
      slug: 'guerra-preflop',
      title: '3-bet, 4-bet y defensa',
      summary:
        'La batalla preflop decide el tamaño de los botes que vas a jugar toda la sesión.',
      level: 'advanced',
      icon: 'Swords',
      outcomes: [
        'Construir un rango de 3-bet por valor y de farol',
        'Defender la ciega grande sin sangrar fichas',
        'Reaccionar correctamente a un 4-bet',
      ],
      lessons: [
        {
          id: 'l-3bet-value',
          slug: 'tres-bet-por-valor-y-farol',
          title: '3-bet por valor y como farol',
          summary:
            'Un rango de 3-bet solo con manos premium es un rango transparente.',
          kind: 'lesson',
          minutes: 10,
          xp: 35,
          blocks: [
            {
              type: 'paragraph',
              text: 'Una 3-bet es una resubida preflop. Si solo la haces con A-A, K-K, Q-Q y A-K, cualquier rival atento se retirará siempre salvo que tenga lo mismo. Necesitas faroles en ese rango.',
            },
            {
              type: 'table',
              headers: ['Componente', 'Manos', 'Por qué'],
              rows: [
                ['Valor', 'TT+, AQs+, AKo', 'Quieres botes grandes con ellas'],
                [
                  'Farol',
                  'A5s-A2s, KQs, suited connectors bajos',
                  'Bloquean ases y juegan bien si pagan',
                ],
                [
                  'Nunca',
                  'AJo, KQo, parejas medias',
                  'Dominadas cuando pagan, no ganan nada cuando ganan',
                ],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'Por qué A5s y no AJo',
              text: 'A5s bloquea los ases del rival, hace color y escalera, y no le importa retirarse a un 4-bet. AJo está dominada por todo lo que paga una 3-bet. Contra la intuición, la mano "peor" es la mejor para farolear.',
            },
            {
              type: 'range',
              id: 'three-bet-sb',
            },
          ],
        },
        {
          id: 'l-3bet-defense',
          slug: 'defender-frente-al-3bet',
          title: 'Defender frente al 3-bet',
          summary: 'Pagar, 4-betear o retirarse: cómo se decide.',
          kind: 'lesson',
          minutes: 9,
          xp: 35,
          blocks: [
            {
              type: 'list',
              ordered: true,
              items: [
                'Retirarse es correcto con la mayoría de tu rango de apertura: abriste ancho, él resubió estrecho.',
                'Pagar funciona en posición con manos que juegan bien postflop: parejas, suited connectors, AQs.',
                'El 4-bet se reserva para valor puro (QQ+, AK) y algún farol con bloqueador de as.',
              ],
            },
            {
              type: 'callout',
              tone: 'warning',
              title: 'Fuera de posición, simplifica',
              text: 'Frente a una 3-bet desde las ciegas, el rango de pago se estrecha muchísimo. Jugar botes grandes fuera de posición con manos medianas es la forma más rápida de perder un stack.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question:
                    'Abres desde el cutoff con A♦J♠ y el botón te hace 3-bet. ¿Qué haces?',
                  options: ['4-bet', 'Pagar', 'Retirarte', 'All-in'],
                  answerIndex: 2,
                  explanation:
                    'AJ offsuit está dominada por casi todo el rango de valor que te resube (AQ, AK, ases, reyes) y fuera de posición no realiza bien su equity. Retirarse es lo estándar.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-3bet-drill',
          slug: 'practica-preflop-agresiva',
          title: 'Práctica: batalla preflop',
          summary: 'Mesa corta donde los botes se deciden antes del flop.',
          kind: 'drill',
          minutes: 20,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'En mesa de 3 jugadores las ciegas llegan constantemente y hay que jugar mucho más ancho. Es el laboratorio perfecto para practicar 3-bets y defensas.',
            },
            {
              type: 'drill',
              mode: 'preflop-position',
              seats: 3,
              goal: 'Juega 25 manos incorporando 3-bets de farol',
              hands: 25,
            },
          ],
        },
      ],
    },
    {
      id: 'c-allin',
      slug: 'all-in-valor-farol-push-fold',
      title: 'All-in: valor, farol y push/fold',
      summary:
        'Cuándo ir all-in por valor, cuándo de farol y cuándo el stack corto no deja otra opción.',
      level: 'advanced',
      icon: 'Rocket',
      formats: ['all'],
      outcomes: [
        'Calcular si un all-in es rentable por fold equity, por equity o por ambas',
        'Jamear preflop (4-bet, 5-bet, squeeze y push/fold) según tu stack',
        'Jamear postflop por SPR comprometido o con overbet polarizado',
        'Farolear all-in solo con blockers, rival capado y sin ICM en contra',
      ],
      lessons: [
        {
          id: 'l-allin-math',
          slug: 'la-matematica-del-all-in',
          title: 'La matemática del all-in',
          summary: 'Fold equity + equity: las dos formas de ganar un jam y su punto de equilibrio.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'Un all-in gana de dos formas a la vez: porque el rival se retira (fold equity) o porque ligas tu mano (equity). Un jam por valor vive de la segunda; un jam de farol puro, solo de la primera; un semibluff combina ambas. Antes de jamear, pregúntate cuál de las dos te paga.',
            },
            {
              type: 'table',
              headers: ['Situación', 'Cálculo', 'Qué significa'],
              rows: [
                ['Jam 100 en bote 100, sin equity', 'Necesita 50% de folds', 'La mitad de las veces se tiene que retirar'],
                ['Jam 100 en bote 200, sin equity', 'Necesita 33% de folds', 'Bote grande: el farol sale más barato'],
                ['Jam con 40% de equity', 'Necesita muchos menos folds', 'Tu proyecto paga parte del jam aunque te paguen'],
                ['Jam contra quien nunca foldea', 'Necesita 60%+ de equity', 'Sin folds, solo jamea lo que va por delante'],
              ],
            },
            {
              type: 'callout',
              tone: 'key',
              title: 'La fórmula que memorizar',
              text: 'Farol puro: folds necesarios = riesgo ÷ (riesgo + bote). Jam 150 en bote 100 → 60%. Jam 150 en bote 300 → 33%. Con proyecto, réstale tu equity: cada 10% de equity te "regala" alrededor de 10% de folds.',
            },
            {
              type: 'spot',
              hole: 'As Ks',
              board: 'Qs 7d 2c 9h',
              question:
                'Turn, bote 120. Tienes proyecto de color máximo (9 outs, ~20%) y vas a jamear 150. ¿Cuántos folds necesitas?',
              answer:
                'Sin equity necesitarías 150 ÷ 270 ≈ 55%. Con 20% de equity ganas el bote de 420 una de cada cinco veces que te pagan (≈84 de valor esperado), así que te basta con alrededor del 35% de folds. Contra un rival que se retira un tercio de las veces, el jam es rentable; contra una calling station, es quemar fichas.',
            },
            {
              type: 'spot',
              hole: '7s 6s',
              board: '8h 9c Kd',
              question:
                'Flop, bote 60. Tienes escalera abierta (8 outs) y piensas en jamear 200. ¿Es un semibluff o un regalo?',
              answer:
                'Un regalo contra casi todos. Jamear más de 3 veces el bote necesita muchísimos folds, y con solo 8 outs tu equity (~32% a dos cartas) no compensa. El semibluff se apuesta grande, no se jamea: apuesta 40-45 para negar equity y reevalúa en el turn.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: 'Jameas 100 en un bote de 100 como farol puro. ¿Qué % de folds necesitas?',
                  options: ['25%', '33%', '50%', '75%'],
                  answerIndex: 2,
                  explanation:
                    'Riesgo ÷ (riesgo + bote) = 100 ÷ 200 = 50%. Por eso los jams de farol en botes pequeños son caros: necesitan que el rival se retire la mitad de las veces.',
                },
                {
                  id: 'q2',
                  question: 'Mismo jam pero con 40% de equity (semibluff). ¿Qué cambia?',
                  options: [
                    'Necesitas más folds todavía',
                    'Necesitas menos folds: tu equity paga parte del jam',
                    'Nada: la equity no cuenta',
                    'Debes jamear más grande',
                  ],
                  answerIndex: 1,
                  explanation:
                    'Cuando te pagan, ganas el 40% de las veces. Ese valor esperado descuenta del coste del jam: el semibluff es rentable contra rivales que nunca pagarían un farol puro.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-allin-preflop',
          slug: 'all-in-preflop',
          title: 'All-in preflop: 4-bet, 5-bet, squeeze y push/fold',
          summary: 'Con 100bb se resube pequeño; con 20bb se jamea. El stack manda.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Preflop el all-in no es una jugada, son cuatro distintas según tu stack. Profundo (100bb) el jam es casi siempre un error: se resube pequeño para jugar postflop. Medio (30-50bb) el 3-bet jam con valor cobra fold equity más equity. Corto (20bb o menos) no hay juego postflop: push o fold directo.',
            },
            {
              type: 'table',
              headers: ['Tu stack', 'Línea estándar', 'Con qué manos'],
              rows: [
                ['100bb', '4-bet pequeño (2,2-2,5x), 5-bet jam solo QQ+/AK', 'Valor estrecho + faroles con blocker de as'],
                ['40-60bb', '3-bet jam con valor y semibluffs', 'TT+, AQ+ y algún A5s por blockers'],
                ['15-20bb', 'Push/fold: shove o fold, nada de min-raise OOP', 'Pares, A-x, broadways y conectores suited en posición'],
                ['12bb o menos', 'Shove amplio en BTN/SB, call ajustado en BB', 'Cualquier par, cualquier as, K-x suited'],
              ],
            },
            {
              type: 'heading',
              text: 'El squeeze jam',
            },
            {
              type: 'paragraph',
              text: 'Alguien abre, otro paga, y tú jameas desde las ciegas o el botón. Es el jam con más fold equity del preflop: el pagador casi nunca trae mano de call (habría resubido él) y el abridor debe pasar por dos rangos. Con 20-30bb, jamear TT+, AQ+ y faroles con blocker (A5s, KQs) sobre un open + call es una de las jugadas más rentables del torneo.',
            },
            {
              type: 'spot',
              hole: 'Ah Kd',
              question:
                'Cash 100bb. CO abre, BTN hace 3-bet y tú estás en SB con A-K. ¿Jameas?',
              answer:
                'No: 4-bet pequeño (unas 2,5x el 3-bet). Con 100bb efectivas jamear convierte tu mano en un volado contra su rango de call (QQ+/AK) y hace foldear todo lo que dominas. El jam preflop con A-K es para stacks de 50bb o menos, o torneos con ICM donde el fold equity vale más.',
            },
            {
              type: 'spot',
              hole: 'Ts Th',
              question: 'Torneo, 16bb en el botón tras dos folds. ¿Min-raise o shove con 10-10?',
              answer:
                'Shove. Con 16bb el min-raise invita a las ciegas a pagar y jugarás un bote con SPR 2 fuera de posición si te pagan: el peor escenario. El shove cobra ciegas + antes ya y cuando te pagan vas por delante de su rango de call casi siempre.',
            },
            {
              type: 'spot',
              hole: 'As 5s',
              question:
                'Spin, 12bb en BB. El botón min-raisea. Tienes A-5 suited. ¿Pagas, resubes pequeño o jameas?',
              answer:
                'Jameas. El as bloquea sus calls fuertes (A-x alto, pares altos que temen el as) y tienes fold equity inmediata más ~30% de equity cuando te pagan. Pagar te deja SPR 1 fuera de posición; resubir pequeño regala tu fold equity.',
            },
            {
              type: 'drill',
              mode: 'vs-3bet',
              seats: 6,
              goal: 'Juega 30 manos decidiendo 4-bet, 5-bet jam o fold según tu stack y tu mano',
              hands: 30,
            },
          ],
        },
        {
          id: 'l-allin-postflop',
          slug: 'all-in-postflop',
          title: 'All-in postflop: SPR comprometido y overbet jam',
          summary: 'Con SPR bajo la mano se juega sola; en river solo jamea el rango polarizado.',
          kind: 'lesson',
          minutes: 12,
          xp: 45,
          blocks: [
            {
              type: 'paragraph',
              text: 'Postflop hay dos jams buenos y uno malo. Bueno 1: SPR bajo (1-3) con mano fuerte, donde retirarse ya no es opción matemática. Bueno 2: overbet jam en river con nuts o farol con blocker contra rango capado. Malo: jamear de farol en bote pequeño contra quien paga, o con mano media "para ver dónde estoy".',
            },
            {
              type: 'table',
              headers: ['SPR en flop', 'Con mano fuerte', 'Con proyecto', 'Con aire'],
              rows: [
                ['1 o menos', 'Jam: comprometido siempre', 'Jam si 12+ outs', 'Jam solo vs quien overfoldea'],
                ['2-3', 'Apuesta y paga el jam rival', 'Semibluff grande, no jam directo', 'Check/fold la mayoría'],
                ['4-6', 'Dos calles de valor, sin compromiso', 'Paga por precio, no jamees', 'Abandona'],
                ['8+', 'Control: solo dos parejas o más juegan bote grande', 'Implied odds, bote pequeño', 'Ni lo intentes'],
              ],
            },
            {
              type: 'spot',
              hole: 'Qs Qd',
              board: 'Qh 7s 2c',
              question: 'Bote 100, stack efectivo 90 (SPR 0,9). Tienes trío de damas. ¿Apuestas pequeño para "extraer" o jameas?',
              answer:
                'Jameas (o apuestas para pagar cualquier subida, que es lo mismo). Con SPR menor de 1 no hay forma de perderte: cualquier apuesta te compromete, y pasar o apostar pequeño solo regala carta gratis a sus 6 outs. A SPR bajo, lo profesional es no inventar.',
            },
            {
              type: 'spot',
              hole: 'As 5s',
              board: 'Ks 7d 2c 4s 9s',
              question:
                'River K-7-2-4-9 con cuatro picas. Tienes el color máximo y el rival pasó dos calles (capado). Bote 100, stacks 250. ¿Value fino o overbet jam?',
              answer:
                'Overbet jam. Tu rango aún tiene todos los colores máximos y el suyo está capado: no puede pagar grande sin nuts que no tiene. El value fino deja fichas: contra capado, polariza al máximo con nuts y faroles con blocker.',
            },
            {
              type: 'spot',
              hole: 'Jh Th',
              board: 'Qh 9c 2d Ks',
              question:
                'Turn Q-9-2-K. Tienes proyecto de escalera abierta (8 outs) y el rival apuesta 75% del bote con stacks profundos detrás. ¿Jameas de semibluff?',
              answer:
                'No. El jam necesita folds que no tienes (apostó fuerte = valor o draw fuerte) y tu equity (~16% a una carta) no compensa el riesgo. Paga si el precio da por implícitas, o retírate: el semibluff se apuesta, no se jamea, sin fold equity.',
            },
            {
              type: 'drill',
              mode: 'aggression',
              seats: 6,
              goal: 'Juega 25 manos jameando por SPR comprometido y con overbet polarizado en river',
              hands: 25,
            },
          ],
        },
        {
          id: 'l-allin-bluff',
          slug: 'el-farol-all-in',
          title: 'El farol all-in: blockers, capados y errores ICM',
          summary: 'El jam más caro del juego solo funciona con checklist completo.',
          kind: 'lesson',
          minutes: 11,
          xp: 40,
          blocks: [
            {
              type: 'paragraph',
              text: 'El farol all-in es la jugada con más varianza del poker: cuando falla, pierdes el stack entero. Por eso nunca se hace "porque toca": se hace con checklist. Si falla un punto, el jam pasa de profesional a lotería.',
            },
            {
              type: 'table',
              headers: ['Checklist del jam de farol', 'Pregunta', 'Si es no…'],
              rows: [
                ['Fold equity real', '¿Se retira este rival lo suficiente? (necesitas 40-60%)', 'No jamees a calling stations'],
                ['Blockers a sus calls', '¿Bloqueas sus nuts y no sus folds?', 'Sin blocker, tu farol cuenta cuentos'],
                ['Rival capado', '¿Su línea excluye las mejores manos?', 'Contra uncapped te pagan más'],
                ['ICM a favor', '¿No arriesgas tu torneo en burbuja como mediano?', 'En burbuja, el jam marginal es fold'],
                ['Sin showdown', '¿Tu mano no gana nunca al enseñar?', 'Con showdown medio, el jam convierte valor en farol'],
              ],
            },
            {
              type: 'spot',
              hole: 'Ac 4c',
              board: 'Ks 7d 2c 4s 9h',
              question:
                'River K-7-2-4-9 con tres tréboles. Tienes A-4 de tréboles (proyecto fallido) y el rival pasó flop y turn. Bote 100, jam 150. ¿Faroleas?',
              answer:
                'Sí: es el farol all-in de manual. Bloqueas su mejor pago (el color máximo al as), tu mano no gana nunca en showdown, el rival está capado y necesitas 60% de folds contra un rango que casi todo son manos medias asustadas. Cinco checks, cinco síes.',
            },
            {
              type: 'spot',
              hole: '9s 9c',
              board: 'Kh 7d 2c',
              question:
                'Burbuja de MTT, stack mediano. Flop K-7-2, el líder apuesta 75% y tú tienes 9-9. En cash jamearías de farol a veces. ¿Aquí?',
              answer:
                'Fold. Tu jam necesita folds que el líder no da (presiona a medianos) y si te pagan mueres antes de premios. Es el error ICM clásico: un jam ganador en fichas y perdedor en dinero. Como mediano en burbuja, tu torneo vale más que este bote.',
            },
            {
              type: 'spot',
              hole: 'As Kd',
              board: 'Qh Jh 2c 8d 3s',
              question:
                'River Q-J-2-8-3 sin completar. Fallaste con A-K, el rival (calling station) pasó. Bote 80, jam 100. ¿Lo intentas?',
              answer:
                'No. Checklist roto en el punto 1: una calling station no foldea lo suficiente para ningún jam. Tu A-K aún gana a sus propios faroles fallidos en showdown. Pasar y enseñar es gratis; jamear es donar.',
            },
            {
              type: 'quiz',
              questions: [
                {
                  id: 'q1',
                  question: '¿Cuál es el mejor candidato para un farol all-in en river?',
                  options: [
                    'Segunda pareja con showdown medio',
                    'Proyecto fallido con blocker a sus nuts y sin valor de showdown',
                    'Top pair débil',
                    'Cualquier mano si el bote es grande',
                  ],
                  answerIndex: 1,
                  explanation:
                    'El farol perfecto: no gana nunca al enseñar (no conviertes valor en farol) y bloquea justo las manos que te pagarían. Segunda pareja y top pair débil tienen showdown: jamear con ellas es tirar su valor.',
                },
                {
                  id: 'q2',
                  question: 'Stack mediano en burbuja de MTT con proyecto fallido y blocker. ¿Jam?',
                  options: [
                    'Sí: el blocker lo justifica todo',
                    'No: el ICM rompe el checklist aunque el resto cuadre',
                    'Sí, pero a mitad de bote',
                    'Da igual',
                  ],
                  answerIndex: 1,
                  explanation:
                    'El ICM es un veto, no un ajuste: arriesgar tu torneo en burbuja por un bote marginal es perdedor en dinero aunque sea ganador en fichas. Guarda el jam para cuando seas grande o corto.',
                },
              ],
            },
          ],
        },
        {
          id: 'l-allin-drill',
          slug: 'practica-all-in',
          title: 'Práctica: todas las formas del all-in',
          summary: 'Jams de valor, semibluffs y folds ICM en la misma sesión.',
          kind: 'drill',
          minutes: 20,
          xp: 50,
          blocks: [
            {
              type: 'paragraph',
              text: 'Sesión integral con stacks variados: profundos para 4-bets pequeños, medios para squeeze jams y cortos para push/fold. Antes de cada jam, recita el checklist en voz alta: folds, blocker, capado, ICM.',
            },
            {
              type: 'drill',
              mode: 'integral',
              seats: 6,
              goal: 'Juega 40 manos jameando solo con checklist completo',
              hands: 40,
            },
          ],
        },
      ],
    },
  ],
};
