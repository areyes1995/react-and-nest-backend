// ──────────────────────────────────────────────
// Evaluador de expresiones matemáticas (sin eval).
// Admite: + - * / ^ % !, paréntesis, multiplicación
// implícita (2x, 3(x+1), 2π), constantes (pi, π, e),
// variables y funciones científicas. Modo DEG/RAD.
// ──────────────────────────────────────────────

export type AngleMode = 'DEG' | 'RAD'
export type Scope = Record<string, number>

type Node =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string }
  | { k: 'un'; op: '-' | '+' | '!'; a: Node }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'call'; fn: string; args: Node[] }

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'sec', 'csc', 'cot',
  'sqrt', 'cbrt', 'abs', 'ln', 'log', 'log2', 'log10', 'exp', 'floor', 'ceil', 'round', 'sign', 'nroot', 'max', 'min',
])

const CONSTANTS: Record<string, number> = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI }

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string } | { t: '(' } | { t: ')' } | { t: ',' }

function tokenize(src: string): Tok[] {
  const s = src.replace(/×|·/g, '*').replace(/÷/g, '/').replace(/−|–/g, '-').replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3')
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      if (s[j] === 'e' && /[-+0-9]/.test(s[j + 1] ?? '') && /[0-9]/.test(s[j + 1] === '-' || s[j + 1] === '+' ? s[j + 2] ?? '' : s[j + 1])) {
        j += 2
        while (j < s.length && /[0-9]/.test(s[j])) j++
      }
      const v = Number(s.slice(i, j))
      if (!Number.isFinite(v)) throw new Error(`Número inválido: ${s.slice(i, j)}`)
      out.push({ t: 'num', v })
      i = j
    } else if (/[a-zA-Zπ_]/.test(c)) {
      let j = i
      while (j < s.length && /[a-zA-Z0-9π_]/.test(s[j])) j++
      out.push({ t: 'id', v: s.slice(i, j).toLowerCase() })
      i = j
    } else if ('+-*/^%!'.includes(c)) {
      out.push({ t: 'op', v: c })
      i++
    } else if (c === '(' || c === '[') {
      out.push({ t: '(' })
      i++
    } else if (c === ')' || c === ']') {
      out.push({ t: ')' })
      i++
    } else if (c === ',' || c === ';') {
      out.push({ t: ',' })
      i++
    } else {
      throw new Error(`Carácter no válido: "${c}"`)
    }
  }
  return out
}

/** Separa identificadores pegados como "xy" o "2pi" → x·y (si no son funciones). */
function splitIdentifier(id: string, known: Set<string>): string[] {
  if (FUNCTIONS.has(id) || id in CONSTANTS || known.has(id) || id.length === 1) return [id]
  const parts: string[] = []
  let rest = id
  while (rest) {
    const fn = [...FUNCTIONS, ...Object.keys(CONSTANTS)].sort((a, b) => b.length - a.length).find((f) => rest.startsWith(f))
    if (fn) {
      parts.push(fn)
      rest = rest.slice(fn.length)
    } else {
      parts.push(rest[0])
      rest = rest.slice(1)
    }
  }
  return parts
}

