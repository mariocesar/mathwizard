import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '../../../lib/domain/rng';
import {
  DEFAULT_SESSION,
  startSession,
  step,
  type ComposerState,
  type Effect,
  type SessionOptions,
} from './composer';
import { initDoc } from './scheduler';
import type { FactId, SessionItem, TablesDoc } from './types';

const ISO = '2026-09-12T10:00:00.000Z';

/** Conductor de sesiones para las pruebas: avanza el reloj y despacha eventos. */
class Driver {
  state: ComposerState;
  allEffects: Effect[] = [];
  now = 1000;
  rng: Rng;

  constructor(doc: TablesDoc, seed = 1, opts: SessionOptions = DEFAULT_SESSION) {
    this.rng = createRng(seed);
    const { state, effects } = startSession(doc, this.rng, ISO, opts);
    this.state = state;
    this.allEffects.push(...effects);
  }

  do(event: Parameters<typeof step>[1]): Effect[] {
    const { state, effects } = step(this.state, event, this.rng);
    this.state = state;
    this.allEffects.push(...effects);
    return effects;
  }

  /** Presenta el ítem/paso actual (RENDERED tras el pintado). */
  present(): void {
    if (this.state.status === 'presenting') {
      this.now += 300;
      this.do({ type: 'RENDERED', nowMs: this.now });
    }
  }

  /** Teclea un número y confirma. Devuelve los efectos del SUBMIT. */
  type(value: number, { latencyMs = 1000 }: { latencyMs?: number } = {}): Effect[] {
    this.present();
    const digits = String(value).split('').map(Number);
    this.now += latencyMs;
    for (const [i, d] of digits.entries()) {
      this.do({ type: 'DIGIT', d, nowMs: this.now + i * 150 });
    }
    this.now += digits.length * 150;
    return this.do({ type: 'SUBMIT', nowMs: this.now });
  }

  /** Responde el paso actual (bien o mal, rápido o lento). */
  answer({
    correct = true,
    latencyMs = 1000,
  }: { correct?: boolean; latencyMs?: number } = {}): Effect[] {
    const expected = this.currentExpected();
    return this.type(correct ? expected : expected + 1, { latencyMs });
  }

  currentExpected(): number {
    const item = this.state.current!;
    if (item.kind === 'strategy') return item.steps[this.state.stepIndex]!.expected;
    return item.expected;
  }

  finishFeedback(): void {
    if (this.state.status === 'feedback') this.do({ type: 'FEEDBACK_DONE' });
  }

  /** Completa el ítem actual entero (todos los pasos si es estrategia). */
  completeItem({ correct = true, latencyMs = 1000 } = {}): Effect[] {
    let effects: Effect[] = [];
    const item = this.state.current!;
    if (item.kind === 'strategy' && correct) {
      while (this.state.status !== 'feedback' && this.state.status !== 'summary') {
        effects = this.answer({ correct: true, latencyMs });
      }
    } else {
      effects = this.answer({ correct, latencyMs });
    }
    return effects;
  }
}

function firstRetrievalDriver(seed = 1): Driver {
  // Avanza el doc para que existan ítems de recuperación en el bloque principal.
  const doc = initDoc();
  for (const id of ['3x4', '6x7'] as FactId[]) {
    doc.facts[id]!.box = 3;
    doc.facts[id]!.phase = 'retrieval';
    doc.facts[id]!.lastSeenSession = 0;
    doc.facts[id]!.dueSession = 0;
  }
  return new Driver(doc, seed);
}

