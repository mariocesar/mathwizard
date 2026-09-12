/**
 * Voz en español via SpeechSynthesis. La voz es el canal de corrección:
 * en el fallo dice el hecho completo («siete por ocho, cincuenta y seis»).
 *
 * Los navegadores móviles exigen un gesto del usuario antes de poder
 * hablar: `arm()` debe llamarse desde un pointerdown real (el primer toque
 * de la sesión) o el primer fallo se quedaría mudo.
 */
export interface SpeechService {
  /** Habla (cancela lo anterior). No hace nada si está desactivado. */
  say(text: string): void;
  /** Desbloquea el audio; llamar desde un gesto del usuario. */
  arm(): void;
  /** ¿Hay voz en español disponible? Si no, la UI muestra la frase en texto. */
  available(): boolean;
}

export function createSpeech(enabled: () => boolean): SpeechService {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  let voice: SpeechSynthesisVoice | null = null;
  let armed = false;

  function pickVoice(): void {
    if (!synth) return;
    const voices = synth.getVoices();
    voice =
      voices.find((v) => v.lang === 'es-ES') ?? voices.find((v) => v.lang.startsWith('es')) ?? null;
  }

  if (synth) {
    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);
  }

  return {
    say(text: string): void {
      if (!synth || !enabled()) return;
      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang ?? 'es-ES';
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        synth.speak(utterance);
      } catch {
        // Sin voz no hay corrección hablada; la UI ya muestra el texto.
      }
    },

    arm(): void {
      if (!synth || armed) return;
      armed = true;
      try {
        synth.resume();
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0;
        synth.speak(silent);
      } catch {
        armed = false;
      }
    },

    available(): boolean {
      if (!synth) return false;
      if (voice) return true;
      pickVoice();
      return voice !== null;
    },
  };
}
