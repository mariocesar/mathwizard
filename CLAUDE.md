# Matemago / Math Wizard — identidad visual

La marca se llama **Matemago** en español y **Math Wizard** en inglés. Su dirección
visual es **«Tinta y Estrellas»**: aprender matemáticas se siente como practicar
magia en un libro ilustrado. Debe resultar lúdica y capaz, con el acabado cuidado
de un juego móvil, sin parecer infantil ni una interfaz corporativa.

## Imagen de marca

Los iconos de `public/icons/` son la referencia visual principal. Muestran un
sombrero de mago índigo, suave y con volumen, de ala curva y ribetes dorados. Una
**× dorada grande** brilla en el frente: la multiplicación es parte de la identidad,
no un adorno genérico. Unos pocos destellos de cuatro puntas y una estela de luz
rodean el sombrero. El centro tiene un resplandor cálido de vitela; los bordes se
oscurecen hacia violeta tinta. La silueta y la × se reconocen incluso en tamaños
pequeños.

El arte tiene profundidad, textura de tela y luz suave, pero mantiene una
composición sencilla. Evita saturarlo de símbolos, estrellas o efectos; evita
también el brillo plástico, el neón y los personajes con rostro añadidos a la
marca. No pongas texto dentro de los iconos ni dibujes esquinas redondeadas en
el archivo: cada plataforma aplica su propia máscara.

## Cómo llevarla a la interfaz

- Usa los tokens de `src/app.css` como fuente de verdad. La base diurna es vitela
  `#faf5ec` con tinta índigo `#2e2a52`; el dorado `#e3a83b` y su luz `#f5c86b`
  señalan magia, progreso y aciertos. Reserva el cielo índigo oscuro para la
  escena nocturna. No uses rojo; los aciertos nunca son verdes.
- Da protagonismo a los números y a las operaciones. Emplea Fredoka para títulos
  y cifras grandes, Atkinson Hyperlegible para texto de interfaz. Mantén los
  ejercicios fáciles de leer y tocar antes de añadir decoración.
- Traduce el volumen del icono con capas cálidas, bordes definidos y sombras
  discretas. Usa destellos y resplandores dorados como acentos de celebración o
  descubrimiento, no como fondo permanente de controles o texto.
- Repite motivos concretos de la marca —sombrero, ×, estrellas de cuatro puntas,
  trazos de constelación— con moderación. Una ilustración protagonista puede ser
  rica; botones, tarjetas y estados deben seguir siendo claros y consistentes.
- El tono emocional es alentador y curioso. Los fallos no se representan con
  alarmas rojas, caras tristes ni castigos visuales. Respeta contraste, tamaño de
  toque y preferencias de movimiento reducido.

## Archivos de iconos

Los originales están en `scripts/assets/icon-master.png` y
`scripts/assets/icon-maskable-master.png`. Ejecuta `bun run icons` para regenerar
los PNG de `public/icons/` y `public/favicon.png`. El icono maskable conserva el
sombrero completo dentro de la zona segura circular central; comprueba su recorte
antes de cambiar el arte.
