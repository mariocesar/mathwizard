import { parseFactId, product } from './facts';
import { hechoEnPalabras } from './numeros';
import type { FactId, ItemResult, SessionResult } from './types';

/**
 * Todas las frases de feedback. Regla de oro: se habla DEL HECHO, nunca
 * del niño. «¡56! Esa se resistía.» — jamás «¡qué listo eres!».
 */

export interface FeedbackPlan {
  type: 'correct-fast' | 'correct-slow' | 'wrong' | 'strategy-done';
  /** Línea corta bajo el hecho (también es el fallback si no hay voz). */
  line: string;
  /** Lo que se dice en voz alta (solo en el fallo). */
  spoken?: string;
}

export function correctFast(factId: FactId, wasRequeued: boolean): FeedbackPlan {
  const p = product(factId);
  return {
    type: 'correct-fast',
    line: wasRequeued ? `¡${p}! Esa se resistía.` : `¡${p}! A la primera.`,
  };
}

export function correctSlow(): FeedbackPlan {
  return { type: 'correct-slow', line: 'Eso es.' };
}

export function wrong(factId: FactId): FeedbackPlan {
  const { a, b } = parseFactId(factId);
  return {
    type: 'wrong',
    line: `${a} × ${b} = ${a * b}. Vuelve enseguida.`,
    spoken: hechoEnPalabras(a, b),
  };
}

export function strategyDone(closing: string): FeedbackPlan {
  return { type: 'strategy-done', line: closing };
}

export const STALLED_LINE = 'Vamos a pensarlo juntos.';

/**
 * Frase de cierre de sesión: progreso concreto, nunca elogio a la persona.
 * `bigPromotions` = hechos que llegaron a caja ≥ 4 en esta sesión.
 */
export function summaryLine(
  bigPromotions: FactId[],
  recovered: FactId[],
  items: ItemResult[],
): string {
  if (bigPromotions.length > 0) {
    return `El ${product(bigPromotions[0]!)} ya no se te escapa.`;
  }
  if (recovered.length > 0) {
    const { a, b } = parseFactId(recovered[0]!);
    return `El ${a} × ${b} volvió y lo cazaste.`;
  }
  let best = 0;
  let streak = 0;
  for (const item of items) {
    streak = item.correct ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return best > 0 ? `Hoy: ${best} seguidas bien.` : 'Hoy has practicado. Mañana, más.';
}

export function buildSessionSummary(
  session: number,
  startedAt: string,
  items: ItemResult[],
  promotions: FactId[],
  bigPromotions: FactId[],
  recovered: FactId[],
): SessionResult {
  return {
    session,
    startedAt,
    items,
    promotions,
    recovered,
    summaryLine: summaryLine(bigPromotions, recovered, items),
  };
}
