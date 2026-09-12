import type { Rng } from '../../../lib/domain/rng';
import { getFact } from './facts';
import {
  STALLED_LINE,
  buildSessionSummary,
  correctFast,
  correctSlow,
  strategyDone,
  wrong,
  type FeedbackPlan,
} from './feedback';
import { classifyLatency } from './latency';
import {
  MIN_ANSWERS_TO_COUNT,
  applyOutcome,
  planSession,
  type PlanOptions,
  FULL_SESSION,
} from './scheduler';
import { buildStrategy } from './strategies';
import type { FactId, ItemResult, SessionItem, ShownAs, TablesDoc } from './types';

/**
 * Compositor de sesión: un reducer puro con lista de efectos.
 * `step(state, event) → { state, effects }`. Los timestamps ENTRAN por los
 * eventos — aquí no hay performance.now(), ni timers, ni DOM: 100% testeable.
 *
 * Decisiones clave (del diseño investigado):
 * - Sin evento TIMEOUT y sin reloj visible: el umbral de 6 s se clasifica
 *   al confirmar; el feedback diferencial ES el indicador de velocidad.
 * - Confirmación explícita con ✓ (el autoconfirmar filtra la longitud de
 *   la respuesta).
 * - El fallo se re-pregunta ~3 ítems después; la sesión SIEMPRE termina
 *   con el trío fácil reservado.
 */

export type ComposerEvent =
  | { type: 'RENDERED'; nowMs: number }
  | { type: 'DIGIT'; d: number; nowMs: number }
  | { type: 'BACKSPACE' }
  | { type: 'SUBMIT'; nowMs: number }
  | { type: 'FEEDBACK_DONE' }
  | { type: 'STALLED' }
  | { type: 'VISIBILITY_HIDDEN'; nowMs: number }
  | { type: 'VISIBILITY_VISIBLE'; nowMs: number }
  | { type: 'ABORT' };

/** No existe ningún efecto de sonido/háptica de error: no está en el tipo. */
export type Effect =
  | { type: 'speak'; text: string }
  | { type: 'sound'; id: 'ding' }
  | { type: 'haptic'; ms: 40 }
  | { type: 'celebrate'; durationMs: 280 }
  | { type: 'armSpeech' };

export type ComposerStatus = 'presenting' | 'awaitingInput' | 'entering' | 'feedback' | 'summary';

export interface ComposerState {
  status: ComposerStatus;
  doc: TablesDoc;
  session: number;
  startedAt: string;
  queue: SessionItem[];
  winddownIds: FactId[];
  inWinddown: boolean;
  current: SessionItem | null;
  stepIndex: number;
  input: string;
  presentedAt: number | null;
  firstDigitAt: number | null;
  latencyInvalid: boolean;
  hiddenAt: number | null;
  budgetMs: number;
  results: ItemResult[];
  promotions: FactId[];
  bigPromotions: FactId[];
  recovered: FactId[];
  armSpeechEmitted: boolean;
  winddownRetries: number;
  feedback: FeedbackPlan | null;
  aborted: boolean;
}

export interface StepResult {
  state: ComposerState;
  effects: Effect[];
}

export interface SessionOptions extends PlanOptions {
  budgetMs: number;
}

export const DEFAULT_SESSION: SessionOptions = { ...FULL_SESSION, budgetMs: 5 * 60 * 1000 };

const MAX_DIGITS = 3;
const REQUEUE_OFFSET = 3;
const MAX_WINDDOWN_RETRIES = 2;

function randomShownAs(rng: Rng): ShownAs {
  return rng.next() < 0.5 ? 'ab' : 'ba';
}

