<script lang="ts">
  import type { GiroItem } from '../logic/giro';

  /**
   * «5 × _ = 20»: el hueco es la respuesta. Sin huecos pre-dimensionados
   * (la respuesta es siempre un operando de 1–2 dígitos, no filtra nada).
   */
  let {
    item,
    input,
    revealed = null,
  }: {
    item: GiroItem;
    input: string;
    revealed?: number | null;
  } = $props();
</script>

{#snippet gap()}
  {#if revealed !== null}
    <span class="answer reveal">{revealed}</span>
  {:else}
    <span class="answer">{input}<span class="caret">_</span></span>
  {/if}
{/snippet}

<p class="fact">
  {#if item.hiddenFirst}
    {@render gap()}
    <span class="times">×</span>
    <span class="operand">{item.shown}</span>
  {:else}
    <span class="operand">{item.shown}</span>
    <span class="times">×</span>
    {@render gap()}
  {/if}
  <span class="equals">=</span>
  <span class="operand">{item.product}</span>
</p>

<style>
  .fact {
    font-family: var(--font-display);
    font-size: var(--text-hero);
    font-weight: 600;
    color: var(--ink);
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.18em;
    line-height: 1.1;
    white-space: nowrap;
  }

  .times,
  .equals {
    color: var(--ink-soft);
    font-size: 0.6em;
    font-weight: 500;
  }

  .answer {
    min-width: 1.2ch;
    color: var(--tinta-viva);
  }

  .answer.reveal {
    color: var(--ink);
    animation: reveal-in 200ms var(--ease-out);
  }

  .caret {
    color: var(--ink-faint);
    animation: blink 1.2s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @keyframes reveal-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
