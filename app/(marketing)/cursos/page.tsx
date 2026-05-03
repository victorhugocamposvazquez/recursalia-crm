import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../marketing.module.css';
import cursosStyles from './cursos-index.module.css';
import type {
  CourseInputPayload,
  CourseVertical,
  GeneratedCourseStructure,
} from '@/types';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';

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
  title: string | null;
  content: string | null;
  author_name?: string | null;
};

type ReviewStats = {
  avg: number | null;
  count: number;
  samples: { quote: string; author: string }[];
};

const VERTICAL_LABELS: Record<CourseVertical, string> = {
  general: 'General',
  professional_soft: 'Profesional',
  creative: 'Creativo',
  technical_skills: 'Técnico',
};

const VERTICAL_ORDER: CourseVertical[] = [
  'general',
  'professional_soft',
  'creative',
  'technical_skills',
];

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

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

function buildCursosHref(opts: {
  cat?: CourseVertical | 'all';
  q?: string;
}): string {
  const sp = new URLSearchParams();
  const qt = opts.q?.trim();
  const c = opts.cat && opts.cat !== 'all' ? opts.cat : '';
  if (qt) sp.set('q', qt);
  if (c) sp.set('cat', c);
  const s = sp.toString();
  return s ? `/cursos?${s}` : '/cursos';
}

function categoryOfCourse(c: CourseRow): CourseVertical {
  const ip = c.input_payload;
  return ip?.courseVertical ?? 'general';
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return `${(i > 20 ? cut.slice(0, i) : cut).trim()}…`;
}

function buildReviewStats(rows: ReviewDbRow[]): Map<string, ReviewStats> {
  const byCourse = new Map<string, ReviewDbRow[]>();
  for (const r of rows) {
    const list = byCourse.get(r.course_id) ?? [];
    list.push(r);
    byCourse.set(r.course_id, list);
  }

  const stats = new Map<string, ReviewStats>();
  byCourse.forEach((list, courseId) => {
    const ratings = list
      .map((x) => x.rating)
      .filter((n) => typeof n === 'number' && n >= 1 && n <= 5);

    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    const samples: { quote: string; author: string }[] = [];
    const seen = new Set<string>();
    for (const r of list) {
      if (samples.length >= 2) break;
      const raw = [r.title, r.content].filter(Boolean).join(' — ');
      const quote = truncate(stripTags(raw || ''), 130);
      if (quote.length < 8 || seen.has(quote)) continue;
      seen.add(quote);
      const nm = typeof r.author_name === 'string' ? r.author_name.trim() : '';
      const author = nm ? `${nm.split(/\s+/)[0] ?? 'A'}.` : 'Alumno';
      samples.push({ quote, author });
    }

    stats.set(courseId, {
      avg,
      count: ratings.length,
      samples,
    });
  });
  return stats;
}

/** Etiqueta de bestseller igual criterio que la ficha del curso (`input.bestSeller !== false`). */
function bestsellerLabel(gc: GeneratedCourseStructure | null): string {
  const b = gc?.badge?.trim();
  if (b && b.length > 0) {
    return /^best\s*seller$/i.test(b) ? 'Bestseller' : b;
  }
  return 'Bestseller';
}

