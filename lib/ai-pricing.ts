/**
 * Precios orientativos USD por 1M tokens (facturación estimada interna).
 * Ajustar según tarifas actuales de OpenAI/Google; no sustituye a las facturas oficiales.
 */
const OPENAI_USD_PER_1M: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

const DEFAULT_MODEL_KEY = 'gpt-4o-mini';

export function estimateOpenAiCostUsd(
  model: string,
  inputTokens?: number | null,
  outputTokens?: number | null
): number {
  const rates =
    OPENAI_USD_PER_1M[model] ?? OPENAI_USD_PER_1M[DEFAULT_MODEL_KEY];
  const inT = Math.max(0, inputTokens ?? 0);
  const outT = Math.max(0, outputTokens ?? 0);
  return (inT / 1_000_000) * rates.input + (outT / 1_000_000) * rates.output;
}

/** Coste estimado por imagen generada (configurable; Gemini no expone token breakdown homogéneo). */
export function estimateGeminiImageCostUsd(imageCount: number = 1): number {
  const raw = process.env.AI_GEMINI_IMAGE_USD_ESTIMATE ?? '0.04';
  const per = Number.parseFloat(raw);
  const unit = Number.isFinite(per) && per >= 0 ? per : 0.04;
  return unit * Math.max(0, imageCount);
}
