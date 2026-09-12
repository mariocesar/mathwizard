import { describe, expect, it } from 'vitest';
import { FACTS } from '../../../lib/domain/facts';
import { initDoc } from './scheduler';
import { buildStrategy } from './strategies';

describe('buildStrategy', () => {
  const doc = initDoc();

  it('toda plantilla es aritméticamente consistente para TODOS los hechos', () => {
    for (const fact of FACTS) {
      const built = buildStrategy(doc, fact.id);
      expect(built.steps.length).toBeGreaterThanOrEqual(1);
      expect(built.steps.length).toBeLessThanOrEqual(2);
      // El último paso responde el producto del hecho:
      expect(built.steps.at(-1)!.expected).toBe(fact.a * fact.b);
      // Prompts en español con números concretos, nunca placeholders:
      for (const step of built.steps) {
        expect(step.prompt).toMatch(/\d/);
        expect(step.prompt).not.toMatch(/[{}]/);
      }
      expect(built.closing).toContain(`= ${fact.a * fact.b}`);
    }
  });

  it('el primer paso SIEMPRE nombra el hecho original en la orientación mostrada', () => {
    // Regla anti-confusión: nunca «7 × 9» arriba y «¿cuánto es 10 × 7?» a
    // secas abajo — el paso 1 explica el rodeo nombrando el hecho.
    for (const fact of FACTS) {
      const built = buildStrategy(doc, fact.id);
      expect(built.steps[0]!.prompt).toContain(`${built.display.a} × ${built.display.b}`);
      // La orientación mostrada es una permutación del hecho canónico:
      expect([built.display.a, built.display.b].sort((x, y) => x - y)).toEqual([fact.a, fact.b]);
    }
  });

  it('prefiere anclas ya sólidas: 7×8 usa 5×+2× (sembradas), no doble de 4×8 (caja 1)', () => {
    expect(buildStrategy(doc, '7x8').strategyId).toBe('cincoMasDos');
  });

  it('9×n siempre puede anclarse en la tabla del 10', () => {
    expect(buildStrategy(doc, '9x9').strategyId).toBe('diezMenos');
    expect(buildStrategy(doc, '6x9').strategyId).toBe('diezMenos');
  });

  it('la selección evoluciona: 6×8 cambia a doble-de-4 cuando 4×6 se vuelve sólido', () => {
    // Recién sembrado: ninguna ancla sólida → prioridad fija (dobleDe3 > dobleDe4).
    expect(buildStrategy(doc, '6x8').strategyId).toBe('dobleDe3');

    const advanced = structuredClone(doc);
    advanced.facts['4x6']!.box = 4;
    // 4×6 sólido hace sólida la derivación doble-de-4×6 para el 8:
    expect(buildStrategy(advanced, '6x8').strategyId).toBe('dobleDe4');
  });

  it('hechos sin plantilla (solo tocan 1/2/5/10) caen al modo «despacio»', () => {
    const built = buildStrategy(doc, '2x5');
    expect(built.strategyId).toBe('despacio');
    expect(built.steps).toHaveLength(1);
    expect(built.steps[0]!.expected).toBe(10);
  });

  it('el paso 2 del 7×n declara 2×n y pide solo la suma', () => {
    const built = buildStrategy(doc, '7x8');
    expect(built.steps[0]!.prompt).toContain('5 × 8');
    expect(built.steps[0]!.expected).toBe(40);
    expect(built.steps[1]!.prompt).toContain('16');
    expect(built.steps[1]!.expected).toBe(56);
  });
});
