import { getSupabase } from '@/lib/supabase';
import {
  estimateGeminiImageCostUsd,
  estimateOpenAiCostUsd,
} from '@/lib/ai-pricing';

export type AiUsageProvider = 'openai' | 'google_gemini';

export interface LogAiUsageRow {
  provider: AiUsageProvider;
  operation: string;
  model: string;
  input_tokens?: number | null;
  output_tokens?: number | null;
  image_requests?: number;
  course_id?: string | null;
  metadata?: Record<string, unknown>;
}

function computeEstimatedUsd(row: LogAiUsageRow): number {
  if (row.provider === 'openai') {
    return estimateOpenAiCostUsd(
      row.model,
      row.input_tokens,
      row.output_tokens
    );
  }
  const imgs = row.image_requests ?? 0;
  return estimateGeminiImageCostUsd(imgs);
}

/**
 * Inserta un registro de uso; no bloquea ni lanza (errores → consola).
 */
export function logAiUsage(row: LogAiUsageRow): void {
  void insertAiUsage(row);
}

async function insertAiUsage(row: LogAiUsageRow): Promise<void> {
  try {
    const estimated_cost_usd = computeEstimatedUsd(row);
    const { error } = await getSupabase().from('ai_usage_log').insert({
      provider: row.provider,
      operation: row.operation,
      model: row.model,
      input_tokens: row.input_tokens ?? null,
      output_tokens: row.output_tokens ?? null,
      image_requests: row.image_requests ?? 0,
      estimated_cost_usd,
      course_id: row.course_id ?? null,
      metadata: row.metadata ?? {},
    });
    if (error) {
      console.warn('[ai_usage_log] insert failed:', error.message);
    }
  } catch (e) {
    console.warn('[ai_usage_log]', e);
  }
}

export function logOpenAiChatUsage(
  operation: string,
  model: string,
  usage:
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      }
    | undefined,
  courseId?: string | null,
  metadata?: Record<string, unknown>
): void {
  if (!usage) return;
  logAiUsage({
    provider: 'openai',
    operation,
    model,
    input_tokens: usage.prompt_tokens ?? null,
    output_tokens: usage.completion_tokens ?? null,
    course_id: courseId ?? undefined,
    metadata,
  });
}

export function logGeminiImageUsage(
  operation: string,
  model: string,
  courseId?: string | null,
  imageRequests: number = 1,
  metadata?: Record<string, unknown>
): void {
  logAiUsage({
    provider: 'google_gemini',
    operation,
    model,
    image_requests: imageRequests,
    course_id: courseId ?? undefined,
    metadata,
  });
}
