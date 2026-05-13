import { cache } from 'react';
import { getSupabase } from '@/lib/supabase';
import { HOME_COURSE_CATEGORIES } from '@/lib/homeContent';
import type {
  FrontCategoryPublic,
  FrontHomeHeroCopy,
  FrontSearchCopy,
  FrontSitePayload,
} from '@/types';

const SEARCH_COPY_KEYS = [
  'search_hero',
  'search_hero_lines',
  'search_header',
  'search_drawer',
] as const;

const HOME_COPY_KEYS = [
  'home_eyebrow',
  'home_title_lead',
  'home_title_accent',
  'home_title_rest',
  'home_sub_lead',
  'home_sub_highlight',
  'home_sub_rest',
] as const;

const ALL_COPY_KEYS = [...SEARCH_COPY_KEYS, ...HOME_COPY_KEYS];

export const STATIC_SEARCH_COPY: FrontSearchCopy = {
  hero: 'Encuentra tu recurso perfecto…',
  heroLines: ['Encuentra tu recurso perfecto…'],
  header: '¿Qué quieres aprender?',
  drawer: '¿Qué quieres aprender?',
};

export const STATIC_HOME_HERO: FrontHomeHeroCopy = {
  eyebrow: 'Mejora tu presente. Decide tu futuro',
  titleLead: 'Cursos online claros y aplicables, creados por',
  titleAccent: 'expertos',
  titleRest: '.',
  subtitleLead: 'Diploma incluido, acceso de por vida y ',
  subtitleHighlight: '7 días de garantía',
  subtitleRest: '. Empieza hoy y avanza a tu ritmo, sin compromisos.',
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

function mapHomeHeroFromRows(rows: { key: string; value: string }[] | null): FrontHomeHeroCopy {
  const m = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
  const d = STATIC_HOME_HERO;
  const t = (key: string, fallback: string) => m[key]?.trim() || fallback;
  return {
    eyebrow: t('home_eyebrow', d.eyebrow),
    titleLead: t('home_title_lead', d.titleLead),
    titleAccent: t('home_title_accent', d.titleAccent),
    titleRest: t('home_title_rest', d.titleRest),
    subtitleLead: t('home_sub_lead', d.subtitleLead),
    subtitleHighlight: t('home_sub_highlight', d.subtitleHighlight),
    subtitleRest: t('home_sub_rest', d.subtitleRest),
  };
}

function staticCategories(): FrontCategoryPublic[] {
  return HOME_COURSE_CATEGORIES.map((c, i) => ({
    id: `static-${i}`,
    label: c.label,
    q: c.q,
  }));
}

async function fetchFrontPayload(): Promise<FrontSitePayload> {
  try {
    const supabase = getSupabase();
    const [catsRes, copyRes] = await Promise.all([
      supabase
        .from('front_course_categories')
        .select('id,label,query_q')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('front_site_copy').select('key,value').in('key', [...ALL_COPY_KEYS]),
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

    const copyRows = copyRes.data ?? [];

    return {
      categories,
      searchCopy: mapCopyRows(copyRows),
      homeHero: mapHomeHeroFromRows(copyRows),
    };
  } catch {
    return {
      categories: staticCategories(),
      searchCopy: { ...STATIC_SEARCH_COPY },
      homeHero: { ...STATIC_HOME_HERO },
    };
  }
}

/** Datos para el sitio público (solo categorías activas). Memoizado por petición RSC. */
export const loadFrontSitePayload = cache(fetchFrontPayload);

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
  homeHero: FrontHomeHeroCopy;
} | null> {
  try {
    const supabase = getSupabase();
    const [catsRes, copyRes] = await Promise.all([
      supabase
        .from('front_course_categories')
        .select('id,label,query_q,sort_order,is_active')
        .order('sort_order', { ascending: true }),
      supabase.from('front_site_copy').select('key,value').in('key', [...ALL_COPY_KEYS]),
    ]);

    if (catsRes.error) throw catsRes.error;
    if (copyRes.error) throw copyRes.error;

    const copyRows = copyRes.data ?? [];

    return {
      categories: (catsRes.data ?? []) as FrontCategoryRow[],
      searchCopy: mapCopyRows(copyRows),
      homeHero: mapHomeHeroFromRows(copyRows),
    };
  } catch {
    return null;
  }
}
