# MathWizard

Conviértete en un mago de las mates practicando. Una PWA instalable, en español,
para móvil primero — servida desde GitHub Pages:
**<https://mariocesar.github.io/mathwizard/>**

La primera actividad entrena las tablas de multiplicar con un diseño basado en
evidencia: planificador Leitner por hecho, modo estrategia/recuperación elegido
por el planificador (nunca por el niño), latencia al primer dígito, y feedback
asimétrico (celebración ≤300 ms; en el fallo, la app dice el hecho completo en
voz alta — sin zumbidos, sin rojo, sin caras tristes).

## Desarrollo

```sh
bun install
bun run dev        # http://localhost:5173/mathwizard/
bun run test       # vitest (dominio puro, determinista)
bun run check      # svelte-check
bun run lint       # eslint + prettier
bun run build && bun run verify-dist
```

Stack: Svelte 5 (runes) + Vite + TypeScript, vite-plugin-pwa, Vitest. Bun como
gestor de paquetes. Deploy automático a GitHub Pages en cada push a `main`.
