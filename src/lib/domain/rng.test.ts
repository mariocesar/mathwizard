import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('es determinista para una misma semilla', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produce secuencias distintas con semillas distintas', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('next() queda siempre en [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(n) queda en [0, n) y toca todos los valores', () => {
    const rng = createRng(13);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
      seen.add(v);
    }
    expect(seen.size).toBe(5);
  });

  it('shuffle conserva los elementos y no muta el original', () => {
    const rng = createRng(99);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const copy = [...original];
    const shuffled = rng.shuffle(original);
    expect(original).toEqual(copy);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
  });

  it('pick lanza con array vacío', () => {
    const rng = createRng(1);
    expect(() => rng.pick([])).toThrow();
  });
});
