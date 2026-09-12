<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createRng } from '../../lib/domain/rng';
  import { loadSlice } from '../../lib/storage/migrate';
  import { activityKey } from '../../lib/storage/storage';
  import NumPad from '../../lib/ui/NumPad.svelte';
  import SessionDots from '../../lib/ui/SessionDots.svelte';
  import WizardMark from '../../lib/ui/WizardMark.svelte';
  import { correctGlint, hatTip } from '../../lib/ui/motion';
  import { armAudio, playDing, playTick, playWarmNote } from '../../lib/ui/sound';
  import { settings } from '../../app/settings.svelte';
  import type { ActivityProps } from '../types';
  import { TABLES_SPEC, TIMES_TABLES_ID } from '../times-tables/logic/state';
  import GiroDisplay from './components/GiroDisplay.svelte';
  import {
    giroPool,
    giroSummaryLine,
    startGiro,
    stepGiro,
    type GiroEffect,
    type GiroState,
  } from './logic/giro';
  import type { GiroDoc } from './logic/state';

  let { slice, services, exit }: ActivityProps<GiroDoc> = $props();

  const rng = createRng(Math.floor(Math.random() * 2 ** 31));

  // Lectura sancionada de solo-lectura: el pool sale del progreso de Las
  // tablas (se gira lo que ya va solo).
  const tablesDoc = loadSlice(
    localStorage,
    activityKey(TIMES_TABLES_ID),
    TABLES_SPEC,
    new Date().toISOString(),
  );

  // svelte-ignore state_referenced_locally
  const startingBest = slice.data.bestStreak;

  let gs = $state.raw<GiroState>(startGiro(giroPool(tablesDoc), rng));
  let factEl = $state<HTMLElement | null>(null);
  let cancelFeedback: (() => void) | null = null;
  let recorded = false;

  function runEffect(effect: GiroEffect): void {
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
    }
  }

  function record(): void {
    if (recorded || gs.results.length === 0) return;
    recorded = true;
    const corrects = gs.results.filter((r) => r.correct).length;
    const best = gs.bestStreak;
    slice.update((doc) => ({
      bestStreak: Math.max(doc.bestStreak, best),
      totalCorrect: doc.totalCorrect + corrects,
      sessionsPlayed: doc.sessionsPlayed + 1,
    }));
  }

  function dispatch(event: Parameters<typeof stepGiro>[1]): void {
    const result = stepGiro(gs, event, rng);
    gs = result.state;
    for (const effect of result.effects) runEffect(effect);

    if (gs.status === 'feedback' && gs.feedback) {
      cancelFeedback?.();
      cancelFeedback = services.clock.after(gs.feedback.correct ? 800 : 1700, () =>
        dispatch({ type: 'FEEDBACK_DONE' }),
      );
    }
    if (gs.status === 'summary') {
      record();
      if (settings.data.sound) playWarmNote();
    }
  }

  function onDigit(d: number): void {
    services.speech.arm();
    armAudio();
    if (settings.data.sound) playTick();
    services.haptics.tap();
    dispatch({ type: 'DIGIT', d });
  }

  onDestroy(() => {
    cancelFeedback?.();
    record();
  });

  const dots = $derived(gs.results.map((r) => (r.correct ? 'gold' : 'ink')) as ('gold' | 'ink')[]);
  const pendingCount = $derived(gs.queue.length + (gs.current && gs.status !== 'summary' ? 1 : 0));
  const revealed = $derived(
    gs.status === 'feedback' && gs.feedback?.correct === false && gs.current
      ? gs.current.expected
      : null,
  );
  const newRecord = $derived(gs.bestStreak > startingBest);

  function hatAction(node: HTMLElement) {
    hatTip(node);
  }
</script>

{#if gs.status === 'summary'}
  <div class="summary">
    <div use:hatAction><WizardMark size={84} /></div>
    <h2>{giroSummaryLine(gs, newRecord)}</h2>
    {#if slice.data.bestStreak >= 3}
      <p class="stat">Tu mejor racha: {slice.data.bestStreak} giros.</p>
    {/if}
    <button class="back" onclick={exit}>Volver a la torre</button>
  </div>
{:else if gs.current}
  <div class="session">
    <header>
      <button class="close" aria-label="salir" onclick={exit}>✕</button>
      <SessionDots {dots} pending={pendingCount} />
      <span class="spacer"></span>
    </header>

    <main bind:this={factEl}>
      <GiroDisplay item={gs.current} input={gs.input} {revealed} />
      <p class="feedback-line" aria-live="polite">
        {gs.status === 'feedback' && gs.feedback ? gs.feedback.line : ' '}
      </p>
    </main>

    <NumPad
      {onDigit}
      onBackspace={() => dispatch({ type: 'BACKSPACE' })}
      onConfirm={() => dispatch({ type: 'SUBMIT' })}
      disabled={gs.status === 'feedback'}
    />
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
    grid-template-columns: var(--tap-icon) 1fr var(--tap-icon);
    align-items: center;
    min-height: var(--tap-icon);
  }

  .close {
    width: var(--tap-icon);
    height: var(--tap-icon);
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    font-size: var(--text-icon);
    border-radius: var(--radius-pill);
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

  .stat {
    color: var(--ink-soft);
    font-size: var(--text-note);
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
