import type { Fact, FactId, FactKind } from './types';

/** Operandos de las tablas «nuevas» de 3.º — definen objetivo vs. sembrado. */
const HARD_OPERANDS = new Set([3, 4, 6, 7, 8, 9]);

export function canonicalId(a: number, b: number): FactId {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}x${hi}`;
}

export function parseFactId(id: FactId): { a: number; b: number } {
  const [a, b] = id.split('x').map(Number);
  return { a: a!, b: b! };
}

export function product(id: FactId): number {
  const { a, b } = parseFactId(id);
  return a * b;
}

function kindOf(a: number, b: number): FactKind {
  if (HARD_OPERANDS.has(a) && HARD_OPERANDS.has(b)) {
    return a === b ? 'square' : 'target';
  }
  return 'seeded';
}

/**
 * El universo completo: 55 hechos canónicos (1 ≤ a ≤ b ≤ 10).
 * 15 target + 6 square = 21 objetivos; 34 seeded (tocan 1, 2, 5 o 10).
 */
export function allFacts(): Fact[] {
  const facts: Fact[] = [];
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      facts.push({ id: canonicalId(a, b), a, b, kind: kindOf(a, b) });
    }
  }
  return facts;
}

export const FACTS: readonly Fact[] = allFacts();

export const FACT_BY_ID: ReadonlyMap<FactId, Fact> = new Map(FACTS.map((f) => [f.id, f]));

export function getFact(id: FactId): Fact {
  const fact = FACT_BY_ID.get(id);
  if (!fact) throw new Error(`Hecho desconocido: ${id}`);
  return fact;
}

/** ¿Comparten operando dos hechos? (para el entrelazado anti-secuencias) */
export function shareOperand(x: FactId, y: FactId): boolean {
  const fx = parseFactId(x);
  const fy = parseFactId(y);
  return fx.a === fy.a || fx.a === fy.b || fx.b === fy.a || fx.b === fy.b;
}
