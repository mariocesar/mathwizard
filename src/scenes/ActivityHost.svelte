<script lang="ts">
  import { getActivity } from '../activities/registry';
  import { router } from '../app/router.svelte';
  import { getServices } from '../lib/services';
  import { PersistedSlice } from '../lib/storage/persisted.svelte';
  import { activityKey } from '../lib/storage/storage';

  let { id }: { id: string } = $props();

  const services = getServices();
  // App remonta este host con {#key} por id.
  // svelte-ignore state_referenced_locally
  const module = getActivity(id);

  $effect(() => {
    if (!module) router.home();
  });

  const slice = module?.persistence
    ? new PersistedSlice(localStorage, activityKey(module.id), module.persistence)
    : null;

  const Activity = $derived(module?.component);
</script>

{#if module && Activity && slice}
  <Activity {slice} {services} exit={() => router.home()} />
{/if}