function makeItem(
  doc: TablesDoc,
  factId: FactId,
  rng: Rng,
  isWinddown: boolean,
  forceRetrieval = false,
): SessionItem {
  const fact = getFact(factId);
  const shownAs = randomShownAs(rng);
  const a = shownAs === 'ab' ? fact.a : fact.b;
  const b = shownAs === 'ab' ? fact.b : fact.a;
  const state = doc.facts[factId]!;
  // Estrategia solo para hechos YA VISTOS en fase estrategia. Un hecho nunca
  // visto se presenta como SONDA de recuperación (verificar antes de enseñar),
  // y una re-pregunta tras fallo es recuperación rápida (acaba de oírlo);
  // su tratamiento de estrategia llega en la apertura de la sesión siguiente.
  const wantsStrategy =
    !isWinddown && !forceRetrieval && state.phase === 'strategy' && state.lastSeenSession >= 0;
  if (wantsStrategy) {
    const strategy = buildStrategy(doc, factId);
    // La tarjeta muestra el hecho en la MISMA orientación que la derivación
    // («9 × 7» arriba si abajo se habla de 9 × 7) — nada de saltos de tema.
    return {
      kind: 'strategy',
      factId,
      a: strategy.display.a,
      b: strategy.display.b,
      strategyId: strategy.strategyId,
      steps: strategy.steps,
      closing: strategy.closing,
      expected: fact.a * fact.b,
      isWinddown: false,
    };
  }
  return { kind: 'retrieval', factId, a, b, expected: fact.a * fact.b, isWinddown };
}

export function startSession(
  doc: TablesDoc,
  rng: Rng,
  startedAt: string,
  opts: SessionOptions = DEFAULT_SESSION,
): StepResult {
  const plan = planSession(doc, rng, opts);
  const queue = plan.main.map((id) => makeItem(doc, id, rng, false));
  const state: ComposerState = {
    status: 'presenting',
    doc,
    session: doc.sessionCounter,
    startedAt,
    queue,
    winddownIds: plan.winddown,
    inWinddown: false,
    current: queue[0] ?? null,
    stepIndex: 0,
    input: '',
    presentedAt: null,
    firstDigitAt: null,
    latencyInvalid: false,
    hiddenAt: null,
    budgetMs: opts.budgetMs,
    results: [],
    promotions: [],
    bigPromotions: [],
    recovered: [],
    armSpeechEmitted: false,
    winddownRetries: 0,
    feedback: null,
    aborted: false,
  };
  if (state.current) state.queue = queue.slice(1);
  else return advanceToWinddownOrSummary({ ...state }, rng);
  return { state, effects: [] };
}

export function step(state: ComposerState, event: ComposerEvent, rng: Rng): StepResult {
  switch (event.type) {
    case 'RENDERED':
      return onRendered(state, event.nowMs);
    case 'DIGIT':
      return onDigit(state, event.d, event.nowMs);
    case 'BACKSPACE':
      return onBackspace(state);
    case 'SUBMIT':
      return onSubmit(state, event.nowMs, rng);
    case 'FEEDBACK_DONE':
      return onFeedbackDone(state, rng);
    case 'STALLED':
      return onStalled(state);
    case 'VISIBILITY_HIDDEN':
      return onHidden(state, event.nowMs);
    case 'VISIBILITY_VISIBLE':
      return onVisible(state, event.nowMs);
    case 'ABORT':
      return finalize({ ...state, aborted: true });
  }
}

function onRendered(state: ComposerState, nowMs: number): StepResult {
  if (state.status !== 'presenting') return { state, effects: [] };
  return {
    state: { ...state, status: 'awaitingInput', presentedAt: nowMs, firstDigitAt: null },
    effects: [],
  };
}

function onDigit(state: ComposerState, d: number, nowMs: number): StepResult {
  if (state.status !== 'awaitingInput' && state.status !== 'entering') {
    return { state, effects: [] };
  }
  const effects: Effect[] = [];
  let { armSpeechEmitted, firstDigitAt } = state;
  if (!armSpeechEmitted) {
    effects.push({ type: 'armSpeech' });
    armSpeechEmitted = true;
  }
  // Solo un dígito fija la latencia; el primero cuenta aunque luego lo borre.
  if (firstDigitAt === null) firstDigitAt = nowMs;
  const input = state.input.length < MAX_DIGITS ? state.input + String(d) : state.input;
  return {
    state: { ...state, status: 'entering', input, firstDigitAt, armSpeechEmitted },
    effects,
  };
}

