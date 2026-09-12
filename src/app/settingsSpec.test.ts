import { describe, expect, it } from 'vitest';
import { loadSlice, saveSlice } from '../lib/storage/migrate';
import { createMemoryStorage } from '../lib/storage/storage';
import { SETTINGS_SPEC } from './settingsSpec';

const NOW = '2026-09-12T10:00:00.000Z';

describe('SETTINGS_SPEC', () => {
  it('por defecto: sonido sí, voz NO', () => {
    expect(SETTINGS_SPEC.initial()).toEqual({ sound: true, voice: false, name: 'Vito' });
  });

  it('migra v1 conservando sonido y nombre, con la voz apagada', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({ v: 1, savedAt: NOW, data: { sound: false, name: 'Emma' } }),
    );
    expect(loadSlice(storage, 'k', SETTINGS_SPEC, NOW)).toEqual({
      sound: false,
      voice: false,
      name: 'Emma',
    });
  });

  it('round-trip v2', () => {
    const storage = createMemoryStorage();
    const value = { sound: true, voice: true, name: 'Vito' };
    saveSlice(storage, 'k', SETTINGS_SPEC, value, NOW);
    expect(loadSlice(storage, 'k', SETTINGS_SPEC, NOW)).toEqual(value);
  });
});
