import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { loadFrontSitePayload } from '@/lib/front-site-data';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';
import { HomeCategoryCarousel } from '@/components/marketing/HomeCategoryCarousel';
import { HomeHowItWorksPinned } from '@/components/marketing/HomeHowItWorksPinned';
import { HomeFaq } from '@/components/marketing/HomeFaq';
import {
  Asterisk,
  Spiral,
  Star,
} from '@/components/marketing/DoodleAccents';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';
import { COURSE_IMAGE_BLUR_DATA_URL } from '@/lib/imagePlaceholder';
import type { GeneratedCourseStructure } from '@/types';
import homeStyles from './home.module.css';

export const revalidate = 60;

type FeaturedCourseRow = {
  id: string;
  public_slug: string;
  published_title: string | null;
  topic: string;
  featured_image_url: string | null;
  generated_content: GeneratedCourseStructure | null;
};

type ReviewStatRow = {
  course_id: string;
  rating: number;
};

type HighlightedReviewRow = {
  id: string;
  title: string;
  content: string;
  rating: number;
  author_name: string;
  course_id: string;
  review_date: string;
};

const HERO_AVATARS = [
  { src: '/images/home/avatar_1.jpg', alt: 'Alumna satisfecha 1' },
  { src: '/images/home/avatar_2.jpg', alt: 'Alumna satisfecha 2' },
  { src: '/images/home/avatar_3.jpg', alt: 'Alumna satisfecha 3' },
  { src: '/images/home/avatar_4.jpg', alt: 'Alumna satisfecha 4' },
];

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(n)) return null;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatScoreEs(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

function formatThousands(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n);
}

const TRUST_PILLARS = [
  {
    title: 'Pago 100 % seguro con Hotmart',
    body: 'Compras procesadas por Hotmart, plataforma de referencia con 8 millones de usuarios en todo el mundo.',
    icon: (
      // Escudo doodle con check
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 4 6 7v8c0 6 4.5 11 10 12 5.5-1 10-6 10-12V7z" />
        <path d="m11 16 3 3 6-7" />
      </svg>
    ),
  },
  {
    title: 'Garantía de devolución de 7 días',
    body: 'Si el curso no es para ti, te devolvemos el dinero. Sin preguntas, sin trámites complicados.',
    icon: (
      // Refresh garabato con flecha
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M27 15a11 11 0 0 1-19 7" />
        <path d="M5 17a11 11 0 0 1 19-7" />
        <path d="M24 4v6h-6" />
        <path d="M8 28v-6h6" />
      </svg>
    ),
  },
  {
    title: 'Acceso de por vida y desde cualquier dispositivo',
    body: 'Accede al contenido desde móvil, tablet u ordenador, las veces que quieras. Tu compra no caduca.',
    icon: (
      // Infinito ondulado a mano
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 16c-3 0-5-2-5-5s2-5 5-5c4 0 7 10 14 10 3 0 5-2 5-5s-2-5-5-5c-4 0-7 10-14 10z" />
      </svg>
    ),
  },
  {
    title: 'Diploma incluido en cada curso',
    body: 'Al finalizar recibes un diploma personalizado con código de verificación que puedes compartir.',
    icon: (
      // Diploma con cinta
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="6" width="22" height="14" rx="2.5" />
        <path d="M5 11h22" />
        <path d="m12 28 4-3 4 3v-6" />
        <circle cx="16" cy="16" r="2" />
      </svg>
    ),
  },
  {
    title: 'Bolsa de empleo activa',
    body: 'Cursos con bolsa de trabajo incluyen acceso a oportunidades reales con empresas colaboradoras.',
    icon: (
      // Maletín con asas
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="9" width="24" height="17" rx="2.5" />
        <path d="M11 9V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" />
        <path d="M4 16h24" />
        <path d="M14 16v3M18 16v3" />
      </svg>
    ),
  },
  {
    title: 'Soporte humano en español',
    body: 'Equipo de atención al alumno por correo electrónico para resolver dudas técnicas o de contenido.',
    icon: (
      // Burbuja chat con corazón
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M28 18a5 5 0 0 1-5 5h-1l-5 5v-5h-3a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5h11a5 5 0 0 1 5 5z" />
        <path d="M16 14c.7-1.4 2.4-1.4 3 0 .6-1.4 2.3-1.4 3 0s-3 4-3 4-3.6-2.6-3-4z" />
      </svg>
    ),
  },
];

