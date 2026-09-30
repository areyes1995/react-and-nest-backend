// ──────────────────────────────────────────────
// Generador de problemas contextualizados (módulo 4.1)
// sin depender de un proveedor de IA. Detecta la familia
// del tema y construye el problema con números
// coherentes, su procedimiento, respuesta y variantes
// fácil y difícil. Se usa como respaldo del proveedor
// y como base del generador de exámenes y actividades.
// ──────────────────────────────────────────────

import { Fraction } from '../math/fraction';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface GeneratedProblem {
  family: string;
  statement: string;
  procedure: string[];
  solution: string;
  answer: string;
  /** Respuesta numérica (para distractores y corrección automática). */
  numericAnswer?: number;
  difficulty: DifficultyLevel;
  latex?: string;
}

export interface ProblemWithVariants extends GeneratedProblem {
  easierVariant: GeneratedProblem;
  harderVariant: GeneratedProblem;
}

export interface ProblemRequest {
  topic: string;
  context?: string;
  difficulty?: DifficultyLevel;
  count?: number;
  seed?: number;
}

type Rng = () => number;

function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 7;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const choice = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
const money = (n: number) => `RD$${n.toLocaleString('es-DO', { maximumFractionDigits: 2 })}`;
const fmt = (n: number, d = 2) => Number(n.toFixed(d)).toLocaleString('es-DO', { maximumFractionDigits: d });

const NAMES = ['Ana', 'Luis', 'María', 'Carlos', 'Yarelis', 'José', 'Camila', 'Pedro', 'Rosa', 'Miguel', 'Laura', 'Andrés'];
const PLACES = ['Santo Domingo', 'Santiago', 'La Vega', 'San Pedro de Macorís', 'Puerto Plata', 'Barahona'];

interface Context {
  label: string;
  items: string[];
  place: string;
}

function contextFor(rng: Rng, context?: string): Context {
  const c = (context ?? '').toLowerCase();
  if (/salud|nutri|deport/.test(c)) {
    return { label: 'salud', items: ['vasos de agua', 'minutos de ejercicio', 'raciones de fruta'], place: choice(rng, PLACES) };
  }
  if (/ambient|agua|recicl|clima/.test(c)) {
    return { label: 'medio ambiente', items: ['botellas recicladas', 'litros de agua', 'árboles sembrados'], place: choice(rng, PLACES) };
  }
  if (/finan|dinero|compra|negocio|colmado/.test(c)) {
    return { label: 'finanzas', items: ['libretas', 'jugos', 'paquetes de galletas'], place: choice(rng, PLACES) };
  }
  return { label: 'vida cotidiana', items: ['mangos', 'libros', 'refrescos', 'lápices'], place: choice(rng, PLACES) };
}

type Family = (rng: Rng, level: DifficultyLevel, ctx: Context) => GeneratedProblem;

const scaleFor = (level: DifficultyLevel) => (level === 'EASY' ? 1 : level === 'MEDIUM' ? 2 : 4);

// ── Familias ───────────────────────────────────────

const linearEquation: Family = (rng, level, ctx) => {
  const s = scaleFor(level);
  const name = choice(rng, NAMES);
  const item = choice(rng, ctx.items);
  const x = int(rng, 3, 8 * s);
  const a = int(rng, 2, 3 + s);
  const b = int(rng, 5, 20 * s);
  const total = a * x + b;
  const unit = int(rng, 2, 6) * 5;
  const statement =
    level === 'HARD'
      ? `${name} compra ${a} cajas con la misma cantidad de ${item} y le regalan ${b} unidades más. Si en total tiene ${total} ${item} y cada unidad cuesta ${money(unit)}, ¿cuántas unidades trae cada caja y cuánto pagó por las cajas?`
      : `${name} tiene ${a} cajas con la misma cantidad de ${item} y ${b} ${item} sueltos. Si en total tiene ${total} ${item}, ¿cuántos ${item} hay en cada caja?`;
  const procedure = [
    `Sea x la cantidad de ${item} por caja. Planteamos: ${a}x + ${b} = ${total}.`,
    `Restamos ${b} en ambos lados: ${a}x = ${total - b}.`,
    `Dividimos entre ${a}: x = ${x}.`,
    `Verificamos: ${a}(${x}) + ${b} = ${total}. ✓`,
  ];
  if (level === 'HARD') procedure.push(`Pagó ${a} × ${x} × ${money(unit)} = ${money(a * x * unit)}.`);
  return {
    family: 'ecuaciones lineales',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer: level === 'HARD' ? `${x} por caja; pagó ${money(a * x * unit)}` : `${x} ${item} por caja`,
    numericAnswer: x,
    difficulty: level,
    latex: `${a}x + ${b} = ${total}`,
  };
};

