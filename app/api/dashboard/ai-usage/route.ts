import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

interface AiUsageRow {
  id: string;
  created_at: string;
  provider: string;
  operation: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  image_requests: number;
  estimated_cost_usd: string | number;
  course_id: string | null;
  metadata: Record<string, unknown>;
}

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  const daysRaw = req.nextUrl.searchParams.get('days');
  let days = 60;
  if (daysRaw) {
    const n = Number.parseInt(daysRaw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 730) days = n;
  }

  try {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const sinceIso = since.toISOString();

    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from('ai_usage_log')
      .select(
        'id, created_at, provider, operation, model, input_tokens, output_tokens, image_requests, estimated_cost_usd, course_id, metadata'
      )
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);

    const list = (rows ?? []) as AiUsageRow[];
    let totalUsd = 0;
    const byProvider: Record<string, number> = {};
    const opMap = new Map<
      string,
      { operation: string; count: number; usd: number }
    >();

    for (const r of list) {
      const usd = toNum(r.estimated_cost_usd);
      totalUsd += usd;
      byProvider[r.provider] = (byProvider[r.provider] ?? 0) + usd;
      const prev = opMap.get(r.operation) ?? {
        operation: r.operation,
        count: 0,
        usd: 0,
      };
      prev.count += 1;
      prev.usd += usd;
      opMap.set(r.operation, prev);
    }

    const by_operation = Array.from(opMap.values()).sort(
      (a, b) => b.usd - a.usd
    );

    return jsonResponse({
      period: { from: sinceIso, days },
      totals: {
        estimated_cost_usd: totalUsd,
        events: list.length,
        by_provider: byProvider,
      },
      by_operation,
      recent: list.slice(0, 120).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        provider: r.provider,
        operation: r.operation,
        model: r.model,
        input_tokens: r.input_tokens,
        output_tokens: r.output_tokens,
        image_requests: r.image_requests,
        estimated_cost_usd: toNum(r.estimated_cost_usd),
        course_id: r.course_id,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('ai-usage fetch failed', 500, msg);
  }
}
