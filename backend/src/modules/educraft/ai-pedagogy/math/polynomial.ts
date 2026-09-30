// ──────────────────────────────────────────────
// Polinomios de grado ≤ 2 con coeficientes racionales
// y un analizador de expresiones escolares:
//   2x + 5, 3(x - 1), x^2 - 4x, (x+1)(x-1), 3/4x, 0.5y
// Términos: "1" (constante), "x", "y", "x^2"…
// ──────────────────────────────────────────────

import { Fraction } from './fraction';

export type Poly = Map<string, Fraction>;

const CONST = '1';

export function constant(n: Fraction): Poly {
  return new Map([[CONST, n]]);
}

export function variable(name: string): Poly {
  return new Map([[name, Fraction.ONE]]);
}

function clean(p: Poly): Poly {
  const out: Poly = new Map();
  for (const [k, v] of p) if (!v.isZero()) out.set(k, v);
  return out;
}

export function add(a: Poly, b: Poly): Poly {
  const out: Poly = new Map(a);
  for (const [k, v] of b) out.set(k, (out.get(k) ?? Fraction.ZERO).add(v));
  return clean(out);
}

export function scale(a: Poly, f: Fraction): Poly {
  const out: Poly = new Map();
  for (const [k, v] of a) out.set(k, v.mul(f));
  return clean(out);
}

export function sub(a: Poly, b: Poly): Poly {
  return add(a, scale(b, Fraction.ONE.neg()));
}

function degreeOf(term: string): number {
  if (term === CONST) return 0;
  return term.endsWith('^2') ? 2 : 1;
}

function mulTerms(a: string, b: string): string {
  if (a === CONST) return b;
  if (b === CONST) return a;
  if (a === b && degreeOf(a) === 1) return `${a}^2`;
  throw new Error('Solo se admiten expresiones de grado ≤ 2 en una variable');
}

export function mul(a: Poly, b: Poly): Poly {
  let out: Poly = new Map();
  for (const [ka, va] of a) {
    for (const [kb, vb] of b) {
      const term = mulTerms(ka, kb);
      out = add(out, new Map([[term, va.mul(vb)]]));
    }
  }
  return out;
}

export function isConstant(p: Poly): boolean {
  return [...p.keys()].every((k) => k === CONST);
}

export function constValue(p: Poly): Fraction {
  return p.get(CONST) ?? Fraction.ZERO;
}

export function coef(p: Poly, term: string): Fraction {
  return p.get(term) ?? Fraction.ZERO;
}

export function variables(p: Poly): string[] {
  return [...new Set([...p.keys()].filter((k) => k !== CONST).map((k) => k.replace('^2', '')))].sort();
}

export function degree(p: Poly): number {
  return Math.max(0, ...[...p.keys()].map(degreeOf));
}

export function evaluate(p: Poly, values: Record<string, Fraction>): Fraction {
  let total = Fraction.ZERO;
  for (const [k, v] of p) {
    if (k === CONST) total = total.add(v);
    else if (k.endsWith('^2')) {
      const x = values[k.replace('^2', '')];
      total = total.add(v.mul(x).mul(x));
    } else total = total.add(v.mul(values[k]));
  }
  return total;
}

/** Representación LaTeX ordenada: x², x, y, constante. */
export function toLatex(p: Poly): string {
  const order = (k: string) => (k === CONST ? 1000 : k.endsWith('^2') ? 0 : 10 + k.charCodeAt(0));
  const terms = [...p.entries()].filter(([, v]) => !v.isZero()).sort(([a], [b]) => order(a) - order(b));
  if (!terms.length) return '0';
  return terms
    .map(([k, v], i) => {
      const neg = v.isNegative();
      const abs = v.abs();
      const coefText = k === CONST ? abs.toLatex() : abs.isOne() ? '' : abs.toLatex();
      const body = k === CONST ? coefText : `${coefText}${k}`;
      if (i === 0) return `${neg ? '-' : ''}${body}`;
      return ` ${neg ? '-' : '+'} ${body}`;
    })
    .join('');
}

