import { describe, expect, it } from 'vitest';
import { loadSlice, saveSlice, type SliceSpec } from './migrate';
import { createMemoryStorage, type StorageLike } from './storage';

interface Doc {
  count: number;
  label?: string;
}

const NOW = '2026-09-12T10:00:00.000Z';

const specV2: SliceSpec<Doc> = {
  version: 2,
  initial: () => ({ count: 0, label: 'nuevo' }),
  migrate: (data, fromVersion) => {
    if (fromVersion === 1) {
      const old = data as { count: number };
      return { count: old.count, label: 'migrado' };
    }
    throw new Error(`versión desconocida: ${fromVersion}`);
  },
};

function quarantineKeys(all: string[]): string[] {
  return all.filter((k) => k.startsWith('mathwizard:quarantine:'));
}

function trackedMemory(): { storage: StorageLike; keys: () => string[] } {
  const map = new Map<string, string>();
  return {
    storage: {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
    },
    keys: () => [...map.keys()],
  };
}

describe('loadSlice / saveSlice', () => {
  it('devuelve initial() cuando no hay nada guardado', () => {
    const storage = createMemoryStorage();
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual({ count: 0, label: 'nuevo' });
  });

  it('hace round-trip con la misma versión', () => {
    const storage = createMemoryStorage();
    saveSlice(storage, 'k', specV2, { count: 7, label: 'siete' }, NOW);
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual({ count: 7, label: 'siete' });
  });

  it('cuarentena + initial() con JSON corrupto', () => {
    const { storage, keys } = trackedMemory();
    storage.setItem('k', '{esto no es json');
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual(specV2.initial());
    expect(quarantineKeys(keys())).toHaveLength(1);
  });

  it('cuarentena + initial() con un valor sin forma de sobre', () => {
    const { storage, keys } = trackedMemory();
    storage.setItem('k', JSON.stringify({ cualquier: 'cosa' }));
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual(specV2.initial());
    expect(quarantineKeys(keys())).toHaveLength(1);
  });

  it('migra desde una versión anterior y guarda el resultado', () => {
    const storage = createMemoryStorage();
    storage.setItem('k', JSON.stringify({ v: 1, savedAt: NOW, data: { count: 3 } }));
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual({ count: 3, label: 'migrado' });
    // El save-back deja el valor ya migrado:
    const stored = JSON.parse(storage.getItem('k')!);
    expect(stored.v).toBe(2);
    expect(stored.data).toEqual({ count: 3, label: 'migrado' });
  });

  it('cuarentena + initial() si migrate lanza', () => {
    const { storage, keys } = trackedMemory();
    storage.setItem('k', JSON.stringify({ v: 0, savedAt: NOW, data: {} }));
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual(specV2.initial());
    expect(quarantineKeys(keys())).toHaveLength(1);
  });

  it('cuarentena + initial() con una versión más nueva que el código', () => {
    const { storage, keys } = trackedMemory();
    storage.setItem('k', JSON.stringify({ v: 99, savedAt: NOW, data: { count: 1 } }));
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual(specV2.initial());
    expect(quarantineKeys(keys())).toHaveLength(1);
  });

  it('no revienta si setItem lanza (cuota llena)', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(() => saveSlice(storage, 'k', specV2, { count: 1 }, NOW)).not.toThrow();
    expect(loadSlice(storage, 'k', specV2, NOW)).toEqual(specV2.initial());
  });
});
