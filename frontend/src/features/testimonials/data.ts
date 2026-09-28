// ──────────────────────────────────────────────
// testimonials — opiniones de la portada.
//
// ⚠️  CONTENIDO DE EJEMPLO — PERSONAS INVENTADAS
// Ninguno de estos comentarios procede de un
// estudiante real: son texto de relleno para poder
// maquetar y ver la sección en movimiento.
//
// Antes de publicar la web hay que sustituirlos por
// opiniones reales y con permiso de quien las firma.
// Publicar reseñas inventadas como si fueran de
// clientes induce a error y, en bastantes países,
// es publicidad engañosa sancionable.
//
// Es el único sitio donde vive este texto: cambia
// este archivo y la sección entera se actualiza.
// ──────────────────────────────────────────────

export type Tone = 'positivo' | 'neutral'

export interface Testimonial {
  name: string
  /** Iniciales del avatar. */
  initials: string
  /** Contexto de quien habla: nivel o perfil. */
  role: string
  text: string
  tone: Tone
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ana García',
    initials: 'AG',
    role: 'Nivel Principiante',
    text: 'Empecé sin saber qué mano ganaba a cuál. En dos semanas entendía las pot odds y sabía por qué retiraba cada mano.',
    tone: 'positivo',
  },
  {
    name: 'Carlos Mendoza',
    initials: 'CM',
    role: 'Nivel Intermedio',
    text: 'El panel que te dice tu equity después de cada decisión es lo que más me ha hecho mejorar. Ves el error en el momento, no tres manos después.',
    tone: 'positivo',
  },
  {
    name: 'Roberto Silva',
    initials: 'RS',
    role: 'Coach de póker',
    text: 'Uso la mesa de práctica con mis alumnos: fijo el número de jugadores y el tipo de rival según lo que toque entrenar ese día.',
    tone: 'positivo',
  },
  {
    name: 'Lucía Ferrer',
    initials: 'LF',
    role: 'Nivel Intermedio',
    text: 'La matriz de rangos me costó al principio. Cuando llevas unas cuantas sesiones ves el bloque de memoria, pero no es inmediato.',
    tone: 'neutral',
  },
  {
    name: 'Diego Ramírez',
    initials: 'DR',
    role: 'Nivel Avanzado',
    text: 'Los cursos de rangos y bloqueadores son los que más me han cundido. El resto ya lo sabía, pero esos dos los he repetido tres veces.',
    tone: 'positivo',
  },
  {
    name: 'Marta Ibáñez',
    initials: 'MI',
    role: 'Nivel Principiante',
    text: 'Me gusta que cada clase acabe en la mesa. Leer teoría sola se me hacía bola y aquí la aplicas al momento.',
    tone: 'positivo',
  },
  {
    name: 'Javier Ortiz',
    initials: 'JO',
    role: 'Nivel Intermedio',
    text: 'Está bien montado y se nota el trabajo. Echo en falta más contenido de torneos, que es lo que yo juego.',
    tone: 'neutral',
  },
  {
    name: 'Nadia Costa',
    initials: 'NC',
    role: 'Nivel Avanzado',
    text: 'La calculadora de equity y el entrenador preflop los tengo abiertos mientras juego. Solo por eso ya me compensa.',
    tone: 'positivo',
  },
  {
    name: 'Bruno Sanz',
    initials: 'BS',
    role: 'Nivel Principiante',
    text: 'Venía de jugar con amigos y perder sin saber por qué. Ahora al menos sé cuándo el error fue mío y cuándo fue la carta.',
    tone: 'positivo',
  },
  {
    name: 'Elena Prats',
    initials: 'EP',
    role: 'Nivel Intermedio',
    text: 'El glosario me salva cada dos por tres. Poder consultarlo sin salir de la clase está mejor pensado de lo que parece.',
    tone: 'positivo',
  },
  {
    name: 'Tomás Herrera',
    initials: 'TH',
    role: 'Nivel Principiante',
    text: 'Los vídeos van bien, aunque yo aprendo más con las clases escritas. Cuestión de gustos, supongo.',
    tone: 'neutral',
  },
  {
    name: 'Sofía Delgado',
    initials: 'SD',
    role: 'Nivel Avanzado',
    text: 'La guerra preflop de 3-bets me tenía atascada hacía meses. El curso lo explica por rangos y no por manos sueltas, y ahí hizo clic.',
    tone: 'positivo',
  },
  {
    name: 'Pablo Ruiz',
    initials: 'PR',
    role: 'Nivel Intermedio',
    text: 'Lo de que te guarde el progreso entre el móvil y el ordenador parece una tontería hasta que estudias en el metro.',
    tone: 'positivo',
  },
  {
    name: 'Irene Molina',
    initials: 'IM',
    role: 'Nivel Principiante',
    text: 'La racha me tiene enganchada, para bien y para mal. Llevo 31 días seguidos y me da rabia romperla.',
    tone: 'positivo',
  },
  {
    name: 'Andrés Vila',
    initials: 'AV',
    role: 'Nivel Intermedio',
    text: 'Cumple lo que promete. No esperaba un solver completo ni lo hay, pero para aprender la base va sobrado.',
    tone: 'neutral',
  },
  {
    name: 'Clara Bonet',
    initials: 'CB',
    role: 'Nivel Avanzado',
    text: 'Lo mejor es que no te suelta un número y ya: te dice qué pot odds exigía la apuesta y por qué tu call estaba mal.',
    tone: 'positivo',
  },
  {
    name: 'Héctor Lago',
    initials: 'HL',
    role: 'Nivel Principiante',
    text: 'Tardé dos clases en perderle el miedo a la mesa. Que las fichas no valgan nada ayuda más de lo que pensaba.',
    tone: 'positivo',
  },
  {
    name: 'Rosa Cano',
    initials: 'RC',
    role: 'Nivel Intermedio',
    text: 'El orden de los niveles está bien pensado: cuando llegas a rangos ya te sabes las pot odds sin pensarlas.',
    tone: 'positivo',
  },
]

/** Reparte las opiniones en `columns` columnas, alternando una a una. */
export function splitIntoColumns(items: Testimonial[], columns: number): Testimonial[][] {
  const result: Testimonial[][] = Array.from({ length: columns }, () => [])
  items.forEach((item, i) => result[i % columns].push(item))
  return result
}
