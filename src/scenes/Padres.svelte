<script lang="ts">
  import { router } from '../app/router.svelte';

  // Página para adultos: aquí SÍ se puede leer largo (la regla de «una
  // frase por pantalla» aplica a las escenas del niño, no a esta).
</script>

<header>
  <button class="back" aria-label="volver" onclick={() => router.home()}>←</button>
  <h1>Por qué se practica así</h1>
</header>

<main>
  <p class="intro">
    Casi todo lo que hace rara a esta app comparada con otros juegos de tablas es deliberado y viene
    de estudios publicados. Esta página resume cada decisión y su fuente.
  </p>

  <section>
    <h2>El objetivo real son 15 hechos, no 100</h2>
    <p>
      Con las tablas del 1 al 10, la conmutatividad (7×8 = 8×7) deja 55 hechos únicos. Quitando lo
      que ya se trae de 2.º (tablas del 1, 2, 5 y 10) y los cuadrados, que tienen ancla propia en la
      diagonal, quedan <strong>15 hechos difíciles</strong>: 3×4, 3×6, 3×7, 3×8, 3×9, 4×6, 4×7, 4×8,
      4×9, 6×7, 6×8, 6×9, 7×8, 7×9 y 8×9. La app reparte el esfuerzo ahí, no uniformemente. Ver que
      el monstruo tiene quince cabezas y no cien ya es, por sí solo, una ayuda.
    </p>
  </section>

  <section>
    <h2>Se escribe la respuesta; nunca hay opciones para elegir</h2>
    <p>
      Elegir entre cuatro opciones es <em>reconocer</em>; escribir la respuesta es
      <em>recuperar de memoria</em>, que es lo que construye fluidez. En un estudio de aula, las
      flashcards (recuperación) ganaron al canturreo repetitivo tanto inmediatamente como semanas
      después (<a
        href="https://hechingerreport.org/proof-points-flashcards-prevail-over-repetition-in-memorizing-multiplication-tables/"
        target="_blank"
        rel="noopener">Hechinger Report / HFL Education</a
      >).
    </p>
  </section>

  <section>
    <h2>Cada hecho lleva su propia cuenta, y el método cambia según el hecho</h2>
    <p>
      Un hecho pasa por fases: primero se cuenta, luego se <em>deriva</em> de lo que ya se sabe, y
      al final se recupera directo. La fase es del hecho, no del niño: puede tener 2×7 automatizado
      y 7×8 aún en derivación. Por eso el planificador decide el modo por hecho: cajas bajas →
      «Pensemos juntos» (derivación guiada, sin reloj); cajas altas → práctica rápida. El estudio
      clave comparó drill cronometrado solo contra drill + estrategias en 58 alumnos de 4.º: los dos
      lograron velocidad, pero el grupo integrado rindió mejor en aplicación y mantenimiento (<a
        href="https://eric.ed.gov/?id=EJ786218"
        target="_blank"
        rel="noopener">Woodward 2006, <em>Learning Disability Quarterly</em></a
      >). Por eso «Pensemos juntos» no es una actividad aparte: es la mitad que hace que la
      velocidad se sostenga.
    </p>
    <p>
      Las derivaciones que enseña son las del temario español de 3.º: 4× como doble de 2×, 8× como
      doble de 4×, 6× como doble de 3×, 9× como 10× menos un grupo — refuerzan lo del colegio en vez
      de competir con ello.
    </p>
  </section>

  <section>
    <h2>No hay reloj visible, pero sí un umbral de velocidad</h2>
    <p>
      La velocidad importa (distingue «lo calculó» de «se lo sabe»), pero la ansiedad matemática
      consume exactamente la memoria de trabajo que la recuperación necesita. Así que el umbral — 6
      segundos, el mismo que usa la prueba estatutaria inglesa para esta edad (<a
        href="https://www.timestables.co.uk/multiplication-tables-check/"
        target="_blank"
        rel="noopener">Multiplication Tables Check</a
      >) — se mide en silencio, desde que aparece la pregunta hasta el
      <em>primer dígito</em> tecleado. El niño solo ve el resultado después: estrella dorada (rápida)
      o plateada (correcta). La plateada sigue siendo estrella: aquí no existe perder.
    </p>
  </section>

  <section>
    <h2>El fallo es silencioso, neutro, y enseña la respuesta</h2>
    <p>
      El meta-análisis clásico de feedback (607 efectos, 23.663 observaciones) encontró que
      <strong>más de un tercio de las intervenciones de feedback empeoran el rendimiento</strong>, y
      el patrón dañino es el que dirige la atención al yo («lo hiciste mal») en vez de a la tarea (<a
        href="https://mrbartonmaths.com/resourcesnew/8.%20Research/Marking%20and%20Feedback/The%20effects%20of%20feedback%20interventions.pdf"
        target="_blank"
        rel="noopener">Kluger &amp; DeNisi 1996, <em>Psychological Bulletin</em></a
      >). Por eso al fallar no hay zumbido, ni rojo, ni mascota triste: aparece el hecho completo
      («7 × 8 = 56») y se vuelve a preguntar tres ítems después. La corrección informa; jamás
      castiga.
    </p>
  </section>

  <section>
    <h2>Se elogia al hecho, nunca al niño</h2>
    <p>
      Los niños elogiados por «listos» eligen después tareas más fáciles, disfrutan menos y rinden
      peor tras un tropiezo que los elogiados por su trabajo concreto (<a
        href="https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf"
        target="_blank"
        rel="noopener">Mueller &amp; Dweck 1998</a
      >). La app dice «¡56! Esa se resistía» — nunca «¡qué listo eres!».
    </p>
  </section>

  <section>
    <h2>La celebración dura menos que la pregunta</h2>
    <p>
      La métrica que decide si una sesión sirve es cuántas recuperaciones caben en ella. La prueba
      oficial inglesa mete 25 ítems en 5 minutos; muchos juegos entregan un tercio de eso porque el
      confeti roba el tiempo. Aquí la celebración dura ~300 ms y la siguiente pregunta ya está en
      pantalla. La gamificación bien hecha sí ayuda — efectos medios positivos en un meta-análisis
      de 19 estudios (<a href="https://eric.ed.gov/?id=EJ1245270" target="_blank" rel="noopener"
        >Sailer &amp; Homner 2020</a
      >) — pero el juego tiene que <em>ser</em> la matemática, no un envoltorio: la versión
      «intrínseca» del mismo juego produjo más aprendizaje y 7× más juego voluntario (<a
        href="https://eric.ed.gov/?id=EJ922627"
        target="_blank"
        rel="noopener">Habgood &amp; Ainsworth 2011</a
      >).
    </p>
  </section>

  <section>
    <h2>Práctica mezclada, sesiones cortas, y siempre se acaba ganando</h2>
    <p>
      Machacar una tabla seguida construye el patrón, no el hecho («si estamos en los 7, la
      respuesta va de 7 en 7»). Por eso los hechos van mezclados y nunca se repite operando dos
      veces seguidas. Las sesiones son cortas y terminan con tres hechos que va a acertar seguro: se
      para mientras aún quiere otra ronda. Tres ratos de 2–3 minutos repartidos por el día valen más
      que uno largo — ese reparto es el espaciamiento que pide la evidencia.
    </p>
  </section>

  <section>
    <h2>La primera vez que aparece un hecho, la app pregunta antes de enseñar</h2>
    <p>
      Un hecho nuevo se presenta primero como pregunta directa. Si lo responde rápido, se da por
      casi sabido y va directo a consolidación; solo si falla entra la derivación guiada. La app
      verifica lo que ya sabe en vez de suponer que no sabe nada — nadie quiere que le enseñen la
      tabla del 2 que ya domina.
    </p>
  </section>

  <section>
    <h2>«Tu cielo»: el marcador que también enseña</h2>
    <p>
      El mapa de estrellas es la tabla de Pitágoras. Que 7×8 y 8×7 se enciendan a la vez no es un
      adorno: es la conmutatividad hecha visible — la simetría convierte 100 casillas en 55 hechos.
      La diagonal son los cuadrados. Y cada estrella se gana respondiendo en la app: nada viene
      encendido de fábrica.
    </p>
  </section>

  <p class="outro">
    Dos cosas que la app no puede hacer por ti: si un hecho está tan verde que necesita contar con
    los dedos, lo que toca es una mesa con fichas (lo físico va antes que la pantalla); y el mejor
    indicador de que esto funciona no está aquí dentro — es si abre la app dos días seguidos sin que
    se lo pidas.
  </p>
</main>

<style>
  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-block: var(--space-3);
  }

  .back {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    color: var(--ink-soft);
    border-radius: var(--radius-pill);
  }

  h1 {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 600;
  }

  main {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-bottom: var(--space-6);
    font-size: var(--text-note);
    overflow-y: auto;
  }

  .intro,
  .outro {
    color: var(--ink-soft);
  }

  .outro {
    border-top: 1.5px solid var(--ink-faint);
    padding-top: var(--space-4);
  }

  h2 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: var(--space-2);
  }

  section p + p {
    margin-top: var(--space-2);
  }

  a {
    color: var(--tinta-viva);
  }
</style>
