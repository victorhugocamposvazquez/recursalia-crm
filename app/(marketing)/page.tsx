import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';
import { HomeCategoryCarousel } from '@/components/marketing/HomeCategoryCarousel';
import { HomeHowItWorksPinned } from '@/components/marketing/HomeHowItWorksPinned';
import { HomeFaq } from '@/components/marketing/HomeFaq';
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
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Garantía de devolución de 7 días',
    body: 'Si el curso no es para ti, te devolvemos el dinero. Sin preguntas, sin trámites complicados.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
    ),
  },
  {
    title: 'Acceso de por vida y desde cualquier dispositivo',
    body: 'Accede al contenido desde móvil, tablet u ordenador, las veces que quieras. Tu compra no caduca.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18.5 12c2 0 3.5-1.6 3.5-3.5S20.5 5 18.5 5s-3.5 1.6-3.9 3.4C14 11 11 13 9 13s-3.5 1.6-3.5 3.5S7 20 9 20s3.5-1.6 3.9-3.4C14 14 16 12 18.5 12Z" />
      </svg>
    ),
  },
  {
    title: 'Diploma incluido en cada curso',
    body: 'Al finalizar recibes un diploma personalizado con código de verificación que puedes compartir.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M3 9h18" />
        <path d="m9 21 3-2 3 2v-4" />
      </svg>
    ),
  },
  {
    title: 'Bolsa de empleo activa',
    body: 'Cursos con bolsa de trabajo incluyen acceso a oportunidades reales con empresas colaboradoras.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M3 13h18" />
      </svg>
    ),
  },
  {
    title: 'Soporte humano en español',
    body: 'Equipo de atención al alumno por correo electrónico para resolver dudas técnicas o de contenido.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a4 4 0 0 1-4 4h-1l-4 3v-3H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z" />
      </svg>
    ),
  },
];

function pickHighlightedReviews(rows: HighlightedReviewRow[]): HighlightedReviewRow[] {
  return rows
    .filter((r) => r.rating >= 4 && r.content && r.content.length >= 80)
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (b.content?.length ?? 0) - (a.content?.length ?? 0);
    })
    .slice(0, 3);
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
        .limit(60),
    ]);

    featuredRaw = (coursesRes.data ?? []) as FeaturedCourseRow[];
    reviewStats = (statsRes.data ?? []) as ReviewStatRow[];
    highlightedReviews = pickHighlightedReviews(
      (reviewsRes.data ?? []) as HighlightedReviewRow[]
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

  const featured = featuredRaw.slice(0, 6);

  return (
    <>
      <section className={homeStyles.hero} aria-labelledby="hero-heading">
        <div className={homeStyles.heroBlobs} aria-hidden>
          <span className={homeStyles.heroBlobBlue} />
          <span className={homeStyles.heroBlobAmber} />
          <svg
            className={homeStyles.heroGrid}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <pattern
                id="hero-dotgrid"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="#cbd5e1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dotgrid)" />
          </svg>
        </div>

        <div className={homeStyles.heroInner}>
          <p className={homeStyles.heroEyebrow}>
            <span className={homeStyles.heroEyebrowDot} aria-hidden /> Aprende algo
            nuevo. Cambia tu próxima decisión.
          </p>
          <h1 id="hero-heading" className={homeStyles.heroTitle}>
            Cursos online claros y aplicables, creados por expertos.
          </h1>
          <p className={homeStyles.heroSubtitle}>
            Diploma incluido, acceso de por vida y 7 días de garantía. Empieza hoy
            y avanza a tu ritmo, sin compromisos.
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
                {averageRating != null && totalReviews > 0 ? (
                  <>
                    {' · '}
                    {formatScoreEs(averageRating)} sobre {formatThousands(totalReviews)} valoraciones
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className={homeStyles.heroFloatTopRight} aria-hidden>
          <span className={homeStyles.heroFloatIcon}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="13" rx="2" />
              <path d="M3 9h18" />
              <path d="m9 21 3-2 3 2v-4" />
            </svg>
          </span>
          <div>
            <p className={homeStyles.heroFloatTitle}>
              Diploma incluido
              <span className={homeStyles.heroFloatBadge}>Nuevo</span>
            </p>
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
                      </div>
                      <div className={homeStyles.courseBody}>
                        <h3 className={homeStyles.courseTitle}>{title}</h3>
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
              {averageRating != null ? (
                <div className={homeStyles.opinionsAverage}>
                  <span className={homeStyles.opinionsScore}>
                    {formatScoreEs(averageRating)}
                  </span>
                  <StarRatingDisplay value={averageRating} ariaHidden />
                  <span className={homeStyles.opinionsCount}>
                    Sobre {formatThousands(totalReviews)} valoraciones
                  </span>
                </div>
              ) : null}
            </header>

            <ul className={homeStyles.reviewGrid}>
              {highlightedReviews.map((r) => {
                const courseTitle = courseTitleById.get(r.course_id);
                return (
                  <li key={r.id} className={homeStyles.reviewCard}>
                    <span className={homeStyles.reviewQuote} aria-hidden>
                      “
                    </span>
                    <StarRatingDisplay value={r.rating} ariaHidden />
                    <h3 className={homeStyles.reviewTitle}>{r.title}</h3>
                    <p className={homeStyles.reviewBody}>{r.content}</p>
                    <p className={homeStyles.reviewAuthor}>
                      <strong>{r.author_name}</strong>
                      {courseTitle ? (
                        <span className={homeStyles.reviewCourse}>
                          {' · '}
                          {courseTitle}
                        </span>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
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
            <svg
              className={homeStyles.finalMesh}
              viewBox="0 0 600 320"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <pattern
                  id="cta-grid"
                  x="0"
                  y="0"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="600" height="320" fill="url(#cta-grid)" />
            </svg>
            <span className={homeStyles.finalGlow} aria-hidden />
            <h2 id="cta-heading" className={homeStyles.finalTitle}>
              ¿Empezamos? Tu próximo curso te está esperando.
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
