/**
 * Sonidos sintetizados con WebAudio: nada de assets, nada que precachear.
 * Solo existen sonidos de acierto y de tecla — el fallo es SILENCIO
 * (el silencio es el sonido más neutro que hay); la voz ya corrige.
 */
let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, startAt: number, duration: number, volume: number): void {
  const ac = audioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime + startAt);
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startAt + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + startAt);
  osc.stop(ac.currentTime + startAt + duration + 0.05);
}

/** Campanita corta del acierto rápido (~150 ms). */
export function playDing(): void {
  tone(880, 0, 0.12, 0.12);
  tone(1318.5, 0.06, 0.14, 0.1);
}

/** Tic de papel al pulsar tecla: apenas audible. */
export function playTick(): void {
  tone(1800, 0, 0.02, 0.03);
}

/** Nota cálida única del fin de sesión. */
export function playWarmNote(): void {
  tone(523.25, 0, 0.35, 0.1);
  tone(659.25, 0.05, 0.4, 0.07);
}

/** Desbloqueo desde un gesto del usuario (autoplay policy). */
export function armAudio(): void {
  audioContext();
}
