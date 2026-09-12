import { describe, expect, it } from 'vitest';
import { FACTS, canonicalId, product, shareOperand } from './facts';

describe('universo de hechos', () => {
  it('tiene exactamente 55 hechos canónicos', () => {
    expect(FACTS).toHaveLength(55);
  });

  it('reparte 15 target + 6 square + 34 seeded', () => {
    const byKind = { target: 0, square: 0, seeded: 0 };
    for (const f of FACTS) byKind[f.kind]++;
    expect(byKind).toEqual({ target: 15, square: 6, seeded: 34 });
  });

  it('los 15 hechos duros coinciden con la lista de la investigación, literal', () => {
    const targets = FACTS.filter((f) => f.kind === 'target')
      .map((f) => f.id)
      .sort();
    expect(targets).toEqual(
      [
        '3x4',
        '3x6',
        '3x7',
        '3x8',
        '3x9',
        '4x6',
        '4x7',
        '4x8',
        '4x9',
        '6x7',
        '6x8',
        '6x9',
        '7x8',
        '7x9',
        '8x9',
      ].sort(),
    );
  });

  it('los 6 cuadrados son 3,4,6,7,8,9', () => {
    const squares = FACTS.filter((f) => f.kind === 'square').map((f) => f.id);
    expect(squares.sort()).toEqual(['3x3', '4x4', '6x6', '7x7', '8x8', '9x9'].sort());
  });

  it('canonicalId normaliza el orden (conmutatividad)', () => {
    expect(canonicalId(8, 7)).toBe('7x8');
    expect(canonicalId(7, 8)).toBe('7x8');
    expect(product('7x8')).toBe(56);
  });

  it('shareOperand detecta operandos compartidos', () => {
    expect(shareOperand('3x4', '3x7')).toBe(true);
    expect(shareOperand('3x4', '4x9')).toBe(true);
    expect(shareOperand('3x4', '6x7')).toBe(false);
  });
});