describe('composer — flujo básico', () => {
  it('arranca presentando el primer ítem del plan', () => {
    const d = new Driver(initDoc());
    expect(d.state.status).toBe('presenting');
    expect(d.state.current).not.toBeNull();
  });

  it('bien y rápido: ding + háptica + celebración ≤300 ms', () => {
    const d = new Driver(initDoc());
    // Busca un ítem de recuperación (los sembrados vencidos de la sesión 0).
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const effects = d.answer({ correct: true, latencyMs: 800 });
    const types = effects.map((e) => e.type).sort();
    expect(types).toContain('sound');
    expect(types).toContain('haptic');
    const celebrate = effects.find((e) => e.type === 'celebrate');
    expect(celebrate).toBeDefined();
    expect((celebrate as { durationMs: number }).durationMs).toBeLessThanOrEqual(300);
  });

  it('bien pero lento: SOLO «Eso es.» — sin celebración, sin promoción', () => {
    const d = new Driver(initDoc());
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const factId = d.state.current!.factId;
    const boxBefore = d.state.doc.facts[factId]!.box;
    const effects = d.answer({ correct: true, latencyMs: 8000 });
    expect(effects).toEqual([{ type: 'speak', text: 'Eso es.' }]);
    expect(d.state.doc.facts[factId]!.box).toBe(boxBefore);
  });

  it('mal: exactamente UN efecto — la voz con el hecho en palabras. Nada más.', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const effects = d.answer({ correct: false });
    expect(effects).toHaveLength(1);
    expect(effects[0]!.type).toBe('speak');
    expect((effects[0] as { text: string }).text).toMatch(/por .*, /);
    // Y en pantalla, línea neutra que enseña el hecho:
    expect(d.state.feedback!.type).toBe('wrong');
  });

  it('armSpeech se emite exactamente una vez: en el primer dígito de la sesión', () => {
    const d = new Driver(initDoc());
    d.completeItem();
    d.finishFeedback();
    d.completeItem();
    const armCount = d.allEffects.filter((e) => e.type === 'armSpeech').length;
    expect(armCount).toBe(1);
    expect(d.allEffects[0]!.type).toBe('armSpeech');
  });
});

describe('composer — re-encolado y recuperación', () => {
  it('un fallo se re-pregunta 3 ítems después, marcado como requeue', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const failedId = d.state.current!.factId;
    d.answer({ correct: false });
    d.finishFeedback();

    const upcoming: SessionItem[] = [d.state.current!, ...d.state.queue];
    const reappearance = upcoming.findIndex((i) => i.factId === failedId);
    expect(reappearance).toBe(3);
    expect(upcoming[reappearance]!.requeueOf).toBe(failedId);
  });

  it('el re-encolado es recuperación rápida, no estrategia (acaba de oírlo)', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const failedId = d.state.current!.factId;
    d.answer({ correct: false });
    d.finishFeedback();
    const upcoming: SessionItem[] = [d.state.current!, ...d.state.queue];
    const requeued = upcoming.find((i) => i.requeueOf === failedId)!;
    expect(requeued.kind).toBe('retrieval');
  });

  it('acertar el re-encolado lo registra como recuperado', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const failedId = d.state.current!.factId;
    d.answer({ correct: false });
    d.finishFeedback();
    // Avanza hasta el re-encolado:
    while (d.state.current!.factId !== failedId) {
      d.completeItem();
      d.finishFeedback();
    }
    d.completeItem({ correct: true });
    expect(d.state.recovered).toContain(failedId);
  });
});

describe('composer — atasco (STALLED)', () => {
  it('convierte a estrategia sin contar como fallo y sin promocionar', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const factId = d.state.current!.factId;
    const boxBefore = d.state.doc.facts[factId]!.box;
    d.present();
    const effects = d.do({ type: 'STALLED' });
    expect(effects).toEqual([{ type: 'speak', text: 'Vamos a pensarlo juntos.' }]);
    expect(d.state.current!.kind).toBe('strategy');

    d.completeItem({ correct: true });
    expect(d.state.doc.facts[factId]!.box).toBeLessThanOrEqual(boxBefore);
    const lastResult = d.state.results.at(-1)!;
    expect(lastResult.correct).toBe(true);
  });

  it('con un dígito ya tecleado, STALLED no hace nada', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    d.present();
    d.do({ type: 'DIGIT', d: 5, nowMs: d.now + 100 });
    const before = d.state.current;
    d.do({ type: 'STALLED' });
    expect(d.state.current).toBe(before);
  });
});

