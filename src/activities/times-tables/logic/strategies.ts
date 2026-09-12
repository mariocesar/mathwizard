import { canonicalId, getFact } from './facts';
import type { FactId, FactState, StrategyId, StrategyStep, TablesDoc } from './types';

/**
 * Las 6 derivaciones del temario de 3.º, como datos. Exactamente 1–2 pasos,
 * en español, con los números concretos calculados al construir.
 *
 * Regla de claridad (salió de probarlo con un niño): el PRIMER paso siempre
 * nombra el hecho original y el porqué del rodeo — «9 × 7 es 10 × 7 menos
 * un 7» — nunca una pregunta suelta que parezca cambiar de tema. Y la
 * tarjeta del hecho se muestra en la MISMA orientación que usa la
 * derivación (`display`), para que arriba y abajo hablen del mismo número.
 */
interface StrategyTemplate {
  id: StrategyId;
  /** Operando que la dispara. */
  appliesTo: number;
  /** Hechos ancla de los que depende la derivación. */
  anchors: (n: number) => FactId[];
  build: (n: number) => { steps: StrategyStep[]; closing: string };
}

const closingFor = (a: number, b: number) => `Así que ${a} × ${b} = ${a * b}.`;

const TEMPLATES: StrategyTemplate[] = [
  {
    id: 'diezMenos',
    appliesTo: 9,
    anchors: (n) => [canonicalId(10, n)],
    build: (n) => ({
      steps: [
        {
          prompt: `9 × ${n} es 10 × ${n} menos un ${n}. Primero: ¿cuánto es 10 × ${n}?`,
          expected: 10 * n,
        },
        { prompt: `Y ahora un ${n} menos: ¿${10 * n} − ${n}?`, expected: 9 * n },
      ],
      closing: closingFor(9, n),
    }),
  },
  {
    id: 'dobleDe2',
    appliesTo: 4,
    anchors: (n) => [canonicalId(2, n)],
    build: (n) => ({
      steps: [
        { prompt: `4 × ${n} es el doble de 2 × ${n}. ¿Cuánto es 2 × ${n}?`, expected: 2 * n },
        { prompt: `¿Y el doble de ${2 * n}?`, expected: 4 * n },
      ],
      closing: closingFor(4, n),
    }),
  },
  {
    id: 'dosMasUno',
    appliesTo: 3,
    anchors: (n) => [canonicalId(2, n)],
    build: (n) => ({
      steps: [
        {
          prompt: `3 × ${n} es 2 × ${n} y un ${n} más. Primero: ¿cuánto es 2 × ${n}?`,
          expected: 2 * n,
        },
        { prompt: `Y un ${n} más: ¿${2 * n} + ${n}?`, expected: 3 * n },
      ],
      closing: closingFor(3, n),
    }),
  },
  {
    id: 'cincoMasDos',
    appliesTo: 7,
    anchors: (n) => [canonicalId(5, n), canonicalId(2, n)],
    build: (n) => ({
      steps: [
        {
          prompt: `7 × ${n} se parte en 5 × ${n} y 2 × ${n}. Primero: ¿cuánto es 5 × ${n}?`,
          expected: 5 * n,
        },
        { prompt: `Y 2 × ${n} son ${2 * n}. ¿Cuánto es ${5 * n} + ${2 * n}?`, expected: 7 * n },
      ],
      closing: closingFor(7, n),
    }),
  },
  {
    id: 'dobleDe3',
    appliesTo: 6,
    anchors: (n) => [canonicalId(3, n)],
    build: (n) => ({
      steps: [
        { prompt: `6 × ${n} es el doble de 3 × ${n}. ¿Cuánto es 3 × ${n}?`, expected: 3 * n },
        { prompt: `¿Y el doble de ${3 * n}?`, expected: 6 * n },
      ],
      closing: closingFor(6, n),
    }),
  },
  {
    id: 'dobleDe4',
    appliesTo: 8,
    anchors: (n) => [canonicalId(4, n)],
    build: (n) => ({
      steps: [
        { prompt: `8 × ${n} es el doble de 4 × ${n}. ¿Cuánto es 4 × ${n}?`, expected: 4 * n },
        { prompt: `¿Y el doble de ${4 * n}?`, expected: 8 * n },
      ],
      closing: closingFor(8, n),
    }),
  },
];

/** Prioridad fija: anclas en tablas sabidas (10, 2, 5) antes que en tablas del curso. */
const PRIORITY: StrategyId[] = [
  'diezMenos',
  'dobleDe2',
  'dosMasUno',
  'cincoMasDos',
  'dobleDe3',
  'dobleDe4',
];

function isSolid(doc: TablesDoc, id: FactId): boolean {
  const state: FactState | undefined = doc.facts[id];
  if (!state) return false;
  return state.box >= 3 || getFact(id).kind === 'seeded';
}

export interface BuiltStrategy {
  strategyId: StrategyId;
  steps: StrategyStep[];
  closing: string;
  /**
   * Orientación de presentación del hecho, la misma que usan los prompts:
   * la tarjeta de arriba y la derivación de abajo hablan del mismo número.
   */
  display: { a: number; b: number };
}

/**
 * Elige la derivación para un hecho según lo que el niño YA tiene sólido:
 * candidatas cuyas anclas están en caja ≥3 o sembradas; si ninguna, la de
 * mayor prioridad. Hechos sin plantilla (solo tocan 1/2/5/10): fallback
 * «despacio» — una sola pregunta sin reloj.
 */
export function buildStrategy(doc: TablesDoc, factId: FactId): BuiltStrategy {
  const { a, b } = getFact(factId);

  const candidates: { template: StrategyTemplate; n: number }[] = [];
  for (const template of TEMPLATES) {
    if (template.appliesTo === a) candidates.push({ template, n: b });
    if (template.appliesTo === b && a !== b) candidates.push({ template, n: a });
  }

  if (candidates.length === 0) {
    return {
      strategyId: 'despacio',
      steps: [{ prompt: `Vamos despacio: ¿cuánto es ${a} × ${b}?`, expected: a * b }],
      closing: closingFor(a, b),
      display: { a, b },
    };
  }

  const byPriority = (x: { template: StrategyTemplate }, y: { template: StrategyTemplate }) =>
    PRIORITY.indexOf(x.template.id) - PRIORITY.indexOf(y.template.id);

  const solid = candidates
    .filter((c) => c.template.anchors(c.n).every((anchor) => isSolid(doc, anchor)))
    .sort(byPriority);

  const chosen = solid[0] ?? [...candidates].sort(byPriority)[0]!;
  const { steps, closing } = chosen.template.build(chosen.n);
  return {
    strategyId: chosen.template.id,
    steps,
    closing,
    display: { a: chosen.template.appliesTo, b: chosen.n },
  };
}
