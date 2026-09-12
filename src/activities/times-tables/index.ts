import { defineActivity } from '../types';
import TimesIcon from './components/TimesIcon.svelte';
import TimesTablesActivity from './TimesTablesActivity.svelte';
import { progressSummary } from './logic/progress';
import { TABLES_SPEC, TIMES_TABLES_ID } from './logic/state';
import type { TablesDoc } from './logic/types';

export default defineActivity<TablesDoc>({
  id: TIMES_TABLES_ID,
  title: 'Las tablas',
  icon: TimesIcon,
  order: 1,
  component: TimesTablesActivity,
  persistence: TABLES_SPEC,
  progress: progressSummary,
});
