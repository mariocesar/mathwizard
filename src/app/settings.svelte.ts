import { PersistedSlice } from '../lib/storage/persisted.svelte';
import type { SliceSpec } from '../lib/storage/migrate';
import { settingsKey } from '../lib/storage/storage';

export interface Settings {
  sound: boolean;
  name: string;
}

const spec: SliceSpec<Settings> = {
  version: 1,
  initial: () => ({ sound: true, name: 'Vito' }),
  migrate: () => spec.initial(),
};

export const settings = new PersistedSlice<Settings>(localStorage, settingsKey(), spec);
