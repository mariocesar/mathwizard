import '@fontsource-variable/fredoka';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './app.css';

import { mount } from 'svelte';
import App from './App.svelte';
import { router } from './app/router.svelte';
import { settings } from './app/settings.svelte';
import { setupPWA } from './app/pwa';
import { createHaptics, createSpeech, realClock, type Services } from './lib/services';
import { armAudio } from './lib/ui/sound';

const soundOn = () => settings.data.sound;

const services: Services = {
  speech: createSpeech(soundOn),
  haptics: createHaptics(soundOn),
  clock: realClock,
};

// El primer gesto de la persona desbloquea voz y audio (autoplay policy):
// sin esto, el primer fallo de la sesión se quedaría mudo.
document.addEventListener(
  'pointerdown',
  () => {
    services.speech.arm();
    armAudio();
  },
  { capture: true, once: true },
);

router.init();
setupPWA();

const app = mount(App, {
  target: document.getElementById('app')!,
  props: { services },
});

export default app;