function onBackspace(state: ComposerState): StepResult {
  if (state.status !== 'entering' || state.input.length === 0) return { state, effects: [] };
  return { state: { ...state, input: state.input.slice(0, -1) }, effects: [] };
}

function onSubmit(state: ComposerState, nowMs: number, rng: Rng): StepResult {
  if ((state.status !== 'entering' && state.status !== 'awaitingInput') || !state.current) {
    return { state, effects: [] };
  }
  if (state.input.length === 0) return { state, effects: [] };

  const item = state.current;
  const answer = Number(state.input);

  // Presupuesto: descuenta el tiempo activo de este ítem.
  const spent = state.presentedAt !== null ? Math.max(0, nowMs - state.presentedAt) : 0;
  const budgetMs = state.budgetMs - spent;

  if (item.kind === 'strategy') {
    return onSubmitStrategy(state, item, answer, budgetMs, rng);
  }
  return onSubmitRetrieval(state, item, answer, budgetMs, rng);
}

function onSubmitRetrieval(
  state: ComposerState,
  item: Extract<SessionItem, { kind: 'retrieval' }>,
  answer: number,
  budgetMs: number,
  rng: Rng,
): StepResult {
  const correct = answer === item.expected;
  const latency =
    state.latencyInvalid || state.firstDigitAt === null || state.presentedAt === null
      ? null
      : state.firstDigitAt - state.presentedAt;
  const speed = classifyLatency(latency, state.doc.speedThresholdMs);
  const fast = speed === 'invalid' ? null : speed === 'fast';
  const shownAs: ShownAs = item.a <= item.b ? 'ab' : 'ba';

  const prev = state.doc.facts[item.factId]!;
  const next = applyOutcome(prev, { kind: 'retrieval', correct, fast }, state.session, {
    firstDigitMs: latency,
    shownAs,
  });
  const doc: TablesDoc = { ...state.doc, facts: { ...state.doc.facts, [item.factId]: next } };

  const result: ItemResult = {
    factId: item.factId,
    mode: 'retrieval',
    correct,
    fast,
    firstDigitMs: latency,
  };

  const promotions = [...state.promotions];
  const bigPromotions = [...state.bigPromotions];
  const recovered = [...state.recovered];
  let queue = state.queue;
  const effects: Effect[] = [];
  let feedback: FeedbackPlan;

  if (correct && fast === true) {
    if (next.box > prev.box) {
      promotions.push(item.factId);
      if (next.box >= 4 && !bigPromotions.includes(item.factId)) bigPromotions.push(item.factId);
    }
    if (item.requeueOf && !recovered.includes(item.factId)) recovered.push(item.factId);
    effects.push(
      { type: 'sound', id: 'ding' },
      { type: 'haptic', ms: 40 },
      { type: 'celebrate', durationMs: 280 },
    );
    feedback = correctFast(item.factId, item.requeueOf !== undefined);
  } else if (correct) {
    if (item.requeueOf && !recovered.includes(item.factId)) recovered.push(item.factId);
    effects.push({ type: 'speak', text: 'Eso es.' });
    feedback = correctSlow();
  } else {
    feedback = wrong(item.factId);
    effects.push({ type: 'speak', text: feedback.spoken! });
    if (!item.isWinddown) {
      const requeued = makeItem(doc, item.factId, rng, false, true);
      const withTag = { ...requeued, requeueOf: item.factId } as SessionItem;
      const at = Math.min(REQUEUE_OFFSET, state.queue.length);
      queue = [...state.queue.slice(0, at), withTag, ...state.queue.slice(at)];
    }
  }

  return {
    state: {
      ...state,
      status: 'feedback',
      doc,
      queue,
      budgetMs,
      results: [...state.results, result],
      promotions,
      bigPromotions,
      recovered,
      feedback,
    },
    effects,
  };
}