const fractions: Family = (rng, level, ctx) => {
  const name = choice(rng, NAMES);
  const dens = level === 'EASY' ? [2, 4, 8] : level === 'MEDIUM' ? [3, 4, 6, 12] : [5, 6, 8, 10, 12, 15];
  const d1 = choice(rng, dens);
  let d2 = choice(rng, dens);
  if (level === 'EASY') d2 = d1;
  const n1 = int(rng, 1, d1 - 1);
  const n2 = int(rng, 1, d2 - 1);
  const f1 = new Fraction(n1, d1);
  const f2 = new Fraction(n2, d2);
  const sum = f1.add(f2);
  const eaten = sum.valueOf() <= 1;
  const item = ctx.label === 'salud' ? 'una jarra de jugo natural' : 'una pizza';
  const statement = eaten
    ? `En ${ctx.place}, ${name} comparte ${item}: el lunes usa ${f1.toString()} y el martes ${f2.toString()}. ¿Qué fracción de ${item} usó en total y cuánto queda?`
    : `${name} tiene dos recipientes: uno con ${f1.toString()} de litro y otro con ${f2.toString()} de litro de pintura. ¿Cuántos litros tiene en total?`;
  const mcm = (f1.den * f2.den) / gcd(f1.den, f2.den);
  const procedure = [
    `Buscamos el denominador común: m.c.m.(${f1.den}, ${f2.den}) = ${mcm}.`,
    `Convertimos: ${f1.toString()} = ${(f1.num * mcm) / f1.den}/${mcm} y ${f2.toString()} = ${(f2.num * mcm) / f2.den}/${mcm}.`,
    `Sumamos numeradores: ${(f1.num * mcm) / f1.den + (f2.num * mcm) / f2.den}/${mcm}.`,
    `Simplificamos: ${sum.toString()}.`,
  ];
  let answer = sum.toString();
  if (eaten) {
    const rest = Fraction.ONE.sub(sum);
    procedure.push(`Queda 1 − ${sum.toString()} = ${rest.toString()}.`);
    answer = `Usó ${sum.toString()}; queda ${rest.toString()}`;
  }
  return {
    family: 'fracciones',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer,
    numericAnswer: sum.valueOf(),
    difficulty: level,
    latex: `${f1.toLatex()} + ${f2.toLatex()} = ${sum.toLatex()}`,
  };
};

const percent: Family = (rng, level, ctx) => {
  const item = choice(rng, ctx.items);
  const price = int(rng, 4, 20 * scaleFor(level)) * 50;
  const pct = choice(rng, level === 'EASY' ? [10, 20, 25, 50] : [15, 18, 30, 35, 40]);
  const discount = (price * pct) / 100;
  const tax = level === 'HARD' ? 18 : 0;
  const final = (price - discount) * (1 + tax / 100);
  const statement =
    tax > 0
      ? `Un paquete de ${item} cuesta ${money(price)}. La tienda ofrece un descuento de ${pct}% y luego se aplica el ITBIS de 18%. ¿Cuál es el precio final?`
      : `Un paquete de ${item} cuesta ${money(price)} y tiene un descuento de ${pct}%. ¿Cuánto se ahorra y cuál es el precio final?`;
  const procedure = [
    `Descuento: ${pct}% de ${money(price)} = ${price} × ${pct / 100} = ${money(discount)}.`,
    `Precio con descuento: ${money(price)} − ${money(discount)} = ${money(price - discount)}.`,
  ];
  if (tax > 0) procedure.push(`Con ITBIS: ${money(price - discount)} × 1.18 = ${money(Number(final.toFixed(2)))}.`);
  return {
    family: 'porcentajes',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer: tax > 0 ? money(Number(final.toFixed(2))) : `Ahorro ${money(discount)}; paga ${money(price - discount)}`,
    numericAnswer: Number(final.toFixed(2)),
    difficulty: level,
  };
};

