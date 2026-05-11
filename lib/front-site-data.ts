import { getSupabase } from '@/lib/supabase';
import { HOME_COURSE_CATEGORIES } from '@/lib/homeContent';
import type { FrontCategoryPublic, FrontSearchCopy, FrontSitePayload } from '@/types';

const COPY_KEYS = [
  'search_hero',
  'search_hero_lines',
  'search_header',
  'search_drawer',
] as const;

export const STATIC_SEARCH_COPY: FrontSearchCopy = {
  hero: 'Encuentra tu recurso perfecto…',
  heroLines: ['Encuentra tu recurso perfecto…'],
  header: '¿Qué quieres aprender?',
  drawer: '¿Qué quieres aprender?',
};

function parseHeroLinesJson(raw: string | undefined): string[] | null {
  if (raw == null || raw.trim() === '') return null;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return null;
    const lines = j
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

function mapCopyRows(rows: { key: string; value: string }[] | null): FrontSearchCopy {
  const m = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
  const heroBase = m.search_hero ?? STATIC_SEARCH_COPY.hero;
  const fromJson = parseHeroLinesJson(m.search_hero_lines);
  const heroLines = fromJson ?? [heroBase];
  return {
    hero: heroLines[0] ?? heroBase,
    heroLines,
    header: m.search_header ?? STATIC_SEARCH_COPY.header,
    drawer: m.search_drawer ?? STATIC_SEARCH_COPY.drawer,
  };
}

function staticCategories(): FrontCategoryPublic[] {
  return HOME_COURSE_CATEGORIES.map((c, i) => ({
    id: `static-${i}`,
    label: c.label,
    q: c.q,
  }));
}

/** Datos para el sitio público (solo categorías activas). */
export async function loadFrontSitePayload(): Promise<FrontSitePayload> {
  try {
    const supabase = getSupabase();
    const [catsRes, copyRes] = await Promise.all([
      supabase
        .from('front_course_categories')
        .select('id,label,query_q')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('front_site_copy').select('key,value').in('key', [...COPY_KEYS]),
    ]);

    if (catsRes.error) throw catsRes.error;
    if (copyRes.error) throw copyRes.error;

    const rows = catsRes.data ?? [];
    const categories: FrontCategoryPublic[] =
      rows.length > 0
        ? rows.map((r) => ({
            id: r.id,
            label: r.label,
            q: r.query_q,
          }))
        : staticCategories();

    return {
      categories,
      searchCopy: mapCopyRows(copyRes.data),
    };
  } catch {
    return {
      categories: staticCategories(),
      searchCopy: { ...STATIC_SEARCH_COPY },
    };
  }
}

export type FrontCategoryRow = {
  id: string;
  label: string;
  query_q: string;
  sort_order: number;
  is_active: boolean;
};

/** Panel admin: todas las categorías + textos. */
export async function loadFrontSiteAdmin(): Promise<{
  categories: FrontCategoryRow[];
  searchCopy: FrontSearchCopy;
} | null> {
  try {
    const supabase = getSupabase();
    const [catsRes, copyRes] = await Promise.all([
      supabase
        .from('front_course_categories')
        .select('id,label,query_q,sort_order,is_active')
        .order('sort_order', { ascending: true }),
      supabase.from('front_site_copy').select('key,value').in('key', [...COPY_KEYS]),
    ]);

    if (catsRes.error) throw catsRes.error;
    if (copyRes.error) throw copyRes.error;

    return {
      categories: (catsRes.data ?? []) as FrontCategoryRow[],
      searchCopy: mapCopyRows(copyRes.data),
    };
  } catch {
    return null;
  }
}
