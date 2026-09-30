// ──────────────────────────────────────────────
// Creación de ejemplos paso a paso (módulo 4.3).
// Resuelve de forma exacta:
//   • ecuaciones lineales en una variable  (2x + 5 = 13)
//   • ecuaciones cuadráticas               (x^2 - 5x + 6 = 0)
//   • sistemas 2×2                         (2x + y = 7; x - y = 2)
//   • simplificación de expresiones        (3(x+2) - x)
// Cada paso trae explicación, expresión LaTeX y la
// operación aplicada, listo para proyectar en clase.
// ──────────────────────────────────────────────

import { Fraction } from './fraction';
import {
  add,
  coef,
  constant,
  constValue,
  degree,
  evaluate,
  parseExpression,
  Poly,
  scale,
  sub,
  toLatex,
  variables,
} from './polynomial';

export interface SolutionStep {
  title: string;
  explanation: string;
  latex: string;
}

export interface StepSolution {
  kind: 'linear' | 'quadratic' | 'system' | 'simplify' | 'identity' | 'no-solution';
  input: string;
  inputLatex: string;
  steps: SolutionStep[];
  answer: string;
  answerLatex: string;
}

const eq = (l: Poly, r: Poly) => `${toLatex(l)} = ${toLatex(r)}`;

function opText(verbPositive: string, verbNegative: string, value: Fraction, suffix = '') {
  const abs = value.abs();
  return value.isNegative()
    ? `${verbNegative} ${abs.toString()}${suffix}`
    : `${verbPositive} ${abs.toString()}${suffix}`;
}

