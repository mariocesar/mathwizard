/**
 * Clasificación de latencia al primer dígito. La medición la hace la UI
 * (pintado → primer pointerdown de un dígito); aquí solo se clasifica.
 */
export type Speed = 'fast' | 'slow' | 'invalid';

export function classifyLatency(firstDigitMs: number | null, thresholdMs: number): Speed {
  if (firstDigitMs === null || firstDigitMs < 0) return 'invalid';
  return firstDigitMs <= thresholdMs ? 'fast' : 'slow';
}

/**
 * Gancho de calibración (post-v1): umbral personal a partir de la mediana
 * de las últimas latencias correctas en hechos sembrados de caja 5.
 */
export function calibratedThreshold(latencies: number[], fallbackMs: number): number {
  if (latencies.length < 20) return fallbackMs;
  const sorted = [...latencies].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  return Math.min(8000, Math.max(4000, median * 2.5));
}
