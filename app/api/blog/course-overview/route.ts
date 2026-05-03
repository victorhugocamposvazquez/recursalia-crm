import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';

export type BlogCourseOverviewItem = {
  id: string;
  topic: string;
  /** Título público desde generated_content o topic. */
  displayTitle: string;
  public_slug: string | null;
  drafts: number;
  published: number;
};

export async function GET() {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const supabase = getSupabase();
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('id, topic, public_slug, generated_content')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (cErr) throw new Error(cErr.message);

    const { data: rows, error: pErr } = await supabase
      .from('blog_posts')
      .select('course_id, status');

    if (pErr) throw new Error(pErr.message);

    const counts = new Map<string, { drafts: number; published: number }>();

    for (const r of rows ?? []) {
      const cid = r.course_id as string;
      if (!counts.has(cid)) counts.set(cid, { drafts: 0, published: 0 });
      const c = counts.get(cid)!;
      if (r.status === 'draft') c.drafts += 1;
      else if (r.status === 'published') c.published += 1;
    }

    const list = (courses ?? []) as Array<{
      id: string;
      topic: string;
      public_slug: string | null;
      generated_content: GeneratedCourseStructure | null;
    }>;

    const merged: BlogCourseOverviewItem[] = list.map((c) => {
      const gcTitle = (c.generated_content as GeneratedCourseStructure | null)?.title?.trim();
      const displayTitle = gcTitle || c.topic;
      const tally = counts.get(c.id);

      return {
        id: c.id,
        topic: c.topic,
        displayTitle,
        public_slug: c.public_slug,
        drafts: tally?.drafts ?? 0,
        published: tally?.published ?? 0,
      };
    });

    merged.sort((a, b) => {
      const score = (x: BlogCourseOverviewItem) => x.drafts * 1000 + x.published;
      if (score(b) !== score(a)) return score(b) - score(a);
      return a.displayTitle.localeCompare(b.displayTitle, 'es');
    });

    return jsonResponse({ courses: merged });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Blog course overview failed', 500, msg);
  }
}