// ── Analizador ─────────────────────────────────────

type Token =
  | { t: 'num'; v: Fraction }
  | { t: 'var'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' | '^' }
  | { t: '(' }
  | { t: ')' };

function tokenize(src: string): Token[] {
  const s = src
    .replace(/[·×]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/²/g, '^2')
    .replace(/\\cdot/g, '*')
    .replace(/\s+/g, '');
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.,]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const n = Number(s.slice(i, j).replace(',', '.'));
      if (!Number.isFinite(n)) throw new Error(`Número inválido: ${s.slice(i, j)}`);
      tokens.push({ t: 'num', v: new Fraction(n) });
      i = j;
    } else if (/[a-zA-Z]/.test(ch)) {
      tokens.push({ t: 'var', v: ch.toLowerCase() });
      i++;
    } else if ('+-*/^'.includes(ch)) {
      tokens.push({ t: 'op', v: ch as '+' | '-' | '*' | '/' | '^' });
      i++;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      tokens.push({ t: '(' });
      i++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      tokens.push({ t: ')' });
      i++;
    } else {
      throw new Error(`Carácter no reconocido: "${ch}"`);
    }
  }
  // Multiplicación implícita: 2x, 2(x), x(x), )(
  const out: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const prev = out[out.length - 1];
    const cur = tokens[k];
    const prevEnds = prev && (prev.t === 'num' || prev.t === 'var' || prev.t === ')');
    const curStarts = cur.t === 'var' || cur.t === '(' || (cur.t === 'num' && prev?.t === ')');
    if (prevEnds && curStarts) out.push({ t: 'op', v: '*' });
    out.push(cur);
  }
  return out;
}

export function parseExpression(src: string): Poly {
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function expr(): Poly {
    let left = term();
    while (peek()?.t === 'op' && ((peek() as { v: string }).v === '+' || (peek() as { v: string }).v === '-')) {
      const op = (next() as { v: string }).v;
      const right = term();
      left = op === '+' ? add(left, right) : sub(left, right);
    }
    return left;
  }

  function term(): Poly {
    let left = unary();
    while (peek()?.t === 'op' && ((peek() as { v: string }).v === '*' || (peek() as { v: string }).v === '/')) {
      const op = (next() as { v: string }).v;
      const right = unary();
      if (op === '*') left = mul(left, right);
      else {
        if (!isConstant(right)) throw new Error('No se admite dividir entre una expresión con variable');
        left = scale(left, Fraction.ONE.div(constValue(right)));
      }
    }
    return left;
  }

  function unary(): Poly {
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '-') {
      next();
      return scale(unary(), Fraction.ONE.neg());
    }
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '+') {
      next();
      return unary();
    }
    return power();
  }

  function power(): Poly {
    const base = atom();
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '^') {
      next();
      const exp = atom();
      if (!isConstant(exp)) throw new Error('El exponente debe ser un número');
      const n = constValue(exp);
      if (!n.isInteger() || n.valueOf() < 0 || n.valueOf() > 2) {
        if (isConstant(base)) return constant(new Fraction(Math.pow(constValue(base).valueOf(), n.valueOf())));
        throw new Error('Solo se admiten exponentes 0, 1 o 2');
      }
      let result = constant(Fraction.ONE);
      for (let k = 0; k < n.valueOf(); k++) result = mul(result, base);
      return result;
    }
    return base;
  }

  function atom(): Poly {
    const tok = next();
    if (!tok) throw new Error('Expresión incompleta');
    if (tok.t === 'num') return constant(tok.v);
    if (tok.t === 'var') return variable(tok.v);
    if (tok.t === '(') {
      const inner = expr();
      if (next()?.t !== ')') throw new Error('Falta cerrar un paréntesis');
      return inner;
    }
    throw new Error('Expresión mal formada');
  }

  const result = expr();
  if (pos < tokens.length) throw new Error('Expresión mal formada');
  return result;
}
