import Link from 'next/link';
import Image from 'next/image';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';
import { HomeCategoryGrid } from '@/components/marketing/HomeCategoryGrid';
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

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Elige el curso',
    body: 'Más de un centenar de cursos prácticos en categorías como salud, marketing, idiomas, finanzas o fotografía.',
  },
  {
    step: '02',
    title: 'Aprende a tu ritmo',
    body: 'Acceso de por vida a vídeos, lecciones y material descargable. Empieza hoy y avanza cuando quieras.',
  },
  {
    step: '03',
    title: 'Demuéstralo',
    body: 'Recibe diploma de aprovechamiento al completar el curso y suma puntos para nuestra bolsa de empleo.',
  },
];

const TRUST_PILLARS = [
  {
    title: 'Pago 100 % seguro con Hotmart',
    body: 'Compras procesadas por Hotmart, plataforma de referencia con 8 millones de usuarios en todo el mundo.',
  },
  {
    title: 'Garantía de devolución de 7 días',
    body: 'Si el curso no es para ti, te devolvemos el dinero. Sin preguntas, sin trámites complicados.',
  },
  {
    title: 'Acceso de por vida y desde cualquier dispositivo',
    body: 'Accede al contenido desde móvil, tablet u ordenador, las veces que quieras. Tu compra no caduca.',
  },
  {
    title: 'Diploma incluido en cada curso',
    body: 'Al finalizar recibes un diploma personalizado con código de verificación que puedes compartir.',
  },
  {
    title: 'Bolsa de empleo activa',
    body: 'Cursos con bolsa de trabajo incluyen acceso a oportunidades reales con empresas colaboradoras.',
  },
  {
    title: 'Soporte humano en español',
    body: 'Equipo de atención al alumno por correo electrónico para resolver dudas técnicas o de contenido.',
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
        <div className={homeStyles.heroInner}>
          <p className={homeStyles.heroEyebrow}>
            Aprende algo nuevo. Cambia tu próxima decisión.
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

          <div className={homeStyles.heroProof}>
            {averageRating != null && totalReviews > 0 ? (
              <div className={homeStyles.heroProofBlock}>
                <span className={homeStyles.heroProofScore}>
                  {formatScoreEs(averageRating)}
                </span>
                <StarRatingDisplay value={averageRating} ariaHidden />
                <span className={homeStyles.heroProofMeta}>
                  {formatThousands(totalReviews)} valoraciones
                </span>
              </div>
            ) : null}
            {publishedCourses > 0 ? (
              <div className={homeStyles.heroProofBlock}>
                <strong>{formatThousands(publishedCourses)}</strong> cursos
                publicados
              </div>
            ) : null}
            <div className={homeStyles.heroProofBlock}>
              <strong>7 días</strong> de garantía Hotmart
            </div>
          </div>
        </div>
      </section>

      <section className={homeStyles.metricsBand} aria-label="Recursalia en cifras">
        <div className={homeStyles.metricsInner}>
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {publishedCourses > 0 ? formatThousands(publishedCourses) : '—'}
            </span>
            <span className={homeStyles.metricLabel}>Cursos publicados</span>
          </div>
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {averageRating != null ? formatScoreEs(averageRating) : '—'}
              <span className={homeStyles.metricUnit}>/5</span>
            </span>
            <span className={homeStyles.metricLabel}>Valoración media</span>
          </div>
          <div className={homeStyles.metric}>
            <span className={homeStyles.metricValue}>
              {totalReviews > 0 ? formatThousands(totalReviews) : '—'}
            </span>
            <span className={homeStyles.metricLabel}>Opiniones de alumnos</span>
          </div>
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
          <HomeCategoryGrid />
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
          <ol className={homeStyles.steps}>
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className={homeStyles.stepCard}>
                <span className={homeStyles.stepNumber}>{item.step}</span>
                <h3 className={homeStyles.stepTitle}>{item.title}</h3>
                <p className={homeStyles.stepBody}>{item.body}</p>
              </li>
            ))}
          </ol>
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
                <svg
                  className={homeStyles.trustIcon}
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
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
                    <StarRatingDisplay value={r.rating} ariaHidden />
                    <h3 className={homeStyles.reviewTitle}>{r.title}</h3>
                    <p className={homeStyles.reviewBody}>“{r.content}”</p>
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
