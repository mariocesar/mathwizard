import { FACTS, getFact, parseFactId, shareOperand, type FactId } from '../../../lib/domain/facts';
import { interleave } from '../../../lib/domain/interleave';
import { hechoEnPalabras } from '../../../lib/domain/numeros';
import type { Rng } from '../../../lib/domain/rng';

/**
 * «El giro» — idea de Vito: el factor que falta. `5 × _ = 20`, `_ × 8 = 64`.
 * El cerebro «gira» la multiplicación — el puente natural a la división.
 *
 * Sin reloj, sin latencia: es un reto de razonamiento, no de velocidad.
 * Se gira lo que ya va solo: el pool sale de los hechos con caja ≥ 3 en
 * «Las tablas» (girar lo desconocido sería frustración, no reto).
 */

export interface GiroItem {
  factId: FactId;
  /** El operando visible, en el hueco que le tocó. */
  shown: number;
  /** true → «_ × shown = product»; false → «shown × _ = product». */
  hiddenFirst: boolean;
  product: number;
  /** El operando oculto: la respuesta. */
  expected: number;
  requeueOf?: FactId;
}

/** Forma estructural mínima del doc de «Las tablas»: solo la caja. */
export interface TablesLike {
  facts: Record<string, { box: number }>;
}

export const GIRO_SESSION_ITEMS = 12;
const REQUEUE_OFFSET = 2;

/** Hechos «giranles»: caja ≥ 3 en Las tablas (ya se recuperan solos). */
export function giroPool(tables: TablesLike): FactId[] {
  return FACTS.filter((f) => (tables.facts[f.id]?.box ?? 0) >= 3).map((f) => f.id);
}

export function makeGiroItem(factId: FactId, rng: Rng, requeueOf?: FactId): GiroItem {
  const fact = getFact(factId);
  // Qué operando se esconde y en qué lado se muestra el visible:
  const hideA = rng.next() < 0.5;
  const hiddenFirst = rng.next() < 0.5;
  const expected = hideA ? fact.a : fact.b;
  const shown = hideA ? fact.b : fact.a;
  return { factId, shown, hiddenFirst, product: fact.a * fact.b, expected, requeueOf };
}

export function planGiro(pool: FactId[], rng: Rng, count = GIRO_SESSION_ITEMS): GiroItem[] {
  const ordered = interleave(rng.shuffle(pool), shareOperand).slice(0, count);
  return ordered.map((id) => makeGiroItem(id, rng));
}

export type GiroEvent =
  | { type: 'DIGIT'; d: number }
  | { type: 'BACKSPACE' }
  | { type: 'SUBMIT' }
  | { type: 'FEEDBACK_DONE' }
  | { type: 'ABORT' };

/** Igual que en Las tablas: no existe ningún efecto de error en el tipo. */
export type GiroEffect =
  | { type: 'speak'; text: string }
  | { type: 'sound'; id: 'ding' }
  | { type: 'haptic' }
  | { type: 'celebrate' };

export interface GiroFeedback {
  correct: boolean;
  line: string;
  spoken?: string;
}

export interface GiroResult {
  factId: FactId;
  correct: boolean;
}

export interface GiroState {
  status: 'entering' | 'feedback' | 'summary';
  queue: GiroItem[];
  current: GiroItem | null;
  input: string;
  results: GiroResult[];
  streak: number;
  bestStreak: number;
  feedback: GiroFeedback | null;
  /** Reintento único del último ítem para acabar en victoria. */
  finalRetryUsed: boolean;
}

export interface GiroStep {
  state: GiroState;
  effects: GiroEffect[];
}

const MAX_DIGITS = 2;

export function startGiro(pool: FactId[], rng: Rng): GiroState {
  const [first, ...rest] = planGiro(pool, rng);
  return {
    status: first ? 'entering' : 'summary',
    queue: rest,
    current: first ?? null,
    input: '',
    results: [],
    streak: 0,
    bestStreak: 0,
    feedback: null,
    finalRetryUsed: false,
  };
}

