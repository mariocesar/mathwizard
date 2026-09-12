/**
 * Números en palabras, 0–100. Las frases habladas van SIEMPRE en palabras:
 * las voces malas de Android leen «56» dígito a dígito y el símbolo «×»
 * como «equis» — las palabras son deterministas en cualquier voz.
 */
const UNIDADES = [
  'cero',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  'veintiuno',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
] as const;

const DECENAS: Record<number, string> = {
  3: 'treinta',
  4: 'cuarenta',
  5: 'cincuenta',
  6: 'sesenta',
  7: 'setenta',
  8: 'ochenta',
  9: 'noventa',
};

export function enPalabras(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new Error(`Fuera de rango (0–100): ${n}`);
  }
  if (n < 30) return UNIDADES[n]!;
  if (n === 100) return 'cien';
  const decena = Math.floor(n / 10);
  const resto = n % 10;
  const base = DECENAS[decena]!;
  return resto === 0 ? base : `${base} y ${UNIDADES[resto]!}`;
}

/** «siete por ocho, cincuenta y seis» — la cadena verbal completa. */
export function hechoEnPalabras(a: number, b: number): string {
  return `${enPalabras(a)} por ${enPalabras(b)}, ${enPalabras(a * b)}`;
}