function pickHighlightedReviews(
  rows: HighlightedReviewRow[],
  limit = 10
): HighlightedReviewRow[] {
  const eligible = rows.filter(
    (r) => r.rating >= 4 && r.content && r.content.length >= 80
  );

  // Agrupamos por curso y ordenamos cada grupo por calidad (rating, longitud, fecha)
  const byCourse = new Map<string, HighlightedReviewRow[]>();
  for (const r of eligible) {
    const list = byCourse.get(r.course_id) ?? [];
    list.push(r);
    byCourse.set(r.course_id, list);
  }
  for (const list of Array.from(byCourse.values())) {
    list.sort((a: HighlightedReviewRow, b: HighlightedReviewRow) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const lenDiff = (b.content?.length ?? 0) - (a.content?.length ?? 0);
      if (lenDiff !== 0) return lenDiff;
      return (b.review_date || '').localeCompare(a.review_date || '');
    });
  }

  // Round-robin entre cursos para que las reseñas estén "mezcladas"
  const courses = Array.from(byCourse.keys());
  const result: HighlightedReviewRow[] = [];
  let idx = 0;
  while (result.length < limit && courses.length > 0) {
    const courseId = courses[idx % courses.length];
    const list = byCourse.get(courseId);
    if (list && list.length > 0) {
      result.push(list.shift() as HighlightedReviewRow);
      idx += 1;
    } else {
      // curso sin más reseñas, lo retiramos del round-robin
      courses.splice(idx % courses.length, 1);
    }
  }

  // Fallback si quedaran huecos por algún motivo (no debería)
  if (result.length < limit) {
    const remaining = eligible.filter((r) => !result.includes(r));
    remaining.sort((a, b) => b.rating - a.rating);
    result.push(...remaining.slice(0, limit - result.length));
  }

  return result;
}

