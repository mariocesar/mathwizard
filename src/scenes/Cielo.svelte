<script lang="ts">
  import { router } from '../app/router.svelte';
  import { progressMatrix } from '../activities/times-tables/logic/progress';
  import { TABLES_SPEC, TIMES_TABLES_ID } from '../activities/times-tables/logic/state';
  import { parseFactId } from '../activities/times-tables/logic/facts';
  import { loadSlice } from '../lib/storage/migrate';
  import { activityKey } from '../lib/storage/storage';
  import PythagorasGrid from '../lib/ui/PythagorasGrid.svelte';

  const doc = loadSlice(
    localStorage,
    activityKey(TIMES_TABLES_ID),
    TABLES_SPEC,
    new Date().toISOString(),
  );
  const matrix = progressMatrix(doc);

  // El único momento orquestado: encender las estrellas nuevas de la última
  // sesión (máx. 3 pares), cada una con su línea a la celda espejo.
  const kindleCells: [number, number][] = (doc.recentSessions.at(-1)?.promotions ?? [])
    .filter((id) => doc.facts[id]?.box === 5)
    .slice(0, 3)
    .map((id) => {
      const { a, b } = parseFactId(id);
      return [a, b] as [number, number];
    });
</script>

<header>
  <button class="back" aria-label="volver" onclick={() => router.home()}>←</button>
  <div>
    <h1>Tu cielo</h1>
    <p class="count">{matrix.goldCells} de {matrix.totalCells} estrellas</p>
  </div>
</header>

<main>
  {#if matrix.goldCells === 0 && matrix.plataCells === 0}
    <p class="explainer">
      Cada estrella es una multiplicación que ya es tuya. Practica y enciende las primeras.
    </p>
  {/if}
  <PythagorasGrid {matrix} size="full" {kindleCells} />
  <p class="legend">
    ✦ rápidas y tuyas · <span class="plata">■</span> casi · <span class="dim">■</span> aún por encender
  </p>
</main>

<style>
  header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-block: var(--space-3);
  }

  .back {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    color: var(--star-dim);
    border-radius: var(--radius-pill);
  }

  h1 {
    font-family: var(--font-display);
    font-size: var(--text-title);
    font-weight: 600;
    color: var(--star);
  }

  .count {
    color: var(--star-dim);
    font-size: var(--text-note);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-4);
    padding-bottom: var(--space-5);
  }

  .explainer {
    text-align: center;
    color: var(--star-dim);
    max-width: 30ch;
    margin-inline: auto;
  }

  .legend {
    text-align: center;
    color: var(--star-dim);
    font-size: 0.9rem;
  }

  .legend .plata {
    color: var(--plata);
  }

  .legend .dim {
    color: var(--night-raised);
  }
</style>
