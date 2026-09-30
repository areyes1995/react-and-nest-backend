// Racional exacto para los procedimientos paso a paso.

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(num: number, den = 1) {
    if (den === 0) throw new Error('División entre cero');
    if (!Number.isFinite(num) || !Number.isFinite(den)) throw new Error('Número inválido');
    // Decimales → fracción (hasta 6 cifras).
    if (!Number.isInteger(num) || !Number.isInteger(den)) {
      const scale = 10 ** 6;
      num = Math.round(num * scale);
      den = Math.round(den * scale);
    }
    const sign = den < 0 ? -1 : 1;
    const g = gcd(num, den);
    this.num = (sign * num) / g;
    this.den = (sign * den) / g;
  }

  static of(value: number | Fraction): Fraction {
    return value instanceof Fraction ? value : new Fraction(value);
  }

  static readonly ZERO = new Fraction(0);
  static readonly ONE = new Fraction(1);

  add(o: Fraction) {
    return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den);
  }
  sub(o: Fraction) {
    return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den);
  }
  mul(o: Fraction) {
    return new Fraction(this.num * o.num, this.den * o.den);
  }
  div(o: Fraction) {
    if (o.num === 0) throw new Error('División entre cero');
    return new Fraction(this.num * o.den, this.den * o.num);
  }
  neg() {
    return new Fraction(-this.num, this.den);
  }
  abs() {
    return new Fraction(Math.abs(this.num), this.den);
  }
  isZero() {
    return this.num === 0;
  }
  isOne() {
    return this.num === 1 && this.den === 1;
  }
  isInteger() {
    return this.den === 1;
  }
  isNegative() {
    return this.num < 0;
  }
  equals(o: Fraction) {
    return this.num === o.num && this.den === o.den;
  }
  valueOf() {
    return this.num / this.den;
  }

  toString() {
    return this.den === 1 ? String(this.num) : `${this.num}/${this.den}`;
  }

  toLatex() {
    if (this.den === 1) return String(this.num);
    const sign = this.num < 0 ? '-' : '';
    return `${sign}\\frac{${Math.abs(this.num)}}{${this.den}}`;
  }
}
