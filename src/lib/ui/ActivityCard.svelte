<script lang="ts">
  import type { Component } from 'svelte';

  let {
    title,
    onOpen,
    icon,
  }: {
    title: string;
    onOpen?: () => void;
    icon?: Component;
  } = $props();

  const Icon = $derived(icon);
</script>

<button class="card" onclick={onOpen}>
  <span class="glyph">
    {#if Icon}<Icon />{:else}×{/if}
  </span>
  <span class="title">{title}</span>
</button>

<style>
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    aspect-ratio: 1;
    width: 100%;
    background: var(--paper-raised);
    border-radius: var(--radius-card);
    box-shadow: 0 3px 0 rgb(46 42 82 / 0.12);
    transition:
      transform var(--dur-tap) var(--ease-out),
      box-shadow var(--dur-tap) var(--ease-out);
  }

  button.card:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgb(46 42 82 / 0.12);
  }

  .glyph {
    font-family: var(--font-display);
    font-size: 3rem;
    font-weight: 600;
    color: var(--tinta-viva);
    line-height: 1;
    display: grid;
    place-items: center;
  }

  .glyph :global(svg) {
    width: 64px;
    height: 64px;
  }

  .title {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--text-body);
    color: var(--ink);
  }
</style>