export function solveStepByStep(input: string): StepSolution {
  const clean = input.trim().replace(/\$/g, '');
  if (!clean) throw new Error('Escribe una expresión o ecuación');
  const equations = clean
    .split(/[;\n]/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (equations.length === 2 && equations.every((e) => e.includes('='))) {
    return solveSystem(clean, equations[0], equations[1]);
  }
  if (!clean.includes('=')) return simplify(clean);
  const [leftSrc, rightSrc, extra] = clean.split('=');
  if (extra !== undefined) throw new Error('La ecuación tiene más de un signo "="');
  const left = parseExpression(leftSrc);
  const right = parseExpression(rightSrc);
  const vars = [...new Set([...variables(left), ...variables(right)])];
  if (vars.length > 1) {
    throw new Error('Para dos incógnitas escribe un sistema: "2x + y = 7; x - y = 2"');
  }
  const x = vars[0] ?? 'x';
  const all = sub(left, right);
  if (degree(all) === 2) return solveQuadratic(clean, left, right, x);
  return solveLinear(clean, leftSrc, rightSrc, left, right, x);
}

function simplify(src: string): StepSolution {
  const p = parseExpression(src);
  const latex = toLatex(p);
  return {
    kind: 'simplify',
    input: src,
    inputLatex: src,
    steps: [
      {
        title: 'Paso 1',
        explanation: 'Eliminar paréntesis aplicando la propiedad distributiva.',
        latex: src.replace(/\*/g, '\\cdot '),
      },
      {
        title: 'Paso 2',
        explanation: 'Reducir términos semejantes (sumar los coeficientes de cada término).',
        latex,
      },
    ],
    answer: latex,
    answerLatex: latex,
  };
}

function solveLinear(
  input: string,
  leftSrc: string,
  rightSrc: string,
  left: Poly,
  right: Poly,
  x: string,
): StepSolution {
  const steps: SolutionStep[] = [];
  let n = 1;
  const push = (explanation: string, l: Poly, r: Poly) =>
    steps.push({ title: `Paso ${n++}`, explanation, latex: eq(l, r) });

  const originalLatex = `${leftSrc.trim()} = ${rightSrc.trim()}`;
  const simplifiedLatex = eq(left, right);
  if (simplifiedLatex.replace(/\s/g, '') !== originalLatex.replace(/\s|\*/g, '')) {
    push('Simplificar cada lado: eliminar paréntesis y reducir términos semejantes.', left, right);
  }

  let l = left;
  let r = right;
  const cx = coef(r, x);
  if (!cx.isZero()) {
    const term = new Map([[x, cx]]);
    l = sub(l, term);
    r = sub(r, term);
    push(
      `${opText('Restar', 'Sumar', cx, x)} en ambos lados para reunir los términos con ${x} a la izquierda.`,
      l,
      r,
    );
  }
  const b = constValue(l);
  if (!b.isZero()) {
    l = sub(l, constant(b));
    r = sub(r, constant(b));
    push(`${opText('Restar', 'Sumar', b)} en ambos lados.`, l, r);
  }

  const a = coef(l, x);
  const rhs = constValue(r);
  if (a.isZero()) {
    const identity = rhs.isZero();
    steps.push({
      title: `Paso ${n++}`,
      explanation: identity
        ? 'Ambos lados son iguales para cualquier valor: la ecuación es una identidad.'
        : 'Se obtiene una igualdad falsa: la ecuación no tiene solución.',
      latex: `0 = ${rhs.toLatex()}`,
    });
    return {
      kind: identity ? 'identity' : 'no-solution',
      input,
      inputLatex: originalLatex,
      steps,
      answer: identity ? 'Infinitas soluciones' : 'Sin solución',
      answerLatex: identity ? '\\mathbb{R}' : '\\varnothing',
    };
  }

  const solution = rhs.div(a);
  if (!a.isOne()) {
    push(
      a.isInteger() ? `Dividir entre ${a.toString()} en ambos lados.` : `Multiplicar por ${new Fraction(a.den, a.num).toString()} en ambos lados.`,
      new Map([[x, Fraction.ONE]]),
      constant(solution),
    );
  }

  const lv = evaluate(left, { [x]: solution });
  const rv = evaluate(right, { [x]: solution });
  steps.push({
    title: `Paso ${n++}`,
    explanation: `Verificación: sustituir ${x} = ${solution.toString()} en la ecuación original.`,
    latex: `${lv.toLatex()} = ${rv.toLatex()} \;\\checkmark`,
  });

  return {
    kind: 'linear',
    input,
    inputLatex: originalLatex,
    steps,
    answer: `${x} = ${solution.toString()}`,
    answerLatex: `${x} = ${solution.toLatex()}`,
  };
}

function solveQuadratic(input: string, left: Poly, right: Poly, x: string): StepSolution {
  const steps: SolutionStep[] = [];
  let n = 1;
  let all = sub(left, right);
  if (!constValue(right).isZero() || coef(right, x).isZero() === false || coef(right, `${x}^2`).isZero() === false) {
    steps.push({
      title: `Paso ${n++}`,
      explanation: 'Pasar todos los términos al lado izquierdo para igualar a cero.',
      latex: `${toLatex(all)} = 0`,
    });
  }
  let a = coef(all, `${x}^2`);
  if (a.isNegative()) {
    all = scale(all, Fraction.ONE.neg());
    a = a.neg();
    steps.push({
      title: `Paso ${n++}`,
      explanation: 'Multiplicar por −1 para que el coeficiente principal sea positivo.',
      latex: `${toLatex(all)} = 0`,
    });
  }
  const b = coef(all, x);
  const c = constValue(all);
  steps.push({
    title: `Paso ${n++}`,
    explanation: 'Identificar los coeficientes de la forma ax² + bx + c = 0.',
    latex: `a = ${a.toLatex()},\; b = ${b.toLatex()},\; c = ${c.toLatex()}`,
  });
  const disc = b.mul(b).sub(new Fraction(4).mul(a).mul(c));
  steps.push({
    title: `Paso ${n++}`,
    explanation: 'Calcular el discriminante Δ = b² − 4ac.',
    latex: `\\Delta = (${b.toLatex()})^2 - 4(${a.toLatex()})(${c.toLatex()}) = ${disc.toLatex()}`,
  });

  if (disc.isNegative()) {
    steps.push({
      title: `Paso ${n++}`,
      explanation: 'Como Δ < 0, la ecuación no tiene soluciones reales.',
      latex: '\\Delta < 0',
    });
    return {
      kind: 'no-solution',
      input,
      inputLatex: input,
      steps,
      answer: 'Sin soluciones reales',
      answerLatex: '\\varnothing',
    };
  }

  const sqrtNum = Math.sqrt(disc.num);
  const sqrtDen = Math.sqrt(disc.den);
  const exact = Number.isInteger(sqrtNum) && Number.isInteger(sqrtDen);
  const twoA = new Fraction(2).mul(a);
  steps.push({
    title: `Paso ${n++}`,
    explanation: 'Aplicar la fórmula general x = (−b ± √Δ) / 2a.',
    latex: `${x} = \\frac{${b.neg().toLatex()} \\pm \\sqrt{${disc.toLatex()}}}{${twoA.toLatex()}}`,
  });

  let answer: string;
  let answerLatex: string;
  if (exact) {
    const root = new Fraction(sqrtNum, sqrtDen);
    const x1 = b.neg().add(root).div(twoA);
    const x2 = b.neg().sub(root).div(twoA);
    if (disc.isZero()) {
      answer = `${x} = ${x1.toString()}`;
      answerLatex = `${x} = ${x1.toLatex()}`;
    } else {
      answer = `${x}₁ = ${x1.toString()}, ${x}₂ = ${x2.toString()}`;
      answerLatex = `${x}_1 = ${x1.toLatex()},\; ${x}_2 = ${x2.toLatex()}`;
    }
    steps.push({
      title: `Paso ${n++}`,
      explanation: disc.isZero() ? 'Δ = 0: hay una solución doble.' : 'Calcular las dos soluciones.',
      latex: answerLatex,
    });
    const check = evaluate(all, { [x]: x1 });
    steps.push({
      title: `Paso ${n++}`,
      explanation: `Verificación con ${x} = ${x1.toString()}.`,
      latex: `${check.toLatex()} = 0 \;\\checkmark`,
    });
  } else {
    const r = Math.sqrt(disc.valueOf());
    const x1 = (-b.valueOf() + r) / twoA.valueOf();
    const x2 = (-b.valueOf() - r) / twoA.valueOf();
    answer = `${x}₁ ≈ ${x1.toFixed(3)}, ${x}₂ ≈ ${x2.toFixed(3)}`;
    answerLatex = `${x}_1 \\approx ${x1.toFixed(3)},\; ${x}_2 \\approx ${x2.toFixed(3)}`;
    steps.push({
      title: `Paso ${n++}`,
      explanation: 'La raíz no es exacta: se aproximan las soluciones.',
      latex: answerLatex,
    });
  }

  return { kind: 'quadratic', input, inputLatex: input, steps, answer, answerLatex };
}

function solveSystem(input: string, e1: string, e2: string): StepSolution {
  const toStandard = (src: string) => {
    const [l, r] = src.split('=');
    const p = sub(parseExpression(l), parseExpression(r));
    if (degree(p) > 1) throw new Error('El sistema debe ser lineal');
    return p;
  };
  const p1 = toStandard(e1);
  const p2 = toStandard(e2);
  const vars = [...new Set([...variables(p1), ...variables(p2)])];
  if (vars.length !== 2) throw new Error('El sistema debe tener exactamente dos incógnitas');
  const [x, y] = vars;
  const a1 = coef(p1, x), b1 = coef(p1, y), c1 = constValue(p1).neg();
  const a2 = coef(p2, x), b2 = coef(p2, y), c2 = constValue(p2).neg();
  const line = (a: Fraction, b: Fraction, c: Fraction) =>
    `${toLatex(add(new Map([[x, a]]), new Map([[y, b]])))} = ${c.toLatex()}`;

  const steps: SolutionStep[] = [
    {
      title: 'Paso 1',
      explanation: 'Escribir ambas ecuaciones en la forma ax + by = c.',
      latex: `\\begin{cases} ${line(a1, b1, c1)} \\\\ ${line(a2, b2, c2)} \\end{cases}`,
    },
  ];

  const det = a1.mul(b2).sub(a2.mul(b1));
  if (det.isZero()) {
    steps.push({
      title: 'Paso 2',
      explanation: 'Las rectas son paralelas o coincidentes: el sistema no tiene solución única.',
      latex: '\\Delta = 0',
    });
    return {
      kind: 'no-solution',
      input,
      inputLatex: input,
      steps,
      answer: 'Sin solución única',
      answerLatex: '\\Delta = 0',
    };
  }

  // Método de reducción: eliminar y.
  const m1 = b2, m2 = b1;
  steps.push({
    title: 'Paso 2',
    explanation: `Método de reducción: multiplicar la 1.ª ecuación por ${m1.toString()} y la 2.ª por ${m2.toString()} para igualar los coeficientes de ${y}.`,
    latex: `\\begin{cases} ${line(a1.mul(m1), b1.mul(m1), c1.mul(m1))} \\\\ ${line(a2.mul(m2), b2.mul(m2), c2.mul(m2))} \\end{cases}`,
  });
  const ax = a1.mul(m1).sub(a2.mul(m2));
  const cx = c1.mul(m1).sub(c2.mul(m2));
  steps.push({
    title: 'Paso 3',
    explanation: `Restar las ecuaciones para eliminar ${y}.`,
    latex: `${toLatex(new Map([[x, ax]]))} = ${cx.toLatex()}`,
  });
  const xv = cx.div(ax);
  steps.push({
    title: 'Paso 4',
    explanation: `Despejar ${x}.`,
    latex: `${x} = ${xv.toLatex()}`,
  });
  const yv = c1.sub(a1.mul(xv)).div(b1.isZero() ? Fraction.ONE : b1);
  const yFinal = b1.isZero() ? c2.sub(a2.mul(xv)).div(b2) : yv;
  steps.push({
    title: 'Paso 5',
    explanation: `Sustituir ${x} = ${xv.toString()} en una ecuación y despejar ${y}.`,
    latex: `${y} = ${yFinal.toLatex()}`,
  });
  const v1 = evaluate(p1, { [x]: xv, [y]: yFinal });
  const v2 = evaluate(p2, { [x]: xv, [y]: yFinal });
  steps.push({
    title: 'Paso 6',
    explanation: 'Verificación: ambas ecuaciones se cumplen.',
    latex: `${v1.isZero() && v2.isZero() ? '\\checkmark\; \\checkmark' : '\\times'}`,
  });
  return {
    kind: 'system',
    input,
    inputLatex: input,
    steps,
    answer: `${x} = ${xv.toString()}, ${y} = ${yFinal.toString()}`,
    answerLatex: `${x} = ${xv.toLatex()},\; ${y} = ${yFinal.toLatex()}`,
  };
}
