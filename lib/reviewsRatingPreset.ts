/**
 * Perfil de distribución de estrellas para reseñas generadas por IA.
 * `high` y `mixed` se mantienen por compatibilidad con APIs existentes.
 */
export type ReviewsRatingPreset =
  | 'stellar'
  | 'high'
  | 'good'
  | 'mixed'
  | 'critical';

const KNOWN = new Set<ReviewsRatingPreset>([
  'stellar',
  'high',
  'good',
  'mixed',
  'critical',
]);

export function normalizeReviewsRatingPreset(
  raw: string | undefined
): ReviewsRatingPreset {
  if (raw && KNOWN.has(raw as ReviewsRatingPreset)) {
    return raw as ReviewsRatingPreset;
  }
  return 'high';
}

/** Líneas que se añaden al prompt de generación de reseñas (distribución 1–5★). */
export function buildReviewsRatingInstruction(preset: ReviewsRatingPreset): string {
  switch (preset) {
    case 'stellar':
      return 'DISTRIBUCION DE rating (obligatorio): aproximadamente 93-97% deben ser 5 estrellas, el resto 4 estrellas. Ninguna reseña con 3 estrellas o menos.';
    case 'high':
      return 'DISTRIBUCION DE rating (obligatorio): la gran mayoria (80%) deben ser 5 estrellas, la mayoria del resto 4 estrellas. Alguna reseña aislada de 3 estrellas para credibilidad.';
    case 'good':
      return 'DISTRIBUCION DE rating (obligatorio): positiva pero creible: ~30% de 5 estrellas, ~40% de 4 estrellas, ~22% de 3 estrellas, ~8% de 2 estrellas. Evitar 1 salvo 1-2 muy aisladas si encaja.';
    case 'mixed':
      return 'DISTRIBUCION DE rating (obligatorio): 40% de 5 estrellas, 30% de 4 estrellas, 20% de 3 estrellas y 10% de 2 estrellas. Variedad natural.';
    case 'critical':
      return 'DISTRIBUCION DE rating (obligatorio): realista con critica mezclada: ~10% de 5 estrellas, ~20% de 4, ~35% de 3, ~25% de 2 y ~10% de 1 estrella. Textos honestos con pros y contras; no todas pueden ser entusiastas.';
    default:
      return buildReviewsRatingInstruction('high');
  }
}

/** Opciones UI alineadas con `ReviewsRatingPreset`. */
export const REVIEWS_RATING_PRESET_OPTIONS: {
  value: ReviewsRatingPreset;
  label: string;
}[] = [
  {
    value: 'stellar',
    label: '★★★★★ Casi perfecto (solo 5★ y pocas 4★)',
  },
  {
    value: 'high',
    label: '★★★★★ Muy positivo (~80% cinco estrellas)',
  },
  {
    value: 'good',
    label: '★★★★☆ Bueno (centro en 4★; alguna crítica leve)',
  },
  {
    value: 'mixed',
    label: '★★★☆☆ Variado (2★ a 5★ repartidas)',
  },
  {
    value: 'critical',
    label: '★★☆☆☆ Con críticas (incluye 1★–2★ realistas)',
  },
];
