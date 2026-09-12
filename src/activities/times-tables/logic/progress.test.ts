import { describe, expect, it } from 'vitest';
import { progressMatrix, progressSummary } from './progress';
import { initDoc } from './scheduler';
import type { Attempt } from './types';

const win = (session = 0): Attempt => ({
  session,
  mode: 'retrieval',
  correct: true,
  firstDigitMs: 900,
  shownAs: 'ab',
});

describe('progressMatrix', () => {
  it('el cielo empieza COMPLETAMENTE oscuro: nada viene encendido de fábrica', () => {
    // Feedback de Vito: «¿alguien hizo eso por mí?» — las estrellas se ganan.
    const { gold, total } = progressSummary(initDoc());
    expect(gold).toBe(0);
    expect(total).toBe(100);
    const matrix = progressMatrix(initDoc());
    expect(matrix.plataCells).toBe(0);
  });

  it('un sembrado en caja 5 se enciende SOLO tras un acierto real en la app', () => {
    const doc = initDoc();
    const matrix1 = progressMatrix(doc);
    expect(matrix1.cells[0]![1]).toBe('unlit'); // 1×2, caja 5 pero sin historia

    doc.facts['1x2']!.history = [win()];
    const matrix2 = progressMatrix(doc);
    expect(matrix2.cells[0]![1]).toBe('gold');
  });

  it('las celdas espejo se encienden JUNTAS desde un solo estado canónico', () => {
    const doc = initDoc();
    doc.facts['7x8']!.box = 5;
    doc.facts['7x8']!.history = [win()];
    const matrix = progressMatrix(doc);
    expect(matrix.cells[6]![7]).toBe('gold'); // fila 7, columna 8
    expect(matrix.cells[7]![6]).toBe('gold'); // fila 8, columna 7 — el espejo
  });

  it('oro = caja 5, plata = cajas 3–4, apagado = cajas 1–2 (siempre con acierto)', () => {
    const doc = initDoc();
    doc.facts['3x4']!.box = 3;
    doc.facts['3x4']!.history = [win()];
    doc.facts['6x7']!.box = 4;
    doc.facts['6x7']!.history = [win()];
    doc.facts['7x9']!.box = 2;
    doc.facts['7x9']!.history = [win()];
    const matrix = progressMatrix(doc);
    expect(matrix.cells[2]![3]).toBe('plata');
    expect(matrix.cells[5]![6]).toBe('plata');
    expect(matrix.cells[6]![8]).toBe('unlit'); // caja 2: aún no
  });
});
