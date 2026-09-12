<script lang="ts">
  import type { Snippet } from 'svelte';

  let { scene = 'default', children }: { scene?: string; children: Snippet } = $props();
</script>

<div class="stage" data-scene={scene}>
  {@render children()}
</div>

<style>
  .stage {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: env(safe-area-inset-top);
    padding-right: max(env(safe-area-inset-right), var(--space-3));
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: max(env(safe-area-inset-left), var(--space-3));
    max-width: 480px;
    margin-inline: auto;
    background: var(--paper);
    width: 100%;
  }

  .stage[data-scene='cielo'] {
    background: var(--night);
    color: var(--star-dim);
  }

  /* Desktop: la página descansa sobre el escritorio */
  @media (min-width: 720px) {
    .stage {
      min-height: min(860px, 94dvh);
      margin-block: max(3dvh, 24px);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-page);
    }

    .stage[data-scene='cielo'] {
      max-width: 640px;
    }
  }
</style>
