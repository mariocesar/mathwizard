<script lang="ts">
  /**
   * El sombrero del mago: glifo estático (SIN cara — una mascota con cara
   * acaba reaccionando al niño, y eso está prohibido por diseño).
   */
  let { size = 48 }: { size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 64 64"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <path
    d="M33 8 C 38 20 42 32 45 44 L 19 44 C 24 31 28 20 33 8 Z"
    fill="var(--ink)"
    stroke="var(--ink)"
    stroke-width="3"
    stroke-linejoin="round"
  />
  <ellipse cx="32" cy="46" rx="19" ry="3.6" fill="var(--ink)" />
  <path d="M22.5 37 L 41.5 37 L 43 42 L 21 42 Z" fill="var(--gold)" />
  <!-- La × dorada del frente: es identidad de marca, no adorno (CLAUDE.md). -->
  <path
    d="M28.4 25.4 L 35.6 32.6 M 35.6 25.4 L 28.4 32.6"
    stroke="var(--gold)"
    stroke-width="3.2"
    stroke-linecap="round"
  />
  <path
    d="M48 12 L 49.8 16.8 L 54.6 18.6 L 49.8 20.4 L 48 25.2 L 46.2 20.4 L 41.4 18.6 L 46.2 16.8 Z"
    fill="var(--gold)"
  />
  <circle cx="14" cy="16" r="1.8" fill="var(--gold-glow)" />
</svg>