function onSubmitStrategy(
  state: ComposerState,
  item: Extract<SessionItem, { kind: 'strategy' }>,
  answer: number,
  budgetMs: number,
  rng: Rng,
): StepResult {
  const stepDef = item.steps[state.stepIndex]!;
  const stepCorrect = answer === stepDef.expected;
  const isLastStep = state.stepIndex === item.steps.length - 1;

  if (stepCorrect && !isLastStep) {
    // Paso intermedio bien: siguiente paso, mismo ítem, sin registrar aún.
    return {
      state: {
        ...state,
        status: 'presenting',
        stepIndex: state.stepIndex + 1,
        input: '',
        budgetMs,
        presentedAt: null,
      },
      effects: [],
    };
  }

  const correct = stepCorrect; // último paso bien = ítem bien; cualquier paso mal = mal
  const shownAs: ShownAs = item.a <= item.b ? 'ab' : 'ba';
  const prev = state.doc.facts[item.factId]!;

  // Conversión por atasco: se registra como recuperación lenta-correcta
  // (nunca promociona); si falla los pasos, es un fallo de estrategia normal.
  const outcome =
    item.stalled && correct
      ? ({ kind: 'retrieval', correct: true, fast: false } as const)
      : ({ kind: 'strategy', correct } as const);

  const next = applyOutcome(prev, outcome, state.session, { firstDigitMs: null, shownAs });
  const doc: TablesDoc = { ...state.doc, facts: { ...state.doc.facts, [item.factId]: next } };

  const result: ItemResult = {
    factId: item.factId,
    mode: outcome.kind,
    correct,
    fast: outcome.kind === 'retrieval' ? false : null,
    firstDigitMs: null,
  };

  const promotions = [...state.promotions];
  const bigPromotions = [...state.bigPromotions];
  const recovered = [...state.recovered];
  let queue = state.queue;
  const effects: Effect[] = [];
  let feedback: FeedbackPlan;

  if (correct) {
    if (next.box > prev.box) promotions.push(item.factId);
    if (item.requeueOf && !recovered.includes(item.factId)) recovered.push(item.factId);
    effects.push({ type: 'celebrate', durationMs: 280 });
    feedback = strategyDone(item.closing);
  } else {
    feedback = wrong(item.factId);
    effects.push({ type: 'speak', text: feedback.spoken! });
    const requeued = makeItem(doc, item.factId, rng, false, true);
    const withTag = { ...requeued, requeueOf: item.factId } as SessionItem;
    const at = Math.min(REQUEUE_OFFSET, state.queue.length);
    queue = [...state.queue.slice(0, at), withTag, ...state.queue.slice(at)];
  }

  return {
    state: {
      ...state,
      status: 'feedback',
      doc,
      queue,
      budgetMs,
      results: [...state.results, result],
      promotions,
      bigPromotions,
      recovered,
      feedback,
    },
    effects,
  };
}

function onFeedbackDone(state: ComposerState, rng: Rng): StepResult {
  if (state.status !== 'feedback') return { state, effects: [] };

  // Fallo en el cierre: se re-presenta el MISMO ítem (acaba de oír la
  // respuesta; el acierto es casi seguro), máximo 2 veces.
  if (
    state.inWinddown &&
    state.feedback?.type === 'wrong' &&
    state.current &&
    state.winddownRetries < MAX_WINDDOWN_RETRIES
  ) {
    return {
      state: {
        ...state,
        status: 'presenting',
        input: '',
        stepIndex: 0,
        presentedAt: null,
        firstDigitAt: null,
        latencyInvalid: false,
        winddownRetries: state.winddownRetries + 1,
        feedback: null,
      },
      effects: [],
    };
  }

  return advance(state, rng);
}

