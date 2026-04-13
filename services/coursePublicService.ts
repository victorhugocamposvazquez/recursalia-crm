import { getSupabase } from '@/lib/supabase';
import { slugifyTitle } from '@/utils/slugify';
import type { GeneratedReview } from '@/types';

export async function resolveUniquePublicSlug(
  baseTitle: string,
  excludeCourseId?: string
): Promise<string> {
  const supabase = getSupabase();
  const base = slugifyTitle(baseTitle);
  let candidate = base;
  let n = 2;

  for (;;) {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('public_slug', candidate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Slug check failed: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    if (excludeCourseId && data.id === excludeCourseId) {
      return candidate;
    }

    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function replaceCourseReviews(
  courseId: string,
  reviews: GeneratedReview[]
): Promise<void> {
  const supabase = getSupabase();
  const { error: delErr } = await supabase
    .from('course_reviews')
    .delete()
    .eq('course_id', courseId);
  if (delErr) {
    throw new Error(`Failed to clear reviews: ${delErr.message}`);
  }

  if (reviews.length === 0) return;

  const rows = reviews.map((r) => ({
    course_id: courseId,
    title: r.title,
    content: r.content,
    rating: r.rating,
    author_name: r.author_name,
    review_date: r.date,
  }));

  const { error: insErr } = await supabase.from('course_reviews').insert(rows);
  if (insErr) {
    throw new Error(`Failed to insert reviews: ${insErr.message}`);
  }
}
