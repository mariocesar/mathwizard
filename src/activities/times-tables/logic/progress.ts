import { canonicalId } from '../../../lib/domain/facts';
import type { FactState, TablesDoc } from './types';

/**
 * Matriz de dominio 10×10 para «Tu cielo». Las celdas espejo (7×8 y 8×7)
 * salen del MISMO estado canónico: el marcador enseña la conmutatividad.
 *
 * El brillo ACUMULA (idea de Mamá): cada acierto sube la caja y la estrella
 * brilla más, hasta el oro pleno en la caja 5. Y una estrella ganada nunca
 * vuelve a negro — si el hecho cae de caja, baja a brillo mínimo, pero
 * apagarla del todo sería un castigo en la pantalla del premio.
 *
 * Una estrella solo se enciende si el niño la GANÓ en la app (al menos un
 * acierto registrado). Feedback real de Vito al ver 64 estrellas de fábrica:
 * «¿alguien hizo eso por mí?» — el cielo empieza oscuro.
 */

/** 0 = apagada · 1 = tenue · 2 = brillando · 3 = oro pleno (dominada). */
export type CellLevel = 0 | 1 | 2 | 3;

export interface ProgressMatrix {
  /** cells[fila-1][columna-1], filas y columnas 1..10. */
  cells: CellLevel[][];
  /** Estrellas a oro pleno (caja 5): las que cuentan como «tuyas». */
  goldCells: number;
  /** Celdas con algún brillo (nivel ≥ 1). */
  earnedCells: number;
  totalCells: 100;
}

function levelFor(state: FactState | undefined): CellLevel {
  if (!state) return 0;
  const earned = state.history.some((attempt) => attempt.correct);
  if (!earned) return 0;
  if (state.box === 5) return 3;
  if (state.box === 4) return 2;
  return 1;
}

export function progressMatrix(doc: TablesDoc): ProgressMatrix {
  const cells: CellLevel[][] = [];
  let goldCells = 0;
  let earnedCells = 0;
  for (let row = 1; row <= 10; row++) {
    const cols: CellLevel[] = [];
    for (let col = 1; col <= 10; col++) {
      const level = levelFor(doc.facts[canonicalId(row, col)]);
      cols.push(level);
      if (level === 3) goldCells++;
      if (level >= 1) earnedCells++;
    }
    cells.push(cols);
  }
  return { cells, goldCells, earnedCells, totalCells: 100 };
}

export interface ProgressSummary {
  gold: number;
  total: number;
}

/** «23 de 100 estrellas» — para la franja de Home y el contador del cielo. */
export function progressSummary(doc: TablesDoc): ProgressSummary {
  return { gold: progressMatrix(doc).goldCells, total: 100 };
}
