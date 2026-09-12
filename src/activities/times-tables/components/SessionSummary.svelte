<script lang="ts">
  import WizardMark from '../../../lib/ui/WizardMark.svelte';
  import { hatTip } from '../../../lib/ui/motion';
  import { playWarmNote } from '../../../lib/ui/sound';
  import { settings } from '../../../app/settings.svelte';
  import { parseFactId } from '../../../lib/domain/facts';
  import type { FactId, TablesDoc } from '../logic/types';

  let {
    doc,
    promotions,
    onExit,
  }: {
    doc: TablesDoc;
    promotions: FactId[];
    onExit: () => void;
  } = $props();

  const summary = $derived(doc.recentSessions.at(-1));
  /** Estrellas nuevas: hechos promovidos que han llegado a oro (caja 5). */
  const newStars = $derived(
    [...new Set(promotions)].filter((id) => doc.facts[id]?.box === 5).slice(0, 3),
  );

  function hatAction(node: HTMLElement) {
    hatTip(node);
    if (settings.data.sound) playWarmNote();
  }
</script>

<div class="summary">
  <div class="hat" use:hatAction>
    <WizardMark size={84} />
  </div>

  <h2>{summary?.summaryLine ?? 'Hoy has practicado.'}</h2>

  {#if newStars.length > 0}
    <p class="stars-label">Estrellas nuevas:</p>
    <div class="tiles">
      {#each newStars as id (id)}
        {@const f = parseFactId(id)}
        <span class="tile">{f.a}×{f.b}</span>
        <span class="sparkle">✦</span>
        <span class="tile">{f.b}×{f.a}</span>
      {/each}
    </div>
  {/if}

  <button class="back" onclick={onExit}>Volver a la torre</button>
</div>

<style>
  .summary {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    text-align: center;
    padding: var(--space-4);
  }

  h2 {
    font-family: var(--font-display);
    font-size: var(--text-title);
    font-weight: 500;
    color: var(--ink);
    max-width: 18ch;
  }

  .stars-label {
    color: var(--ink-soft);
    font-size: var(--text-note);
  }

  .tiles {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: center;
  }

  .tile {
    background: var(--night);
    color: var(--star);
    font-family: var(--font-display);
    font-weight: 600;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-cell);
    box-shadow: var(--glow-star);
  }

  .sparkle {
    color: var(--gold);
  }

  .back {
    margin-top: var(--space-3);
    width: min(100%, 320px);
    padding: var(--space-3) var(--space-4);
    background: var(--tinta-viva);
    color: white;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--text-body);
    border-radius: var(--radius-key);
    box-shadow: 0 3px 0 rgb(46 42 82 / 0.35);
  }

  .back:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgb(46 42 82 / 0.35);
  }
</style>
