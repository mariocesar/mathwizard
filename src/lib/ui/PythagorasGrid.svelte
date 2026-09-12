<script lang="ts">
  import type { ProgressMatrix } from '../../activities/times-tables/logic/progress';
  import { cellKindle } from './motion';

  /**
   * La tabla de Pitágoras como carta estelar. Marcador Y material didáctico:
   * las celdas espejo salen del mismo hecho (conmutatividad como simetría),
   * la diagonal son los cuadrados. Tres tamaños: full (Tu cielo), mini
   * (franja de Home), tile (fin de sesión).
   */
  let {
    matrix,
    size = 'full',
    kindleCells = [],
    onSelect,
  }: {
    matrix: ProgressMatrix;
    size?: 'full' | 'mini';
    /** Celdas [fila, columna] (1-based) que se encienden al entrar (máx 3 pares). */
    kindleCells?: [number, number][];
    onSelect?: (row: number, col: number) => void;
  } = $props();

  let selected = $state<[number, number] | null>(null);

  function isKindle(row: number, col: number): boolean {
    return kindleCells.some(([r, c]) => (r === row && c === col) || (r === col && c === row));
  }

  function select(row: number, col: number) {
    if (size !== 'full') return;
    selected = [row, col];
    onSelect?.(row, col);
  }

  function isMirrorOfSelected(row: number, col: number): boolean {
    if (!selected) return false;
    const [r, c] = selected;
    return (row === r && col === c) || (row === c && col === r);
  }

  function kindleAction(node: HTMLElement, coords: { row: number; col: number; active: boolean }) {
    if (coords.active) {
      // Escalona los encendidos para el único momento orquestado de la app.
      const pairIndex = kindleCells.findIndex(
        ([r, c]) =>
          (r === coords.row && c === coords.col) || (r === coords.col && c === coords.row),
      );
      setTimeout(() => cellKindle(node), Math.max(0, pairIndex) * 250);
    }
  }

  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
</script>

<div class="chart" class:mini={size === 'mini'}>
  {#if size === 'full'}
    <div class="corner"></div>
    {#each rows as col (col)}
      <div class="header">{col}</div>
    {/each}
  {/if}
  {#each rows as row (row)}
    {#if size === 'full'}
      <div class="header">{row}</div>
    {/if}
    {#each rows as col (col)}
      {@const cell = matrix.cells[row - 1]![col - 1]!}
      <button
        class="cell {cell}"
        class:diagonal={row === col}
        class:mirror={isMirrorOfSelected(row, col)}
        aria-label={`${row} por ${col}`}
        tabindex={size === 'full' ? 0 : -1}
        use:kindleAction={{ row, col, active: isKindle(row, col) }}
        onclick={() => select(row, col)}
      >
        {#if cell === 'gold' && size === 'full'}✦{/if}
      </button>
    {/each}
  {/each}
</div>
{#if size === 'full' && selected}
  <p class="fact-line">
    {selected[0]} × {selected[1]} = {selected[0] * selected[1]}
  </p>
{/if}

<style>
  .chart {
    display: grid;
    grid-template-columns: auto repeat(10, 1fr);
    gap: 3px;
    width: min(100%, 560px);
    margin-inline: auto;
  }

  .chart.mini {
    grid-template-columns: repeat(10, 1fr);
    gap: 2px;
    width: 100%;
  }

  .corner {
    width: 1.4rem;
  }

  .header {
    display: grid;
    place-items: center;
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--star-dim);
    min-width: 1.4rem;
  }

  .cell {
    aspect-ratio: 1;
    border-radius: var(--radius-cell);
    background: var(--night-raised);
    display: grid;
    place-items: center;
    font-size: 0.7rem;
    color: var(--night);
    line-height: 1;
    padding: 0;
  }

  .mini .cell {
    border-radius: 2px;
    pointer-events: none;
  }

  .cell.gold {
    background: var(--star);
    box-shadow: 0 0 8px rgb(245 200 107 / 0.45);
  }

  .cell.plata {
    background: color-mix(in srgb, var(--night-raised) 40%, var(--plata));
  }

  .cell.diagonal {
    outline: 1.5px solid color-mix(in srgb, var(--star) 45%, transparent);
    outline-offset: -1.5px;
  }

  .cell.mirror {
    outline: 2px solid var(--gold-glow);
    outline-offset: 1px;
  }

  .fact-line {
    text-align: center;
    margin-top: var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-title);
    color: var(--star);
  }
</style>