describe('composer — visibilidad y presupuesto', () => {
  it('ocultar la app invalida la latencia del ítem actual (sin mover la caja)', () => {
    const d = firstRetrievalDriver();
    while (d.state.current && d.state.current.kind !== 'retrieval') {
      d.completeItem();
      d.finishFeedback();
    }
    const factId = d.state.current!.factId;
    const before = d.state.doc.facts[factId]!;
    d.present();
    d.do({ type: 'VISIBILITY_HIDDEN', nowMs: d.now + 100 });
    d.do({ type: 'VISIBILITY_VISIBLE', nowMs: d.now + 60_000 });
    d.answer({ correct: true, latencyMs: 500 });
    const result = d.state.results.at(-1)!;
    expect(result.fast).toBeNull();
    expect(result.firstDigitMs).toBeNull();
    const after = d.state.doc.facts[factId]!;
    expect(after.box).toBe(before.box);
    expect(after.phase).toBe(before.phase);
  });

  it('el tiempo oculto no consume presupuesto', () => {
    const d = firstRetrievalDriver();
    d.present();
    const budgetBefore = d.state.budgetMs;
    d.do({ type: 'VISIBILITY_HIDDEN', nowMs: d.now });
    d.do({ type: 'VISIBILITY_VISIBLE', nowMs: d.now + 10 * 60 * 1000 });
    d.completeItem({ correct: true, latencyMs: 1000 });
    // Consumido ≈ latencia + tecleo, jamás los 10 minutos ocultos:
    expect(budgetBefore - d.state.budgetMs).toBeLessThan(30_000);
  });

  it('agotado el presupuesto pasa al cierre, y el cierre siempre corre', () => {
    const doc = initDoc();
    const d = new Driver(doc, 3, { ...DEFAULT_SESSION, budgetMs: 1 });
    d.completeItem();
    d.finishFeedback();
    // Con presupuesto agotado, lo siguiente es el trío del cierre:
    expect(d.state.inWinddown).toBe(true);
  });
});

describe('composer — cierre y resumen', () => {
  function runFullSession(d: Driver, answerAll: (d: Driver) => void): void {
    let guard = 0;
    while (d.state.status !== 'summary' && guard++ < 500) {
      answerAll(d);
      d.finishFeedback();
    }
    expect(guard).toBeLessThan(500);
  }

  it('la sesión termina con el trío fácil y la última respuesta es correcta', () => {
    const d = new Driver(initDoc(), 5);
    runFullSession(d, (drv) => drv.completeItem({ correct: true, latencyMs: 900 }));
    expect(d.state.status).toBe('summary');
    expect(d.state.results.length).toBeGreaterThanOrEqual(3);
    expect(d.state.results.at(-1)!.correct).toBe(true);
  });

  it('fallo en el cierre: se re-presenta el mismo ítem y se acaba en acierto', () => {
    const doc = initDoc();
    const d = new Driver(doc, 5, { ...DEFAULT_SESSION, budgetMs: 1 });
    // Primer ítem consume el presupuesto → cierre.
    d.completeItem({ correct: true, latencyMs: 900 });
    d.finishFeedback();
    expect(d.state.inWinddown).toBe(true);

    // Falla el primer ítem del cierre:
    const failedId = d.state.current!.factId;
    d.answer({ correct: false });
    d.finishFeedback();
    // Debe re-presentar el MISMO hecho:
    expect(d.state.current!.factId).toBe(failedId);
    // Ahora bien, y el resto del trío:
    let guard = 0;
    while (d.state.status !== 'summary' && guard++ < 20) {
      d.completeItem({ correct: true, latencyMs: 900 });
      d.finishFeedback();
    }
    expect(d.state.status).toBe('summary');
    expect(d.state.results.at(-1)!.correct).toBe(true);
  });

  it('un bot que machaca respuestas mal TERMINA igualmente (sin bucles infinitos)', () => {
    const doc = initDoc();
    const d = new Driver(doc, 9, { ...DEFAULT_SESSION, budgetMs: 60_000 });
    let guard = 0;
    while (d.state.status !== 'summary' && guard++ < 2000) {
      d.answer({ correct: false, latencyMs: 500 });
      d.finishFeedback();
    }
    expect(d.state.status).toBe('summary');
  });

  it('el contador de sesiones solo sube con ≥5 respuestas', () => {
    const doc = initDoc();
    const d1 = new Driver(structuredClone(doc), 1);
    d1.completeItem();
    d1.do({ type: 'ABORT' });
    expect(d1.state.doc.sessionCounter).toBe(0);

    const d2 = new Driver(structuredClone(doc), 1);
    for (let i = 0; i < 6; i++) {
      d2.completeItem({ correct: true, latencyMs: 900 });
      d2.finishFeedback();
    }
    d2.do({ type: 'ABORT' });
    expect(d2.state.doc.sessionCounter).toBe(1);
  });

  it('el resumen nombra progreso concreto', () => {
    const d = new Driver(initDoc(), 5);
    let guard = 0;
    while (d.state.status !== 'summary' && guard++ < 500) {
      d.completeItem({ correct: true, latencyMs: 900 });
      d.finishFeedback();
    }
    const last = d.state.doc.recentSessions.at(-1)!;
    expect(last.summaryLine.length).toBeGreaterThan(0);
    expect(last.summaryLine).not.toMatch(/listo|inteligente|genial/i);
  });
});

