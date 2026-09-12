<script lang="ts">
  /**
   * El hecho es el protagonista: lo más grande de la pantalla. La respuesta
   * se muestra según se teclea (sin huecos pre-dibujados: el número de
   * huecos filtraría la longitud de la respuesta).
   */
  let {
    a,
    b,
    input,
    revealed = null,
  }: {
    a: number;
    b: number;
    input: string;
    /** En el fallo: la respuesta correcta que se enseña en tinta serena. */
    revealed?: number | null;
  } = $props();
</script>

<p class="fact" class:revealed={revealed !== null}>
  <span class="operand">{a}</span>
  <span class="times">×</span>
  <span class="operand">{b}</span>
  <span class="equals">=</span>
  {#if revealed !== null}
    <span class="answer reveal">{revealed}</span>
  {:else}
    <span class="answer">{input}<span class="caret">_</span></span>
  {/if}
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

  /* Guía estática: durante la práctica nada se mueve si el niño no lo causó. */
  .caret {
    color: var(--ink-soft);
    opacity: 0.6;
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
