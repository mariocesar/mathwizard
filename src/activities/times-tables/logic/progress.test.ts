import { describe, expect, it } from 'vitest';
import { progressMatrix, progressSummary } from './progress';
import { initDoc } from './scheduler';

describe('progressMatrix', () => {
  it('las celdas espejo se encienden JUNTAS desde un solo estado canónico', () => {
    const doc = initDoc();
    doc.facts['7x8']!.box = 5;
    const matrix = progressMatrix(doc);
    expect(matrix.cells[6]![7]).toBe('gold'); // fila 7, columna 8
    expect(matrix.cells[7]![6]).toBe('gold'); // fila 8, columna 7 — el espejo
  });

  it('oro = caja 5, plata = cajas 3–4, apagado = cajas 1–2', () => {
    const doc = initDoc();
    doc.facts['3x4']!.box = 3;
    doc.facts['6x7']!.box = 1;
    const matrix = progressMatrix(doc);
    expect(matrix.cells[2]![3]).toBe('plata');
    expect(matrix.cells[5]![6]).toBe('unlit');
    // Los sembrados nacen en caja 5:
    expect(matrix.cells[0]![0]).toBe('gold'); // 1×1
  });

  it('recién sembrado: las 34 sabidas encienden sus celdas y el resto no', () => {
    const doc = initDoc();
    const { gold, total } = progressSummary(doc);
    // 34 hechos sembrados → 10 pares no-cuadrados... contamos celdas:
    // cada hecho a≠b enciende 2 celdas, cada cuadrado 1.
    // Sembrados: los que tocan {1,2,5,10}. Cuadrados sembrados: 1×1, 2×2, 5×5, 10×10 (4).
    // No-cuadrados sembrados: 30. Celdas = 30·2 + 4 = 64.
    expect(gold).toBe(64);
    expect(total).toBe(100);
  });
});
