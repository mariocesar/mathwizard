<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { createRng } from '../../lib/domain/rng';
  import FactDisplay from '../../lib/ui/FactDisplay.svelte';
  import NumPad from '../../lib/ui/NumPad.svelte';
  import SessionDots from '../../lib/ui/SessionDots.svelte';
  import ThoughtCard from '../../lib/ui/ThoughtCard.svelte';
  import { correctGlint } from '../../lib/ui/motion';
  import { armAudio, playDing, playTick } from '../../lib/ui/sound';
  import { settings } from '../../app/settings.svelte';
  import type { ActivityProps } from '../types';
  import SessionSummary from './components/SessionSummary.svelte';
  import { startSession, step, type ComposerState, type Effect } from './logic/composer';
  import type { TablesDoc } from './logic/types';

  let { slice, services, exit }: ActivityProps<TablesDoc> = $props();

  const rng = createRng(Math.floor(Math.random() * 2 ** 31));

  // La sesión arranca con la foto del doc al montar.
  // svelte-ignore state_referenced_locally
  let cs = $state.raw<ComposerState>(
    startSession($state.snapshot(slice.data) as TablesDoc, rng, new Date().toISOString()).state,
  );

  let factEl = $state<HTMLElement | null>(null);
  let cancelStall: (() => void) | null = null;
  let cancelFeedback: (() => void) | null = null;

  const FEEDBACK_MS = {
    'correct-fast': 700,
    'correct-slow': 950,
    wrong: 1700,
    'strategy-done': 1300,
  } as const;

  function runEffect(effect: Effect): void {
    switch (effect.type) {
      case 'speak':
        services.speech.say(effect.text);
        break;
      case 'sound':
        if (settings.data.sound) playDing();
        break;
      case 'haptic':
        services.haptics.success();
        break;
      case 'celebrate':
        if (factEl) correctGlint(factEl);
        break;
      case 'armSpeech':
        services.speech.arm();
        armAudio();
        break;
    }
  }

  function dispatch(event: Parameters<typeof step>[1]): void {
    const prevDoc = cs.doc;
    const result = step(cs, event, rng);
    cs = result.state;
    for (const effect of result.effects) runEffect(effect);
    if (cs.doc !== prevDoc) {
      const doc = cs.doc;
      slice.update(() => doc);
    }
    void react();
  }

  async function react(): Promise<void> {
    cancelStall?.();
    cancelStall = null;

    if (cs.status === 'presenting') {
      await tick();
      requestAnimationFrame(() => {
        dispatch({ type: 'RENDERED', nowMs: performance.now() });
      });
      return;
    }

    if (cs.status === 'awaitingInput' && cs.current?.kind === 'retrieval') {
      // 15 s sin primer dígito → «Vamos a pensarlo juntos» (atasco ≠ fallo).
      cancelStall = services.clock.after(15_000, () => dispatch({ type: 'STALLED' }));
      return;
    }

    if (cs.status === 'feedback' && cs.feedback) {
      cancelFeedback?.();
      cancelFeedback = services.clock.after(FEEDBACK_MS[cs.feedback.type], () =>
        dispatch({ type: 'FEEDBACK_DONE' }),
      );
    }
  }

  function onDigit(d: number, timeStamp: number): void {
    if (settings.data.sound) playTick();
    services.haptics.tap();
    dispatch({ type: 'DIGIT', d, nowMs: timeStamp });
  }

  function onBackspace(): void {
    dispatch({ type: 'BACKSPACE' });
  }

  function onConfirm(timeStamp: number): void {
    dispatch({ type: 'SUBMIT', nowMs: timeStamp });
  }

  function onVisibility(): void {
    dispatch({
      type: document.visibilityState === 'hidden' ? 'VISIBILITY_HIDDEN' : 'VISIBILITY_VISIBLE',
      nowMs: performance.now(),
    });
  }

  onDestroy(() => {
    cancelStall?.();
    cancelFeedback?.();
    if (cs.status !== 'summary') {
      // Salida a media sesión: se cierra la contabilidad y se persiste.
      const result = step(cs, { type: 'ABORT' }, rng);
      const doc = result.state.doc;
      slice.update(() => doc);
    }
  });

  // Arranque: el primer ítem ya está en 'presenting'.
  void react();

  const pendingCount = $derived(
    cs.queue.length + cs.winddownIds.length + (cs.current && cs.status !== 'summary' ? 1 : 0),
  );
  const dots = $derived(
    cs.results.map((r) =>
      r.correct && r.fast === true ? 'gold' : r.correct ? 'plata' : 'ink',
    ) as ('gold' | 'plata' | 'ink')[],
  );
  const isStrategy = $derived(cs.current?.kind === 'strategy');
  const revealed = $derived(
    cs.status === 'feedback' && cs.feedback?.type === 'wrong' && cs.current
      ? cs.current.expected
      : null,
  );
