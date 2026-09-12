import { isEnvelope, type Envelope, type StorageLike } from './storage';

/**
 * Declaración de persistencia de un slice: versión del esquema, estado
 * inicial y migración. `migrate` recibe los datos de una versión anterior
 * y debe devolver datos válidos de la versión actual; si lanza, el slice
 * se pone en cuarentena y se reinicia — una app para un niño nunca puede
 * romperse por datos guardados.
 */
export interface SliceSpec<T> {
  version: number;
  initial: () => T;
  migrate: (data: unknown, fromVersion: number) => T;
}

function quarantine(storage: StorageLike, key: string, raw: string, nowIso: string): void {
  try {
    storage.setItem(`mathwizard:quarantine:${key}:${nowIso}`, raw);
  } catch {
    // Sin espacio para la copia: se pierde el valor corrupto, no la app.
  }
}

export function saveSlice<T>(
  storage: StorageLike,
  key: string,
  spec: SliceSpec<T>,
  data: T,
  nowIso: string,
): void {
  const envelope: Envelope = { v: spec.version, savedAt: nowIso, data };
  try {
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Cuota llena o modo privado: seguimos en memoria sin romper la sesión.
  }
}

export function loadSlice<T>(
  storage: StorageLike,
  key: string,
  spec: SliceSpec<T>,
  nowIso: string,
): T {
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return spec.initial();
  }
  if (raw === null) return spec.initial();

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    quarantine(storage, key, raw, nowIso);
    return spec.initial();
  }

  if (!isEnvelope(envelope)) {
    quarantine(storage, key, raw, nowIso);
    return spec.initial();
  }

  if (envelope.v === spec.version) {
    return envelope.data as T;
  }

  if (envelope.v < spec.version) {
    try {
      const migrated = spec.migrate(envelope.data, envelope.v);
      saveSlice(storage, key, spec, migrated, nowIso);
      return migrated;
    } catch {
      quarantine(storage, key, raw, nowIso);
      return spec.initial();
    }
  }

  // Versión más nueva que el código (rollback tras un deploy fallido).
  quarantine(storage, key, raw, nowIso);
  return spec.initial();
}