const simpleInterest: Family = (rng, level) => {
  const name = choice(rng, NAMES);
  const capital = int(rng, 2, 10 * scaleFor(level)) * 5000;
  const rate = choice(rng, [4, 5, 6, 8, 10, 12]);
  const years = int(rng, 1, level === 'EASY' ? 2 : 5);
  const compound = level === 'HARD';
  const interest = compound ? capital * ((1 + rate / 100) ** years - 1) : (capital * rate * years) / 100;
  const statement = compound
    ? `${name} deposita ${money(capital)} en una cooperativa que paga ${rate}% anual de interés compuesto. ¿Qué monto tendrá al cabo de ${years} años?`
    : `${name} ahorra ${money(capital)} en un banco que paga ${rate}% de interés simple anual. ¿Cuánto interés gana en ${years} año${years > 1 ? 's' : ''} y cuál es el monto final?`;
  const procedure = compound
    ? [
        `Monto: M = C(1 + i)^t = ${capital}(1 + ${rate / 100})^${years}.`,
        `M = ${money(Number((capital + interest).toFixed(2)))}.`,
      ]
    : [
        `Interés simple: I = C · i · t = ${capital} × ${rate / 100} × ${years} = ${money(interest)}.`,
        `Monto: M = C + I = ${money(capital)} + ${money(interest)} = ${money(capital + interest)}.`,
      ];
  return {
    family: 'interés',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer: compound ? money(Number((capital + interest).toFixed(2))) : `I = ${money(interest)}; M = ${money(capital + interest)}`,
    numericAnswer: Number((capital + interest).toFixed(2)),
    difficulty: level,
    latex: compound ? `M = C(1+i)^t` : `I = C \\cdot i \\cdot t`,
  };
};

const pythagoras: Family = (rng, level) => {
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [6, 8, 10],
    [9, 12, 15],
  ];
  const [a, b, c] = choice(rng, level === 'EASY' ? triples.slice(0, 2) : triples);
  const k = level === 'HARD' ? int(rng, 2, 4) : 1;
  const findLeg = level !== 'EASY' && rng() > 0.5;
  const statement = findLeg
    ? `Una escalera de ${c * k} m se apoya en una pared. Si la base está a ${a * k} m de la pared, ¿a qué altura llega la escalera?`
    : `Un terreno rectangular mide ${a * k} m por ${b * k} m. ¿Cuánto mide la diagonal que lo atraviesa?`;
  const procedure = findLeg
    ? [`Teorema de Pitágoras: c² = a² + b² ⇒ b = √(c² − a²).`, `b = √(${(c * k) ** 2} − ${(a * k) ** 2}) = √${(b * k) ** 2} = ${b * k} m.`]
    : [`Teorema de Pitágoras: d² = ${a * k}² + ${b * k}² = ${(a * k) ** 2 + (b * k) ** 2}.`, `d = √${(c * k) ** 2} = ${c * k} m.`];
  return {
    family: 'teorema de Pitágoras',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer: `${findLeg ? b * k : c * k} m`,
    numericAnswer: findLeg ? b * k : c * k,
    difficulty: level,
    latex: 'c^2 = a^2 + b^2',
  };
};