/** El hecho completo en el orden presentado, p. ej. «5 × 4 = 20». */
export function completedFact(item: GiroItem): string {
  const first = item.hiddenFirst ? item.expected : item.shown;
  const second = item.hiddenFirst ? item.shown : item.expected;
  return `${first} × ${second} = ${item.product}`;
}

export function stepGiro(state: GiroState, event: GiroEvent, rng: Rng): GiroStep {
  switch (event.type) {
    case 'DIGIT': {
      if (state.status !== 'entering') return { state, effects: [] };
      const input = state.input.length < MAX_DIGITS ? state.input + String(event.d) : state.input;
      return { state: { ...state, input }, effects: [] };
    }

    case 'BACKSPACE': {
      if (state.status !== 'entering' || state.input.length === 0) {
        return { state, effects: [] };
      }
      return { state: { ...state, input: state.input.slice(0, -1) }, effects: [] };
    }

    case 'SUBMIT': {
      if (state.status !== 'entering' || !state.current || state.input.length === 0) {
        return { state, effects: [] };
      }
      const item = state.current;
      const correct = Number(state.input) === item.expected;
      const results = [...state.results, { factId: item.factId, correct }];

      if (correct) {
        const streak = state.streak + 1;
        return {
          state: {
            ...state,
            status: 'feedback',
            results,
            streak,
            bestStreak: Math.max(state.bestStreak, streak),
            feedback: { correct: true, line: `¡${item.expected}! ${completedFact(item)}.` },
          },
          effects: [{ type: 'sound', id: 'ding' }, { type: 'haptic' }, { type: 'celebrate' }],
        };
      }

      const { a, b } = parseFactId(item.factId);
      const spoken = hechoEnPalabras(a, b);
      // Re-pregunta única a +2 (si no era ya una re-pregunta).
      let queue = state.queue;
      if (!item.requeueOf) {
        const requeued = makeGiroItem(item.factId, rng, item.factId);
        const at = Math.min(REQUEUE_OFFSET, queue.length);
        queue = [...queue.slice(0, at), requeued, ...queue.slice(at)];
      }
      return {
        state: {
          ...state,
          status: 'feedback',
          results,
          queue,
          streak: 0,
          feedback: {
            correct: false,
            line: `Era ${item.expected}: ${completedFact(item)}. Vuelve enseguida.`,
            spoken,
          },
        },
        effects: [{ type: 'speak', text: spoken }],
      };
    }

    case 'FEEDBACK_DONE': {
      if (state.status !== 'feedback') return { state, effects: [] };

      // Último ítem fallado: se re-presenta UNA vez (acaba de ver la
      // respuesta) para cerrar en victoria; si vuelve a fallar, se cierra.
      if (
        state.queue.length === 0 &&
        state.feedback?.correct === false &&
        !state.finalRetryUsed &&
        state.current
      ) {
        return {
          state: {
            ...state,
            status: 'entering',
            input: '',
            feedback: null,
            finalRetryUsed: true,
          },
          effects: [],
        };
      }

      const [next, ...rest] = state.queue;
      if (!next) {
        return {
          state: { ...state, status: 'summary', current: null, feedback: null },
          effects: [],
        };
      }
      return {
        state: {
          ...state,
          status: 'entering',
          current: next,
          queue: rest,
          input: '',
          feedback: null,
        },
        effects: [],
      };
    }

    case 'ABORT':
      return { state: { ...state, status: 'summary', current: null, feedback: null }, effects: [] };
  }
}

/** Frase de cierre: progreso concreto, nunca elogio a la persona. */
export function giroSummaryLine(state: GiroState, newRecord: boolean): string {
  const corrects = state.results.filter((r) => r.correct).length;
  if (newRecord && state.bestStreak >= 3) {
    return `Nueva mejor racha: ${state.bestStreak} giros seguidos.`;
  }
  if (state.bestStreak >= 3) {
    return `Racha de ${state.bestStreak} giros seguidos.`;
  }
  if (corrects > 0) {
    return `Hoy: ${corrects} giros hechos.`;
  }
  return 'Los giros cuestan al principio. Mañana salen.';
}
