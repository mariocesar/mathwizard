import { describe, expect, it } from 'vitest';
import { createRng } from '../../../lib/domain/rng';
import { getFact, shareOperand } from './facts';
import {
  FULL_SESSION,
  INTERVALS,
  applyOutcome,
  initDoc,
  interleave,
  planSession,
  type Outcome,
} from './scheduler';
import type { Box, FactState } from './types';

const info = { firstDigitMs: 1000, shownAs: 'ab' as const };

function stateAt(
  box: Box,
  phase: 'strategy' | 'retrieval',
  extra: Partial<FactState> = {},
): FactState {
  return {
    factId: '7x8',
    box,
    phase,
    lastSeenSession: 0,
    dueSession: 0,
    slowStreak: 0,
    history: [],
    ...extra,
  };
}

describe('initDoc', () => {
  const doc = initDoc();
  const states = Object.values(doc.facts);

  it('siembra 55 hechos: 21 objetivos en caja 1/estrategia, 34 sabidos en caja 5', () => {
    expect(states).toHaveLength(55);
    const targets = states.filter((s) => getFact(s.factId).kind !== 'seeded');
    const seeded = states.filter((s) => getFact(s.factId).kind === 'seeded');
    expect(targets).toHaveLength(21);
    expect(seeded).toHaveLength(34);
    for (const t of targets) {
      expect(t.box).toBe(1);
      expect(t.phase).toBe('strategy');
      expect(t.dueSession).toBe(0);
    }
    for (const s of seeded) {
      expect(s.box).toBe(5);
      expect(s.phase).toBe('retrieval');
    }
  });

  it('escalona los sembrados entre las sesiones 0–7', () => {
    const dues = new Set(
      states.filter((s) => getFact(s.factId).kind === 'seeded').map((s) => s.dueSession),
    );
    expect([...dues].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('applyOutcome — invariantes', () => {
  it('PROPIEDAD: mal nunca sube de caja, en ningún modo, desde ninguna caja', () => {
    for (const box of [1, 2, 3, 4, 5] as const) {
      for (const phase of ['strategy', 'retrieval'] as const) {
        for (const outcome of [
          { kind: 'strategy', correct: false },
          { kind: 'retrieval', correct: false, fast: true },
          { kind: 'retrieval', correct: false, fast: false },
          { kind: 'retrieval', correct: false, fast: null },
        ] satisfies Outcome[]) {
          const next = applyOutcome(stateAt(box, phase), outcome, 3, info);
          expect(next.box).toBeLessThanOrEqual(box);
        }
      }
    }
  });

  it('PROPIEDAD: lento nunca sube de caja', () => {
    for (const box of [1, 2, 3, 4, 5] as const) {
      const next = applyOutcome(
        stateAt(box, 'retrieval'),
        { kind: 'retrieval', correct: true, fast: false },
        3,
        info,
      );
      expect(next.box).toBeLessThanOrEqual(box);
    }
  });

  it('fallo en recuperación ⇒ caja 1 Y fase estrategia (regla Woodward)', () => {
    const next = applyOutcome(
      stateAt(4, 'retrieval'),
      { kind: 'retrieval', correct: false, fast: true },
      3,
      info,
    );
    expect(next.box).toBe(1);
    expect(next.phase).toBe('strategy');
  });

  it('bien y rápido sube exactamente una caja y satura en 5', () => {
    const from3 = applyOutcome(
      stateAt(3, 'retrieval'),
      { kind: 'retrieval', correct: true, fast: true },
      3,
      info,
    );
    expect(from3.box).toBe(4);
    const from5 = applyOutcome(
      stateAt(5, 'retrieval'),
      { kind: 'retrieval', correct: true, fast: true },
      3,
      info,
    );
    expect(from5.box).toBe(5);
  });

  it('bien-pero-lento: caja igual, vence la sesión siguiente, y a la segunda baja a 2/estrategia', () => {
    const first = applyOutcome(
      stateAt(4, 'retrieval'),
      { kind: 'retrieval', correct: true, fast: false },
      3,
      info,
    );
    expect(first.box).toBe(4);
    expect(first.slowStreak).toBe(1);
    expect(first.dueSession).toBe(4);

    const second = applyOutcome(
      { ...first, lastSeenSession: 4 },
      { kind: 'retrieval', correct: true, fast: false },
      4,
      info,
    );
    expect(second.box).toBe(2);
    expect(second.phase).toBe('strategy');
    expect(second.slowStreak).toBe(0);
  });

  it('una rápida resetea la racha de lentas', () => {
    const slow = applyOutcome(
      stateAt(4, 'retrieval'),
      { kind: 'retrieval', correct: true, fast: false },
      3,
      info,
    );
    const fast = applyOutcome(slow, { kind: 'retrieval', correct: true, fast: true }, 4, info);
    expect(fast.slowStreak).toBe(0);
    expect(fast.box).toBe(5);
  });

  it('latencia inválida no mueve nada: ni caja, ni fase, ni racha', () => {
    const before = stateAt(3, 'retrieval', { slowStreak: 1 });
    const next = applyOutcome(before, { kind: 'retrieval', correct: true, fast: null }, 3, {
      firstDigitMs: null,
      shownAs: 'ab',
    });
    expect(next.box).toBe(3);
    expect(next.phase).toBe('retrieval');
    expect(next.slowStreak).toBe(1);
    expect(next.dueSession).toBe(4);
  });

  it('estrategia bien: 1→2→3 y en 3 pasa a recuperación; nunca degrada desde caja alta', () => {
    let s = stateAt(1, 'strategy');
    s = applyOutcome(s, { kind: 'strategy', correct: true }, 1, info);
    expect(s.box).toBe(2);
    expect(s.phase).toBe('strategy');
    s = applyOutcome(s, { kind: 'strategy', correct: true }, 2, info);
    expect(s.box).toBe(3);
    expect(s.phase).toBe('retrieval');

    const high = applyOutcome(
      stateAt(4, 'retrieval'),
      { kind: 'strategy', correct: true },
      3,
      info,
    );
    expect(high.box).toBe(4);
  });

  it('estrategia mal: caja 1', () => {
    const next = applyOutcome(
      stateAt(2, 'strategy'),
      { kind: 'strategy', correct: false },
      3,
      info,
    );
    expect(next.box).toBe(1);
    expect(next.phase).toBe('strategy');
  });

  it('la historia se recorta a 20 intentos', () => {
    let s = stateAt(5, 'retrieval');
    for (let i = 0; i < 30; i++) {
      s = applyOutcome(s, { kind: 'retrieval', correct: true, fast: true }, i, info);
    }
    expect(s.history).toHaveLength(20);
  });

  it('los intervalos son {0,1,2,4,8}', () => {
    expect(INTERVALS).toEqual({ 1: 0, 2: 1, 3: 2, 4: 4, 5: 8 });
  });
});

describe('applyOutcome — sonda de primer encuentro', () => {
  // «Yo me sé la del 3, quiero practicar 8 y 9»: la app verifica, no supone.
  const fresh = (): FactState => stateAt(1, 'strategy', { lastSeenSession: -1 });

  it('rápida y bien ⇒ directo a caja 4 (casi sabido)', () => {
    const next = applyOutcome(fresh(), { kind: 'retrieval', correct: true, fast: true }, 0, info);
    expect(next.box).toBe(4);
    expect(next.phase).toBe('retrieval');
  });

  it('bien pero lenta ⇒ caja 3 (a consolidar en recuperación)', () => {
    const next = applyOutcome(fresh(), { kind: 'retrieval', correct: true, fast: false }, 0, info);
    expect(next.box).toBe(3);
    expect(next.phase).toBe('retrieval');
  });

  it('mal ⇒ caja 1 y estrategia, el camino normal', () => {
    const next = applyOutcome(fresh(), { kind: 'retrieval', correct: false, fast: true }, 0, info);
    expect(next.box).toBe(1);
    expect(next.phase).toBe('strategy');
  });

  it('un sembrado (caja 5) en su primer encuentro NO es sonda: rápida se queda en 5', () => {
    const seeded = stateAt(5, 'retrieval', { lastSeenSession: -1 });
    const next = applyOutcome(seeded, { kind: 'retrieval', correct: true, fast: true }, 0, info);
    expect(next.box).toBe(5);
  });

  it('un hecho YA VISTO no vuelve a sondear: rápida sube solo una caja', () => {
    const seen = stateAt(1, 'strategy', { lastSeenSession: 2 });
    const next = applyOutcome(seen, { kind: 'retrieval', correct: true, fast: true }, 3, info);
    expect(next.box).toBe(2);
  });
});

describe('planSession', () => {
  it('respeta los topes: ≤4 sondas nuevas y ≤3 ítems del bloque de pensar', () => {
    const doc = initDoc();
    const plan = planSession(doc, createRng(1), FULL_SESSION);
    const probes = plan.main.filter(
      (id) => doc.facts[id]!.lastSeenSession === -1 && getFact(id).kind !== 'seeded',
    );
    const opening = plan.main.filter(
      (id) => doc.facts[id]!.phase === 'strategy' && doc.facts[id]!.lastSeenSession >= 0,
    );
    expect(probes.length).toBeLessThanOrEqual(4);
    expect(opening.length).toBeLessThanOrEqual(3);
  });

  it('el bloque de pensar va SIEMPRE al principio de la sesión', () => {
    // «¿Puedo hacerlo después?» / «me gusta que piense»: primero pensamos
    // (poco), luego a toda velocidad — nunca interrumpe el flujo.
    const doc = initDoc();
    for (const id of ['3x4', '6x7', '7x8', '4x9'] as const) {
      doc.facts[id]!.lastSeenSession = 0;
      doc.facts[id]!.dueSession = 1;
      doc.facts[id]!.box = 1;
      doc.facts[id]!.phase = 'strategy';
    }
    doc.sessionCounter = 1;
    const plan = planSession(doc, createRng(3), FULL_SESSION);
    const isOpening = (id: (typeof plan.main)[number]) =>
      doc.facts[id]!.phase === 'strategy' && doc.facts[id]!.lastSeenSession >= 0;
    const lastOpening = plan.main.map(isOpening).lastIndexOf(true);
    const firstFlow = plan.main.map(isOpening).indexOf(false);
    if (lastOpening !== -1 && firstFlow !== -1) {
      expect(lastOpening).toBeLessThan(firstFlow);
    }
    expect(plan.main.filter(isOpening).length).toBeLessThanOrEqual(3);
  });

  it('reserva 3 hechos seguros para el cierre, fuera del bloque principal', () => {
    const doc = initDoc();
    const plan = planSession(doc, createRng(2), FULL_SESSION);
    expect(plan.winddown).toHaveLength(3);
    for (const id of plan.winddown) {
      expect(getFact(id).kind).toBe('seeded');
      expect(doc.facts[id]!.box).toBe(5);
      expect(plan.main).not.toContain(id);
    }
  });

  it('es determinista con la misma semilla', () => {
    const doc = initDoc();
    expect(planSession(doc, createRng(7), FULL_SESSION)).toEqual(
      planSession(doc, createRng(7), FULL_SESSION),
    );
  });

  it('no repite operandos consecutivos cuando es evitable', () => {
    const doc = initDoc();
    for (const seed of [1, 2, 3, 4, 5]) {
      const plan = planSession(doc, createRng(seed), FULL_SESSION);
      let violations = 0;
      for (let i = 1; i < plan.main.length; i++) {
        if (shareOperand(plan.main[i - 1]!, plan.main[i]!)) violations++;
      }
      // El pool de la sesión 0 es pequeño (~6 ítems que comparten 1/2/5/10),
      // así que algún choque puede ser inevitable; la garantía fuerte la dan
      // las pruebas unitarias de interleave() con pools construidos.
      expect(violations).toBeLessThanOrEqual(2);
    }
  });
});

describe('interleave', () => {
  it('repara conflictos evitables', () => {
    const out = interleave(['3x4', '3x7', '6x7', '8x9'], shareOperand);
    for (let i = 1; i < out.length; i++) {
      expect(shareOperand(out[i - 1]!, out[i]!)).toBe(false);
    }
  });

  it('no revienta con un pool donde el conflicto es inevitable', () => {
    const out = interleave(['3x4', '3x6', '3x7'], shareOperand);
    expect(out).toHaveLength(3);
    expect([...out].sort()).toEqual(['3x4', '3x6', '3x7']);
  });
});
