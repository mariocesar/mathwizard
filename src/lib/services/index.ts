import { getContext, setContext } from 'svelte';
import type { Clock } from './clock';
import type { HapticsService } from './haptics';
import type { SpeechService } from './speech';

export interface Services {
  speech: SpeechService;
  haptics: HapticsService;
  clock: Clock;
}

const KEY = Symbol('mathwizard:services');

export function setServices(services: Services): void {
  setContext(KEY, services);
}

export function getServices(): Services {
  const services = getContext<Services | undefined>(KEY);
  if (!services) throw new Error('Services no está en el contexto: falta setServices() en App');
  return services;
}

export type { Clock } from './clock';
export { realClock } from './clock';
export type { HapticsService } from './haptics';
export { createHaptics } from './haptics';
export type { SpeechService } from './speech';
export { createSpeech } from './speech';