describe('composer — fuzz de 500 sesiones (bot honesto)', () => {
  it('toda sesión termina, y termina en acierto; el estado nunca se corrompe', () => {
    let doc = initDoc();
    for (let s = 0; s < 500; s++) {
      const rng = createRng(1000 + s);
      const d = new Driver(doc, 1000 + s, { ...DEFAULT_SESSION, budgetMs: 90_000 });
      let guard = 0;
      while (d.state.status !== 'summary' && guard++ < 1000) {
        const inWinddownRetry = d.state.winddownRetries > 0;
        // Bot honesto con destreza por caja: cuanto más alta la caja, más
        // acierta y más rápido va (modela el aprendizaje real; un bot plano
        // del 70% no puede escalar un Leitner con reset a caja 1).
        const box = d.state.doc.facts[d.state.current!.factId]!.box;
        const isStrategy = d.state.current!.kind === 'strategy';
        const pCorrect = Math.min(1, 0.55 + box * 0.1 + (isStrategy ? 0.15 : 0));
        const correct = inWinddownRetry ? true : rng.next() < pCorrect;
        const pFast = Math.min(1, 0.3 + box * 0.14);
        const latencyMs = rng.next() < pFast ? 800 : 8000;
        d.completeItem({ correct, latencyMs });
        d.finishFeedback();
      }
      expect(guard).toBeLessThan(1000);
      expect(d.state.status).toBe('summary');
      if (d.state.results.length > 0) {
        expect(d.state.results.at(-1)!.correct).toBe(true);
      }
      // Invariantes del doc tras cada sesión:
      for (const fs of Object.values(d.state.doc.facts)) {
        expect(fs.box).toBeGreaterThanOrEqual(1);
        expect(fs.box).toBeLessThanOrEqual(5);
        expect(fs.history.length).toBeLessThanOrEqual(20);
        if (fs.box <= 2 && fs.lastSeenSession >= 0) {
          // Regla de integración: caja baja ⇒ próxima presentación en estrategia
          // (salvo sembrados intactos que nunca han fallado).
          if (fs.history.some((a) => !a.correct)) {
            expect(fs.phase).toBe('strategy');
          }
        }
      }
      doc = d.state.doc;
    }
    // Con 500 sesiones de un bot 70% acertando, el progreso REAL sube:
    const golds = Object.values(doc.facts).filter((f) => f.box === 5).length;
    expect(golds).toBeGreaterThan(20);
  }, 30_000);
});
