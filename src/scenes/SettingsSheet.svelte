<script lang="ts">
  import { activities } from '../activities/registry';
  import { settings } from '../app/settings.svelte';
  import { activityKey } from '../lib/storage/storage';

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();

  let confirmingReset = $state(false);

  function toggleSound() {
    settings.update((s) => ({ ...s, sound: !s.sound }));
  }

  function rename(event: Event) {
    const name = (event.target as HTMLInputElement).value.trim() || 'Vito';
    settings.update((s) => ({ ...s, name }));
  }

  function resetProgress() {
    if (!confirmingReset) {
      confirmingReset = true;
      return;
    }
    for (const activity of activities) {
      if (activity.persistence) localStorage.removeItem(activityKey(activity.id));
    }
    location.reload();
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div class="sheet" role="dialog" aria-label="Ajustes">
      <h2>Ajustes</h2>

      <label class="row">
        <span>Sonido</span>
        <input type="checkbox" checked={settings.data.sound} onchange={toggleSound} />
      </label>

      <label class="row">
        <span>Nombre</span>
        <input class="name" type="text" value={settings.data.name} onchange={rename} />
      </label>

      <button class="danger" onclick={resetProgress}>
        {confirmingReset ? '¿Seguro? Se pierde todo el progreso' : 'Borrar progreso'}
      </button>

      <button class="close-btn" onclick={onClose}>Cerrar</button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(27 26 58 / 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 10;
  }

  .sheet {
    background: var(--paper);
    border-radius: var(--radius-card) var(--radius-card) 0 0;
    padding: var(--space-4);
    width: min(100%, 480px);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  }

  h2 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-note);
    gap: var(--space-3);
    min-height: 44px;
  }

  .row input[type='checkbox'] {
    width: 24px;
    height: 24px;
    accent-color: var(--tinta-viva);
  }

  .name {
    font: inherit;
    padding: var(--space-2);
    border: 1.5px solid var(--ink-faint);
    border-radius: var(--radius-cell);
    width: 12ch;
    text-align: right;
    background: var(--paper-raised);
    color: var(--ink);
  }

  .danger {
    color: var(--ink-soft);
    text-decoration: underline;
    font-size: var(--text-note);
    text-align: left;
    min-height: 44px;
  }

  .close-btn {
    background: var(--tinta-viva);
    color: white;
    border-radius: var(--radius-key);
    padding: var(--space-3);
    font-family: var(--font-display);
    font-weight: 500;
  }
</style>
