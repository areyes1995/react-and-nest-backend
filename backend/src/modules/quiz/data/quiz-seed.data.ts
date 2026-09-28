// ──────────────────────────────────────────────
// Banco de preguntas inicial.
// Lo carga `prisma/seeders/quiz-questions.seeder.ts`
// y, mientras la tabla no exista, el servicio lo
// sirve directamente desde aquí: la página funciona
// antes de migrar.
//
// Reglas de redacción:
//  - La correcta se escribe siempre en `answerIndex`
//    y las opciones se barajan al servirlas, así que
//    nada de "todas las anteriores".
//  - Toda cifra de la explicación está calculada: la
//    pregunta enseña, no solo evalúa.
//  - Cartas en notación del motor (`As Kh`, `T` = 10).
// ──────────────────────────────────────────────

import { QuizFormatId, QuizLevelId } from '../constants/quiz.constants';

export interface QuizSeedQuestion {
  slug: string;
  level: QuizLevelId;
  format: QuizFormatId;
  category: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  hole?: string;
  board?: string;
}

const TRUE_FALSE = ['Verdadero', 'Falso'];

export const QUIZ_SEED: QuizSeedQuestion[] = [
  // ════════════════ PRINCIPIANTE ════════════════
  {
    slug: 'beg-rules-01',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'rules',
    question: '¿Cuántas cartas propias recibe cada jugador en Texas Hold\'em?',
    options: ['Dos', 'Tres', 'Cuatro', 'Cinco'],
    answerIndex: 0,
    explanation:
      'Cada jugador recibe dos cartas tapadas. Con las cinco comunitarias forma la mejor mano posible de cinco cartas entre las siete disponibles.',
  },
  {
    slug: 'beg-rules-02',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'rules',
    question: '¿En qué orden se reparten las cartas comunitarias?',
    options: [
      'Flop (3 cartas), turn (1) y river (1)',
      'Flop (2 cartas), turn (2) y river (1)',
      'Las cinco a la vez',
      'Flop (1 carta), turn (1) y river (3)',
    ],
    answerIndex: 0,
    explanation:
      'Tras la ronda preflop llega el flop con tres cartas, después el turn con una y por último el river con otra. Hay una ronda de apuestas después de cada una.',
  },
  {
    slug: 'beg-rules-03',
    level: 'beginner',
    format: 'true-false',
    category: 'rules',
    question: 'Para formar tu mano estás obligado a usar tus dos cartas propias.',
    options: TRUE_FALSE,
    answerIndex: 1,
    explanation:
      'Falso. Usas las mejores cinco de las siete cartas: puedes usar tus dos cartas, solo una o ninguna (en ese caso "juegas la mesa").',
  },
  {
    slug: 'beg-rules-04',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'rules',
    question: 'En una mesa completa, ¿quién actúa primero en el preflop?',
    options: [
      'El jugador a la izquierda de la ciega grande (UTG)',
      'La ciega pequeña',
      'El botón',
      'La ciega grande',
    ],
    answerIndex: 0,
    explanation:
      'Las ciegas ya han puesto su apuesta obligada, así que el preflop empieza en UTG. Desde el flop, actúa primero el primer jugador activo a la izquierda del botón.',
  },
  {
    slug: 'beg-rules-05',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'rules',
    question: '¿Qué significa hacer "check" (pasar)?',
    options: [
      'No apostar y seguir en la mano, cuando nadie ha apostado en la calle',
      'Retirarte de la mano',
      'Igualar la apuesta de otro jugador',
      'Subir la apuesta mínima',
    ],
    answerIndex: 0,
    explanation:
      'Solo puedes pasar si no hay ninguna apuesta que igualar en esa calle. Si alguien ya apostó, tus opciones son retirarte, igualar o subir.',
  },
  {
    slug: 'beg-hands-01',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'hands',
    question: '¿Qué mano gana: un color o una escalera?',
    options: ['El color', 'La escalera', 'Empatan', 'Depende del palo'],
    answerIndex: 0,
    explanation:
      'El color es más difícil de conseguir que la escalera, por eso está por encima en el ranking. Los palos nunca desempatan en Hold\'em.',
  },
  {
    slug: 'beg-hands-02',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'hands',
    question: '¿Cuál es la mano más alta posible en Texas Hold\'em?',
    options: [
      'Escalera real (A-K-Q-J-10 del mismo palo)',
      'Póker de ases',
      'Full de ases',
      'Color al as',
    ],
    answerIndex: 0,
    explanation:
      'La escalera real es la escalera de color más alta posible y no puede ser superada. Después vienen el resto de escaleras de color y el póker.',
  },
  {
    slug: 'beg-hands-03',
    level: 'beginner',
    format: 'spot',
    category: 'hands',
    question: '¿Qué mano tienes?',
    hole: 'Ah Kh',
    board: 'Qh 7h 2h',
    options: ['Color al as', 'Escalera', 'Carta alta: as', 'Doble pareja'],
    answerIndex: 0,
    explanation:
      'Cinco corazones: A, K, Q, 7 y 2. Es un color al as, el mejor color posible con este flop (el "nut flush").',
  },
  {
    slug: 'beg-hands-04',
    level: 'beginner',
    format: 'spot',
    category: 'hands',
    question: '¿Qué mano tienes?',
    hole: '8s 8d',
    board: '8c Kd Kh',
    options: ['Full: ochos llenos de reyes', 'Trío de ochos', 'Doble pareja', 'Póker de ochos'],
    answerIndex: 0,
    explanation:
      'Tres ochos (dos tuyos y uno en la mesa) más la pareja de reyes de la mesa forman un full. Un full se nombra por el trío: "ochos llenos de reyes".',
  },
  {
    slug: 'beg-hands-05',
    level: 'beginner',
    format: 'spot',
    category: 'hands',
    question: 'Tú tienes A-K y tu rival A-Q. ¿Quién gana la mano?',
    hole: 'As Kd',
    board: 'Ah 7c 4d 9s 2h',
    options: ['Tú, por el kicker', 'Tu rival', 'Empate: los dos tenéis pareja de ases', 'Se decide por el palo del as'],
    answerIndex: 0,
    explanation:
      'Los dos tenéis pareja de ases. Desempata la siguiente carta más alta, el kicker: tu K supera a su Q (A-A-K-9-7 contra A-A-Q-9-7).',
  },
  {
    slug: 'beg-position-01',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'position',
    question: '¿Cuál es la mejor posición de la mesa después del flop?',
    options: ['El botón', 'La ciega pequeña', 'UTG', 'La ciega grande'],
    answerIndex: 0,
    explanation:
      'El botón actúa el último en el flop, el turn y el river. Ver lo que hacen los demás antes de decidir es la mayor ventaja estructural del poker.',
  },
  {
    slug: 'beg-preflop-01',
    level: 'beginner',
    format: 'true-false',
    category: 'preflop',
    question: 'Cualquier as con cualquier carta (A-x) se puede jugar desde cualquier posición.',
    options: TRUE_FALSE,
    answerIndex: 1,
    explanation:
      'Falso. Un as con kicker bajo (A-2 a A-9 de distinto palo) queda dominado por ases con mejor kicker. Desde posiciones tempranas, donde los rangos rivales son fuertes, se tiran.',
  },
  {
    slug: 'beg-math-01',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'math',
    question: 'Tienes proyecto de color en el flop (cuatro cartas del mismo palo). ¿Cuántas outs tienes?',
    options: ['9', '8', '4', '13'],
    answerIndex: 0,
    explanation:
      'Hay 13 cartas de cada palo y ya ves 4 (dos tuyas y dos en la mesa): quedan 13 − 4 = 9 cartas que te dan el color.',
  },
  {
    slug: 'beg-mental-01',
    level: 'beginner',
    format: 'multiple-choice',
    category: 'mental',
    question: '¿Qué es el bankroll?',
    options: [
      'El dinero reservado exclusivamente para jugar al poker',
      'Las fichas que tienes ahora en la mesa',
      'El bote más grande que has ganado',
      'El límite de apuesta de la mesa',
    ],
    answerIndex: 0,
    explanation:
      'Es un fondo separado del dinero de tu vida diaria. Gestionarlo bien —no jugar límites demasiado altos para él— es lo que te permite sobrevivir a las malas rachas.',
  },

  // ════════════════ INTERMEDIO ════════════════
  {
    slug: 'int-math-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'math',
    question: 'El bote es de 100 y tu rival apuesta 50. ¿Qué equity mínima necesitas para pagar?',
    options: ['25%', '33%', '50%', '20%'],
    answerIndex: 0,
    explanation:
      'Pagas 50 para un bote final de 200 (100 + 50 + tus 50). Necesitas ganar al menos 50 / 200 = 25% de las veces.',
  },
  {
    slug: 'int-math-02',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'math',
    question:
      'En el flop tienes 8 outs y vas all-in, así que verás turn y river. ¿Qué probabilidad aproximada tienes de ligar?',
    options: ['~32%', '~16%', '~8%', '~50%'],
    answerIndex: 0,
    explanation:
      'Regla del 4: con dos cartas por venir, outs × 4 ≈ 8 × 4 = 32% (el valor exacto es 31,5%). Con una sola carta por venir se multiplica por 2.',
  },
  {
    slug: 'int-math-03',
    level: 'intermediate',
    format: 'spot',
    category: 'math',
    question: '¿Qué proyecto tienes y cuántas outs te da?',
    hole: 'Js Th',
    board: '9c 8d 2s',
    options: [
      'Escalera abierta: 8 outs',
      'Escalera interna: 4 outs',
      'Proyecto de color: 9 outs',
      'Ninguno',
    ],
    answerIndex: 0,
    explanation:
      'J-T-9-8 es una escalera abierta por los dos lados: cualquier Q o cualquier 7 la completa. Son 4 + 4 = 8 outs.',
  },
  {
    slug: 'int-math-04',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'math',
    question: 'Tienes un proyecto de escalera interna (gutshot). ¿Cuántas outs tienes?',
    options: ['4', '8', '2', '6'],
    answerIndex: 0,
    explanation:
      'Solo te sirve un valor concreto (por ejemplo, un 8 para 9-7-6-5), y de ese valor quedan las cuatro cartas: 4 outs, la mitad que una escalera abierta.',
  },
  {
    slug: 'int-math-05',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'math',
    question: '¿Qué son las implied odds (cotizaciones implícitas)?',
    options: [
      'Lo que esperas ganar en calles futuras si ligas tu proyecto',
      'La probabilidad de ligar en el river',
      'El porcentaje que cobra la sala (rake)',
      'Las pot odds antes de que el rival apueste',
    ],
    answerIndex: 0,
    explanation:
      'Las pot odds miran solo el bote actual. Las implied odds suman lo que podrás cobrar después si ligas, y justifican pagar proyectos que con las pot odds solas no llegarían.',
  },
  {
    slug: 'int-postflop-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'postflop',
    question: '¿Qué es una continuation bet (c-bet)?',
    options: [
      'Apostar en el flop después de haber sido el agresor preflop',
      'Pagar una apuesta en cada calle',
      'Apostar siempre en el river',
      'Subir la apuesta de un rival en el flop',
    ],
    answerIndex: 0,
    explanation:
      'Quien subió preflop "continúa" la agresión en el flop. Funciona porque su rango preflop es más fuerte y el rival no liga el flop la mayoría de las veces.',
  },
  {
    slug: 'int-postflop-02',
    level: 'intermediate',
    format: 'spot',
    category: 'postflop',
    question: '¿Cuántas cartas del mazo te completan el color?',
    hole: 'Ah Qh',
    board: 'Kh 7h 2c',
    options: ['9', '8', '12', '13'],
    answerIndex: 0,
    explanation:
      'Ves cuatro corazones (Ah, Qh, Kh, 7h), así que quedan 13 − 4 = 9. Además es el proyecto al color máximo: si liga, tienes el nuts.',
  },
  {
    slug: 'int-postflop-03',
    level: 'intermediate',
    format: 'true-false',
    category: 'postflop',
    question: 'Un flop 9♥ 8♥ 7♠ es un board "seco".',
    options: TRUE_FALSE,
    answerIndex: 1,
    explanation:
      'Falso: es muy "mojado" (wet). Cartas conectadas y dos del mismo palo dan escaleras hechas, proyectos de escalera y de color a muchas manos.',
  },
  {
    slug: 'int-position-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'position',
    question: '¿Por qué se juegan más manos desde el botón que desde UTG?',
    options: [
      'Porque actúas el último después del flop y quedan menos jugadores por actuar detrás de ti',
      'Porque el botón paga menos ciegas',
      'Porque desde el botón no se puede farolear',
      'Porque el botón siempre gana los empates',
    ],
    answerIndex: 0,
    explanation:
      'Desde UTG quedan ocho jugadores por detrás que pueden tener una mano fuerte; desde el botón solo las ciegas. Y además jugarás toda la mano con información.',
  },
  {
    slug: 'int-preflop-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'preflop',
    question: '¿Qué es un 3-bet?',
    options: [
      'Una resubida preflop sobre una subida',
      'Apostar tres veces en la misma mano',
      'Una apuesta de tres ciegas grandes',
      'Pagar tres apuestas seguidas',
    ],
    answerIndex: 0,
    explanation:
      'La ciega grande cuenta como la primera apuesta, la subida es la segunda (2-bet) y la resubida es la tercera: el 3-bet. La siguiente sería un 4-bet.',
  },
  {
    slug: 'int-ranges-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'ranges',
    question: 'Un rival juega muy pocas manos, pero cuando entra lo hace subiendo y apostando fuerte. ¿Cómo se le clasifica?',
    options: ['Tight-agresivo (TAG)', 'Loose-pasivo', 'Maníaco', 'Calling station'],
    answerIndex: 0,
    explanation:
      '"Tight" describe cuántas manos juega (pocas) y "agresivo" cómo las juega (apostando y subiendo). Es el perfil de un buen regular.',
  },
  {
    slug: 'int-mental-01',
    level: 'intermediate',
    format: 'multiple-choice',
    category: 'mental',
    question: '¿Qué es el tilt?',
    options: [
      'Jugar peor por frustración o emoción tras un mal resultado',
      'Una estrategia de faroles constantes',
      'Una racha de cartas buenas',
      'Retirarse siempre ante apuestas grandes',
    ],
    answerIndex: 0,
    explanation:
      'El tilt es tomar decisiones guiadas por la emoción en vez de por la lógica. Detectarlo a tiempo y parar la sesión ahorra más dinero que casi cualquier ajuste técnico.',
  },

  // ════════════════ AVANZADO ════════════════
  {
    slug: 'adv-math-01',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'math',
    question:
      'Tu rival apuesta tamaño bote (100 en un bote de 100). ¿Qué frecuencia mínima de defensa (MDF) evita que farolee con beneficio con cualquier mano?',
    options: ['50%', '33%', '67%', '25%'],
    answerIndex: 0,
    explanation:
      'MDF = bote / (bote + apuesta) = 100 / 200 = 50%. Si te retiras más de la mitad de las veces, su farol gana dinero con cualquier par de cartas.',
  },
  {
    slug: 'adv-math-02',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'math',
    question:
      'Apuestas medio bote en el river con un farol puro. ¿Con qué frecuencia debe retirarse el rival para que sea rentable?',
    options: ['33%', '50%', '25%', '20%'],
    answerIndex: 0,
    explanation:
      'Arriesgas 50 para ganar 100: necesitas que se retire 50 / (50 + 100) = 33% de las veces para no perder dinero.',
  },
  {
    slug: 'adv-math-03',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'math',
    question: '¿Qué es la fold equity?',
    options: [
      'El valor extra que ganas por las veces que el rival se retira ante tu apuesta',
      'La equity de tu mano en el showdown',
      'Lo que pierdes cada vez que te retiras',
      'La equity que tenía el rival al retirarse',
    ],
    answerIndex: 0,
    explanation:
      'Una apuesta gana de dos maneras: cuando te pagan y ganas el showdown, y cuando el rival se retira. Esa segunda fuente es la fold equity, y es la que hace rentables los semifaroles.',
  },
  {
    slug: 'adv-ranges-01',
    level: 'advanced',
    format: 'spot',
    category: 'ranges',
    question: 'En este river quieres farolear. ¿Por qué tu A♠ es una carta valiosa?',
    hole: 'As 5d',
    board: 'Ks 9s 4s 2c 7h',
    options: [
      'Bloquea el color al as: el rival nunca puede tener el nuts',
      'Te da el color',
      'Obliga al rival a retirarse',
      'Te da proyecto de escalera',
    ],
    answerIndex: 0,
    explanation:
      'No tienes color (solo una pica), pero con el A♠ en tu mano el rival no puede tener el color máximo. Menos manos suyas que pagan seguro = farol más creíble.',
  },
  {
    slug: 'adv-ranges-02',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'ranges',
    question: '¿Qué es un rango polarizado?',
    options: [
      'Uno formado por manos muy fuertes y faroles, sin manos medias',
      'Uno formado solo por parejas',
      'Uno formado solo por manos del mismo palo',
      'Uno que solo se juega desde el botón',
    ],
    answerIndex: 0,
    explanation:
      'Los dos polos: nuts y aire. Es el rango típico de las apuestas grandes en el river, porque las manos medias prefieren pasar y llegar al showdown baratas.',
  },
  {
    slug: 'adv-ranges-03',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'ranges',
    question: '¿Qué significa que el rango de un rival está "capado"?',
    options: [
      'Que por su línea de juego difícilmente tiene las manos más fuertes',
      'Que solo tiene manos fuertes',
      'Que ha ido all-in',
      'Que le quedan pocas fichas',
    ],
    answerIndex: 0,
    explanation:
      'Por ejemplo, si solo pagó preflop cuando podía resubir, rara vez tiene AA o KK. Un rango capado es vulnerable a apuestas grandes.',
  },
  {
    slug: 'adv-preflop-01',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'preflop',
    question: '¿Por qué A5 del mismo palo es una mano habitual para 3-bet de farol?',
    options: [
      'Bloquea AA y AK, y si te pagan tiene jugabilidad (rueda y color)',
      'Es la mano más fuerte después de AK',
      'Siempre domina a las parejas',
      'Obliga a los ases a retirarse',
    ],
    answerIndex: 0,
    explanation:
      'Tu as reduce las combinaciones de AA y AK del rival, que son las que te harían 4-bet. Y si te pagan, puedes ligar escalera baja (A-2-3-4-5) o color.',
  },
  {
    slug: 'adv-preflop-02',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'preflop',
    question: '¿Qué es un squeeze?',
    options: [
      'Un 3-bet después de una subida y una o más igualadas',
      'Pagar desde la ciega grande',
      'Subir el mínimo permitido',
      'Hacer limp y luego resubir',
    ],
    answerIndex: 0,
    explanation:
      'Quien sube queda "apretado" entre tu resubida y los que pagaron detrás. Los que pagaron suelen tener rangos capados, así que el squeeze gana mucho sin mostrar la mano.',
  },
  {
    slug: 'adv-postflop-01',
    level: 'advanced',
    format: 'spot',
    category: 'postflop',
    question: 'Abriste desde UTG y solo te paga la ciega grande. ¿Quién tiene ventaja de rango en este flop?',
    board: 'As Kd 3c',
    options: [
      'Tú (UTG): tu rango tiene muchos más AA, KK y AK',
      'La ciega grande: defiende más manos',
      'Nadie: el flop es neutro',
      'La ciega grande, porque actúa primero',
    ],
    answerIndex: 0,
    explanation:
      'La ciega grande habría resubido AA, KK y AK muchas veces y defiende muchas manos que no conectan con A-K. Las cartas altas favorecen al rango del que abrió.',
  },
  {
    slug: 'adv-postflop-02',
    level: 'advanced',
    format: 'spot',
    category: 'postflop',
    question: 'Eres el agresor preflop en este flop seco. ¿Qué estrategia de c-bet suele funcionar mejor?',
    board: 'Ks 7d 2c',
    options: [
      'Tamaño pequeño (25–33% del bote) con mucha frecuencia',
      'Overbet del 150% del bote',
      'All-in con todo tu rango',
      'No apostar nunca',
    ],
    answerIndex: 0,
    explanation:
      'En un board seco el rival tiene pocas manos que liguen y pocos proyectos. Una apuesta pequeña consigue casi lo mismo que una grande arriesgando mucho menos, y te deja apostar con todo el rango.',
  },
  {
    slug: 'adv-postflop-03',
    level: 'advanced',
    format: 'true-false',
    category: 'postflop',
    question: 'El check-raise en el flop solo tiene sentido con manos muy fuertes.',
    options: TRUE_FALSE,
    answerIndex: 1,
    explanation:
      'Falso. También se hace con proyectos como semifarol: ganas por fold equity y, si te pagan, aún puedes ligar. Además, mezclarlos protege tus check-raises de valor.',
  },
  {
    slug: 'adv-postflop-04',
    level: 'advanced',
    format: 'multiple-choice',
    category: 'postflop',
    question: '¿Cuándo tiene sentido apostar por valor fino (thin value) en el river?',
    options: [
      'Cuando tu mano gana a más de la mitad de las manos con las que el rival pagará',
      'Con cualquier pareja',
      'Solo con el nuts',
      'Cuando tu mano ya no gana a nada',
    ],
    answerIndex: 0,
    explanation:
      'Una apuesta de valor gana dinero si, cuando te pagan, ganas más de la mitad de las veces. Lo que importa no es su rango entero sino su rango de pago.',
  },

  // ════════════════ PROFESIONAL ════════════════
  {
    slug: 'pro-theory-01',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: '¿Qué describe mejor una estrategia de equilibrio (GTO) en poker?',
    options: [
      'Una que no puede ser explotada: ningún rival mejora cambiando la suya',
      'La que más gana contra cada rival concreto',
      'Jugar solo manos premium',
      'Farolear exactamente la mitad de las veces',
    ],
    answerIndex: 0,
    explanation:
      'El equilibrio de Nash garantiza no perder frente a ninguna estrategia rival, pero no maximiza lo que ganas contra rivales con errores: eso es la explotación.',
  },
  {
    slug: 'pro-theory-02',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question:
      'Apuestas tamaño bote en el river con un rango polarizado. ¿Qué proporción de faroles deja indiferente al rival entre pagar y retirarse?',
    options: ['33% (un farol por cada dos manos de valor)', '50%', '25%', '10%'],
    answerIndex: 0,
    explanation:
      'El rival paga 100 para ganar 200, así que necesita 100 / 300 = 33% de equity. Si el 33% de tu rango son faroles, pagar y retirarse le rinden lo mismo.',
  },
  {
    slug: 'pro-theory-03',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: 'Con una apuesta de medio bote en el river, ¿qué porcentaje de faroles deja indiferente al rival?',
    options: ['25%', '33%', '50%', '20%'],
    answerIndex: 0,
    explanation:
      'Bote 100, apuestas 50: el rival paga 50 para ganar 150 y necesita 50 / 200 = 25%. Cuanto más pequeña la apuesta, menos faroles admite el rango.',
  },
  {
    slug: 'pro-theory-04',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: 'Un rival se retira ante el 70% de las c-bets en el flop. ¿Cuál es el ajuste explotador más directo?',
    options: [
      'Hacer c-bet con mucha más frecuencia, incluso sin nada',
      'Hacer c-bet solo con manos fuertes',
      'Pasar siempre en el flop',
      'Ir all-in en cada flop',
    ],
    answerIndex: 0,
    explanation:
      'Una c-bet de un tercio de bote solo necesita un 25% de retiradas para ganar al instante; contra un 70% cualquier mano apuesta con beneficio.',
  },
  {
    slug: 'pro-theory-05',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: 'Contra una "calling station" (paga casi todo), ¿qué ajuste es el correcto?',
    options: [
      'Farolear menos y apostar por valor más fino y más grande',
      'Farolear más en el river',
      'Jugar pasivo con las manos fuertes',
      'Hacer slowplay con todas tus manos buenas',
    ],
    answerIndex: 0,
    explanation:
      'Sus pagos convierten tus faroles en pérdidas y tus manos medias en valor. Se le gana apostando más manos por valor y con tamaños mayores.',
  },
  {
    slug: 'pro-theory-06',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: 'En un torneo, ¿qué modela el ICM?',
    options: [
      'El valor en dinero real de tu stack según los premios pendientes',
      'La probabilidad de ganar una mano concreta',
      'El tamaño de las ciegas en cada nivel',
      'Cuántos jugadores quedan',
    ],
    answerIndex: 0,
    explanation:
      'Las fichas de torneo no valen lo mismo que dinero: perder el stack cuesta más de lo que vale duplicarlo. Por eso cerca de los premios hace falta más equity para pagar un all-in.',
  },
  {
    slug: 'pro-theory-07',
    level: 'pro',
    format: 'multiple-choice',
    category: 'theory',
    question: '¿Qué es el EV de una decisión?',
    options: [
      'Su valor esperado: lo que ganas o pierdes de media si la repites muchas veces',
      'Lo que ganaste en esa mano concreta',
      'Tu equity en el river',
      'El porcentaje de manos que juegas',
    ],
    answerIndex: 0,
    explanation:
      'Una decisión se juzga por su EV, no por el resultado de una mano. Pagar con el 40% de equity cuando necesitas el 25% es correcto aunque esa vez pierdas.',
  },
  {
    slug: 'pro-math-01',
    level: 'pro',
    format: 'multiple-choice',
    category: 'math',
    question:
      'En el river tu rival va all-in por 300 en un bote de 600. Estimas que farolea el 30% de las veces y tu mano solo gana a sus faroles. ¿Pagar es…?',
    options: [
      'Rentable: necesitas ganar el 25% y ganas el 30%',
      'No rentable: necesitas ganar el 33%',
      'Indiferente: el EV es exactamente cero',
      'No rentable: necesitas ganar el 50%',
    ],
    answerIndex: 0,
    explanation:
      'Pagas 300 para un bote final de 1200 (600 + 300 + 300): necesitas 300 / 1200 = 25%. Con un 30% de faroles, pagar gana dinero a largo plazo.',
  },
  {
    slug: 'pro-ranges-01',
    level: 'pro',
    format: 'multiple-choice',
    category: 'ranges',
    question: '¿Qué significa "proteger" tu rango de check?',
    options: [
      'Incluir algunas manos fuertes en tus checks para que el rival no pueda atacarlos gratis',
      'Apostar siempre con tus mejores manos',
      'Apostar fuerte para proteger tu mano de los proyectos',
      'Retirarte con las manos débiles',
    ],
    answerIndex: 0,
    explanation:
      'Si solo pasas con manos débiles, un rival atento apostará cada vez que pases. Unas cuantas manos fuertes en ese rango castigan esa agresión.',
  },
  {
    slug: 'pro-mental-01',
    level: 'pro',
    format: 'multiple-choice',
    category: 'mental',
    question: '¿Qué bankroll mínimo recomienda la mayoría de profesionales para cash games de No Limit?',
    options: ['Entre 20 y 50 buy-ins del límite', '2 buy-ins', '5 buy-ins', '500 buy-ins'],
    answerIndex: 0,
    explanation:
      'La varianza del No Limit produce rachas negativas de decenas de buy-ins incluso a jugadores ganadores. Con menos de 20 el riesgo de ruina se dispara.',
  },
  {
    slug: 'pro-mental-02',
    level: 'pro',
    format: 'true-false',
    category: 'mental',
    question: 'Si juegas bien, es imposible perder 20 buy-ins seguidos.',
    options: TRUE_FALSE,
    answerIndex: 1,
    explanation:
      'Falso. La varianza hace que jugadores claramente ganadores sufran rachas de 20, 30 o más buy-ins. Por eso se juzgan las decisiones y no los resultados a corto plazo.',
  },
  {
    slug: 'pro-mental-03',
    level: 'pro',
    format: 'multiple-choice',
    category: 'mental',
    question: '¿Qué es lo más fiable para evaluar si estás jugando bien a corto plazo?',
    options: [
      'Revisar la calidad de tus decisiones (su EV), no los resultados',
      'Mirar cuánto ganaste en la sesión',
      'Contar cuántos botes ganaste',
      'Compararte con la suerte de tus rivales',
    ],
    answerIndex: 0,
    explanation:
      'Juzgar una decisión por su resultado ("resulting") te hace cambiar jugadas correctas por una mala carta. El resultado solo converge con la calidad tras miles de manos.',
  },
];
