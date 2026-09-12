/**
 * Claves y sobre de persistencia. Todo pasa por localStorage envuelto en
 * un `StorageLike` inyectable para poder probar sin DOM.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Esquema de claves v1. `profile` reserva sitio para perfiles futuros. */
const PREFIX = 'mathwizard:v1';

export function activityKey(activityId: string, profile = 'default'): string {
  return `${PREFIX}:${profile}:activity:${activityId}`;
}

export function settingsKey(profile = 'default'): string {
  return `${PREFIX}:${profile}:settings`;
}

/** Valor almacenado: versión del esquema + fecha + datos. */
export interface Envelope {
  v: number;
  savedAt: string;
  data: unknown;
}

export function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Envelope).v === 'number' &&
    'data' in value
  );
}

/** Storage en memoria para pruebas y como último recurso. */
export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}
