import { getSupabase } from '@/lib/supabase';
import { slugifyTitle } from '@/utils/slugify';
import type { GeneratedReview } from '@/types';

function normalizeReviewDate(raw: string): string {
  const trimmed = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function clampRating(r: number): number {
  const n = Math.round(Number(r));
  if (!Number.isFinite(n)) return 5;
  return Math.min(5, Math.max(1, n));
}

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
    title: String(r.title).slice(0, 500),
    content: String(r.content ?? '').slice(0, 8000),
    rating: clampRating(r.rating),
    author_name: String(r.author_name).slice(0, 200),
    review_date: normalizeReviewDate(r.date),
  }));

  const { error: insErr } = await supabase.from('course_reviews').insert(rows);
  if (insErr) {
    throw new Error(`Failed to insert reviews: ${insErr.message}`);
  }
}
