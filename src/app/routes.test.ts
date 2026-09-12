import { describe, expect, it } from 'vitest';
import { hashFor, parseHash } from './routes';

describe('parseHash', () => {
  it('vacío, #, #/ y basura van a home', () => {
    for (const h of ['', '#', '#/', '#/nada', '#/a/', '#loquesea']) {
      expect(parseHash(h)).toEqual({ scene: 'home' });
    }
  });

  it('#/a/<id> abre la actividad', () => {
    expect(parseHash('#/a/times-tables')).toEqual({ scene: 'activity', id: 'times-tables' });
  });

  it('#/cielo abre el cielo', () => {
    expect(parseHash('#/cielo')).toEqual({ scene: 'cielo' });
  });

  it('#/padres abre la página para padres', () => {
    expect(parseHash('#/padres')).toEqual({ scene: 'padres' });
  });

  it('hashFor y parseHash son inversos', () => {
    const routes = [
      { scene: 'home' },
      { scene: 'activity', id: 'times-tables' },
      { scene: 'cielo' },
      { scene: 'padres' },
    ] as const;
    for (const route of routes) {
      expect(parseHash(hashFor(route))).toEqual(route);
    }
  });
});
