import { describe, expect, it } from 'vitest';
import { parseFactId, shareOperand } from '../../../lib/domain/facts';
import { createRng } from '../../../lib/domain/rng';
import { initDoc } from '../../times-tables/logic/scheduler';
import {
  GIRO_SESSION_ITEMS,
  completedFact,
  giroPool,
  giroSummaryLine,
  planGiro,
  startGiro,
  stepGiro,
  type GiroState,
} from './giro';

function pool() {
  // Doc recién sembrado: los 34 sabidos (caja 5) ya son giranles.
  return giroPool(initDoc());
}

function drive(state: GiroState, events: Parameters<typeof stepGiro>[1][], seed = 1) {
  const rng = createRng(seed);
  let s = state;
  const effects = [];
  for (const e of events) {
    const r = stepGiro(s, e, rng);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

function answer(state: GiroState, value: number, seed = 1) {
  const digits = String(value).split('').map(Number);
  return drive(
    state,
    [...digits.map((d) => ({ type: 'DIGIT' as const, d })), { type: 'SUBMIT' as const }],
    seed,
  );
}

describe('giroPool', () => {
  it('solo incluye hechos con caja ≥ 3 en Las tablas', () => {
    const doc = initDoc();
    doc.facts['7x8']!.box = 3;
    doc.facts['3x4']!.box = 2;
    const ids = giroPool(doc);
    expect(ids).toContain('7x8');
    expect(ids).not.toContain('3x4');
    expect(ids).toContain('2x5'); // sembrado, caja 5
  });
});

describe('planGiro', () => {
  it('produce 12 ítems aritméticamente consistentes', () => {
    const items = planGiro(pool(), createRng(3));
    expect(items).toHaveLength(GIRO_SESSION_ITEMS);
    for (const item of items) {
      expect(item.shown * item.expected).toBe(item.product);
      const { a, b } = parseFactId(item.factId);
      expect(a * b).toBe(item.product);
    }
  });

  it('mezcla huecos: a veces falta el primero, a veces el segundo', () => {
    const items = planGiro(pool(), createRng(5));
    const firsts = items.filter((i) => i.hiddenFirst).length;
    expect(firsts).toBeGreaterThan(0);
    expect(firsts).toBeLessThan(items.length);
  });

  it('no repite operandos consecutivos cuando es evitable', () => {
    for (const seed of [1, 2, 3]) {
      const items = planGiro(pool(), createRng(seed));
      let violations = 0;
      for (let i = 1; i < items.length; i++) {
        if (shareOperand(items[i - 1]!.factId, items[i]!.factId)) violations++;
      }
      expect(violations).toBeLessThanOrEqual(1);
    }
  });

  it('completedFact respeta la orientación presentada', () => {
    const item = {
      factId: '4x5' as const,
      shown: 5,
      hiddenFirst: true,
      product: 20,
      expected: 4,
    };
    expect(completedFact(item)).toBe('4 × 5 = 20');
  });
});

describe('stepGiro', () => {
  it('acierto: ding + celebración, sube la racha', () => {
    const s0 = startGiro(pool(), createRng(1));
    const { state, effects } = answer(s0, s0.current!.expected);
    expect(effects.map((e) => e.type).sort()).toEqual(['celebrate', 'haptic', 'sound']);
    expect(state.streak).toBe(1);
    expect(state.feedback!.correct).toBe(true);
  });

  it('fallo: SOLO la voz con el hecho completo; racha a cero; re-pregunta a +2', () => {
    const s0 = startGiro(pool(), createRng(2));
    const failedId = s0.current!.factId;
    const { state, effects } = answer(s0, s0.current!.expected + 1);
    expect(effects).toHaveLength(1);
    expect(effects[0]!.type).toBe('speak');
    expect(state.streak).toBe(0);

    const after = drive(state, [{ type: 'FEEDBACK_DONE' }]);
    const upcoming = [after.state.current!, ...after.state.queue];
    expect(upcoming[2]!.factId).toBe(failedId);
    expect(upcoming[2]!.requeueOf).toBe(failedId);
  });

  it('una re-pregunta fallada NO se vuelve a encolar (sin bucles)', () => {
    const s0 = startGiro(pool(), createRng(3));
    let s = s0;
    const rng = createRng(99);
    let guard = 0;
    while (s.status !== 'summary' && guard++ < 100) {
      if (s.status === 'entering') {
        const r = answer(s, s.current!.expected + 1, 99);
        s = r.state;
      } else {
        s = stepGiro(s, { type: 'FEEDBACK_DONE' }, rng).state;
      }
    }
    expect(s.status).toBe('summary');
    // 12 originales + 12 re-preguntas + 1 reintento final como máximo:
    expect(s.results.length).toBeLessThanOrEqual(GIRO_SESSION_ITEMS * 2 + 1);
  });

  it('el último ítem fallado se reintenta UNA vez para acabar en victoria', () => {
    const rng = createRng(4);
    const s0 = startGiro(pool(), rng);
    let s = s0;
    // Acierta todo menos el último:
    while (s.queue.length > 0 || s.status === 'feedback') {
      if (s.status === 'entering') {
        s = answer(s, s.current!.expected, 4).state;
      } else {
        s = stepGiro(s, { type: 'FEEDBACK_DONE' }, rng).state;
      }
    }
    // Estamos en el último ítem: fállalo.
    expect(s.status).toBe('entering');
    const last = s.current!;
    s = answer(s, last.expected + 1, 4).state;
    s = stepGiro(s, { type: 'FEEDBACK_DONE' }, rng).state;
    // Reintento del MISMO ítem:
    expect(s.status).toBe('entering');
    expect(s.current!.factId).toBe(last.factId);
    // Ahora bien → cierre en victoria:
    s = answer(s, s.current!.expected, 4).state;
    s = stepGiro(s, { type: 'FEEDBACK_DONE' }, rng).state;
    expect(s.status).toBe('summary');
    expect(s.results.at(-1)!.correct).toBe(true);
  });

  it('la racha máxima de la sesión queda registrada', () => {
    const rng = createRng(6);
    let s = startGiro(pool(), rng);
    for (let i = 0; i < 3; i++) {
      s = answer(s, s.current!.expected, 6).state;
      s = stepGiro(s, { type: 'FEEDBACK_DONE' }, rng).state;
    }
    s = answer(s, s.current!.expected + 1, 6).state;
    expect(s.bestStreak).toBe(3);
    expect(s.streak).toBe(0);
  });
});

describe('giroSummaryLine', () => {
  const base = (over: Partial<GiroState>): GiroState => ({
    status: 'summary',
    queue: [],
    current: null,
    input: '',
    results: [],
    streak: 0,
    bestStreak: 0,
    feedback: null,
    finalRetryUsed: false,
    ...over,
  });

  it('nombra el progreso, jamás al niño', () => {
    const lines = [
      giroSummaryLine(base({ bestStreak: 5 }), true),
      giroSummaryLine(base({ bestStreak: 4 }), false),
      giroSummaryLine(base({ results: [{ factId: '2x5', correct: true }] }), false),
      giroSummaryLine(base({}), false),
    ];
    for (const line of lines) {
      expect(line.length).toBeGreaterThan(0);
      expect(line).not.toMatch(/listo|inteligente|genial|campeón/i);
    }
    expect(lines[0]).toContain('Nueva mejor racha: 5');
  });
});
