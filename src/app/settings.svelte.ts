import { PersistedSlice } from '../lib/storage/persisted.svelte';
import { settingsKey } from '../lib/storage/storage';
import { SETTINGS_SPEC, type Settings } from './settingsSpec';

export type { Settings };

export const settings = new PersistedSlice<Settings>(localStorage, settingsKey(), SETTINGS_SPEC);
