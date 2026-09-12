<script lang="ts">
  import { fly } from 'svelte/transition';
  import { router } from './app/router.svelte';
  import { setServices, type Services } from './lib/services';
  import SceneShell from './lib/ui/SceneShell.svelte';
  import { motionOK } from './lib/ui/motion';
  import Home from './scenes/Home.svelte';
  import ActivityHost from './scenes/ActivityHost.svelte';
  import Cielo from './scenes/Cielo.svelte';

  let { services }: { services: Services } = $props();
  // Los servicios se crean una vez en main.ts y no cambian.
  // svelte-ignore state_referenced_locally
  setServices(services);

  const route = $derived(router.route);
  const sceneKey = $derived(route.scene + (route.scene === 'activity' ? `:${route.id}` : ''));
  const dur = motionOK() ? { out: 150, in: 250 } : { out: 0, in: 0 };
</script>

<div class="scenes">
  {#key sceneKey}
    <div
      class="scene"
      in:fly={{ x: 24, duration: dur.in, delay: dur.out, opacity: 0 }}
      out:fly={{ x: -24, duration: dur.out, opacity: 0 }}
    >
      {#if route.scene === 'home'}
        <SceneShell><Home /></SceneShell>
      {:else if route.scene === 'activity'}
        <SceneShell><ActivityHost id={route.id} /></SceneShell>
      {:else}
        <SceneShell scene="cielo"><Cielo /></SceneShell>
      {/if}
    </div>
  {/key}
</div>

<style>
  .scenes {
    display: grid;
    min-height: 100dvh;
  }

  .scene {
    grid-area: 1 / 1;
    min-width: 0;
  }
</style>
