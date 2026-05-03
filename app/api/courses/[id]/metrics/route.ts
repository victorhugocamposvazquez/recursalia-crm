import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { count: reviewsCountRaw, error: rErr } = await supabase
      .from('course_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', id);

    if (rErr) throw new Error(rErr.message);

    const { count: draftBlogRaw, error: bErr } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', id)
      .eq('status', 'draft');

    if (bErr) throw new Error(bErr.message);

    return jsonResponse({
      reviewsCount: reviewsCountRaw ?? 0,
      draftBlogCount: draftBlogRaw ?? 0,
      siteUrlConfigured: Boolean(
        process.env.NEXT_PUBLIC_SITE_URL?.trim().startsWith('http'),
      ),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Metrics failed', 500, msg);
  }
}
