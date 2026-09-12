import { loadSlice, saveSlice, type SliceSpec } from './migrate';
import type { StorageLike } from './storage';

const isoNow = () => new Date().toISOString();

/**
 * Slice persistido con estado reactivo (runes). Escritura explícita y
 * síncrona en cada `update()` — nada de autosave con $effect: las
 * escrituras explícitas se depuran y se razonan mejor.
 */
export class PersistedSlice<T> {
  data = $state() as T;

  constructor(
    private readonly storage: StorageLike,
    private readonly key: string,
    private readonly spec: SliceSpec<T>,
    private readonly nowIso: () => string = isoNow,
  ) {
    this.data = loadSlice(storage, key, spec, this.nowIso());
  }

  update(fn: (current: T) => T): void {
    this.data = fn(this.data);
    saveSlice(this.storage, this.key, this.spec, this.data, this.nowIso());
  }

  reset(): void {
    this.data = this.spec.initial();
    saveSlice(this.storage, this.key, this.spec, this.data, this.nowIso());
  }
}
