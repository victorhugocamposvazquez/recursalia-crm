import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../marketing.module.css';
import cursosStyles from './cursos-index.module.css';
import {
  CursosCatalogClient,
  type CourseCatalogEntry,
} from './CursosCatalogClient';
import type {
  CourseInputPayload,
  CourseVertical,
  GeneratedCourseStructure,
} from '@/types';

export const revalidate = 60;

type CourseRow = {
  id: string;
  public_slug: string;
  published_title: string | null;
  topic: string;
  featured_image_url: string | null;
  generated_content: GeneratedCourseStructure | null;
  input_payload: CourseInputPayload | null;
};

type ReviewDbRow = {
  course_id: string;
  rating: number;
};

function normalizeCat(raw: string | undefined): CourseVertical | 'all' {
  if (
    raw === 'general' ||
    raw === 'professional_soft' ||
    raw === 'creative' ||
    raw === 'technical_skills'
  ) {
    return raw;
  }
  return 'all';
}

function categoryOfCourse(c: CourseRow): CourseVertical {
  return c.input_payload?.courseVertical ?? 'general';
}

/** Etiqueta de bestseller igual criterio que la ficha (`input.bestSeller !== false`). */
function bestsellerLabel(gc: GeneratedCourseStructure | null): string {
  const b = gc?.badge?.trim();
  if (b && b.length > 0) {
    return /^best\s*seller$/i.test(b) ? 'Bestseller' : b;
  }
  return 'Bestseller';
}

function buildReviewStats(
  rows: ReviewDbRow[]
): Map<string, { avg: number | null; count: number }> {
  const byCourse = new Map<string, number[]>();
  for (const r of rows) {
    if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) continue;
    const list = byCourse.get(r.course_id) ?? [];
    list.push(r.rating);
    byCourse.set(r.course_id, list);
  }

  const stats = new Map<string, { avg: number | null; count: number }>();
  byCourse.forEach((ratings, courseId) => {
    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;
    stats.set(courseId, { avg, count: ratings.length });
  });
  return stats;
}

export default async function CursosIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = searchParams ?? {};
  const rawQ = sp.q;
  const qParam = typeof rawQ === 'string' ? rawQ.trim() : '';
  const rawCat = typeof sp.cat === 'string' ? sp.cat.trim() : '';
  const catFilter = normalizeCat(rawCat);

  let allCourses: CourseRow[] = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, public_slug, published_title, topic, featured_image_url, generated_content, input_payload'
      )
      .eq('status', 'published')
      .not('public_slug', 'is', null)
      .order('published_at', { ascending: false });

    allCourses = (data ?? []) as CourseRow[];
  } catch {
    allCourses = [];
  }

  const usedCategoriesList = Array.from(
    new Set(allCourses.map((c) => categoryOfCourse(c))),
  );

  let reviewStats = new Map<string, { avg: number | null; count: number }>();
  if (allCourses.length > 0) {
    try {
      const supabase = createPublicSupabaseClient();
      const ids = allCourses.map((c) => c.id);
      const { data: revData } = await supabase
        .from('course_reviews')
        .select('course_id, rating')
        .in('course_id', ids);

      reviewStats = buildReviewStats((revData ?? []) as ReviewDbRow[]);
    } catch {
      reviewStats = new Map();
    }
  }

  const catalogEntries: CourseCatalogEntry[] = allCourses.map((c) => {
    const gc = c.generated_content;
    const input = (c.input_payload ?? {}) as CourseInputPayload;
    const title = c.published_title || gc?.title || c.topic;
    const rv = reviewStats.get(c.id);
    return {
      id: c.id,
      publicSlug: c.public_slug,
      title,
      desc: gc?.short_description ?? '',
      imageUrl: c.featured_image_url,
      category: categoryOfCourse(c),
      showBestseller: input.bestSeller !== false,
      bestsellerLabel: bestsellerLabel(gc ?? null),
      original: gc?.price_original ?? null,
      sale: gc?.price_sale ?? null,
      avgRating: rv?.avg ?? null,
      reviewCount: rv?.count ?? 0,
    };
  });

  return (
    <section
      className={`${styles.section} ${styles.sectionBlogCompact} ${styles.sectionCursosCatalog}`}
    >
      <div className={styles.inner}>
        <CursosCatalogClient
          key={`${catFilter}|${encodeURIComponent(qParam)}`}
          courses={catalogEntries}
          initialCategory={catFilter}
          initialQuery={qParam}
          usedCategories={usedCategoriesList}
        />
      </div>
    </section>
  );
}