export function parse(src: string, variables: string[] = ['x']): Node {
  const known = new Set(variables)
  const raw = tokenize(src)
  const tokens: Tok[] = []
  for (const tk of raw) {
    if (tk.t === 'id') for (const p of splitIdentifier(tk.v, known)) tokens.push({ t: 'id', v: p })
    else tokens.push(tk)
  }
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]
  const isOp = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v

  const startsFactor = (tk?: Tok) => !!tk && (tk.t === 'num' || tk.t === 'id' || tk.t === '(')

  function expression(): Node {
    let a = term()
    while (isOp('+') || isOp('-')) {
      const op = (next() as { v: string }).v
      a = { k: 'bin', op, a, b: term() }
    }
    return a
  }
  function term(): Node {
    let a = unary()
    for (;;) {
      if (isOp('*') || isOp('/') || isOp('%')) {
        const op = (next() as { v: string }).v
        a = { k: 'bin', op, a, b: unary() }
      } else if (startsFactor(peek())) {
        a = { k: 'bin', op: '*', a, b: power() } // multiplicación implícita
      } else break
    }
    return a
  }
  function unary(): Node {
    if (isOp('-')) {
      next()
      return { k: 'un', op: '-', a: unary() }
    }
    if (isOp('+')) {
      next()
      return unary()
    }
    return power()
  }
  function power(): Node {
    const base = postfix()
    if (isOp('^')) {
      next()
      return { k: 'bin', op: '^', a: base, b: unary() } // asociativa a la derecha
    }
    return base
  }
  function postfix(): Node {
    let a = atom()
    while (isOp('!')) {
      next()
      a = { k: 'un', op: '!', a }
    }
    return a
  }
  function atom(): Node {
    const tk = next()
    if (!tk) throw new Error('Expresión incompleta')
    if (tk.t === 'num') return { k: 'num', v: tk.v }
    if (tk.t === '(') {
      const e = expression()
      if (next()?.t !== ')') throw new Error('Falta cerrar un paréntesis')
      return e
    }
    if (tk.t === 'id') {
      if (FUNCTIONS.has(tk.v)) {
        if (peek()?.t === '(') {
          next()
          const args: Node[] = []
          if (peek()?.t !== ')') {
            args.push(expression())
            while (peek()?.t === ',') {
              next()
              args.push(expression())
            }
          }
          if (next()?.t !== ')') throw new Error(`Falta cerrar el paréntesis de ${tk.v}`)
          return { k: 'call', fn: tk.v, args }
        }
        return { k: 'call', fn: tk.v, args: [power()] } // sin x
      }
      if (tk.v in CONSTANTS) return { k: 'num', v: CONSTANTS[tk.v] }
      return { k: 'var', name: tk.v }
    }
    throw new Error('Expresión mal formada')
  }

  const tree = expression()
  if (pos < tokens.length) throw new Error('Expresión mal formada')
  return tree
}

function factorial(n: number): number {
  if (n < 0) return NaN
  if (!Number.isInteger(n)) return gamma(n + 1)
  if (n > 170) return Infinity
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function gamma(z: number): number {
  // Aproximación de Lanczos
  const g = 7
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}

export function evaluateNode(node: Node, scope: Scope, mode: AngleMode = 'RAD'): number {
  const toRad = (v: number) => (mode === 'DEG' ? (v * Math.PI) / 180 : v)
  const fromRad = (v: number) => (mode === 'DEG' ? (v * 180) / Math.PI : v)
  const ev = (n: Node): number => {
    switch (n.k) {
      case 'num':
        return n.v
      case 'var':
        if (!(n.name in scope)) throw new Error(`Variable desconocida: ${n.name}`)
        return scope[n.name]
      case 'un': {
        const a = ev(n.a)
        return n.op === '-' ? -a : n.op === '!' ? factorial(a) : a
      }
      case 'bin': {
        const a = ev(n.a)
        const b = ev(n.b)
        switch (n.op) {
          case '+': return a + b
          case '-': return a - b
          case '*': return a * b
          case '/': return a / b
          case '%': return a % b
          case '^':
            // Raíz real de negativos con exponente 1/impar (p. ej. (-8)^(1/3)).
            if (a < 0 && !Number.isInteger(b)) {
              const inv = 1 / b
              if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b)
            }
            return Math.pow(a, b)
        }
        throw new Error(`Operador desconocido ${n.op}`)
      }
      case 'call': {
        const args = n.args.map(ev)
        const [a, b] = args
        switch (n.fn) {
          case 'sin': return Math.sin(toRad(a))
          case 'cos': return Math.cos(toRad(a))
          case 'tan': return Math.tan(toRad(a))
          case 'sec': return 1 / Math.cos(toRad(a))
          case 'csc': return 1 / Math.sin(toRad(a))
          case 'cot': return 1 / Math.tan(toRad(a))
          case 'asin': return fromRad(Math.asin(a))
          case 'acos': return fromRad(Math.acos(a))
          case 'atan': return fromRad(Math.atan(a))
          case 'sinh': return Math.sinh(a)
          case 'cosh': return Math.cosh(a)
          case 'tanh': return Math.tanh(a)
          case 'sqrt': return Math.sqrt(a)
          case 'cbrt': return Math.cbrt(a)
          case 'nroot': return b % 2 === 1 && a < 0 ? -Math.pow(-a, 1 / b) : Math.pow(a, 1 / b)
          case 'abs': return Math.abs(a)
          case 'ln': return Math.log(a)
          case 'log': return args.length === 2 ? Math.log(b) / Math.log(a) : Math.log10(a)
          case 'log10': return Math.log10(a)
          case 'log2': return Math.log2(a)
          case 'exp': return Math.exp(a)
          case 'floor': return Math.floor(a)
          case 'ceil': return Math.ceil(a)
          case 'round': return Math.round(a)
          case 'sign': return Math.sign(a)
          case 'max': return Math.max(...args)
          case 'min': return Math.min(...args)
        }
        throw new Error(`Función desconocida ${n.fn}`)
      }
    }
  }
  return ev(node)
}

