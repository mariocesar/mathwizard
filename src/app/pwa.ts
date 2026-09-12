import { registerSW } from 'virtual:pwa-register';

/**
 * Registro del service worker. autoUpdate: las versiones nuevas se activan
 * en el siguiente arranque — a un niño no se le enseñan diálogos de update.
 */
export function setupPWA(): void {
  registerSW({ immediate: true });
}
