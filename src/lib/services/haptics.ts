/**
 * Vibración con nombres, no arrays crudos. Regla de asimetría: existe
 * háptica de acierto; NO existe háptica de error — el fallo es silencioso.
 */
export interface HapticsService {
  /** Toque de tecla: confirmación táctil mínima. */
  tap(): void;
  /** Acierto rápido: pulso corto. */
  success(): void;
}

export function createHaptics(enabled: () => boolean): HapticsService {
  const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const vibrate = (pattern: number | number[]) => {
    if (!supported || !enabled()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Algunos navegadores lanzan sin gesto previo: lo ignoramos.
    }
  };
  return {
    tap: () => vibrate(8),
    success: () => vibrate(40),
  };
}
