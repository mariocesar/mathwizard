/** Rutas de la app. Hash routing: en GitHub Pages no hay 404 que hackear. */
export type Route = { scene: 'home' } | { scene: 'activity'; id: string } | { scene: 'cielo' };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '');
  if (h.startsWith('/a/')) {
    const id = h.slice('/a/'.length);
    if (id.length > 0) return { scene: 'activity', id };
  }
  if (h === '/cielo') return { scene: 'cielo' };
  return { scene: 'home' };
}

export function hashFor(route: Route): string {
  switch (route.scene) {
    case 'home':
      return '#/';
    case 'activity':
      return `#/a/${route.id}`;
    case 'cielo':
      return '#/cielo';
  }
}
