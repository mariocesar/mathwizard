<script lang="ts">
  import type { ItemResult } from '../../activities/times-tables/logic/types';

  /**
   * El ÚNICO indicador de estado en recuperación. Oro = rápida y tuya;
   * plata = correcta (sigue siendo estrella); tinta = anotada, aún sin
   * estrella. Nunca hay estado de derrota.
   */
  let { results, pending }: { results: ItemResult[]; pending: number } = $props();

  function dotClass(r: ItemResult): string {
    if (r.correct && r.fast === true) return 'gold';
    if (r.correct) return 'plata';
    return 'ink';
  }
</script>

<div class="dots" aria-hidden="true">
  {#each results as r, i (i)}
    <span class="dot {dotClass(r)}"></span>
  {/each}
  {#if pending > 0}
    <span class="dot current"></span>
    {#each Array(Math.max(0, Math.min(pending - 1, 12 - results.length))) as _, i (i)}
      <span class="dot"></span>
    {/each}
  {/if}
</div>

<style>
  .dots {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    min-height: 12px;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: var(--radius-pill);
    background: var(--paper-sunken);
    box-shadow: inset 0 0 0 1.5px var(--ink-faint);
    transition: background-color var(--dur-quick) var(--ease-out);
  }

  .dot.gold {
    background: var(--gold);
    box-shadow: 0 0 6px rgb(245 200 107 / 0.6);
  }

  .dot.plata {
    background: var(--plata);
    box-shadow: none;
  }

  .dot.ink {
    background: var(--ink-soft);
    box-shadow: none;
  }

  .dot.current {
    box-shadow: inset 0 0 0 2px var(--tinta-viva);
    background: var(--paper-raised);
  }
</style>
