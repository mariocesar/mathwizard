import type { SliceSpec } from '../lib/storage/migrate';

export interface Settings {
  /** Sonidos de la interfaz (campanita, tic de tecla, nota final). */
  sound: boolean;
  /**
   * Voz sintetizada que dice el hecho en el fallo. Apagada por defecto:
   * a Vito la voz del sistema le sonó rara (2026-09-12). La corrección
   * escrita se muestra siempre; la voz es opcional para quien tenga una
   * voz es-ES agradable instalada.
   */
  voice: boolean;
  name: string;
}

export const SETTINGS_SPEC: SliceSpec<Settings> = {
  version: 2,
  initial: () => ({ sound: true, voice: false, name: 'Vito' }),
  migrate: (data, fromVersion) => {
    if (fromVersion === 1) {
      // v1 no tenía `voice` (la voz iba atada a `sound`). Nace apagada.
      const old = data as { sound?: boolean; name?: string };
      return {
        sound: old.sound ?? true,
        voice: false,
        name: old.name ?? 'Vito',
      };
    }
    return SETTINGS_SPEC.initial();
  },
};