function advance(state: ComposerState, rng: Rng): StepResult {
  const base = {
    ...state,
    input: '',
    stepIndex: 0,
    presentedAt: null,
    firstDigitAt: null,
    latencyInvalid: false,
    winddownRetries: 0,
    feedback: null,
  };

  if (!state.inWinddown && state.budgetMs > 0 && state.queue.length > 0) {
    const [nextItem, ...rest] = state.queue;
    return {
      state: { ...base, status: 'presenting', current: nextItem!, queue: rest },
      effects: [],
    };
  }

  return advanceToWinddownOrSummary(base, rng);
}

function advanceToWinddownOrSummary(state: ComposerState, rng: Rng): StepResult {
  if (state.winddownIds.length > 0) {
    const [nextId, ...restIds] = state.winddownIds;
    const item = makeItem(state.doc, nextId!, rng, true);
    return {
      state: {
        ...state,
        status: 'presenting',
        current: item,
        winddownIds: restIds,
        inWinddown: true,
        winddownRetries: 0,
      },
      effects: [],
    };
  }
  return finalize(state);
}

function finalize(state: ComposerState): StepResult {
  const counts = state.results.length >= MIN_ANSWERS_TO_COUNT;
  const summary = buildSessionSummary(
    state.session,
    state.startedAt,
    state.results,
    state.promotions,
    state.bigPromotions,
    state.recovered,
  );
  const doc: TablesDoc = {
    ...state.doc,
    sessionCounter: counts ? state.doc.sessionCounter + 1 : state.doc.sessionCounter,
    recentSessions:
      state.results.length > 0
        ? [...state.doc.recentSessions, summary].slice(-10)
        : state.doc.recentSessions,
  };
  return {
    state: { ...state, status: 'summary', doc, current: null, feedback: null },
    effects: [],
  };
}

function onStalled(state: ComposerState): StepResult {
  // Solo convierte una recuperación sin primer dígito aún: atascarse no es fallar.
  if (
    state.status !== 'awaitingInput' ||
    !state.current ||
    state.current.kind !== 'retrieval' ||
    state.firstDigitAt !== null
  ) {
    return { state, effects: [] };
  }
  const item = state.current;
  const strategy = buildStrategy(state.doc, item.factId);
  const converted: SessionItem = {
    kind: 'strategy',
    factId: item.factId,
    a: strategy.display.a,
    b: strategy.display.b,
    strategyId: strategy.strategyId,
    steps: strategy.steps,
    closing: strategy.closing,
    expected: item.expected,
    isWinddown: false,
    requeueOf: item.requeueOf,
    stalled: true,
  };
  return {
    state: {
      ...state,
      status: 'presenting',
      current: converted,
      stepIndex: 0,
      input: '',
      presentedAt: null,
      firstDigitAt: null,
    },
    effects: [{ type: 'speak', text: STALLED_LINE }],
  };
}

function onHidden(state: ComposerState, nowMs: number): StepResult {
  if (state.status === 'awaitingInput' || state.status === 'entering') {
    // La medición del ítem actual ya no vale; el presupuesto se pausa.
    return {
      state: { ...state, latencyInvalid: true, hiddenAt: nowMs },
      effects: [],
    };
  }
  return { state: { ...state, hiddenAt: nowMs }, effects: [] };
}

function onVisible(state: ComposerState, nowMs: number): StepResult {
  if (state.hiddenAt === null) return { state, effects: [] };
  // Neutraliza el tiempo oculto desplazando el ancla del ítem actual.
  const presentedAt =
    state.presentedAt !== null ? state.presentedAt + (nowMs - state.hiddenAt) : null;
  return { state: { ...state, presentedAt, hiddenAt: null }, effects: [] };
}
