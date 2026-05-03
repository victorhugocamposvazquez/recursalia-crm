import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { CourseRecord } from '@/types';

export async function GET() {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const supabase = getSupabase();
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(400);

    if (cErr) throw new Error(cErr.message);

    const list = (courses ?? []) as CourseRecord[];
    const ids = list.map((c) => c.id);

    let reviewCountByCourse: Record<string, number> = {};

    const chunkSize = 50;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      const { data: rows, error: rr } = await supabase
        .from('course_reviews')
        .select('course_id')
        .in('course_id', chunk);

      if (rr) continue;
      for (const row of rows ?? []) {
        const cid = row.course_id as string;
        reviewCountByCourse[cid] = (reviewCountByCourse[cid] ?? 0) + 1;
      }
    }

    const publishedNoImage = list.filter(
      (c) =>
        c.status === 'published' &&
        !(c.featured_image_url && c.featured_image_url.trim()),
    ).length;

    const publishedNoHotmart = list.filter(
      (c) =>
        c.status === 'published' &&
        !(c.hotmart_product_id && /^https?:\/\//i.test(c.hotmart_product_id)),
    ).length;

    const draftsWithReviewErrors = list.filter(
      (c) =>
        c.status !== 'published' &&
        c.generated_content &&
        c.error_log?.includes('--- ERRORES ---'),
    ).length;

    return jsonResponse({
      courses: list,
      reviewCountByCourse,
      aggregates: {
        total: list.length,
        published: list.filter((c) => c.status === 'published').length,
        draft: list.filter((c) => c.status === 'draft').length,
        error: list.filter((c) => c.status === 'error').length,
        publishedMissingImage: publishedNoImage,
        publishedMissingHotmart: publishedNoHotmart,
        draftWithReviewErrorsFlag: draftsWithReviewErrors,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Operations fetch failed', 500, msg);
  }
}
