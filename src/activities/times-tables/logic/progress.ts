import { canonicalId } from './facts';
import type { TablesDoc } from './types';

/**
 * Matriz de dominio 10×10 para «Tu cielo». Las celdas espejo (7×8 y 8×7)
 * salen del MISMO estado canónico: el marcador enseña la conmutatividad.
 * oro = caja 5 (dominado) · plata = cajas 3–4 (en camino) · apagado = 1–2.
 *
 * Una estrella solo se enciende si el niño la GANÓ en la app (al menos un
 * acierto registrado). Feedback real de Vito al ver 64 estrellas de fábrica:
 * «¿alguien hizo eso por mí?» — el cielo empieza oscuro y se enciende con
 * victorias reales, o la moneda entera pierde el valor.
 */
export type CellState = 'gold' | 'plata' | 'unlit';

export interface ProgressMatrix {
  /** cells[fila-1][columna-1], filas y columnas 1..10. */
  cells: CellState[][];
  goldCells: number;
  plataCells: number;
  totalCells: 100;
}

function cellStateFor(doc: TablesDoc, a: number, b: number): CellState {
  const state = doc.facts[canonicalId(a, b)];
  if (!state) return 'unlit';
  const earned = state.history.some((attempt) => attempt.correct);
  if (!earned) return 'unlit';
  if (state.box === 5) return 'gold';
  if (state.box >= 3) return 'plata';
  return 'unlit';
}

export function progressMatrix(doc: TablesDoc): ProgressMatrix {
  const cells: CellState[][] = [];
  let goldCells = 0;
  let plataCells = 0;
  for (let row = 1; row <= 10; row++) {
    const cols: CellState[] = [];
    for (let col = 1; col <= 10; col++) {
      const cell = cellStateFor(doc, row, col);
      cols.push(cell);
      if (cell === 'gold') goldCells++;
      if (cell === 'plata') plataCells++;
    }
    cells.push(cols);
  }
  return { cells, goldCells, plataCells, totalCells: 100 };
}

export interface ProgressSummary {
  gold: number;
  total: number;
}

/** «23 de 100 estrellas» — para la franja de Home y el contador del cielo. */
export function progressSummary(doc: TablesDoc): ProgressSummary {
  return { gold: progressMatrix(doc).goldCells, total: 100 };
}
