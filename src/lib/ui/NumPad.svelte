<script lang="ts">
  /**
   * Teclado propio de tipografía de imprenta. NUNCA el teclado del sistema.
   * Los dígitos disparan en pointerdown (la latencia al primer dígito se
   * mide ahí); el teclado físico se refleja en la tecla con .pressed.
   */
  let {
    onDigit,
    onBackspace,
    onConfirm,
    disabled = false,
  }: {
    onDigit: (d: number, timeStamp: number) => void;
    onBackspace: () => void;
    onConfirm: (timeStamp: number) => void;
    disabled?: boolean;
  } = $props();

  let pressed = $state<string | null>(null);
  let releaseTimer: ReturnType<typeof setTimeout> | null = null;

  function flash(key: string) {
    pressed = key;
    if (releaseTimer) clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => (pressed = null), 120);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key >= '0' && event.key <= '9') {
      flash(event.key);
      onDigit(Number(event.key), event.timeStamp);
    } else if (event.key === 'Backspace') {
      flash('back');
      onBackspace();
    } else if (event.key === 'Enter') {
      flash('ok');
      onConfirm(event.timeStamp);
    }
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="pad" class:disabled>
  {#each digits as d (d)}
    <button
      class="key"
      class:pressed={pressed === String(d)}
      aria-label={String(d)}
      {disabled}
      onpointerdown={(e) => {
        flash(String(d));
        onDigit(d, e.timeStamp);
      }}
    >
      {d}
    </button>
  {/each}
  <button
    class="key key-back"
    class:pressed={pressed === 'back'}
    aria-label="borrar"
    {disabled}
    onpointerdown={() => {
      flash('back');
      onBackspace();
    }}
  >
    ⌫
  </button>
  <button
    class="key"
    class:pressed={pressed === '0'}
    aria-label="0"
    {disabled}
    onpointerdown={(e) => {
      flash('0');
      onDigit(0, e.timeStamp);
    }}
  >
    0
  </button>
  <button
    class="key key-ok"
    class:pressed={pressed === 'ok'}
    aria-label="comprobar"
    {disabled}
    onpointerdown={(e) => {
      flash('ok');
      onConfirm(e.timeStamp);
    }}
  >
    ✓
  </button>
</div>

<style>
  .pad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: min(100%, 360px);
    margin-inline: auto;
    padding-bottom: var(--space-2);
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }

  .key {
    height: clamp(56px, 9dvh, 72px);
    min-height: 48px;
    border-radius: var(--radius-key);
    background: var(--paper-raised);
    box-shadow: var(--edge-key);
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--ink);
    display: grid;
    place-items: center;
    transition:
      transform var(--dur-tap) var(--ease-out),
      box-shadow var(--dur-tap) var(--ease-out),
      background-color var(--dur-tap) var(--ease-out);
  }

  .key:active,
  .key.pressed {
    transform: translateY(2px);
    box-shadow: var(--edge-key-down);
    background: color-mix(in srgb, var(--paper-raised) 92%, var(--tinta-viva));
  }

  .key-back {
    background: var(--paper);
    box-shadow: inset 0 0 0 2px var(--ink-faint);
    color: var(--ink-soft);
    font-size: 1.4rem;
  }

  .key-ok {
    background: var(--tinta-viva);
    color: white;
    box-shadow: 0 3px 0 rgb(46 42 82 / 0.35);
  }

  .key-ok:active,
  .key-ok.pressed {
    box-shadow: 0 1px 0 rgb(46 42 82 / 0.35);
    background: var(--tinta-viva);
  }

  .disabled .key {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
