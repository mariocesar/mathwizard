/**
 * Construcción codiciosa: en cada paso toma el primer candidato del pool que
 * no choca con el último colocado; si todos chocan, el conflicto es
 * inevitable con este pool y se toma el primero. (Práctica mezclada: nunca
 * dos ítems seguidos de la misma tabla.)
 */
export function interleave<T>(items: T[], conflicts: (a: T, b: T) => boolean): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length > 0) {
    const last = out.at(-1);
    const idx = last === undefined ? 0 : pool.findIndex((c) => !conflicts(last, c));
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0]!);
  }
  return out;
}
