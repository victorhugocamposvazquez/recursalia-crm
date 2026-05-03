import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  resolveCourseCatalogSlug,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import styles from '../marketing.module.css';
import {
  CursosCatalogClient,
  type CourseCatalogEntry,
} from './CursosCatalogClient';
import type {
  CourseInputPayload,
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
  catalog_category: string | null;
};

type ReviewDbRow = {
  course_id: string;
  rating: number;
};

function normalizeCatParam(
  raw: string | undefined,
  activeSlugs: Set<string>
): string | 'all' {
  if (!raw?.trim()) return 'all';
  const s = raw.trim().toLowerCase();
  return activeSlugs.has(s) ? s : 'all';
}

function categoryOfCourse(c: CourseRow): string {
  return resolveCourseCatalogSlug(c.catalog_category, c.input_payload);
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

  let catalogOptions: CatalogCategoryPublic[] = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
  try {
    const supabase = createPublicSupabaseClient();
    const { data: cats } = await supabase
      .from('catalog_categories')
      .select('slug, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (cats && cats.length > 0) {
      catalogOptions = cats as CatalogCategoryPublic[];
    }
  } catch {
    catalogOptions = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
  }

  const activeSlugSet = new Set(catalogOptions.map((c) => c.slug));
  const catFilter = normalizeCatParam(rawCat, activeSlugSet);

  let allCourses: CourseRow[] = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, public_slug, published_title, topic, featured_image_url, generated_content, input_payload, catalog_category'
      )
      .eq('status', 'published')
      .not('public_slug', 'is', null)
      .order('published_at', { ascending: false });

    allCourses = (data ?? []) as CourseRow[];
  } catch {
    allCourses = [];
  }

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
          catalogOptions={catalogOptions}
          initialCategory={catFilter}
          initialQuery={qParam}
        />
      </div>
    </section>
  );
}