export function evaluate(src: string, scope: Scope = {}, mode: AngleMode = 'RAD'): number {
  return evaluateNode(parse(src, Object.keys(scope)), scope, mode)
}

/** Compila f(x) para graficar (devuelve NaN fuera del dominio). */
export function compile(src: string, variable = 'x'): (x: number) => number {
  const cleaned = src.replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '')
  const tree = parse(cleaned, [variable])
  return (x: number) => {
    try {
      return evaluateNode(tree, { [variable]: x })
    } catch {
      return NaN
    }
  }
}

// ── Análisis numérico ──────────────────────────

export function derivative(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/** Integral definida por la regla de Simpson compuesta. */
export function integral(f: (x: number) => number, a: number, b: number, n = 1000): number {
  if (a === b) return 0
  const N = n % 2 === 0 ? n : n + 1
  const h = (b - a) / N
  let s = f(a) + f(b)
  for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

export function limit(f: (x: number) => number, a: number): { left: number; right: number; value: number | null } {
  const hs = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6]
  const left = f(a - hs[hs.length - 1])
  const right = f(a + hs[hs.length - 1])
  const close = Math.abs(left - right) < 1e-3 * Math.max(1, Math.abs(left))
  return { left, right, value: close && Number.isFinite(left) ? (left + right) / 2 : null }
}

/** Puntos donde f(x) = g(x) en [a, b] (cambio de signo + bisección). */
export function intersections(f: (x: number) => number, g: (x: number) => number, a: number, b: number, samples = 800): number[] {
  const d = (x: number) => f(x) - g(x)
  const roots: number[] = []
  const step = (b - a) / samples
  let x0 = a
  let y0 = d(x0)
  for (let i = 1; i <= samples; i++) {
    const x1 = a + i * step
    const y1 = d(x1)
    if (Number.isFinite(y0) && Number.isFinite(y1)) {
      if (y0 === 0) roots.push(x0)
      else if (y0 * y1 < 0 && Math.abs(y1 - y0) < 1e3) {
        let lo = x0
        let hi = x1
        for (let k = 0; k < 60; k++) {
          const mid = (lo + hi) / 2
          if (d(lo) * d(mid) <= 0) hi = mid
          else lo = mid
        }
        roots.push((lo + hi) / 2)
      }
    }
    x0 = x1
    y0 = y1
  }
  return roots.filter((r, i, arr) => i === 0 || Math.abs(r - arr[i - 1]) > step)
}

/** Aproxima un decimal a fracción (fracciones continuas). */
export function toFraction(value: number, maxDen = 10000): { num: number; den: number } | null {
  if (!Number.isFinite(value)) return null
  const sign = value < 0 ? -1 : 1
  let x = Math.abs(value)
  let [h1, h0, k1, k0] = [1, 0, 0, 1]
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x)
    ;[h1, h0] = [a * h1 + h0, h1]
    ;[k1, k0] = [a * k1 + k0, k1]
    if (k1 > maxDen) {
      ;[h1, k1] = [h0, k0]
      break
    }
    if (Math.abs(x - a) < 1e-12) break
    x = 1 / (x - a)
  }
  if (Math.abs(sign * (h1 / k1) - value) > 1e-9) return null
  return { num: sign * h1, den: k1 }
}

export function formatNumber(value: number, digits = 10): string {
  if (!Number.isFinite(value)) return Number.isNaN(value) ? 'Indefinido' : value > 0 ? '∞' : '-∞'
  if (Math.abs(value) < 1e-12) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e12 || abs < 1e-6) return value.toExponential(6)
  return String(Number(value.toPrecision(digits)))
}
