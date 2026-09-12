<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Tarjeta de razonamiento del modo estrategia: nota de tinta al margen. */
  let { dimmed = false, children }: { dimmed?: boolean; children: Snippet } = $props();
</script>

<div class="card" class:dimmed>
  {@render children()}
</div>

<style>
  .card {
    background: var(--paper-raised);
    border-left: 3px solid var(--tinta-viva);
    border-radius: var(--radius-card);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-display);
    font-size: var(--text-title);
    font-weight: 500;
    color: var(--ink);
    box-shadow: 0 2px 0 rgb(46 42 82 / 0.08);
    transition: opacity var(--dur-move) var(--ease-out);
  }

  .card.dimmed {
    opacity: 0.55;
    font-size: 1.15rem;
  }
</style>