export default async function MarketingHomePage() {
  let featuredRaw: FeaturedCourseRow[] = [];
  let reviewStats: ReviewStatRow[] = [];
  let highlightedReviews: HighlightedReviewRow[] = [];
  let publishedCourses = 0;

  try {
    const supabase = createPublicSupabaseClient();

    const [coursesRes, statsRes, reviewsRes] = await Promise.all([
      supabase
        .from('courses')
        .select(
          'id, public_slug, published_title, topic, featured_image_url, generated_content'
        )
        .eq('status', 'published')
        .not('public_slug', 'is', null)
        .order('published_at', { ascending: false })
        .limit(8),
      supabase.from('course_reviews').select('course_id, rating'),
      supabase
        .from('course_reviews')
        .select('id, title, content, rating, author_name, course_id, review_date')
        .gte('rating', 4)
        .order('review_date', { ascending: false })
        .limit(300),
    ]);

    featuredRaw = (coursesRes.data ?? []) as FeaturedCourseRow[];
    reviewStats = (statsRes.data ?? []) as ReviewStatRow[];
    highlightedReviews = pickHighlightedReviews(
      (reviewsRes.data ?? []) as HighlightedReviewRow[],
      10
    );
  } catch {
    /* fallback silencioso */
  }

  try {
    const supabase = createPublicSupabaseClient();
    const { count } = await supabase
      .from('courses')
      .select('id', { head: true, count: 'exact' })
      .eq('status', 'published')
      .not('public_slug', 'is', null);
    publishedCourses = count ?? featuredRaw.length;
  } catch {
    publishedCourses = featuredRaw.length;
  }

  const totalReviews = reviewStats.length;
  const averageRating =
    totalReviews > 0
      ? reviewStats.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews
      : null;

  const reviewsByCourse = new Map<string, number>();
  for (const r of reviewStats) {
    reviewsByCourse.set(r.course_id, (reviewsByCourse.get(r.course_id) ?? 0) + 1);
  }

  const courseTitleById = new Map<string, string>();
  for (const c of featuredRaw) {
    courseTitleById.set(
      c.id,
      c.published_title || c.generated_content?.title || c.topic
    );
  }

  // Aseguramos tener título para cualquier curso referenciado por las reseñas
  // destacadas (pueden ser distintos de los 8 cursos destacados).
  const missingCourseIds = Array.from(
    new Set(
      highlightedReviews
        .map((r) => r.course_id)
        .filter((id) => id && !courseTitleById.has(id))
    )
  );
  if (missingCourseIds.length > 0) {
    try {
      const supabase = createPublicSupabaseClient();
      const { data } = await supabase
        .from('courses')
        .select('id, published_title, topic')
        .in('id', missingCourseIds);
      for (const c of (data ?? []) as Array<{
        id: string;
        published_title: string | null;
        topic: string | null;
      }>) {
        courseTitleById.set(c.id, c.published_title || c.topic || 'Curso');
      }
    } catch {
      /* ignoramos: simplemente no mostramos el título */
    }
  }

  const featured = featuredRaw.slice(0, 6);
  const { homeHero } = await loadFrontSitePayload();

  return (
    <>
      <section className={homeStyles.hero} aria-labelledby="hero-heading">
        <div className={homeStyles.heroScribbles} aria-hidden>
          <Spiral className={homeStyles.heroScribble1} width={44} height={44} color="#0f172a" strokeWidth={1.6} />
          <Asterisk className={homeStyles.heroScribble2} width={22} height={22} color="#0f172a" strokeWidth={1.8} />
          <Star className={homeStyles.heroScribble3} width={26} height={26} color="#fda4af" strokeWidth={1.6} />
        </div>

        <div className={homeStyles.heroInner}>
          <p className={homeStyles.heroEyebrow}>
            <span className={homeStyles.heroEyebrowDot} aria-hidden />{homeHero.eyebrow}
          </p>
          <h1 id="hero-heading" className={homeStyles.heroTitle}>
            {homeHero.titleLead}{' '}
            <span className={homeStyles.heroAccent}>{homeHero.titleAccent}</span>
            {homeHero.titleRest}
          </h1>
          <p className={homeStyles.heroSubtitle}>
            {homeHero.subtitleLead}
            <span className={homeStyles.markerHighlight}>{homeHero.subtitleHighlight}</span>
            {homeHero.subtitleRest}
          </p>

          <div className={homeStyles.heroSearchWrap}>
            <HomeHeroSearch />
          </div>

          <div className={homeStyles.heroSocialProof}>
            <ul className={homeStyles.heroAvatars} aria-label="Alumnos satisfechos">
              {HERO_AVATARS.map((avatar) => (
                <li key={avatar.alt}>
                  <Image
                    src={avatar.src}
                    alt={avatar.alt}
                    width={44}
                    height={44}
                    quality={90}
                  />
                </li>
              ))}
            </ul>
            <div className={homeStyles.heroReviewBlock}>
              <div className={homeStyles.heroStars} aria-hidden>
                {[0, 1, 2, 3].map((index) => (
                  <svg
                    key={`star-${index}`}
                    className={homeStyles.heroStar}
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="#f5a623"
                      d="M12 17.3 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"
                    />
                  </svg>
                ))}
                <svg
                  className={homeStyles.heroStar}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="heroStarPartial" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="85%" stopColor="#f5a623" />
                      <stop offset="85%" stopColor="#f5a623" stopOpacity="0.22" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#heroStarPartial)"
                    d="M12 17.3 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"
                  />
                </svg>
              </div>
              <p>
                <strong>+1000 alumnos</strong>
              </p>
            </div>
          </div>
        </div>

        <div className={homeStyles.heroFloatTopRight} aria-hidden>
          <span className={homeStyles.heroFloatIcon}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <p className={homeStyles.heroFloatTitle}>Garantía 7 días</p>
            <p className={homeStyles.heroFloatBody}>Devolución sin preguntas</p>
          </div>
        </div>

        <div className={homeStyles.heroFloatBottomLeft} aria-hidden>
          <span className={`${homeStyles.heroFloatIcon} ${homeStyles.heroFloatIconAmber}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="13" rx="2" />
              <path d="M3 9h18" />
              <path d="m9 21 3-2 3 2v-4" />
            </svg>
          </span>
          <div>
            <p className={homeStyles.heroFloatTitle}>Diploma incluido</p>
            <p className={homeStyles.heroFloatBody}>Verificable y compartible</p>
          </div>
        </div>
      </section>

      <section className={homeStyles.metricsBand} aria-label="Recursalia en cifras">
        <div className={homeStyles.metricsPattern} aria-hidden />
        <div className={homeStyles.metricsInner}>
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {publishedCourses > 0 ? formatThousands(publishedCourses) : '—'}
            </span>
            <span className={homeStyles.metricLabel}>Cursos publicados</span>
          </div>
          <span className={homeStyles.metricDivider} aria-hidden />
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {averageRating != null ? formatScoreEs(averageRating) : '—'}
              <span className={homeStyles.metricUnit}>/5</span>
            </span>
            <span className={homeStyles.metricLabel}>Valoración media</span>
          </div>
          <span className={homeStyles.metricDivider} aria-hidden />
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {totalReviews > 0 ? formatThousands(totalReviews) : '—'}
            </span>
            <span className={homeStyles.metricLabel}>Opiniones de alumnos</span>
          </div>
          <span className={homeStyles.metricDivider} aria-hidden />
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>7 días</span>
            <span className={homeStyles.metricLabel}>Garantía de devolución</span>
          </div>
        </div>
      </section>

      <section
        className={homeStyles.section}
        aria-labelledby="categorias-heading"
      >
        <div className={homeStyles.sectionInner}>
          <header className={homeStyles.sectionHead}>
            <p className={homeStyles.kicker}>Explora</p>
            <h2 id="categorias-heading" className={homeStyles.sectionTitle}>
              Encuentra el área que quieres dominar
            </h2>
          </header>
          <HomeCategoryCarousel />
        </div>
      </section>

      {featured.length > 0 ? (
        <section
          className={homeStyles.sectionAlt}
          aria-labelledby="destacados-heading"
        >
          <div className={homeStyles.sectionInner}>
            <header className={homeStyles.sectionHead}>
              <p className={homeStyles.kicker}>Destacados</p>
              <h2 id="destacados-heading" className={homeStyles.sectionTitle}>
                Cursos populares ahora mismo
              </h2>
            </header>

            <ul className={homeStyles.courseGrid}>
              {featured.map((c) => {
                const gc = c.generated_content;
                const title = c.published_title || gc?.title || c.topic;
                const desc = gc?.short_description ?? '';
                const original = formatMoney(gc?.price_original);
                const sale = formatMoney(gc?.price_sale);
                const showStrike =
                  gc?.price_original != null &&
                  gc?.price_sale != null &&
                  gc.price_sale < gc.price_original;
                const reviewCount = reviewsByCourse.get(c.id) ?? 0;
                return (
                  <li key={c.id} className={homeStyles.courseCard}>
                    <Link
                      href={`/cursos/${c.public_slug}`}
                      className={homeStyles.courseCardLink}
                    >
                      <div className={homeStyles.courseImage}>
                        {c.featured_image_url ? (
                          <Image
                            src={c.featured_image_url}
                            alt=""
                            fill
                            sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw"
                            placeholder="blur"
                            blurDataURL={COURSE_IMAGE_BLUR_DATA_URL}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : null}
                        {showStrike ? (
                          <span
                            className={homeStyles.courseSaleBadge}
                            aria-hidden
                          >
                            Oferta
                          </span>
                        ) : null}
                      </div>
                      <div className={homeStyles.courseBody}>
                        <h3 className={homeStyles.courseTitle}>
                          <span>{title}</span>
                        </h3>
                        {desc ? (
                          <p className={homeStyles.courseDesc}>{desc}</p>
                        ) : null}
                        {reviewCount > 0 ? (
                          <p className={homeStyles.courseMeta}>
                            {formatThousands(reviewCount)} valoración
                            {reviewCount === 1 ? '' : 'es'}
                          </p>
                        ) : null}
                        <div className={homeStyles.coursePrice}>
                          {showStrike ? (
                            <span className={homeStyles.coursePriceOld}>
                              {original}
                            </span>
                          ) : null}
                          <span className={homeStyles.coursePriceNow}>
                            {sale ?? original ?? ''}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className={homeStyles.sectionFootCenter}>
              <Link href="/cursos" className={homeStyles.btnPrimary}>
                Ver catálogo completo
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section
        className={homeStyles.section}
        aria-labelledby="comofunciona-heading"
      >
        <div className={homeStyles.sectionInner}>
          <header className={homeStyles.sectionHead}>
            <p className={homeStyles.kicker}>Cómo funciona</p>
            <h2 id="comofunciona-heading" className={homeStyles.sectionTitle}>
              Aprender en Recursalia es así de simple
            </h2>
          </header>
          <HomeHowItWorksPinned />
        </div>
      </section>

      <section
        className={homeStyles.sectionAlt}
        aria-labelledby="confianza-heading"
      >
        <div className={homeStyles.sectionInner}>
          <header className={homeStyles.sectionHead}>
            <p className={homeStyles.kicker}>Por qué Recursalia</p>
            <h2 id="confianza-heading" className={homeStyles.sectionTitle}>
              Compras seguras y sin sorpresas
            </h2>
            <p className={homeStyles.sectionLead}>
              Trabajamos con Hotmart, líder mundial en cursos digitales, para que
              tu compra sea sencilla, segura y con garantía real.
            </p>
          </header>
          <ul className={homeStyles.trustGrid}>
            {TRUST_PILLARS.map((item) => (
              <li key={item.title} className={homeStyles.trustCard}>
                <span className={homeStyles.trustIconWrap} aria-hidden>
                  {item.icon}
                </span>
                <h3 className={homeStyles.trustTitle}>{item.title}</h3>
                <p className={homeStyles.trustBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {highlightedReviews.length > 0 ? (
        <section
          className={homeStyles.section}
          aria-labelledby="opiniones-heading"
        >
          <div className={homeStyles.sectionInner}>
            <header className={homeStyles.sectionHead}>
              <p className={homeStyles.kicker}>Opiniones reales</p>
              <h2 id="opiniones-heading" className={homeStyles.sectionTitle}>
                Lo que dicen los alumnos
              </h2>
            </header>

            <div className={homeStyles.reviewScroller}>
              <ul
                className={homeStyles.reviewGrid}
                role="list"
                aria-label="Opiniones de alumnos"
                tabIndex={0}
              >
                {highlightedReviews.map((r) => {
                  const courseTitle = courseTitleById.get(r.course_id);
                  const initials = (r.author_name || '?')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? '')
                    .join('');
                  return (
                    <li key={r.id} className={homeStyles.reviewCard}>
                      <svg
                        className={homeStyles.reviewQuote}
                        viewBox="0 0 60 48"
                        width="46"
                        height="36"
                        aria-hidden
                      >
                        <path
                          fill="#d8ff5c"
                          d="M14 4c-7 4-12 12-12 22 0 10 6 18 14 18 6 0 10-4 10-10 0-5-4-9-9-9-1 0-2 0-3 1 1-7 5-13 11-17zm32 0c-7 4-12 12-12 22 0 10 6 18 14 18 6 0 10-4 10-10 0-5-4-9-9-9-1 0-2 0-3 1 1-7 5-13 11-17z"
                        />
                      </svg>
                      <StarRatingDisplay value={r.rating} ariaHidden />
                      <h3 className={homeStyles.reviewTitle}>
                        <span>{r.title}</span>
                      </h3>
                      <p className={homeStyles.reviewBody}>{r.content}</p>
                      <p className={homeStyles.reviewAuthor}>
                        <span className={homeStyles.reviewAvatar} aria-hidden>
                          {initials}
                        </span>
                        <span>
                          <strong>{r.author_name}</strong>
                          {courseTitle ? (
                            <span className={homeStyles.reviewCourse}>
                              {' · '}
                              {courseTitle}
                            </span>
                          ) : null}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className={homeStyles.reviewScrollHint} aria-hidden>
                Desliza para ver más
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={homeStyles.sectionAlt} aria-labelledby="faq-heading">
        <div className={homeStyles.sectionInner}>
          <header className={homeStyles.sectionHead}>
            <p className={homeStyles.kicker}>Preguntas frecuentes</p>
            <h2 id="faq-heading" className={homeStyles.sectionTitle}>
              Lo que conviene saber antes de empezar
            </h2>
          </header>
          <HomeFaq />
        </div>
      </section>

      <section className={homeStyles.section} aria-labelledby="cta-heading">
        <div className={homeStyles.sectionInner}>
          <div className={homeStyles.finalCta}>
            <Spiral
              className={homeStyles.finalScribble1}
              width={48}
              height={48}
              color="#0f172a"
              strokeWidth={1.6}
            />
            <Asterisk
              className={homeStyles.finalScribble2}
              width={24}
              height={24}
              color="#0f172a"
              strokeWidth={1.8}
            />
            <h2 id="cta-heading" className={homeStyles.finalTitle}>
              ¿
              <span className={homeStyles.finalAccent}>empezamos</span>? Tu próximo
              curso te está esperando.
            </h2>
            <p className={homeStyles.finalLead}>
              Cientos de horas de contenido aplicado, equipos de expertos y la
              tranquilidad de Hotmart en cada compra.
            </p>
            <div className={homeStyles.finalActions}>
              <Link href="/cursos" className={homeStyles.btnPrimary}>
                Ver el catálogo
              </Link>
              <Link href="/blog" className={homeStyles.btnGhost}>
                Leer el blog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
