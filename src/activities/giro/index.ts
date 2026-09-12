import { defineActivity } from '../types';
import GiroActivity from './GiroActivity.svelte';
import GiroIcon from './components/GiroIcon.svelte';
import { GIRO_ID, GIRO_SPEC } from './logic/state';
import type { GiroDoc } from './logic/state';

export default defineActivity<GiroDoc>({
  id: GIRO_ID,
  title: 'El giro',
  icon: GiroIcon,
  order: 2,
  component: GiroActivity,
  persistence: GIRO_SPEC,
});
