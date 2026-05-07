import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { CourseProgramAccordion } from '@/components/marketing/CourseProgramAccordion';
import { CourseReviewList, type ReviewRow } from '@/components/marketing/CourseReviewList';
import { CourseSectionNav } from '@/components/marketing/CourseSectionNav';
import { CourseStickyCheckoutBar } from '@/components/marketing/CourseStickyCheckoutBar';
import { CourseRelated, type RelatedCourse } from '@/components/marketing/CourseRelated';
import { SalaryMoneyBagIcon } from '@/components/marketing/SalaryMoneyBagIcon';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';
import type { CourseInputPayload, GeneratedCourseStructure } from '@/types';
import { resolveCourseAuthorDisplay } from '@/lib/courseAuthorDefaults';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  categoryLabel,
  resolveCourseCatalogSlug,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { breadcrumbJsonLd, courseJsonLd } from '@/lib/courseJsonLd';
import { COURSE_IMAGE_BLUR_DATA_URL } from '@/lib/imagePlaceholder';
import { siteCanonicalBase } from '@/lib/blog-seo';
import { appendUtm } from '@/lib/urlTracking';
import styles from './courseLanding.module.css';

export const revalidate = 60;

type CourseRow = {
  id: string;
  public_slug: string;
  hotmart_product_id: string | null;
  input_payload: CourseInputPayload;
  generated_content: GeneratedCourseStructure | null;
  published_title: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  catalog_category: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

type RelatedRow = {
  id: string;
  public_slug: string;
  published_title: string | null;
  topic: string;
  featured_image_url: string | null;
  generated_content: GeneratedCourseStructure | null;
  catalog_category: string | null;
  input_payload: CourseInputPayload | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = siteCanonicalBase();
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select('meta_title, meta_description, featured_image_url, published_title')
      .eq('public_slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) {
      return { title: 'Curso | Recursalia' };
    }

    const title = `${data.meta_title ?? data.published_title ?? 'Curso'} | Recursalia`;
    const description = data.meta_description ?? undefined;
    const url = `${base}/cursos/${slug}`;
    const ogImage = data.featured_image_url
      ? data.featured_image_url.startsWith('http')
        ? data.featured_image_url
        : `${base}${data.featured_image_url}`
      : `${base}/logos/recursalia-logo.png`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        url,
        title,
        description,
        siteName: 'Recursalia',
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Curso | Recursalia' };
  }
}