const volume: Family = (rng, level, ctx) => {
  const cylinder = level !== 'EASY' && rng() > 0.5;
  if (cylinder) {
    const r = int(rng, 2, 6 * scaleFor(level));
    const h = int(rng, 5, 15 * scaleFor(level));
    const v = Math.PI * r * r * h;
    const statement = `Un tanque cilíndrico de ${ctx.place} tiene radio ${r} dm y altura ${h} dm. ¿Cuántos litros de agua caben? (1 dm³ = 1 L)`;
    const procedure = [`V = π r² h = π × ${r}² × ${h}.`, `V ≈ ${fmt(v)} dm³ = ${fmt(v)} L.`];
    return { family: 'volumen', statement, procedure, solution: procedure.join(' '), answer: `${fmt(v)} L`, numericAnswer: Number(v.toFixed(2)), difficulty: level, latex: 'V = \\pi r^2 h' };
  }
  const l = int(rng, 2, 10 * scaleFor(level));
  const w = int(rng, 2, 8 * scaleFor(level));
  const h = int(rng, 2, 6 * scaleFor(level));
  const statement = `Una caja con forma de prisma rectangular mide ${l} cm de largo, ${w} cm de ancho y ${h} cm de alto. ¿Cuál es su volumen?`;
  const procedure = [`V = largo × ancho × alto = ${l} × ${w} × ${h}.`, `V = ${l * w * h} cm³.`];
  return { family: 'volumen', statement, procedure, solution: procedure.join(' '), answer: `${l * w * h} cm³`, numericAnswer: l * w * h, difficulty: level, latex: 'V = l \\cdot a \\cdot h' };
};

const statistics: Family = (rng, level, ctx) => {
  const n = level === 'EASY' ? 5 : level === 'MEDIUM' ? 7 : 9;
  const data = Array.from({ length: n }, () => int(rng, 60, 100));
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const median = sorted[Math.floor(n / 2)];
  const freq = new Map<number, number>();
  for (const d of data) freq.set(d, (freq.get(d) ?? 0) + 1);
  const maxF = Math.max(...freq.values());
  const modes = [...freq.entries()].filter(([, f]) => f === maxF && maxF > 1).map(([v]) => v);
  const subject = ctx.label === 'salud' ? 'pulsaciones por minuto de un grupo de estudiantes' : 'calificaciones de un grupo';
  const statement = `Las ${subject} fueron: ${data.join(', ')}. Calcula la media, la mediana y la moda.`;
  const procedure = [
    `Media: (${data.join(' + ')}) / ${n} = ${fmt(mean)}.`,
    `Ordenamos: ${sorted.join(', ')}. Mediana (valor central) = ${median}.`,
    modes.length ? `Moda: ${modes.join(' y ')} (se repite ${maxF} veces).` : 'Moda: no hay valores repetidos (amodal).',
  ];
  return {
    family: 'estadística',
    statement,
    procedure,
    solution: procedure.join(' '),
    answer: `Media ${fmt(mean)}; mediana ${median}; moda ${modes.length ? modes.join(', ') : 'no hay'}`,
    numericAnswer: Number(mean.toFixed(2)),
    difficulty: level,
  };
};

const probability: Family = (rng, level) => {
  const red = int(rng, 2, 6 * scaleFor(level));
  const blue = int(rng, 2, 6 * scaleFor(level));
  const green = level === 'EASY' ? 0 : int(rng, 1, 5 * scaleFor(level));
  const total = red + blue + green;
  const p = new Fraction(red, total);
  const statement = `En una bolsa hay ${red} bolas rojas, ${blue} azules${green ? ` y ${green} verdes` : ''}. Si se saca una bola al azar, ¿cuál es la probabilidad de que sea roja?`;
  const procedure = [
    `Casos posibles: ${red} + ${blue}${green ? ` + ${green}` : ''} = ${total}.`,
    `Casos favorables: ${red}.`,
    `P(roja) = ${red}/${total} = ${p.toString()} ≈ ${fmt(p.valueOf() * 100, 1)}%.`,
  ];
  return { family: 'probabilidad', statement, procedure, solution: procedure.join(' '), answer: p.toString(), numericAnswer: p.valueOf(), difficulty: level, latex: `P = \\frac{${red}}{${total}}` };
};

