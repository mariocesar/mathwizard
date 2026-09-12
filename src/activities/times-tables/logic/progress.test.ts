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
    expect(progressMatrix(initDoc()).earnedCells).toBe(0);
  });

  it('un sembrado en caja 5 se enciende SOLO tras un acierto real en la app', () => {
    const doc = initDoc();
    expect(progressMatrix(doc).cells[0]![1]).toBe(0); // 1×2, caja 5 sin historia

    doc.facts['1x2']!.history = [win()];
    expect(progressMatrix(doc).cells[0]![1]).toBe(3);
  });

  it('el brillo ACUMULA con las cajas: 1–3 → tenue, 4 → brillando, 5 → oro pleno', () => {
    // Idea de Mamá: cada acierto sube el color hasta el oro del todo.
    const doc = initDoc();
    doc.facts['3x4']!.box = 3;
    doc.facts['3x4']!.history = [win()];
    doc.facts['6x7']!.box = 4;
    doc.facts['6x7']!.history = [win()];
    doc.facts['7x8']!.box = 5;
    doc.facts['7x8']!.history = [win()];
    const matrix = progressMatrix(doc);
    expect(matrix.cells[2]![3]).toBe(1);
    expect(matrix.cells[5]![6]).toBe(2);
    expect(matrix.cells[6]![7]).toBe(3);
  });

  it('una estrella ganada NUNCA vuelve a negro: si cae de caja, baja a tenue', () => {
    // Sin estados de derrota en la pantalla del premio.
    const doc = initDoc();
    doc.facts['7x8']!.box = 1;
    doc.facts['7x8']!.history = [
      win(),
      { session: 1, mode: 'retrieval', correct: false, firstDigitMs: 900, shownAs: 'ab' },
    ];
    expect(progressMatrix(doc).cells[6]![7]).toBe(1);
  });

  it('las celdas espejo se encienden JUNTAS desde un solo estado canónico', () => {
    const doc = initDoc();
    doc.facts['7x8']!.box = 5;
    doc.facts['7x8']!.history = [win()];
    const matrix = progressMatrix(doc);
    expect(matrix.cells[6]![7]).toBe(3); // fila 7, columna 8
    expect(matrix.cells[7]![6]).toBe(3); // fila 8, columna 7 — el espejo
  });

  it('solo el oro pleno cuenta como «estrella tuya» en el contador', () => {
    const doc = initDoc();
    doc.facts['3x4']!.box = 4;
    doc.facts['3x4']!.history = [win()];
    doc.facts['7x8']!.box = 5;
    doc.facts['7x8']!.history = [win()];
    const matrix = progressMatrix(doc);
    expect(matrix.goldCells).toBe(2); // 7×8 y 8×7
    expect(matrix.earnedCells).toBe(4); // + 3×4 y 4×3 en nivel 2
  });
});