</script>

<svelte:document onvisibilitychange={onVisibility} />

{#if cs.status === 'summary'}
  <SessionSummary doc={cs.doc} promotions={cs.promotions} onExit={exit} />
{:else if cs.current}
  <div class="session" class:strategy={isStrategy}>
    <header>
      <button class="close" aria-label="salir" onclick={exit}>✕</button>
      {#if isStrategy}
        <span class="mode-title">Pensemos juntos</span>
      {:else}
        <SessionDots {dots} pending={pendingCount} />
      {/if}
      <span class="spacer"></span>
    </header>

    {#if cs.current.kind === 'retrieval'}
      <main bind:this={factEl}>
        <FactDisplay a={cs.current.a} b={cs.current.b} input={cs.input} {revealed} />
        <p class="feedback-line" aria-live="polite">
          {cs.status === 'feedback' && cs.feedback ? cs.feedback.line : ' '}
        </p>
      </main>
    {:else}
      <main class="thoughts" bind:this={factEl}>
        <ThoughtCard>
          <span class="fact-intro">{cs.current.a} × {cs.current.b}</span>
        </ThoughtCard>
        {#each cs.current.steps.slice(0, cs.stepIndex) as done, i (i)}
          <ThoughtCard dimmed>
            {done.prompt} <strong>{done.expected}</strong>
          </ThoughtCard>
        {/each}
        {#if cs.status === 'feedback' && cs.feedback}
          <ThoughtCard>
            <span aria-live="polite">{cs.feedback.line}</span>
          </ThoughtCard>
        {:else if cs.current.steps[cs.stepIndex]}
          <ThoughtCard>
            {cs.current.steps[cs.stepIndex]!.prompt}
            <span class="step-input">{cs.input}<span class="caret">_</span></span>
          </ThoughtCard>
        {/if}
      </main>
    {/if}

    <NumPad {onDigit} {onBackspace} {onConfirm} disabled={cs.status === 'feedback'} />
  </div>
{/if}

<style>
  .session {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: var(--space-2);
    padding-top: var(--space-2);
  }

  header {
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    min-height: 44px;
  }

  .close {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    font-size: 1.3rem;
    border-radius: var(--radius-pill);
  }

  .mode-title {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--text-body);
    color: var(--tinta-viva);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-3);
    min-height: 0;
  }

  .feedback-line {
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--text-body);
    color: var(--ink-soft);
    min-height: 1.6em;
  }

  .thoughts {
    justify-content: flex-start;
    padding-top: var(--space-3);
    gap: var(--space-2);
    overflow-y: auto;
  }

  .fact-intro {
    font-size: 1.4em;
    font-weight: 600;
  }

  .step-input {
    color: var(--tinta-viva);
    font-weight: 600;
    margin-left: 0.4ch;
  }

  /* Guía estática: durante la práctica nada se mueve si el niño no lo causó. */
  .caret {
    color: var(--ink-soft);
    opacity: 0.6;
  }
</style>
