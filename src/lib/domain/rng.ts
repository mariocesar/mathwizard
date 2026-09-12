/**
 * PRNG sembrado (mulberry32): las pruebas del planificador y del compositor
 * necesitan aleatoriedad determinista para poder afirmar invariantes.
 */
export interface Rng {
  /** Número en [0, 1), como Math.random(). */
  next(): number;
  /** Entero en [0, n). */
  int(n: number): number;
  /** Elemento al azar de un array no vacío. */
  pick<T>(items: readonly T[]): T;
  /** Copia barajada (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;

  function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(n: number): number {
    return Math.floor(next() * n);
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick() sobre un array vacío');
    return items[int(items.length)]!;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }

  return { next, int, pick, shuffle };
}