export default async function CursosIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = searchParams ?? {};
  const rawQ = sp.q;
  const qParam = typeof rawQ === 'string' ? rawQ.trim() : '';
  const qLower = qParam.toLowerCase();

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

  const usedCategories = new Set<CourseVertical>(
    allCourses.map((c) => categoryOfCourse(c)),
  );

  let reviewStats = new Map<string, ReviewStats>();

  if (allCourses.length > 0) {
    try {
      const supabase = createPublicSupabaseClient();
      const ids = allCourses.map((c) => c.id);
      const { data: revData } = await supabase
        .from('course_reviews')
        .select('course_id, rating, title, content, author_name')
        .in('course_id', ids);

      reviewStats = buildReviewStats((revData ?? []) as ReviewDbRow[]);
    } catch {
      reviewStats = new Map();
    }
  }

  let courses = allCourses;

  if (catFilter !== 'all') {
    courses = courses.filter((c) => categoryOfCourse(c) === catFilter);
  }

  if (qLower) {
    courses = courses.filter((c) => {
      const gc = c.generated_content;
      const title = (c.published_title || gc?.title || c.topic || '').toLowerCase();
      const topic = (c.topic || '').toLowerCase();
      const desc = (gc?.short_description || '').toLowerCase();
      return (
        title.includes(qLower) ||
        topic.includes(qLower) ||
        desc.includes(qLower)
      );
    });
  }

  const activeFilters = Boolean(qParam || catFilter !== 'all');

  return (
    <section className={`${styles.section} ${styles.sectionBlogCompact}`}>
      <div className={styles.inner}>
        <h2 className={cursosStyles.catalogH2}>Cursos</h2>

        <div className={cursosStyles.toolbar}>
          <div className={cursosStyles.categories}>
            <span id="catalogo-categorias" className={cursosStyles.categoriesLabel}>
              Categorías
            </span>
            <div
              className={cursosStyles.chips}
              role="navigation"
              aria-labelledby="catalogo-categorias"
            >
              <Link
                href={buildCursosHref({
                  cat: 'all',
                  q: qParam || undefined,
                })}
                className={`${cursosStyles.chip} ${catFilter === 'all' ? cursosStyles.chipActive : ''}`}
              >
                Todos
              </Link>
              {VERTICAL_ORDER.filter(
                (v) => usedCategories.has(v) || usedCategories.size === 0,
              ).map((v) => (
                <Link
                  key={v}
                  href={buildCursosHref({ cat: v, q: qParam || undefined })}
                  className={`${cursosStyles.chip} ${catFilter === v ? cursosStyles.chipActive : ''}`}
                >
                  {VERTICAL_LABELS[v]}
                </Link>
              ))}
            </div>
          </div>

          <form
            className={cursosStyles.searchForm}
            action="/cursos"
            method="get"
            role="search"
            aria-label="Buscar cursos"
          >
            {catFilter !== 'all' ? (
              <input type="hidden" name="cat" value={catFilter} />
            ) : null}
            <div className={cursosStyles.searchField}>
              <input
                type="search"
                name="q"
                className={cursosStyles.searchInput}
                placeholder="Buscar por título o tema…"
                defaultValue={qParam}
                autoComplete="off"
                aria-label="Texto de búsqueda"
              />
              <button type="submit" className={cursosStyles.searchBtn}>
                Buscar
              </button>
            </div>
          </form>
        </div>

        {activeFilters ? (
          <p className={cursosStyles.filterSummary}>
            {[
              catFilter !== 'all' ? VERTICAL_LABELS[catFilter] : null,
              qParam ? `«${qParam}»` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            {' · '}
            {courses.length} resultado{courses.length === 1 ? '' : 's'}
            {' · '}
            <Link href="/cursos">Quitar filtros</Link>
          </p>
        ) : null}

        {courses.length === 0 ? (
          <p className={styles.empty}>
            {activeFilters
              ? 'No hay cursos que coincidan con estos filtros.'
              : 'Aún no hay cursos publicados. Ejecuta la migración SQL en Supabase y publica desde el panel.'}
          </p>
        ) : (
          <div className={cursosStyles.gridTight}>
            {courses.map((c) => {
              const gc = c.generated_content;
              const input = (c.input_payload ?? {}) as CourseInputPayload;
              const title = c.published_title || gc?.title || c.topic;
              const desc = gc?.short_description ?? '';
              const showBestseller = input.bestSeller !== false;

              const original = gc?.price_original;
              const sale = gc?.price_sale;
              const showStrike =
                original != null && sale != null && sale < original;

              const rev = reviewStats.get(c.id);
              const avg = rev?.avg ?? null;
              const revCount = rev?.count ?? 0;
              const samples = rev?.samples ?? [];

              return (
                <article key={c.id} className={cursosStyles.card}>
                  <Link href={`/cursos/${c.public_slug}`}>
                    <div className={cursosStyles.cardImage}>
                      {c.featured_image_url ? (
                        <Image
                          src={c.featured_image_url}
                          alt=""
                          fill
                          sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 25vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                    <div className={cursosStyles.cardBody}>
                      {showBestseller ? (
                        <div className={cursosStyles.badgesRow}>
                          <span className={cursosStyles.bestseller}>
                            <Image
                              src="/images/card-icon-1.webp"
                              alt=""
                              width={17}
                              height={17}
                              className={cursosStyles.bestsellerIcon}
                            />
                            {bestsellerLabel(gc)}
                          </span>
                        </div>
                      ) : null}

                      <h3 className={cursosStyles.title}>{title}</h3>

                      {desc ? <p className={cursosStyles.desc}>{desc}</p> : null}

                      <div className={cursosStyles.priceRow}>
                        {showStrike ? (
                          <span className={cursosStyles.original}>
                            {formatMoney(original)}
                          </span>
                        ) : null}
                        <span className={cursosStyles.sale}>
                          {formatMoney(sale ?? original)}
                        </span>
                      </div>

                      <div className={cursosStyles.reviewsBlock}>
                        {avg != null && revCount > 0 ? (
                          <>
                            <div className={cursosStyles.ratingRow}>
                              <span className={cursosStyles.score}>
                                {avg.toFixed(1).replace('.', ',')}
                              </span>
                              <StarRatingDisplay value={avg} ariaHidden />
                              <span className={cursosStyles.count}>
                                ({revCount}{' '}
                                {revCount === 1 ? 'opinión' : 'opiniones'})
                              </span>
                            </div>
                            {samples.length > 0 ? (
                              <ul className={cursosStyles.quoteList}>
                                {samples.map((s, i) => (
                                  <li key={i} className={cursosStyles.quote}>
                                    «{s.quote}»
                                    <span className={cursosStyles.quoteAuthor}>
                                      — {s.author}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </>
                        ) : (
                          <p className={cursosStyles.ratingMuted}>
                            Sin valoraciones aún
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
