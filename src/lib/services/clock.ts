/**
 * Reloj inyectable: la UI usa esto para timers; el dominio nunca llama a
 * Date.now() — los timestamps entran por eventos.
 */
export interface Clock {
  /** Milisegundos monotónicos (performance.now). */
  now(): number;
  /** Programa fn tras ms; devuelve el cancelador. */
  after(ms: number, fn: () => void): () => void;
}

export const realClock: Clock = {
  now: () => performance.now(),
  after(ms, fn) {
    const id = setTimeout(fn, ms);
    return () => clearTimeout(id);
  },
};