const quadratic: Family = (rng, level) => {
  const r1 = int(rng, 2, 6 * scaleFor(level));
  const r2 = r1 + int(rng, 1, 5);
  const statement = `El largo de un rectángulo mide ${r2 - r1} m más que su ancho y su área es ${r1 * r2} m². ¿Cuáles son sus dimensiones?`;
  const procedure = [
    `Sea x el ancho: x(x + ${r2 - r1}) = ${r1 * r2}.`,
    `x² + ${r2 - r1}x − ${r1 * r2} = 0.`,
    `Factorizamos: (x − ${r1})(x + ${r2}) = 0 ⇒ x = ${r1} (la medida negativa se descarta).`,
    `Ancho ${r1} m y largo ${r2} m.`,
  ];
  return { family: 'ecuaciones cuadráticas', statement, procedure, solution: procedure.join(' '), answer: `${r1} m × ${r2} m`, numericAnswer: r1, difficulty: level, latex: `x^2 + ${r2 - r1}x - ${r1 * r2} = 0` };
};

const linearFunction: Family = (rng, level) => {
  const base = int(rng, 5, 15) * 10;
  const perKm = int(rng, 2, 6) * 5;
  const km = int(rng, 3, 10 * scaleFor(level));
  const statement =
    level === 'HARD'
      ? `Un servicio de transporte cobra ${money(base)} fijos más ${money(perKm)} por kilómetro. Escribe la función del costo, calcula el costo de ${km} km y cuántos km se recorren con ${money(base + perKm * (km + 4))}.`
      : `Un servicio de transporte cobra ${money(base)} fijos más ${money(perKm)} por kilómetro. ¿Cuánto cuesta un viaje de ${km} km?`;
  const procedure = [
    `Función: C(x) = ${perKm}x + ${base}.`,
    `C(${km}) = ${perKm}(${km}) + ${base} = ${money(perKm * km + base)}.`,
  ];
  if (level === 'HARD') procedure.push(`${perKm}x + ${base} = ${base + perKm * (km + 4)} ⇒ x = ${km + 4} km.`);
  return { family: 'funciones', statement, procedure, solution: procedure.join(' '), answer: money(perKm * km + base), numericAnswer: perKm * km + base, difficulty: level, latex: `C(x) = ${perKm}x + ${base}` };
};

const systems: Family = (rng, level) => {
  const adults = int(rng, 5, 20 * scaleFor(level));
  const kids = int(rng, 5, 20 * scaleFor(level));
  const pa = int(rng, 3, 8) * 50;
  const pk = int(rng, 1, 4) * 50;
  const statement = `Para una excursión se vendieron ${adults + kids} boletos y se recaudaron ${money(adults * pa + kids * pk)}. Si el boleto de adulto cuesta ${money(pa)} y el de estudiante ${money(pk)}, ¿cuántos boletos de cada tipo se vendieron?`;
  const procedure = [
    `Sistema: a + e = ${adults + kids}; ${pa}a + ${pk}e = ${adults * pa + kids * pk}.`,
    `De la primera: e = ${adults + kids} − a.`,
    `Sustituimos: ${pa}a + ${pk}(${adults + kids} − a) = ${adults * pa + kids * pk} ⇒ ${pa - pk}a = ${(pa - pk) * adults}.`,
    `a = ${adults}; e = ${kids}.`,
  ];
  return { family: 'sistemas de ecuaciones', statement, procedure, solution: procedure.join(' '), answer: `${adults} adultos y ${kids} estudiantes`, numericAnswer: adults, difficulty: level, latex: `\\begin{cases} a + e = ${adults + kids} \\\\ ${pa}a + ${pk}e = ${adults * pa + kids * pk} \\end{cases}` };
};

