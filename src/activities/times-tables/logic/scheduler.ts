import type { Rng } from '../../../lib/domain/rng';
import { FACTS, getFact, shareOperand } from './facts';
import type { Attempt, Box, FactId, FactState, Phase, ShownAs, TablesDoc } from './types';

/**
 * Espaciado en SESIONES COMPLETADAS, no en días de calendario: el uso de un
 * niño es a ráfagas, y un SRS de calendario castiga los huecos (vuelves tras
 * una semana y todo está «vencido»). Con sesiones, cada sesión tiene una
 * mezcla de dificultad estable pase el tiempo que pase.
 */
export const INTERVALS: Record<Box, number> = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 8 };

/** Umbral MTC (prueba estatutaria inglesa para 8–9 años). */
export const DEFAULT_SPEED_THRESHOLD_MS = 6000;

/** Una sesión solo cuenta (e incrementa el contador) con ≥ 5 respuestas. */
export const MIN_ANSWERS_TO_COUNT = 5;

const HISTORY_CAP = 20;

export function initDoc(): TablesDoc {
  const facts: Record<FactId, FactState> = {};
  let seededIndex = 0;
  for (const fact of FACTS) {
    if (fact.kind === 'seeded') {
      // Sembrados en caja 5, escalonados 0–7: cada sesión vencen unos pocos
      // (reps de confianza + reserva del cierre). Si uno falla, cae a caja 1
      // como cualquier otro — el «ya se lo sabe» se verifica, no se supone.
      facts[fact.id] = {
        factId: fact.id,
        box: 5,
        phase: 'retrieval',
        lastSeenSession: -1,
        dueSession: seededIndex % 8,
        slowStreak: 0,
        history: [],
      };
      seededIndex++;
    } else {
      facts[fact.id] = {
        factId: fact.id,
        box: 1,
        phase: 'strategy',
        lastSeenSession: -1,
        dueSession: 0,
        slowStreak: 0,
        history: [],
      };
    }
  }
  return {
    sessionCounter: 0,
    speedThresholdMs: DEFAULT_SPEED_THRESHOLD_MS,
    baselineMs: null,
    facts,
    recentSessions: [],
  };
}

export type Outcome =
  | { kind: 'strategy'; correct: boolean }
  | { kind: 'retrieval'; correct: boolean; fast: boolean | null };

/** ¿Es la primera vez que la app ve este hecho objetivo? → sonda. */
export function isProbe(state: FactState, outcome: Outcome): boolean {
  return outcome.kind === 'retrieval' && state.lastSeenSession === -1 && state.box === 1;
}

/**
 * LA función de transición. Invariante central: «mal o lento nunca sube».
 * Fallo en recuperación → caja 1 Y fase estrategia (integración Woodward).
 * Dos lentas-correctas seguidas → caja 2 + estrategia (lentitud persistente
 * = lo está calculando, no recuperando).
 *
 * SONDA (primer encuentro de un objetivo, feedback real de Vito: «yo me sé
 * la del 3, quiero practicar 8 y 9»): la primera presentación es una
 * pregunta de recuperación que VERIFICA lo que ya sabe en vez de suponer
 * que no sabe nada. Rápida → caja 4; lenta → caja 3; mal → caja 1 y
 * estrategia, como siempre.
 */
export function applyOutcome(
  state: FactState,
  outcome: Outcome,
  session: number,
  attemptInfo: { firstDigitMs: number | null; shownAs: ShownAs },
): FactState {
  let box: Box = state.box;
  let phase: Phase = state.phase;
  let slowStreak = state.slowStreak;
  let dueOverride: number | null = null;
  let invalid = false;

  if (outcome.kind === 'strategy') {
    if (outcome.correct) {
      box = state.box < 3 ? ((state.box + 1) as Box) : state.box;
      slowStreak = 0;
    } else {
      box = 1;
      slowStreak = 0;
    }
  } else if (isProbe(state, outcome)) {
    if (outcome.correct && outcome.fast === true) {
      box = 4;
      slowStreak = 0;
    } else if (outcome.correct && outcome.fast === false) {
      box = 3;
      slowStreak = 0;
    } else {
      // Mal o medición inválida: entra por el camino normal, caja 1.
      box = 1;
      slowStreak = 0;
    }
  } else {
    if (!outcome.correct) {
      box = 1;
      slowStreak = 0;
    } else if (outcome.fast === true) {
      box = state.box < 5 ? ((state.box + 1) as Box) : 5;
      slowStreak = 0;
    } else if (outcome.fast === false) {
      slowStreak = state.slowStreak + 1;
      if (slowStreak >= 2) {
        box = 2;
        slowStreak = 0;
      } else {
        box = state.box;
        dueOverride = session + 1;
      }
    } else {
      // Latencia inválida: una medición descartada jamás mueve nada.
      invalid = true;
      dueOverride = session + 1;
    }
  }

  // La fase es función de la caja — un solo sitio garantiza el acoplamiento:
  // cajas 1–2 ⇒ estrategia, cajas 3–5 ⇒ recuperación.
  if (!invalid) {
    phase = box >= 3 ? 'retrieval' : 'strategy';
  }

  const attempt: Attempt = {
    session,
    mode: outcome.kind,
    correct: outcome.correct,
    firstDigitMs: attemptInfo.firstDigitMs,
    shownAs: attemptInfo.shownAs,
  };

  return {
    ...state,
    box,
    phase,
    slowStreak,
    lastSeenSession: session,
    dueSession: dueOverride ?? session + INTERVALS[box],
    history: [...state.history, attempt].slice(-HISTORY_CAP),
  };
}

