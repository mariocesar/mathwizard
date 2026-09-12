/**
 * Adornos one-shot con WAAPI, todos detrás de la puerta de movimiento
 * reducido. Constitución: en práctica nada se mueve si el niño no lo causó;
 * la celebración jamás pasa de 300 ms.
 */
export function motionOK(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Destello dorado del acierto: pulso de brillo, 280 ms, una vez. */
export function correctGlint(el: HTMLElement): void {
  if (!motionOK()) return;
  el.animate(
    [
      { textShadow: '0 0 0 rgb(245 200 107 / 0)', transform: 'scale(1)' },
      { textShadow: '0 0 18px rgb(245 200 107 / 0.9)', transform: 'scale(1.04)', offset: 0.4 },
      { textShadow: '0 0 0 rgb(245 200 107 / 0)', transform: 'scale(1)' },
    ],
    { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
}

/** Encendido de estrella en el cielo: brillo que entra, 600 ms. */
export function cellKindle(el: HTMLElement): void {
  if (!motionOK()) return;
  el.animate(
    [
      { opacity: 0.2, boxShadow: '0 0 0 rgb(245 200 107 / 0)' },
      { opacity: 1, boxShadow: '0 0 16px rgb(245 200 107 / 0.8)', offset: 0.7 },
      { opacity: 1, boxShadow: '0 0 12px rgb(245 200 107 / 0.5)' },
    ],
    { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
}

/** Saludo del sombrero al cerrar sesión: se mece una vez, ≤800 ms. */
export function hatTip(el: HTMLElement): void {
  if (!motionOK()) return;
  el.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-8deg)', offset: 0.3 },
      { transform: 'rotate(6deg)', offset: 0.6 },
      { transform: 'rotate(0deg)' },
    ],
    { duration: 700, easing: 'ease-in-out' },
  );
}
