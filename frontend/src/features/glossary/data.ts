// ──────────────────────────────────────────────
// Glosario — el vocabulario del poker.
// Los términos ingleses son los que se usan en la
// mesa, así que se enseñan tal cual, con su
// traducción y una explicación que no dé por
// supuesto nada.
// ──────────────────────────────────────────────

export type GlossaryCategory = 'reglas' | 'acciones' | 'estrategia' | 'matematicas' | 'jerga'

export interface GlossaryTerm {
  term: string
  /** Equivalente en español, si existe uno de uso común. */
  spanish?: string
  category: GlossaryCategory
  definition: string
  /** Términos relacionados, por su `term`. */
  related?: string[]
}

export interface GlossaryCategoryMeta {
  id: GlossaryCategory
  label: string
  /** Color de acento de la categoría: es lo que hace ojeable el listado. */
  color: string
  /** Icono de lucide-react. */
  icon: string
  /** Una línea que explica qué entra en esta categoría. */
  hint: string
}

export const GLOSSARY_CATEGORIES: GlossaryCategoryMeta[] = [
  {
    id: 'reglas',
    label: 'Reglas',
    color: '#38bdf8',
    icon: 'BookOpen',
    hint: 'Cómo funciona el juego: posiciones, calles y reparto del bote.',
  },
  {
    id: 'acciones',
    label: 'Acciones',
    color: '#f59e0b',
    icon: 'MousePointerClick',
    hint: 'Lo que puedes hacer en tu turno y cómo se llama.',
  },
  {
    id: 'estrategia',
    label: 'Estrategia',
    color: '#22c55e',
    icon: 'Target',
    hint: 'Ideas que deciden si una jugada gana o pierde fichas.',
  },
  {
    id: 'matematicas',
    label: 'Matemáticas',
    color: '#a78bfa',
    icon: 'Calculator',
    hint: 'Los números del poker: equity, odds y frecuencias.',
  },
  {
    id: 'jerga',
    label: 'Jerga',
    color: '#f472b6',
    icon: 'MessagesSquare',
    hint: 'El vocabulario de la mesa que nadie te explica.',
  },
]

