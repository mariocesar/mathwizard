import { parseHash, hashFor, type Route } from './routes';

/**
 * Router hash mínimo con estado reactivo. El botón atrás (hardware o
 * navegador) dispara hashchange y la escena se actualiza sola; en home,
 * atrás sale de la app — comportamiento nativo correcto.
 */
class Router {
  route: Route = $state({ scene: 'home' });
  /** Entradas de historial creadas dentro de la app (para volver con back real). */
  private depth = 0;

  init(): void {
    this.route = parseHash(location.hash);
    window.addEventListener('hashchange', () => {
      this.route = parseHash(location.hash);
      if (this.route.scene === 'home') this.depth = 0;
    });
  }

  open(id: string): void {
    this.depth++;
    location.hash = hashFor({ scene: 'activity', id });
  }

  cielo(): void {
    this.depth++;
    location.hash = hashFor({ scene: 'cielo' });
  }

  home(): void {
    if (this.depth > 0) {
      this.depth = 0;
      history.back();
    } else {
      location.replace(hashFor({ scene: 'home' }));
    }
  }
}

export const router = new Router();
