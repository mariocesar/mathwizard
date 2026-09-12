import type { SliceSpec } from '../../../lib/storage/migrate';
import { initDoc } from './scheduler';
import type { TablesDoc } from './types';

export const TIMES_TABLES_ID = 'times-tables';

/**
 * Declaración de persistencia. La versión vive SOLO aquí (en el sobre del
 * slice); el documento no lleva campo de versión propio.
 */
export const TABLES_SPEC: SliceSpec<TablesDoc> = {
  version: 1,
  initial: initDoc,
  migrate: (_data, fromVersion) => {
    // v1 es la primera versión publicada: no hay nada anterior que migrar.
    throw new Error(`No hay migración desde la versión ${fromVersion}`);
  },
};
