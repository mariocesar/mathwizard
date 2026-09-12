<script lang="ts">
  import { router } from '../app/router.svelte';
  import { settings } from '../app/settings.svelte';
  import { activities } from '../activities/registry';
  import { progressMatrix } from '../activities/times-tables/logic/progress';
  import { TABLES_SPEC, TIMES_TABLES_ID } from '../activities/times-tables/logic/state';
  import { loadSlice } from '../lib/storage/migrate';
  import { activityKey } from '../lib/storage/storage';
  import ActivityCard from '../lib/ui/ActivityCard.svelte';
  import PythagorasGrid from '../lib/ui/PythagorasGrid.svelte';
  import SettingsSheet from './SettingsSheet.svelte';

  // Lectura de solo-lectura del progreso de las tablas (excepción sancionada
  // al aislamiento de slices: la franja del cielo vive en la torre).
  const tablesDoc = loadSlice(
    localStorage,
    activityKey(TIMES_TABLES_ID),
    TABLES_SPEC,
    new Date().toISOString(),
  );
  const matrix = progressMatrix(tablesDoc);

  const sorted = [...activities].sort((a, b) => a.order - b.order);
  let settingsOpen = $state(false);

  const heroSrc = `${import.meta.env.BASE_URL}icons/pwa-192.png`;
</script>

<header>
  <h1>Hola, {settings.data.name}</h1>
  <button class="gear" aria-label="ajustes" onclick={() => (settingsOpen = true)}>⚙</button>
</header>

<div class="hero">
  <img src={heroSrc} alt="" width="96" height="96" />
  <span class="brand">Matemago</span>
</div>

<button class="sky-strip" onclick={() => router.cielo()}>
  <span class="sky-label">✦ Tu cielo · {matrix.goldCells} estrellas</span>
  <div class="mini-wrap" data-scene="cielo">
    <PythagorasGrid {matrix} size="mini" />
  </div>
</button>

<p class="prompt">¿Qué practicamos hoy?</p>

<div class="grid">
  {#each sorted as activity (activity.id)}
    <ActivityCard
      title={activity.title}
      icon={activity.icon}
      onOpen={() => router.open(activity.id)}
    />
  {/each}
  <ActivityCard title="Muy pronto" placeholder />
</div>

<SettingsSheet open={settingsOpen} onClose={() => (settingsOpen = false)} />

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: var(--space-3);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--text-title);
    font-weight: 600;
  }

  .gear {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    color: var(--ink-faint);
    border-radius: var(--radius-pill);
  }

  .hero {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }

  .hero img {
    border-radius: var(--radius-card);
    box-shadow: 0 4px 14px rgb(46 42 82 / 0.18);
  }

  .brand {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.35rem;
    color: var(--ink-soft);
  }

  .sky-strip {
    display: block;
    width: 100%;
    background: var(--night);
    border-radius: var(--radius-card);
    padding: var(--space-3);
    margin-block: var(--space-3);
    text-align: left;
    box-shadow: 0 4px 0 rgb(27 26 58 / 0.35);
  }

  .sky-strip:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgb(27 26 58 / 0.35);
  }

  .sky-label {
    display: block;
    color: var(--star);
    font-family: var(--font-display);
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .prompt {
    color: var(--ink-soft);
    padding-block: var(--space-2);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
  }
</style>
