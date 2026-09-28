// ──────────────────────────────────────────────
// Biblioteca de escenas del modo explicativo.
//
// Una por concepto clave del programa. Cada escena
// es una mano corta y limpia que enseña una sola
// idea; las frases están escritas para oírse (van a
// la voz tal cual) y en español, el idioma fuente:
// la voz y la interfaz las traducen como el resto
// de la clase.
//
// Importes: ciegas 25/50 y stacks de 5.000 salvo que
// la escena diga otra cosa. En las apuestas y
// subidas `amount` es el total de la calle.
//
// Todas se construyen en los tests (script.ts las
// valida contra el motor): si una acción no es
// legal o no es el turno de quien la hace, el test
// falla.
// ──────────────────────────────────────────────

import type { ExplainerScene } from './types'

export const SCENES: ExplainerScene[] = [
  {
    id: 'streets',
    title: 'Las calles de una mano',
    summary: 'Preflop, flop, turn y river: cuatro rondas de apuestas y, si hace falta, showdown.',
    keywords: ['preflop', '\\bflop\\b', '\\bturn\\b', '\\briver\\b', 'calles?\\b', 'rondas? de apuestas', 'cartas comunitarias'],
    weight: 1,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: '9h 8h' },
      { id: 'ana', name: 'Ana', cards: 'Ks Qc' },
      { id: 'luis', name: 'Luis', cards: 'Ac 5c' },
    ],
    button: 'luis',
    board: 'Ah 9c 4d Jh 2s',
    beats: [
      {
        say: 'Preflop: cada jugador recibe dos cartas que solo ve él. Luis iguala la ciega grande, tú completas desde la ciega pequeña y Ana pasa.',
        actions: [
          { player: 'luis', type: 'call' },
          { player: 'hero', type: 'call' },
          { player: 'ana', type: 'check' },
        ],
      },
      {
        say: 'Flop: salen tres cartas comunitarias que comparten todos. Nadie apuesta.',
        actions: [
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'luis', type: 'check' },
        ],
      },
      {
        say: 'Turn: la cuarta carta, y otra ronda de apuestas.',
        actions: [
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'luis', type: 'check' },
        ],
      },
      {
        say: 'River: la quinta y última carta. Si después de apostar quedan dos o más jugadores, se llega al showdown.',
        actions: [
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'luis', type: 'check' },
        ],
      },
      {
        say: 'Showdown: se enseñan las cartas y gana la mejor mano de cinco. Luis gana con su pareja de ases.',
        reveal: true,
      },
    ],
  },

  {
    id: 'blinds',
    title: 'Las ciegas',
    summary: 'Apuestas obligatorias antes de ver cartas: hacen que siempre haya algo por lo que jugar.',
    // La ciega como posición ("la ciega grande"), no como unidad ("20 ciegas
    // grandes", "BB/100"): en plural y con cifra es una medida.
    keywords: ['ciega (pequena|grande)', '\\blas ciegas\\b', '\\bblinds?\\b', '\\bsb\\b(?!\\s?/)', '\\bbb\\b(?!\\s?/)'],
    weight: 2,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Jc 8c' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'luis',
    board: 'Jd 8s 3h',
    beats: [
      {
        say: 'Las ciegas son apuestas obligatorias que se ponen antes de ver las cartas. Las pagan los dos jugadores a la izquierda del botón.',
      },
      {
        say: 'Marta pone la ciega pequeña, 25, y tú la ciega grande, 50. Mira las fichas delante de cada una.',
      },
      {
        say: 'Para seguir en la mano, los demás tienen que pagar al menos la ciega grande. Ana y Luis prefieren retirarse.',
        actions: [
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'fold' },
        ],
      },
      {
        say: 'Marta completa: añade 25 para igualar los 50.',
        actions: [{ player: 'marta', type: 'call' }],
      },
      {
        say: 'Como ciega grande tus 50 ya están puestos: puedes pasar y ver el flop gratis.',
        actions: [{ player: 'hero', type: 'check' }],
      },
    ],
  },

  {
    id: 'actions',
    title: 'Las acciones',
    summary: 'Pasar, apostar, igualar, subir y retirarse: todo lo que puedes hacer cuando te toca.',
    keywords: ['acciones', '\\bcheck\\b', '\\bfold\\b', '\\bcall\\b', '\\bkol(es)?\\b', 'kolin', 'igualar', 'retirarse', '\\bpasar\\b', 'subida minima'],
    weight: 1.5,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: '6d 5d' },
      { id: 'ana', name: 'Ana', cards: 'Kh Tc' },
      { id: 'luis', name: 'Luis', cards: 'Ts Td' },
    ],
    button: 'luis',
    board: 'Th 9c 2s Qd',
    beats: [
      {
        say: 'Igualar, o call: Luis paga los 50 de la ciega grande para seguir en la mano. Tú haces lo mismo desde la ciega pequeña.',
        actions: [
          { player: 'luis', type: 'call' },
          { player: 'hero', type: 'call' },
        ],
      },
      {
        say: 'Pasar, o check: Ana ya tiene puesta la ciega grande y no añade nada.',
        actions: [{ player: 'ana', type: 'check' }],
      },
      {
        say: 'En el flop nadie ha apostado todavía, así que tú también puedes pasar.',
        actions: [{ player: 'hero', type: 'check' }],
      },
      {
        say: 'Apostar, o bet: Ana pone 100 en el bote. Ahora quien quiera seguir tiene que pagar esa cantidad.',
        actions: [{ player: 'ana', type: 'bet', amount: 100 }],
      },
      {
        say: 'Subir, o raise: Luis sube a 300. El precio para seguir ya no es 100, es 300.',
        actions: [{ player: 'luis', type: 'raise', amount: 300 }],
      },
      {
        say: 'Retirarse, o fold: tú abandonas la mano. Lo que ya pusiste en el bote deja de ser tuyo.',
        actions: [{ player: 'hero', type: 'fold' }],
      },
      {
        say: 'Ana iguala la subida y la mano sigue entre los dos en el turn.',
        actions: [{ player: 'ana', type: 'call' }],
      },
    ],
  },

  {
    id: 'seats',
    title: 'Las posiciones de la mesa',
    summary: 'Botón, ciegas, UTG, hijack y cutoff: quién es quién y en qué orden actúa cada uno.',
    // UTG llega a la voz como "U-T-G" (lessonScript): se buscan las dos formas.
    keywords: [
      '\\butg\\b', 'u-t-g', 'hijack', 'cutoff', '\\bhj\\b', '\\bco\\b',
      'posiciones de (una|la) mesa', 'seis posiciones', 'orden de actuacion', 'quien es quien', 'boton del dealer',
    ],
    weight: 2.5,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ah Th' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
      { id: 'sofia', name: 'Sofía' },
      { id: 'diego', name: 'Diego' },
    ],
    button: 'hero',
    board: 'Kd 8s 4c',
    beats: [
      {
        say: 'En una mesa de seis jugadores cada asiento tiene un nombre, y todo se cuenta desde el botón del dealer, la D. Hoy lo tienes tú: eres el botón.',
      },
      {
        say: 'A tu izquierda, Ana es la ciega pequeña y ha puesto 25. A su izquierda, Luis es la ciega grande y ha puesto 50.',
      },
      {
        say: 'Siguiendo las agujas del reloj, Marta es UTG: la primera en actuar antes del flop. Se retira.',
        actions: [{ player: 'marta', type: 'fold' }],
      },
      {
        say: 'Después viene Sofía, en el hijack, que también se retira. Y Diego, en el cutoff, el asiento justo antes del botón, paga 50.',
        actions: [
          { player: 'sofia', type: 'fold' },
          { player: 'diego', type: 'call' },
        ],
      },
      {
        say: 'Ahora te toca a ti, en el botón: eres el último antes de las ciegas. Pagas también.',
        actions: [{ player: 'hero', type: 'call' }],
      },
      {
        say: 'Las ciegas cierran la acción antes del flop: Ana completa y Luis pasa, porque ya tenía puestos sus 50.',
        actions: [
          { player: 'ana', type: 'call' },
          { player: 'luis', type: 'check' },
        ],
      },
      {
        say: 'Después del flop el orden cambia: empieza el primero que siga en la mano a la izquierda del botón. Ana actúa primera, luego Luis y luego Diego. Los tres pasan.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'luis', type: 'check' },
          { player: 'diego', type: 'check' },
        ],
      },
      {
        say: 'Y tú, en el botón, actúas el último en todas las calles, sabiendo ya lo que hicieron los demás. Con esa ventaja apuestas 100. Por eso el botón es la mejor posición.',
        actions: [{ player: 'hero', type: 'bet', amount: 100 }],
      },
    ],
  },

  {
    id: 'position',
    title: 'La posición',
    summary: 'Quien hace su acción el último en cada calle decide con más información: eso es jugar en posición.',
    keywords: ['posicion', '\\bip\\b', '\\boop\\b', 'boton', 'hablar? (el )?ultimo', 'actua(r|s)? (el )?ultimo'],
    weight: 2,
    players: [
      { id: 'hero', name: 'Tú', cards: '9h 8h' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis', cards: 'Qd Jc' },
    ],
    button: 'hero',
    board: 'Qh 6c 4d 7s 2h',
    beats: [
      {
        say: 'La posición es el orden en que cada jugador hace su acción. Tienes el botón: después del flop serás el último en actuar en todas las calles.',
      },
      {
        say: 'Subes a 125 con nueve y ocho de corazones. La ciega pequeña se retira y Luis paga desde la ciega grande.',
        actions: [
          { player: 'hero', type: 'raise', amount: 125 },
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'call' },
        ],
      },
      {
        say: 'En el flop Luis hace su acción primero: está fuera de posición. Pasa sin saber qué vas a hacer tú.',
        actions: [{ player: 'luis', type: 'check' }],
      },
      {
        say: 'Tú haces tu acción después, en posición, y ya sabes que él pasó. Decides pasar y ver el turn gratis.',
        actions: [{ player: 'hero', type: 'check' }],
      },
      {
        say: 'El siete del turn te da un proyecto de escalera. Luis vuelve a actuar primero y apuesta 150.',
        actions: [{ player: 'luis', type: 'bet', amount: 150 }],
      },
      {
        say: 'Decides con su apuesta ya sobre la mesa: pagas para ver si ligas la escalera.',
        actions: [{ player: 'hero', type: 'call' }],
      },
      {
        say: 'En el river Luis pasa y tú también, sin pagar más. Pierdes contra su dama, pero lo mínimo: en posición controlas el tamaño del bote.',
        actions: [
          { player: 'luis', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
        reveal: true,
      },
    ],
  },

  {
    id: 'open-raise',
    title: 'Abrir el bote (open raise)',
    summary: 'Ser el primero en subir. Cuanto más tarde te toca actuar, más manos puedes abrir.',
    keywords: ['open raise', 'open reis', '\\babrir\\b', 'apertura', 'abres?\\b', 'rangos? de apertura'],
    weight: 2.5,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Kc 9c' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
      { id: 'sofia', name: 'Sofía' },
      { id: 'diego', name: 'Diego' },
    ],
    button: 'hero',
    beats: [
      {
        say: 'Abrir, o hacer open raise, es ser el primero en subir cuando nadie ha entrado todavía al bote.',
      },
      {
        say: 'Marta es la primera en hacer su acción, en UTG. Con cinco jugadores detrás necesita una mano muy fuerte, y se retira.',
        actions: [{ player: 'marta', type: 'fold' }],
      },
      {
        say: 'En hijack y en cutoff tampoco abren.',
        actions: [
          { player: 'sofia', type: 'fold' },
          { player: 'diego', type: 'fold' },
        ],
      },
      {
        say: 'En el botón solo quedan las ciegas por actuar. Abres a 125, dos veces y media la ciega grande, con rey nueve de tréboles: una mano que desde UTG sería un fold.',
        actions: [{ player: 'hero', type: 'raise', amount: 125 }],
      },
      {
        say: 'Las ciegas jugarían fuera de posición y se retiran: te llevas las ciegas sin ver el flop.',
        actions: [
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'fold' },
        ],
      },
    ],
  },

  {
    id: 'open-sizes',
    title: 'El tamaño según la posición',
    summary: 'Desde el botón basta doblar; de UTG, a 2,5x; desde la SB, a 3x.',
    keywords: ['tamano de (la |tu )?apertura', '\\bmin-raise\\b', 'min-reis', '\\bsize\\b', '\\bdoblar\\b'],
    weight: 3,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Qd Ts' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta' },
      { id: 'sofia', name: 'Sofía' },
      { id: 'diego', name: 'Diego' },
    ],
    button: 'hero',
    beats: [
      {
        say: 'Marta, Sofía y Diego se retiran: desde las primeras posiciones solo se abre fuerte.',
        actions: [
          { player: 'marta', type: 'fold' },
          { player: 'sofia', type: 'fold' },
          { player: 'diego', type: 'fold' },
        ],
      },
      {
        say: 'En el botón basta doblar: min-raise a 100 con dama diez, una mano que desde UTG sería fold.',
        actions: [{ player: 'hero', type: 'raise', amount: 100 }],
      },
      {
        say: 'Ana y Luis, en ciegas y fuera de posición, se retiran. Compara: de UTG habrían sido 125 y desde la SB, 150. El tamaño también es rango.',
        actions: [
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'fold' },
        ],
      },
    ],
  },

  {
    id: 'three-bet',
    title: 'El 3-bet',
    summary: 'La resubida preflop: la ciega grande es la primera apuesta, la apertura la segunda y tu resubida la tercera.',
    keywords: ['3-?bet', 'resubida', 'resubir', 'squeeze', 'scuiz'],
    weight: 3,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Qh Qs' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis' },
      { id: 'marta', name: 'Marta', cards: 'Ad Tc' },
    ],
    button: 'hero',
    board: '9d 5c 2h',
    beats: [
      {
        say: 'Un 3-bet es la resubida antes del flop. La ciega grande cuenta como la primera apuesta y la apertura como la segunda.',
      },
      {
        say: 'Marta abre a 125.',
        actions: [{ player: 'marta', type: 'raise', amount: 125 }],
      },
      {
        say: 'Desde el botón, con pareja de damas, resubes a 375, tres veces su apertura. Eso es un 3-bet.',
        actions: [{ player: 'hero', type: 'raise', amount: 375 }],
      },
      {
        say: 'Las ciegas se apartan.',
        actions: [
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'fold' },
        ],
      },
      {
        say: 'Marta paga: jugará un bote grande y fuera de posición.',
        actions: [{ player: 'marta', type: 'call' }],
      },
      {
        say: 'En el flop ella pasa y tú apuestas 400. El 3-bet te dio la iniciativa y un bote más grande para tu mano fuerte.',
        actions: [
          { player: 'marta', type: 'check' },
          { player: 'hero', type: 'bet', amount: 400 },
        ],
      },
      {
        say: 'Sin pareja, Marta se retira.',
        actions: [{ player: 'marta', type: 'fold' }],
      },
    ],
  },

  {
    id: 'cbet',
    title: 'La c-bet',
    summary: 'La apuesta de continuación: quien subió antes del flop sigue apostando en el flop.',
    keywords: ['c-?bet', 'continuation bet', 'apuestas? de continuacion'],
    weight: 3,
    players: [
      { id: 'hero', name: 'Tú', cards: 'As Qd' },
      { id: 'ana', name: 'Ana' },
      { id: 'luis', name: 'Luis', cards: 'Tc 9c' },
      { id: 'marta', name: 'Marta' },
    ],
    button: 'hero',
    board: 'Ks 7d 2c',
    beats: [
      {
        say: 'La c-bet, o apuesta de continuación, es la apuesta que hace en el flop quien subió antes del flop. Estás en el botón con as dama.',
        actions: [{ player: 'marta', type: 'fold' }],
      },
      {
        say: 'Abres subiendo a 125: tomas la iniciativa de la mano.',
        actions: [{ player: 'hero', type: 'raise', amount: 125 }],
      },
      {
        say: 'La ciega pequeña se retira y Luis paga desde la ciega grande.',
        actions: [
          { player: 'ana', type: 'fold' },
          { player: 'luis', type: 'call' },
        ],
      },
      {
        say: 'Sale rey, siete, dos de palos distintos: un board seco que favorece a quien subió preflop. Luis pasa.',
        actions: [{ player: 'luis', type: 'check' }],
      },
      {
        say: 'Aquí va la c-bet: apuestas 90, un tercio del bote, y sigues contando que tienes una mano fuerte.',
        actions: [{ player: 'hero', type: 'bet', amount: 90 }],
      },
      {
        say: 'A Luis le cuesta pagar sin un rey: se retira y ganas el bote sin enseñar tus cartas.',
        actions: [{ player: 'luis', type: 'fold' }],
      },
    ],
  },

  {
    id: 'barrel',
    title: 'El segundo barril',
    summary: 'Volver a apostar en el turn después de la c-bet, cuando la carta te favorece.',
    keywords: ['barrel', 'barril', 'segundo tiro', 'delayed c-?bet', 'probe'],
    weight: 3,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ac Kc' },
      { id: 'ana', name: 'Ana', cards: '9h 8h' },
    ],
    button: 'hero',
    board: 'Qd 8c 3s Kh',
    beats: [
      {
        say: 'Subes a 150 con as rey de tréboles y Ana paga desde la ciega grande.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'En el flop ella pasa, haces tu c-bet de 100 y paga.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'bet', amount: 100 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Llega un rey: una carta que encaja mucho mejor con tu rango de subida que con el suyo. Ana pasa.',
        actions: [{ player: 'ana', type: 'check' }],
      },
      {
        say: 'Disparas el segundo barril: 300. Las cartas altas del turn favorecen a quien subió preflop.',
        actions: [{ player: 'hero', type: 'bet', amount: 300 }],
      },
      {
        say: 'Con su pareja de ochos, Ana se retira.',
        actions: [{ player: 'ana', type: 'fold' }],
        reveal: true,
      },
    ],
  },

  {
    id: 'check-raise',
    title: 'El check-raise',
    summary: 'Pasar para subir después: hace crecer el bote cuando la apuesta viene del rival.',
    keywords: ['check-?raise', 'check-?reises?'],
    weight: 3.5,
    players: [
      { id: 'hero', name: 'Tú', cards: '8d 7d' },
      { id: 'ana', name: 'Ana', cards: 'Ah Qc' },
      { id: 'luis', name: 'Luis' },
    ],
    button: 'ana',
    board: '8s 7c 3h Kd',
    beats: [
      {
        say: 'Ana abre desde el botón a 125 y la ciega pequeña se retira.',
        actions: [
          { player: 'ana', type: 'raise', amount: 125 },
          { player: 'luis', type: 'fold' },
        ],
      },
      {
        say: 'Pagas en la ciega grande con ocho siete de diamantes.',
        actions: [{ player: 'hero', type: 'call' }],
      },
      {
        say: 'Ocho, siete, tres: ligas doble pareja. Haces tu acción primero y pasas, a propósito.',
        actions: [{ player: 'hero', type: 'check' }],
      },
      {
        say: 'Ana hace su c-bet de 100.',
        actions: [{ player: 'ana', type: 'bet', amount: 100 }],
      },
      {
        say: 'Y ahora subes a 350: eso es un check-raise. Pasar y luego subir mete más fichas en el bote con tu mano fuerte.',
        actions: [{ player: 'hero', type: 'raise', amount: 350 }],
      },
      {
        say: 'Ana paga. El bote es mucho más grande de lo que habría sido si hubieras apostado tú.',
        actions: [{ player: 'ana', type: 'call' }],
      },
    ],
  },

  {
    id: 'value-bet',
    title: 'La apuesta de valor',
    summary: 'Apostar para que te pague una mano peor que la tuya.',
    keywords: ['apuestas? de valor', 'value bet', 'valiu bet', 'por valor', 'apuestas? finas?', 'valor fino'],
    weight: 2.5,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ah Jh' },
      { id: 'ana', name: 'Ana', cards: 'Js Ts' },
    ],
    button: 'hero',
    board: 'Jc 8d 4s 2h 6c',
    beats: [
      {
        say: 'Una apuesta de valor busca que te pague una mano peor. Subes a 150 con as jota y Ana paga.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Ligas pareja de jotas con el mejor kicker. Ana pasa, apuestas 150 y ella paga.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'bet', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'En el turn pasáis los dos: controlas el tamaño del bote.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'River. Ana pasa. Piensa qué manos peores te pueden pagar: jotas con peor kicker, ochos, proyectos fallidos. Apuestas 250 por valor.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'bet', amount: 250 },
        ],
      },
      {
        say: 'Ana paga con jota diez y ganas un bote más grande: eso es apostar por valor.',
        actions: [{ player: 'ana', type: 'call' }],
        reveal: true,
      },
    ],
  },

  {
    id: 'bluff',
    title: 'El farol',
    summary: 'Apostar con una mano que pierde para que se retire una mejor.',
    keywords: ['farol', 'faroles', 'bluff', 'semifarol', 'blockers?', 'bloqueadores?'],
    weight: 2.5,
    players: [
      { id: 'hero', name: 'Tú', cards: '7s 6s' },
      { id: 'ana', name: 'Ana', cards: 'Kd Jc' },
    ],
    button: 'hero',
    board: 'Ks 9s 2d Qh 3c',
    beats: [
      {
        say: 'Un farol es apostar con una mano que no gana para que se retire una mejor. Subes a 150 con siete seis de picas y Ana paga.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Tienes proyecto de color. Ana pasa, apuestas 150 y paga.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'bet', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'En el turn ella vuelve a pasar y apuestas 350. Es un semifarol: hoy no ganas, pero aún puedes ligar.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'bet', amount: 350 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'El river no trae el color. Solo ganas si ella se retira. Ana pasa.',
        actions: [{ player: 'ana', type: 'check' }],
      },
      {
        say: 'Apuestas 900: la historia de una mano fuerte en las tres calles. Eso es un farol.',
        actions: [{ player: 'hero', type: 'bet', amount: 900 }],
      },
      {
        say: 'Ana se retira con pareja de reyes, una mano mejor que la tuya, y el bote es tuyo.',
        actions: [{ player: 'ana', type: 'fold' }],
        reveal: true,
      },
    ],
  },

  {
    id: 'pot-odds',
    title: 'Pot odds y outs',
    summary: 'Comparar lo que cuesta seguir con lo que puedes ganar, y contar las cartas que te ayudan.',
    keywords: ['pot odds', '\\bodds\\b', '\\bouts?\\b', 'regla del (2|dos)\\b', 'precio', 'proyecto', 'equity', 'ekuiti', 'implied'],
    weight: 2.5,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ah 5h' },
      { id: 'ana', name: 'Ana', cards: 'Kd Qc' },
    ],
    button: 'ana',
    board: 'Kh 9h 3c Qh',
    beats: [
      {
        say: 'Ana sube a 100 desde el botón y pagas en la ciega grande con as cinco de corazones.',
        actions: [
          { player: 'ana', type: 'raise', amount: 100 },
          { player: 'hero', type: 'call' },
        ],
      },
      {
        say: 'Rey, nueve, tres, con dos corazones: tienes proyecto de color. Quedan nueve corazones en la baraja: son tus outs. Pasas.',
        actions: [{ player: 'hero', type: 'check' }],
      },
      {
        say: 'Ana apuesta 50 en un bote de 200.',
        actions: [{ player: 'ana', type: 'bet', amount: 50 }],
      },
      {
        say: 'Pagas 50 para ganar 250: necesitas acertar una de cada seis veces, cerca de un 17 por ciento. Con la regla del 2, nueve outs por dos da un 18 por ciento con una carta por salir.',
      },
      {
        say: 'Como 18 es más que 17, pagar es correcto.',
        actions: [{ player: 'hero', type: 'call' }],
      },
      {
        say: 'La dama de corazones del turn te da el color. Pagar al precio correcto es lo que hace rentable un proyecto.',
      },
    ],
  },

  {
    id: 'all-in',
    title: 'All-in',
    summary: 'Apostar todas tus fichas. Nadie puede ganarte más de lo que tiene en la mesa.',
    keywords: ['all-?in', 'ol-in', 'botes? laterales?', 'side pot', 'todas tus fichas'],
    weight: 2.5,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ts Tc' },
      { id: 'ana', name: 'Ana', cards: 'Ah Kd', stack: 1200 },
    ],
    button: 'hero',
    board: '8h 5d 2c Qs 3h',
    beats: [
      {
        say: 'All-in es apostar todas las fichas que tienes. Fíjate en el stack de Ana: solo 1.200.',
      },
      {
        say: 'Subes a 150 con pareja de dieces y Ana va all-in por 1.200.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'raise', amount: 1200 },
        ],
      },
      {
        say: 'De ella solo puedes ganar lo que tiene: pagas hasta sus 1.200 y el resto de tu stack no entra en juego.',
        actions: [{ player: 'hero', type: 'call' }],
      },
      {
        say: 'Ya no quedan apuestas posibles: se enseñan las cartas y salen las cinco comunitarias. Tus dieces aguantan.',
        reveal: true,
      },
    ],
  },

  {
    id: 'ranking-showdown',
    title: 'La categoría manda',
    summary: 'Showdown entre escalera y color: gana el color aunque su carta más alta sea menor.',
    keywords: ['ranking de manos', 'categoria manda', 'color gana a la escalera', 'full gana al color', 'escalera de color', '5 cartas encajen'],
    weight: 3,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: '6h 7h' },
      { id: 'ana', name: 'Ana', cards: '7c Tc' },
    ],
    button: 'hero',
    board: '2h 5h 9h 8c 6d',
    beats: [
      {
        say: 'Subes a 150 con seis siete de corazones y Ana paga con siete diez.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Flop: dos, cinco y nueve de corazones. Ya tienes color servido; Ana solo tiene diez alto y un proyecto de escalera. Nadie apuesta.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Turn: un ocho. River: un seis. Seguís pasando.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Showdown: el ocho y el seis le dan a Ana escalera del seis al diez. Pero tú tienes color. La categoría manda: el color gana a la escalera aunque su diez sea más alto que tu nueve.',
        reveal: true,
      },
    ],
  },

  {
    id: 'full-flush',
    title: 'El board emparejado',
    summary: 'Tu color servido pierde contra un full cuando la mesa se empareja.',
    keywords: ['mesa emparejada', 'tu color esta en peligro', 'full contra color'],
    weight: 3,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ah Jh' },
      { id: 'ana', name: 'Ana', cards: 'Kd Kc' },
    ],
    button: 'hero',
    board: 'Kh 9h 7c 7d 2h',
    beats: [
      {
        say: 'Subes a 150 con as jota de corazones y Ana paga con pareja de reyes.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Flop: rey, nueve y siete con dos corazones. Ana tiene trío de reyes; tú, proyecto de color al as. Nadie apuesta.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Turn: otro siete que empareja la mesa. River: un dos de corazones que te da el color al as. Seguís pasando.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Showdown: tu color al as pierde contra su full de reyes con sietes. Mesa emparejada: el trío se vuelve full, y el full gana al color.',
        reveal: true,
      },
    ],
  },

  {
    id: 'quads',
    title: 'El póker',
    summary: 'El full de reyes pierde contra póker de ochos: en la cima casi nada gana al póker.',
    keywords: ['casi nunca veras', 'tienes poker', 'poker contra full'],
    weight: 3,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: '8d 8c' },
      { id: 'ana', name: 'Ana', cards: 'Ks Qs' },
    ],
    button: 'hero',
    board: '8s 8h Kd 4c 4d',
    beats: [
      {
        say: 'Subes a 150 con pareja de ochos y Ana paga con rey dama.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Flop: ocho, ocho y rey. Tienes póker de ochos; Ana tiene doble pareja de reyes y ochos. Nadie apuesta.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Turn: un cuatro. River: otro cuatro que le da a Ana full de reyes con cuatros. Seguís pasando.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Showdown: su full pierde contra tu póker. En la cima de la tabla casi nada gana al póker: solo una escalera de color lo supera.',
        reveal: true,
      },
    ],
  },

  {
    id: 'wheel',
    title: 'La rueda',
    summary: 'El as también vale como 1: la escalera más baja gana a pareja, doble y trío.',
    keywords: ['rueda', 'escalera mas olvidada', 'as puede valer como'],
    weight: 3,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'As 2h' },
      { id: 'ana', name: 'Ana', cards: 'Ks Qc' },
    ],
    button: 'hero',
    board: '3d 4c 5s Kh 9d',
    beats: [
      {
        say: 'Subes a 150 con as dos y Ana paga con rey dama.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Flop: tres, cuatro y cinco. Tienes la rueda: escalera del as al cinco. Ana no tiene ni pareja. Nadie apuesta.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Turn: un rey que le da pareja a Ana. River: un nueve. Seguís pasando.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Showdown: su pareja de reyes pierde contra tu rueda. El as también vale como 1: es la escalera más baja, pero gana a trío, doble pareja, pareja y carta alta.',
        reveal: true,
      },
    ],
  },

  {
    id: 'kicker',
    title: 'El kicker',
    summary: 'Cuando dos jugadores ligan la misma pareja, gana la carta más alta que la acompaña.',
    keywords: ['kicker', 'desempate', 'ranking de manos', 'mejor mano', 'showdown', 'manos? iguales', 'parecen iguales'],
    weight: 2,
    introductory: true,
    players: [
      { id: 'hero', name: 'Tú', cards: 'Ah Qd' },
      { id: 'ana', name: 'Ana', cards: 'As 9c' },
    ],
    button: 'hero',
    board: 'Ad 7s 4h 2c Jd',
    beats: [
      {
        say: 'Subes a 150 con as dama y Ana paga.',
        actions: [
          { player: 'hero', type: 'raise', amount: 150 },
          { player: 'ana', type: 'call' },
        ],
      },
      {
        say: 'Sale un as: los dos tenéis pareja de ases. Nadie apuesta.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Turn y river, y seguís pasando.',
        actions: [
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
          { player: 'ana', type: 'check' },
          { player: 'hero', type: 'check' },
        ],
      },
      {
        say: 'Misma pareja de ases: decide la carta más alta que la acompaña, el kicker. Tu dama gana a su nueve.',
        reveal: true,
      },
    ],
  },
]

export function findScene(id: string): ExplainerScene | undefined {
  return SCENES.find(scene => scene.id === id)
}
