# Matemago (Math Wizard)

Conviértete en un mago de las mates practicando. Una PWA instalable, en español,
para móvil primero — servida desde GitHub Pages:
**<https://mariocesar.github.io/mathwizard/>**

La primera actividad entrena las tablas de multiplicar con un diseño basado en
evidencia (documentado en el weekend doc de investigación que originó el
proyecto): planificador Leitner **por hecho**, modo estrategia/recuperación
elegido por el planificador (nunca por el niño), latencia al primer dígito con
umbral de 6 s (el estándar de la MTC inglesa), y feedback asimétrico — la
celebración dura ≤300 ms y en el fallo la app dice el hecho completo en voz
alta, sin zumbidos, sin rojo, sin caras tristes.

## Desarrollo

```sh
bun install
bun run dev        # http://localhost:5173/mathwizard/
bun run test       # vitest — dominio puro, determinista (fuzz de 500 sesiones)
bun run check      # svelte-check
bun run lint       # eslint + prettier
bun run build && bun run verify-dist
bun run icons      # regenera public/icons/ desde scripts/assets/
```

Stack: Svelte 5 (runes) + Vite + TypeScript, vite-plugin-pwa, Vitest, bun.
Deploy automático a GitHub Pages en cada push a `main` (check + lint + test +
build + verify-dist como puerta). La identidad visual está en `CLAUDE.md`.

## Arquitectura

```
src/
├── app/          router hash (#/, #/a/<id>, #/cielo), settings, registro SW
├── scenes/       Torre (home), ActivityHost, Tu cielo, Ajustes
├── lib/
│   ├── services/ voz es-ES, háptica, reloj — inyectados por contexto
│   ├── storage/  localStorage con sobre versionado, migración y cuarentena
│   ├── domain/   TS puro compartido (rng sembrado)
│   └── ui/       SceneShell, NumPad, FactDisplay, PythagorasGrid, …
└── activities/
    ├── types.ts      contrato ActivityModule / ActivityProps / SliceSpec
    ├── registry.ts   lista estática de actividades
    └── times-tables/
        ├── logic/    TS PURO, cero imports de Svelte (lo vigila eslint):
        │             facts, scheduler (Leitner), composer (máquina de
        │             estados de sesión), strategies, feedback, numeros,
        │             latency, progress, state
        └── …         componente de actividad y piezas de UI propias
```

Reglas que sostienen el diseño:

- **La lógica educativa vive en `logic/` y es TS puro.** Reducers con
  timestamps que entran por eventos: sin DOM, sin timers, 100% testeable.
  La regla `no-restricted-imports` de eslint lo hace mecánico.
- **La fase es propiedad del hecho, no del niño.** Cajas 1–2 ⇒ modo
  estrategia (derivaciones del temario, sin reloj); cajas 3–5 ⇒ recuperación
  cronometrada. Fallo en recuperación ⇒ caja 1 Y estrategia (Woodward 2006).
- **El espaciado cuenta sesiones, no días** — el uso de un niño es a ráfagas
  y un SRS de calendario castiga los huecos.
- **Persistencia con cuarentena**: un valor corrupto o de una versión
  desconocida se aparta y la app arranca limpia. Nunca se rompe por datos.

## Añadir una actividad

1. Crea `src/activities/<id>/` con `logic/` (TS puro + tests), un componente
   Svelte que reciba `ActivityProps<T>`, y un `index.ts` con `defineActivity`.
2. Añade **una línea** a `src/activities/registry.ts`.

Nada más cambia: ruta, tarjeta en la torre, slice de storage y servicios
salen del registro.

## Anti-goals (revisa cada cambio contra esta lista)

Nunca, en ninguna parte de la app:

1. Rojo, flash, zumbido, sacudida o cara triste en un fallo — el fallo es
   tinta serena mostrando el hecho correcto, en silencio (habla la voz).
2. Celebración de más de 300 ms — si la fiesta dura más que la pregunta,
   está robando práctica.
3. Temporizador visible, cuenta atrás o barra que encoge mientras responde —
   la velocidad aparece después, como oro vs. plata, y la plata sigue siendo
   estrella.
4. Estados de derrota: ni puntos perdidos, ni rachas rotas, ni vidas.
5. Elogios al niño («¡qué listo eres!» está prohibido) — se elogia al hecho:
   «¡56! Esa se resistía.»
6. XP, monedas, cofres, ruletas — la única moneda son 100 estrellas que
   mapean 1:1 a hechos reales.
7. Culpa por ausencia («¡te echamos de menos!» prohibido).
8. Movimiento autónomo durante la práctica — si el niño no lo causó, no se
   mueve.
9. Mascotas con reacciones emocionales al rendimiento.
10. Pantallas cargadas de texto — más de una frase visible en una escena de
    niño es un bug de diseño.
11. Colores fuera de la paleta papel/tinta/oro/noche de `src/app.css`.
12. Animaciones sin su variante de movimiento reducido.

## Checklist de release (en el dispositivo real)

- [ ] Instalar desde la URL de Pages; arranca standalone desde el icono.
- [ ] Modo avión: la app abre y funciona entera.
- [ ] El primer toque desbloquea la voz; un fallo se oye en español natural
      («siete por ocho, cincuenta y seis»).
- [ ] Botón atrás de Android: de la sesión vuelve a la torre; de la torre
      sale de la app.
- [ ] Una sesión completa: orden mezclado, el fallo vuelve ~3 ítems después,
      termina con el trío fácil, el resumen nombra progreso concreto.
- [ ] Cerrar y relanzar: el progreso sigue (Leitner persistido).
- [ ] Legibilidad de dígitos con Vito: `6 8 9 0` a tamaño héroe (si duda,
      cambiar `--font-display` a Baloo 2 — es un token).