export interface PlanOptions {
  targetItems: number;
  maxNewTargets: number;
  maxStrategyItems: number;
}

export const FULL_SESSION: PlanOptions = {
  // 20 ítems + el trío del cierre ≈ 3–4 min: un final visible y cercano
  // (feedback de Vito: «¿cuándo acaba?»). Las sondas son baratas → hasta 4
  // hechos nuevos por sesión; el bloque de pensar se limita a 3.
  targetItems: 20,
  maxNewTargets: 4,
  maxStrategyItems: 3,
};

export interface SessionPlan {
  main: FactId[];
  winddown: FactId[];
}

function neverFailed(state: FactState): boolean {
  return state.history.every((a) => a.correct);
}

/**
 * Selección de hechos para una sesión:
 * vencidos (más atrasado primero, caja baja primero) → tope de nuevos →
 * tope de estrategia → reserva del cierre → relleno con casi-vencidos →
 * entrelazado sin operandos consecutivos compartidos.
 */
export function planSession(
  doc: TablesDoc,
  rng: Rng,
  opts: PlanOptions = FULL_SESSION,
): SessionPlan {
  const states = Object.values(doc.facts);
  const now = doc.sessionCounter;
  const tiebreak = new Map<FactId, number>(states.map((s) => [s.factId, rng.next()]));

  // 1. Reserva del cierre: 3 hechos «seguros» (sembrados, caja 5, sin fallos,
  //    el menos visto primero). Van aparte y SIEMPRE al final de la sesión.
  const safePool = states
    .filter((s) => getFact(s.factId).kind === 'seeded' && s.box === 5 && neverFailed(s))
    .sort(
      (x, y) =>
        x.lastSeenSession - y.lastSeenSession || tiebreak.get(x.factId)! - tiebreak.get(y.factId)!,
    );
  let winddown = safePool.slice(0, 3).map((s) => s.factId);
  if (winddown.length < 3) {
    // Fallback: los de caja más alta con la racha correcta más larga.
    const backup = states
      .filter((s) => !winddown.includes(s.factId))
      .sort((x, y) => y.box - x.box || correctStreak(y) - correctStreak(x));
    winddown = [...winddown, ...backup.slice(0, 3 - winddown.length).map((s) => s.factId)];
  }
  const reserved = new Set(winddown);

  // 2. Vencidos, ordenados por urgencia.
  const due = states
    .filter((s) => !reserved.has(s.factId) && s.dueSession <= now)
    .sort(
      (x, y) =>
        x.dueSession - y.dueSession || // más atrasado primero
        x.box - y.box ||
        tiebreak.get(x.factId)! - tiebreak.get(y.factId)!,
    );

  // 3. Topes: sondas (hechos nuevos) y bloque de estrategia. Un hecho nuevo
  //    se presenta como SONDA de recuperación (no consume el tope de pensar).
  const main: FactState[] = [];
  let newTargets = 0;
  let strategyCount = 0;
  for (const s of due) {
    const isNew = s.lastSeenSession === -1 && getFact(s.factId).kind !== 'seeded';
    const isOpening = s.phase === 'strategy' && s.lastSeenSession >= 0;
    if (isNew && newTargets >= opts.maxNewTargets) continue;
    if (isOpening && strategyCount >= opts.maxStrategyItems) continue;
    main.push(s);
    if (isNew) newTargets++;
    if (isOpening) strategyCount++;
    if (main.length >= opts.targetItems) break;
  }

  // 4. Relleno con casi-vencidos de cajas 4–5 (reps extra inofensivas).
  if (main.length < opts.targetItems) {
    const included = new Set(main.map((s) => s.factId));
    const backfill = states
      .filter(
        (s) =>
          !reserved.has(s.factId) &&
          !included.has(s.factId) &&
          s.dueSession > now &&
          s.box >= 4 &&
          s.phase === 'retrieval',
      )
      .sort(
        (x, y) => x.dueSession - y.dueSession || tiebreak.get(x.factId)! - tiebreak.get(y.factId)!,
      );
    main.push(...backfill.slice(0, opts.targetItems - main.length));
  }

  // 5. Orden: primero el bloque de «trucos» (estrategia ya vista, ≤3) y
  //    después el flujo rápido (sondas + recuperación) — «primero pensamos,
  //    luego a toda velocidad». Cada bloque entrelazado sin operandos
  //    compartidos consecutivos.
  const isOpening = (s: FactState) => s.phase === 'strategy' && s.lastSeenSession >= 0;
  const opening = main.filter(isOpening).map((s) => s.factId);
  const flow = main.filter((s) => !isOpening(s)).map((s) => s.factId);
  const order = [
    ...interleave(rng.shuffle(opening), shareOperand),
    ...interleave(rng.shuffle(flow), shareOperand),
  ];

  return { main: order, winddown };
}

function correctStreak(state: FactState): number {
  let streak = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (!state.history[i]!.correct) break;
    streak++;
  }
  return streak;
}

/**
 * Construcción codiciosa: en cada paso toma el primer candidato del pool que
 * no choca con el último colocado; si todos chocan, el conflicto es
 * inevitable con este pool y se toma el primero.
 */
export function interleave<T>(items: T[], conflicts: (a: T, b: T) => boolean): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length > 0) {
    const last = out.at(-1);
    const idx = last === undefined ? 0 : pool.findIndex((c) => !conflicts(last, c));
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0]!);
  }
  return out;
}