const integers: Family = (rng, level, ctx) => {
  const start = int(rng, -8, 5);
  const rise = int(rng, 3, 12 * scaleFor(level));
  const fall = int(rng, 2, 10 * scaleFor(level));
  const end = start + rise - fall;
  const statement = `En la mañana la temperatura en Constanza era de ${start} °C. Al mediodía subió ${rise} °C y en la noche bajó ${fall} °C. ¿Cuál fue la temperatura en la noche?`;
  const procedure = [`${start} + ${rise} = ${start + rise} °C.`, `${start + rise} − ${fall} = ${end} °C.`];
  void ctx;
  return { family: 'números enteros', statement, procedure, solution: procedure.join(' '), answer: `${end} °C`, numericAnswer: end, difficulty: level };
};

const FAMILIES: Array<{ match: RegExp; gen: Family; name: string }> = [
  { match: /sistema/, gen: systems, name: 'sistemas' },
  { match: /cuadr|segundo grado|factoriz/, gen: quadratic, name: 'cuadráticas' },
  { match: /fracc|racional|quebrad/, gen: fractions, name: 'fracciones' },
  { match: /porcent|por ?ciento|descuento|itbis/, gen: percent, name: 'porcentajes' },
  { match: /inter[eé]s|finanz|ahorro|pr[eé]stamo|cr[eé]dito/, gen: simpleInterest, name: 'interés' },
  { match: /pit[aá]goras|hipotenusa|tri[aá]ngulo rect/, gen: pythagoras, name: 'pitágoras' },
  { match: /volumen|[aá]rea|prisma|cilindro|pir[aá]mide|cuerpo/, gen: volume, name: 'volumen' },
  { match: /estad|media|mediana|moda|promedio|tendencia/, gen: statistics, name: 'estadística' },
  { match: /probab|azar|aleatori/, gen: probability, name: 'probabilidad' },
  { match: /funci[oó]n|lineal|pendiente/, gen: linearFunction, name: 'funciones' },
  { match: /entero|temperatura|negativ/, gen: integers, name: 'enteros' },
  { match: /ecuaci|inc[oó]gnita|despej|primer grado|[aá]lgebra/, gen: linearEquation, name: 'ecuaciones' },
];

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a) || 1;
}

function familyFor(topic: string): Family {
  const t = topic.toLowerCase();
  return FAMILIES.find((f) => f.match.test(t))?.gen ?? linearEquation;
}

export function supportedFamilies(): string[] {
  return FAMILIES.map((f) => f.name);
}

const harder = (l: DifficultyLevel): DifficultyLevel => (l === 'EASY' ? 'MEDIUM' : 'HARD');
const easier = (l: DifficultyLevel): DifficultyLevel => (l === 'HARD' ? 'MEDIUM' : 'EASY');

export function generateProblems(req: ProblemRequest): ProblemWithVariants[] {
  const count = Math.min(Math.max(req.count ?? 1, 1), 20);
  const level = req.difficulty ?? 'MEDIUM';
  const rng = makeRng(req.seed ?? Date.now());
  const ctx = contextFor(rng, req.context);
  const gen = familyFor(req.topic);
  return Array.from({ length: count }, () => ({
    ...gen(rng, level, ctx),
    easierVariant: gen(rng, easier(level), ctx),
    harderVariant: gen(rng, harder(level), ctx),
  }));
}

/** Distractores numéricos plausibles para selección múltiple. */
export function distractors(answer: number, rng: Rng = Math.random): number[] {
  const set = new Set<number>();
  const deltas = [1, -1, 2, -2, 10, -10];
  const multipliers = [2, 0.5];
  let guard = 0;
  while (set.size < 3 && guard++ < 50) {
    const useMul = rng() > 0.6;
    const v = useMul
      ? answer * choice(rng, multipliers)
      : answer + choice(rng, deltas) * (Number.isInteger(answer) ? 1 : 0.25);
    const rounded = Number(v.toFixed(2));
    if (rounded !== answer) set.add(rounded);
  }
  return [...set];
}

export { makeRng };