/** Metadatos de una categoría por su id. */
export function categoryMeta(id: GlossaryCategory): GlossaryCategoryMeta {
  return GLOSSARY_CATEGORIES.find(category => category.id === id) ?? GLOSSARY_CATEGORIES[0]
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: '3-bet', category: 'acciones', definition: 'La tercera apuesta preflop: resubir contra quien abrió el bote. Desde las ciegas casi todo se juega con 3-bet o fold.', related: ['Open raise', '4-bet'] },
  { term: '4-bet', category: 'acciones', definition: 'La cuarta apuesta preflop: resubir contra un 3-bet. Solo la juegan el tope del rango y algún farol con blocker.', related: ['3-bet', '5-bet'] },
  { term: '5-bet', category: 'acciones', definition: 'La quinta apuesta preflop, casi siempre all-in. A estas alturas solo continúan pares altos y A-K.', related: ['4-bet'] },
  { term: 'All-in', spanish: 'Todo dentro', category: 'acciones', definition: 'Apostar todas tus fichas. Si no cubres la apuesta del rival, solo compites por la parte del bote que hayas igualado.', related: ['Side pot'] },
  { term: 'Ante', category: 'reglas', definition: 'Apuesta obligatoria pequeña que ponen todos los jugadores antes de repartir. Aumenta el bote inicial y fuerza más acción.' },
  { term: 'Backdoor', spanish: 'Puerta trasera', category: 'estrategia', definition: 'Proyecto que necesita las dos cartas siguientes para completarse, como un color con solo tres cartas del palo en el flop.' },
  { term: 'Bad beat', category: 'jerga', definition: 'Perder una mano siendo gran favorito. Duele, pero forma parte de la varianza: a largo plazo son las que hacen que los rivales sigan jugando.' },
  { term: 'Bankroll', spanish: 'Banca', category: 'matematicas', definition: 'El dinero separado exclusivamente para jugar, medido en buy-ins. Sin banca suficiente juegas con miedo y tomas peores decisiones justo en los botes grandes.', related: ['Varianza'] },
  { term: 'Barrel', category: 'estrategia', definition: 'Apostar el turn (segundo barrel) o el river (triple barrel) después de haber apostado la calle anterior. Sin equity ni fold equity, el barrel quema fichas.', related: ['C-bet', 'Fold equity'] },
  { term: 'Blockers', spanish: 'Bloqueadores', category: 'estrategia', definition: 'Cartas de tu mano que reducen las combinaciones fuertes que puede tener el rival. Tener el as de un palo impide que el rival tenga el color máximo de ese palo.' },
  { term: 'Bluff', spanish: 'Farol', category: 'estrategia', definition: 'Apostar con una mano que no gana en showdown, buscando que el rival se retire.', related: ['Semi-bluff'] },
  { term: 'Bluff-catch', category: 'estrategia', definition: 'Pagar una apuesta con una mano media que solo gana si el rival va de farol. En el river ya no hay cartas por venir: o el precio da o no da.', related: ['Bluff-catcher', 'Pot odds'] },
  { term: 'Bluff-catcher', category: 'estrategia', definition: 'Mano media con la que pagas esperando cazar un farol: gana a sus faroles y pierde contra su valor. Paga solo con precio y contra quien farolea de verdad.', related: ['Bluff-catch', 'Blockers'] },
  { term: 'Board', spanish: 'Mesa', category: 'reglas', definition: 'Las cartas comunitarias: flop, turn y river. Todos los jugadores las comparten.' },
  { term: 'Bote lateral', category: 'reglas', definition: 'Bote independiente que se crea cuando un jugador va all-in por menos que los demás. Solo lo disputan quienes cubrieron esa cantidad.', related: ['All-in'] },
  { term: 'Bubble', spanish: 'Burbuja', category: 'jerga', definition: 'En torneos, el momento justo antes de que empiecen los premios. Es donde más presión se puede ejercer sobre los stacks medianos.', related: ['ICM'] },
  { term: 'Button', spanish: 'Botón', category: 'reglas', definition: 'La posición del dealer. Actúa el último en todas las rondas postflop, lo que la convierte en la posición más rentable de la mesa.' },
  { term: 'C-bet', spanish: 'Apuesta de continuación', category: 'estrategia', definition: 'Apuesta en el flop hecha por quien fue el agresor preflop. Funciona porque el rival falla el flop la mayoría de las veces.' },
  { term: 'Call', spanish: 'Igualar', category: 'acciones', definition: 'Pagar la apuesta actual para seguir en la mano sin subirla.' },
  { term: 'Check', spanish: 'Pasar', category: 'acciones', definition: 'Ceder el turno sin apostar. Solo es posible si nadie ha apostado en esa calle.' },
  { term: 'Check-raise', category: 'acciones', definition: 'Pasar con la intención de subir cuando el rival apueste. Una de las jugadas más fuertes del juego, tanto por valor como como farol.' },
  { term: 'Cold call', category: 'acciones', definition: 'Pagar una subida sin haber invertido nada antes en el bote. Suele indicar una mano de fuerza media.' },
  { term: 'Combo', spanish: 'Combinación', category: 'matematicas', definition: 'Cada forma concreta de tener una mano. Hay 6 combinaciones de cada pareja y 16 de cada mano no emparejada.' },
  { term: 'Cutoff', category: 'reglas', definition: 'La posición inmediatamente anterior al botón. Es la segunda mejor posición de la mesa.' },
  { term: 'Delayed c-bet', category: 'estrategia', definition: 'Pasar el flop en posición y apostar el turn después de que el rival pase de nuevo. Cobra de manos que flotaron una calle y protege tu rango de check.', related: ['C-bet', 'Probe'] },
  { term: 'Donk bet', category: 'jerga', definition: 'Apostar fuera de posición contra quien fue el agresor de la calle anterior. Mal vista históricamente, hoy tiene usos concretos.' },
  { term: 'Draw', spanish: 'Proyecto', category: 'estrategia', definition: 'Mano incompleta que puede convertirse en fuerte con las cartas por venir, como un proyecto de color o de escalera.', related: ['Outs'] },
  { term: 'Equity', category: 'matematicas', definition: 'Tu porcentaje de participación en el bote: la probabilidad de ganar la mano si se repartieran todas las cartas restantes.', related: ['Pot odds'] },
  { term: 'Equity realization', category: 'estrategia', definition: 'Qué parte de tu equity puedes cobrar realmente. Estar en posición la aumenta; jugar fuera de posición la reduce.' },
  { term: 'Flop', category: 'reglas', definition: 'Las tres primeras cartas comunitarias, repartidas a la vez tras la ronda de apuestas preflop.' },
  { term: 'Fold', spanish: 'Retirarse', category: 'acciones', definition: 'Abandonar la mano. Pierdes lo ya apostado, pero no arriesgas más.' },
  { term: 'Fold equity', category: 'matematicas', definition: 'El valor que aporta a tu apuesta la posibilidad de que el rival se retire. Es la mitad del motivo por el que un semifarol es rentable.' },
  { term: 'Full ring', category: 'jerga', definition: 'Mesa de 9 o 10 jugadores. Se juega más ajustado que en mesa corta porque hay más rivales por superar.' },
  { term: 'GTO', category: 'estrategia', definition: 'Game Theory Optimal: estrategia equilibrada que no puede ser explotada, aunque el rival la conozca. No es la que más gana contra jugadores que cometen errores.' },
  { term: 'Heads-up', category: 'jerga', definition: 'Mano o partida entre dos jugadores. Las ciegas se invierten: el botón es la ciega pequeña y actúa primero preflop.' },
  { term: 'ICM', category: 'matematicas', definition: 'Independent Chip Model: modelo que traduce fichas de torneo a dinero real. Explica por qué en la burbuja muchas jugadas rentables en fichas son errores en dinero.', related: ['Bubble'] },
  { term: 'Implied odds', spanish: 'Odds implícitas', category: 'matematicas', definition: 'Lo que esperas cobrar en calles futuras si ligas tu proyecto. Justifican pagar sin precio directo contra rivales que pagan de más, y no existen contra quien no paga.', related: ['Pot odds', 'Outs'] },
  { term: 'Kicker', category: 'reglas', definition: 'Carta de apoyo que desempata dos manos de la misma categoría. Con A-K y A-Q en un board con as, gana el rey.' },
  { term: 'LAG', category: 'jerga', definition: 'Loose-aggressive: juega muchas manos y con mucha agresión. Difícil de leer y peligroso, pero también propenso a sobrevalorar manos.' },
  { term: 'MDF', category: 'matematicas', definition: 'Minimum Defense Frequency: porcentaje mínimo de tu rango que debes seguir jugando para que el farol del rival no sea automáticamente rentable.' },
  { term: 'Muck', category: 'jerga', definition: 'Descartar la mano sin enseñarla. También se dice de las cartas descartadas en general.' },
  { term: 'Multiway', category: 'jerga', definition: 'Bote con tres o más jugadores. La fold equity se divide y las manos medias pierden valor: sin nuts o gran proyecto, pasar es el estándar.' },
  { term: 'Nuts', spanish: 'Nueces', category: 'jerga', definition: 'La mejor mano posible en un board concreto. No puede perder.' },
  { term: 'Offsuit', category: 'reglas', definition: 'Dos cartas de distinto palo. Se marca con "o": AKo.', related: ['Suited'] },
  { term: 'Open raise', spanish: 'Apertura', category: 'acciones', definition: 'La primera subida preflop de una mano. Define tu rango desde esa posición.' },
  { term: 'Outs', category: 'matematicas', definition: 'Cartas que todavía están en la baraja y que convertirían tu mano en ganadora.', related: ['Draw', 'Equity'] },
  { term: 'Overbet', spanish: 'Sobreapuesta', category: 'estrategia', definition: 'Apostar más que el tamaño del bote. Polariza el rango: se usa con las mejores manos y con faroles.' },
  { term: 'Overcard', category: 'estrategia', definition: 'Carta de tu mano más alta que cualquiera del board. A-K en un flop 9-7-2 son dos overcards.' },
  { term: 'Polarizado', category: 'estrategia', definition: 'Rango compuesto de manos muy fuertes y faroles, sin nada intermedio. Característico de las apuestas grandes.' },
  { term: 'Pot odds', category: 'matematicas', definition: 'Relación entre lo que pagas y lo que puedes ganar. Determinan el porcentaje mínimo de equity que necesitas para que igualar sea rentable.', related: ['Equity'] },
  { term: 'Preflop', category: 'reglas', definition: 'La ronda de apuestas anterior a que se reparta ninguna carta comunitaria.' },
  { term: 'Probe', category: 'estrategia', definition: 'Apostar fuera de posición en el turn cuando el agresor del flop pasó. Ataca su debilidad mostrada, sobre todo en boards que completan tu rango.', related: ['Delayed c-bet', 'Bluff'] },
  { term: 'Rango', category: 'estrategia', definition: 'Conjunto de todas las manos con las que un jugador jugaría de una forma determinada. Pensar en rangos, y no en manos concretas, es el salto clave del jugador avanzado.' },
  { term: 'Rango capado', category: 'estrategia', definition: 'Rango que ya no puede tener las mejores manos por su línea: quien paga y pasa dos calles ya no tiene sets. Contra él, el overbet polarizado es el castigo.', related: ['Overbet', 'Polarizado'] },
  { term: 'Raise', spanish: 'Subir', category: 'acciones', definition: 'Aumentar la apuesta actual. Debe ser al menos del tamaño de la subida anterior.' },
  { term: 'Rake', spanish: 'Comisión', category: 'matematicas', definition: 'La comisión que cobra la sala de cada bote. En micros convierte muchos calls de "precio justo" en perdedores: defiende un poco más estrecho.', related: ['Pot odds'] },
  { term: 'Reverse implied', category: 'matematicas', definition: 'Lo que perderás en calles futuras cuando ligues tu proyecto y aun así vayas por detrás, como el color bajo contra un posible color máximo.', related: ['Implied odds'] },
  { term: 'River', category: 'reglas', definition: 'La quinta y última carta comunitaria. Tras ella se juega la última ronda de apuestas.' },
  { term: 'Semi-bluff', spanish: 'Semifarol', category: 'estrategia', definition: 'Apostar con una mano que aún no gana pero que tiene outs para mejorar. Gana si el rival se retira y también si ligas.', related: ['Bluff', 'Fold equity'] },
  { term: 'Set', category: 'jerga', definition: 'Trío formado con una pareja en mano más una carta del board. Mucho más disimulado que el trío formado con una pareja del board.' },
  { term: 'Showdown', category: 'reglas', definition: 'Momento en que los jugadores que quedan enseñan sus cartas y se decide quién gana el bote.' },
  { term: 'Side pot', spanish: 'Bote lateral', category: 'reglas', definition: 'Ver "Bote lateral".', related: ['All-in'] },
  { term: 'Slowplay', category: 'estrategia', definition: 'Jugar una mano muy fuerte de forma pasiva para disimularla. Útil en boards secos, peligroso en boards con proyectos.' },
  { term: 'SPR', category: 'matematicas', definition: 'Stack-to-pot ratio: el stack efectivo dividido entre el bote en el flop. Decide si tu mano está comprometida o si aún hay que controlar el bote.', related: ['Stack', 'Pot odds'] },
  { term: 'Squeeze', category: 'acciones', definition: 'Resubir después de que alguien haya abierto y uno o más jugadores hayan pagado. La presión sobre los que ya pagaron es máxima.' },
  { term: 'Stack', category: 'reglas', definition: 'Las fichas que tienes delante. Su tamaño respecto a las ciegas condiciona toda tu estrategia.' },
  { term: 'Suited', category: 'reglas', definition: 'Dos cartas del mismo palo. Se marca con "s": AKs.', related: ['Offsuit'] },
  { term: 'TAG', category: 'jerga', definition: 'Tight-aggressive: juega pocas manos pero las juega con agresión. Es el estilo estándar del jugador ganador.' },
  { term: 'Thin value', spanish: 'Valor fino', category: 'estrategia', definition: 'Apostar por valor con una mano media buscando pago de manos aún peores. Es una de las diferencias medibles entre quien empata y quien gana.', related: ['Value bet'] },
  { term: 'Tilt', category: 'jerga', definition: 'Estado emocional en el que las decisiones dejan de seguir tu estrategia. Rara vez se siente como enfado: normalmente se siente como prisa.' },
  { term: 'Turn', category: 'reglas', definition: 'La cuarta carta comunitaria, repartida tras la ronda de apuestas del flop.' },
  { term: 'UTG', category: 'reglas', definition: 'Under the gun: la primera posición a la que le toca actuar preflop. Es la que exige el rango de manos más estrecho porque aún quedan muchos jugadores por actuar detrás.' },
  { term: 'Value bet', spanish: 'Apuesta de valor', category: 'estrategia', definition: 'Apuesta hecha esperando que la pague una mano peor. Si no puedes nombrar una mano peor que pagaría, no es una apuesta de valor.' },
  { term: 'Varianza', category: 'matematicas', definition: 'Los vaivenes inevitables del corto plazo: puedes jugar perfecto y perder semanas. Se combate con bankroll y volumen, no cambiando tu juego.', related: ['Bankroll'] },
  { term: 'VPIP', category: 'matematicas', definition: 'Voluntarily Put money In Pot: porcentaje de manos en las que un jugador pone fichas voluntariamente. Es la primera medida de si alguien juega tight o loose.' },
  { term: 'Winrate', category: 'matematicas', definition: 'Tu ganancia media cada cien manos (bb/100 en cash). La selección de mesa y el valor fino lo suben más que cualquier jugada espectacular.' },
]