function formatMoney(n: number | undefined, currency = 'EUR') {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatScoreEs(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

function formatUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 4H5.21L4.27 2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

/** Estima un valor mensual en EUR (precio efectivo / 30 días) sin redondeos absurdos. */
function dailyCostLabel(price: number | null | undefined): string | null {
  if (!price || price <= 0) return null;
  const perDay = price / 30;
  if (perDay < 0.5) return null;
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(perDay);
  return `Equivale a ${formatted} al día durante un mes`;
}

function totalDurationMinutes(content: GeneratedCourseStructure): number {
  if (content.total_duration_minutes && content.total_duration_minutes > 0) {
    return content.total_duration_minutes;
  }
  return (content.topics ?? [])
    .flatMap((t) => t.lessons ?? [])
    .reduce((acc, l) => acc + (l.duration_minutes ?? 0), 0);
}

function formatDuration(min: number): string {
  if (!min || min < 0) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function totalLessons(content: GeneratedCourseStructure): number {
  return (content.topics ?? []).reduce(
    (acc, t) => acc + (t.lessons?.length ?? 0),
    0
  );
}

/** Bullets cortos «Lo que aprenderás» derivados de los benefits si no hay datos específicos. */
function whatYouLearn(content: GeneratedCourseStructure): string[] {
  const fromBenefits =
    content.benefits
      ?.map((b) => b.title?.trim())
      .filter((t): t is string => Boolean(t && t.length > 0)) ?? [];

  if (fromBenefits.length >= 3) return fromBenefits.slice(0, 6);

  // Fallback: primer módulo y los siguientes módulos como “learnings” cortos.
  const fromTopics = (content.topics ?? [])
    .map((t) => t.title?.replace(/^M[oó]dulo\s+\d+\s*[:\-–]\s*/i, '').trim())
    .filter((t): t is string => Boolean(t && t.length > 0));
  return fromTopics.slice(0, 6);
}

export default async function CursoLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let course: CourseRow | null = null;
  let reviews: ReviewRow[] = [];
  let relatedRaw: RelatedRow[] = [];
  let relatedReviewStats: Map<string, { avg: number | null; count: number }> = new Map();
  let catalogOptions: CatalogCategoryPublic[] = PUBLIC_CATALOG_CATEGORIES_FALLBACK;

  try {
    const supabase = createPublicSupabaseClient();
    try {
      const { data: cats } = await supabase
        .from('catalog_categories')
        .select('slug, label')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cats && cats.length > 0) {
        catalogOptions = cats as CatalogCategoryPublic[];
      }
    } catch {
      /* fallback */
    }

    const { data: c } = await supabase
      .from('courses')
      .select(
        'id, public_slug, hotmart_product_id, input_payload, generated_content, published_title, featured_image_url, published_at, catalog_category'
      )
      .eq('public_slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    course = c as CourseRow | null;

    if (course) {
      const { data: rev } = await supabase
        .from('course_reviews')
        .select('id, title, content, rating, author_name, review_date')
        .eq('course_id', course.id)
        .order('review_date', { ascending: false });
      reviews = (rev ?? []) as ReviewRow[];

      const cat = resolveCourseCatalogSlug(
        course.catalog_category,
        course.input_payload
      );
      const { data: relData } = await supabase
        .from('courses')
        .select(
          'id, public_slug, published_title, topic, featured_image_url, generated_content, catalog_category, input_payload'
        )
        .eq('status', 'published')
        .neq('id', course.id)
        .not('public_slug', 'is', null)
        .order('published_at', { ascending: false })
        .limit(12);
      const all = (relData ?? []) as RelatedRow[];
      relatedRaw = all.filter(
        (r) =>
          resolveCourseCatalogSlug(r.catalog_category, r.input_payload) === cat
      );
      if (relatedRaw.length < 3) {
        relatedRaw = [
          ...relatedRaw,
          ...all.filter((r) => !relatedRaw.some((x) => x.id === r.id)),
        ];
      }
      relatedRaw = relatedRaw.slice(0, 3);

      if (relatedRaw.length > 0) {
        const { data: relRevs } = await supabase
          .from('course_reviews')
          .select('course_id, rating')
          .in(
            'course_id',
            relatedRaw.map((r) => r.id)
          );
        const map = new Map<string, number[]>();
        for (const r of relRevs ?? []) {
          const arr = map.get(r.course_id) ?? [];
          if (typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5) {
            arr.push(r.rating);
          }
          map.set(r.course_id, arr);
        }
        relatedReviewStats = new Map(
          Array.from(map.entries()).map(([cid, ratings]) => {
            const avg =
              ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : null;
            return [cid, { avg, count: ratings.length }];
          })
        );
      }
    }
  } catch {
    course = null;
  }

  if (!course?.generated_content) {
    notFound();
  }

  const content = course.generated_content;
  const input = course.input_payload as CourseInputPayload;
  const title = course.published_title || content.title;
  const bestSeller = input.bestSeller !== false;
  const original = content.price_original;
  const sale = content.price_sale;
  const showStrike = original != null && sale != null && sale < original;
  const effectivePrice = sale ?? original ?? null;
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const hotmartRaw = course.hotmart_product_id?.trim() || null;
  const hotmartUrl = hotmartRaw ? appendUtm(hotmartRaw, 'course_landing') : null;
  const displayPrice = formatMoney(effectivePrice ?? undefined);
  const updatedLabel = formatUpdatedAt(course.published_at);
  const totalDur = totalDurationMinutes(content);
  const totalLes = totalLessons(content);
  const learnings = whatYouLearn(content);
  const dailyEq = dailyCostLabel(effectivePrice);

  const levelEs: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };
  const accessDisplay =
    content.access_level?.trim() || levelEs[input.level] || input.level;

  const authorDisplay = resolveCourseAuthorDisplay(
    content.author_name,
    content.author_bio
  );

  const courseUrl = `/cursos/${slug}`;
  const courseLd = courseJsonLd({
    title,
    description:
      content.short_description ||
      content.description?.replace(/<[^>]*>/g, '').slice(0, 250) ||
      title,
    url: courseUrl,
    imageUrl: course.featured_image_url ?? undefined,
    authorName: authorDisplay.name,
    publishedAt: course.published_at ?? undefined,
    price: effectivePrice,
    language: content.language ?? 'es',
    ratingValue: avg,
    ratingCount: reviews.length,
    durationMinutes: totalDur,
  });
  const breadcrumbsLd = breadcrumbJsonLd([
    { name: 'Inicio', url: '/' },
    { name: 'Cursos', url: '/cursos' },
    { name: title, url: courseUrl },
  ]);

  const relatedItems: RelatedCourse[] = relatedRaw.map((r) => {
    const gc = r.generated_content;
    const stat = relatedReviewStats.get(r.id);
    return {
      id: r.id,
      publicSlug: r.public_slug,
      title: r.published_title || gc?.title || r.topic,
      imageUrl: r.featured_image_url,
      sale: gc?.price_sale ?? null,
      original: gc?.price_original ?? null,
      avgRating: stat?.avg ?? null,
      reviewCount: stat?.count ?? 0,
    };
  });

  return (
    <div className={`${styles.layout} ${styles.layoutStickyCheckout}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />

      <article className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span className={styles.sep}>/</span>
          <Link href="/cursos">Cursos</Link>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{title}</span>
        </nav>

        <div className={styles.heroCard}>
          <div className={styles.heroImg}>
            {course.featured_image_url ? (
              <Image
                src={course.featured_image_url}
                alt={title}
                fill
                priority
                placeholder="blur"
                blurDataURL={COURSE_IMAGE_BLUR_DATA_URL}
                sizes="(max-width: 960px) 100vw, 65vw"
                style={{ objectFit: 'cover' }}
              />
            ) : null}
          </div>
          <div className={styles.heroBody}>
            <h1 className={styles.title}>{title}</h1>
            <a
              href="#opiniones"
              className={styles.ratingJump}
              aria-label="Ir a la sección de opiniones de alumnos"
            >
              {avg != null ? (
                <>
                  <span className={styles.heroScore}>
                    {avg.toFixed(1).replace('.', ',')}
                  </span>
                  <StarRatingDisplay value={avg} ariaHidden />
                  <span className={styles.reviewCount}>({reviews.length})</span>
                </>
              ) : (
                <span className={styles.ratingMuted}>
                  Sin valoraciones aún — ver sección de opiniones
                </span>
              )}
            </a>
            <div className={styles.priceRow}>
              {showStrike && (
                <span className={styles.original}>{formatMoney(original)}</span>
              )}
              <span className={styles.sale}>{displayPrice}</span>
              {bestSeller && (
                <span className={styles.heroBestseller}>
                  <Image
                    src="/images/card-icon-1.webp"
                    alt=""
                    width={26}
                    height={26}
                    className={styles.heroBestsellerSeal}
                  />
                  <span className={styles.heroBestsellerLabel}>Bestseller</span>
                </span>
              )}
            </div>
            <p className={styles.lead}>{content.short_description}</p>

            <ul className={styles.heroFacts} aria-label="Resumen del curso">
              <li>
                <strong>{totalLes}</strong> lecciones
              </li>
              <li>
                <strong>{formatDuration(totalDur)}</strong>
                <span className={styles.heroFactSub}> de contenido</span>
              </li>
              <li>
                <strong>{accessDisplay}</strong>
              </li>
              {content.certificate ? (
                <li>
                  <CheckIcon /> Diploma incluido
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {learnings.length > 0 && (
          <section
            className={styles.learnSection}
            aria-labelledby="learn-heading"
          >
            <h2 id="learn-heading" className={styles.sheetTitle}>
              Lo que aprenderás
            </h2>
            <ul className={styles.learnList}>
              {learnings.map((item, i) => (
                <li key={i} className={styles.learnItem}>
                  <CheckIcon className={styles.learnCheck} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!content.benefits?.length && (
          <section
            className={styles.whatYouGet}
            aria-labelledby="what-you-get-heading"
          >
            <h2 id="what-you-get-heading" className={styles.whatYouGetTitle}>
              Qué obtienes
            </h2>
            <ul className={styles.benefits}>
              {content.benefits!.map((b, i) => (
                <li key={i} className={styles.youGetCard}>
                  <span className={styles.bIcon}>{b.icon || '✓'}</span>
                  <div className={styles.bBody}>
                    <h3>{b.title}</h3>
                    <p>{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.highlight && (
          <div className={styles.highlightWrap}>
            <div className={styles.highlight} role="note">
              <span className={styles.highlightIconBox} aria-hidden>
                <SalaryMoneyBagIcon className={styles.highlightIcon} />
              </span>
              <p className={styles.highlightCopy}>{content.highlight}</p>
            </div>
          </div>
        )}

        <CourseSectionNav />

        <section
          id="beneficios"
          className={styles.anchorSection}
          aria-labelledby="beneficios-heading"
        >
          <div className={styles.beneficiosSheet}>
            <h2 id="beneficios-heading" className={styles.sheetTitle}>
              Beneficios
            </h2>
            <div className={styles.sheetBody}>
              <div
                className={styles.detailProse}
                dangerouslySetInnerHTML={{
                  __html: content.description.replace(/\n/g, '<br/>'),
                }}
              />
              <h4 className={styles.authorHeading}>Autor</h4>
              <div className={styles.authorIdentity}>
                <span className={styles.authorLogoWrap} aria-hidden>
                  <svg
                    className={styles.authorLogoSvg}
                    viewBox="0 0 24 24"
                    width={44}
                    height={44}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 10L12 12.5L17 10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className={styles.authorText}>
                  <p className={styles.authorName}>
                    <strong>{authorDisplay.name}</strong>
                  </p>
                  <p className={styles.authorBio}>{authorDisplay.bio}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="programa"
          className={styles.anchorSection}
          aria-labelledby="programa-heading"
        >
          <div className={styles.programaHeader}>
            <h2 id="programa-heading" className={styles.programaHeading}>
              Programa
            </h2>
            <p className={styles.programaMeta}>
              {totalLes} lecciones · {formatDuration(totalDur)}
            </p>
          </div>
          <CourseProgramAccordion topics={content.topics ?? []} />
        </section>

        <section
          className={`${styles.reviews} ${styles.anchorSection}`}
          id="opiniones"
          aria-labelledby="reviews-heading"
        >
          <CourseReviewList reviews={reviews} average={avg} />
        </section>

        {relatedItems.length > 0 ? (
          <CourseRelated
            heading={`Otros cursos en ${categoryLabel(
              resolveCourseCatalogSlug(
                course.catalog_category,
                course.input_payload
              ),
              catalogOptions
            )}`}
            items={relatedItems}
          />
        ) : null}
      </article>

      <aside className={styles.sidebar} aria-label="Comprar curso">
        <h2 className={styles.sidebarTitle}>{title}</h2>

        <a
          href="#opiniones"
          className={styles.sidebarRating}
          aria-label="Ir a opiniones de alumnos"
        >
          {avg != null ? (
            <>
              <span className={styles.sidebarScore}>{formatScoreEs(avg)}</span>
              <StarRatingDisplay
                value={avg}
                ariaHidden
                className={styles.sidebarStars}
              />
              <span className={styles.sidebarReviewCount}>({reviews.length})</span>
            </>
          ) : (
            <span className={styles.sidebarNoReviews}>Sin opiniones aún</span>
          )}
        </a>

        <div className={styles.sidebarPriceBlock}>
          {showStrike && (
            <span className={styles.sidebarStrike}>{formatMoney(original)}</span>
          )}
          <span className={styles.sidebarPriceMain}>{displayPrice}</span>
          {dailyEq ? (
            <span className={styles.sidebarPriceHint}>{dailyEq}</span>
          ) : null}
        </div>

        {hotmartUrl ? (
          <a
            className={styles.buy}
            href={hotmartUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CartIcon className={styles.buyCart} />
            Comprar ahora
          </a>
        ) : (
          <div className={styles.buyDisabled} role="status" aria-live="polite">
            <CartIcon className={styles.buyCart} />
            Próximamente disponible
          </div>
        )}

        {!hotmartUrl ? (
          <p className={styles.notifyCopy}>
            Estamos ultimando este curso. Mientras tanto, puedes ver el resto
            del catálogo o suscribirte a nuestras novedades.
          </p>
        ) : null}

        <ul className={styles.trustList} aria-label="Garantías de compra">
          <li>
            <CheckIcon /> Pago seguro a través de Hotmart
          </li>
          <li>
            <CheckIcon /> 7 días de garantía de devolución
          </li>
          <li>
            <CheckIcon /> Acceso de por vida desde cualquier dispositivo
          </li>
          <li>
            <CheckIcon /> Soporte en español
          </li>
        </ul>

        <ul className={styles.metaList}>
          <li>
            <span className={styles.metaLabel}>Actualizado</span>
            <span className={styles.metaPill}>{updatedLabel}</span>
          </li>
          <li>
            <span className={styles.metaLabel}>Acceso</span>
            <span className={styles.metaPill}>{accessDisplay}</span>
          </li>
          <li>
            <span className={styles.metaLabel}>Lecciones</span>
            <span className={styles.metaPill}>{totalLes}</span>
          </li>
          <li>
            <span className={styles.metaLabel}>Duración</span>
            <span className={styles.metaPill}>{formatDuration(totalDur)}</span>
          </li>
          <li>
            <span className={styles.metaLabel}>Diploma / certificado</span>
            <span className={styles.metaPill}>
              {content.certificate ? 'Sí' : 'No'}
            </span>
          </li>
          <li>
            <span className={styles.metaLabel}>Bolsa de trabajo</span>
            <span className={styles.metaPill}>
              {content.job_bank ? 'Sí' : 'No'}
            </span>
          </li>
          <li>
            <span className={styles.metaLabel}>Idioma</span>
            <span className={styles.metaPill}>
              {content.language ?? 'Español'}
            </span>
          </li>
        </ul>

        <div className={styles.backLink}>
          <Link href="#opiniones">Ver todas las opiniones</Link>
          <span className={styles.backSep}>·</span>
          <Link href="/cursos">Catálogo</Link>
        </div>
      </aside>

      <CourseStickyCheckoutBar
        title={title}
        hotmartUrl={hotmartUrl}
        displayPriceLabel={displayPrice}
        originalPriceLabel={showStrike ? formatMoney(original) : null}
        showStrike={showStrike}
        ratingAverage={avg}
        reviewCount={reviews.length}
      />
    </div>
  );
}
