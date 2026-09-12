/**
 * Tipos del dominio de las tablas. Todo JSON-serializable: sin Date, sin
 * Map, sin clases — el documento entero viaja por el slice persistido.
 * El universo de hechos vive en lib/domain/facts (compartido con «El giro»).
 */
import type { Fact, FactId, FactKind } from '../../../lib/domain/facts';

export type { Fact, FactId, FactKind };

export type Box = 1 | 2 | 3 | 4 | 5;

/** La fase es propiedad DEL HECHO, no del niño. */
export type Phase = 'strategy' | 'retrieval';

export type ShownAs = 'ab' | 'ba';

export interface Attempt {
  session: number;
  mode: Phase;
  correct: boolean;
  /** null = medición descartada (app en segundo plano, o modo estrategia). */
  firstDigitMs: number | null;
  shownAs: ShownAs;
}

export interface FactState {
  factId: FactId;
  box: Box;
  /** Modo de la PRÓXIMA presentación (regla fallo-en-recuperación → estrategia). */
  phase: Phase;
  /** -1 = nunca visto. */
  lastSeenSession: number;
  dueSession: number;
  /** Correctas-pero-lentas consecutivas en recuperación. */
  slowStreak: number;
  /** Últimos 20 intentos. */
  history: Attempt[];
}

export interface StrategyStep {
  prompt: string; // español, con los números concretos ya calculados
  expected: number;
}

export type StrategyId =
  'dobleDe2' | 'dobleDe4' | 'dobleDe3' | 'diezMenos' | 'dosMasUno' | 'cincoMasDos' | 'despacio'; // fallback sin plantilla (hechos que solo tocan 1/2/5/10)

export type SessionItem =
  | {
      kind: 'retrieval';
      factId: FactId;
      /** Operandos en el orden de presentación (aleatorizado). */
      a: number;
      b: number;
      expected: number;
      isWinddown: boolean;
      requeueOf?: FactId;
    }
  | {
      kind: 'strategy';
      factId: FactId;
      a: number;
      b: number;
      strategyId: StrategyId;
      steps: StrategyStep[];
      closing: string; // «Así que 4 × 8 = 32.»
      expected: number;
      isWinddown: false;
      requeueOf?: FactId;
      /** true si nació de una conversión por atasco (STALLED). */
      stalled?: boolean;
    };

export interface ItemResult {
  factId: FactId;
  mode: Phase;
  correct: boolean;
  /** Solo recuperación; null cuando la latencia no vale. */
  fast: boolean | null;
  firstDigitMs: number | null;
}

export interface SessionResult {
  session: number;
  startedAt: string; // ISO — curiosidad de padres, jamás para planificar
  items: ItemResult[];
  promotions: FactId[];
  recovered: FactId[];
  summaryLine: string;
}

/** Documento persistido de la actividad (el `data` del slice). */
export interface TablesDoc {
  sessionCounter: number;
  speedThresholdMs: number;
  baselineMs: number | null;
  facts: Record<FactId, FactState>;
  recentSessions: SessionResult[]; // últimas 10
}