/** Términos agrupados por su letra inicial, para el índice alfabético. */
export function groupByLetter(terms: GlossaryTerm[]): { letter: string; terms: GlossaryTerm[] }[] {
  const groups = new Map<string, GlossaryTerm[]>()
  for (const term of [...terms].sort((a, b) => a.term.localeCompare(b.term, 'es'))) {
    const letter = term.term[0].toUpperCase()
    const bucket = groups.get(letter)
    if (bucket) bucket.push(term)
    else groups.set(letter, [term])
  }
  return [...groups.entries()].map(([letter, items]) => ({ letter, terms: items }))
}

/** Cuántos términos hay en cada categoría, para los filtros. */
export function countByCategory(terms: GlossaryTerm[] = GLOSSARY): Record<GlossaryCategory, number> {
  const counts = {
    reglas: 0,
    acciones: 0,
    estrategia: 0,
    matematicas: 0,
    jerga: 0,
  } as Record<GlossaryCategory, number>
  for (const term of terms) counts[term.category] += 1
  return counts
}

/** Busca un término por su nombre exacto (para navegar entre relacionados). */
export function findTerm(name: string): GlossaryTerm | undefined {
  const needle = name.trim().toLowerCase()
  return GLOSSARY.find(term => term.term.toLowerCase() === needle)
}
