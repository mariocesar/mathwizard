import type { SliceSpec } from '../../../lib/storage/migrate';

export const GIRO_ID = 'giro';

/** Persistencia mínima: récords, no planificación (el reto es por sesión). */
export interface GiroDoc {
  bestStreak: number;
  totalCorrect: number;
  sessionsPlayed: number;
}

export const GIRO_SPEC: SliceSpec<GiroDoc> = {
  version: 1,
  initial: () => ({ bestStreak: 0, totalCorrect: 0, sessionsPlayed: 0 }),
  migrate: (_data, fromVersion) => {
    throw new Error(`No hay migración desde la versión ${fromVersion}`);
  },
};
