import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { CourseTabs } from '@/components/marketing/CourseTabs';
import { CourseReviewList, type ReviewRow } from '@/components/marketing/CourseReviewList';
import { StarRatingDisplay } from '@/components/marketing/StarRatingDisplay';
import type { CourseInputPayload, GeneratedCourseStructure } from '@/types';
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
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select('meta_title, meta_description, featured_image_url')
      .eq('public_slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) {
      return { title: 'Curso | Recursalia' };
    }

    return {
      title: `${data.meta_title ?? 'Curso'} | Recursalia`,
      description: data.meta_description ?? undefined,
      openGraph: data.featured_image_url
        ? { images: [{ url: data.featured_image_url }] }
        : undefined,
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

export default async function CursoLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let course: CourseRow | null = null;
  let reviews: ReviewRow[] = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data: c } = await supabase
      .from('courses')
      .select(
        'id, public_slug, hotmart_product_id, input_payload, generated_content, published_title, featured_image_url, published_at'
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
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const hotmartUrl = course.hotmart_product_id?.trim() || null;
  const displayPrice = formatMoney(sale ?? original);
  const updatedLabel = formatUpdatedAt(course.published_at);
  const tagParts = (() => {
    const parts = input.topic
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (parts.length > 0) return parts;
    const single = input.topic.trim();
    return single ? [single] : ['Curso online'];
  })();

  const levelEs: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };
  const accessDisplay =
    content.access_level?.trim() ||
    levelEs[input.level] ||
    input.level;

  const infoTab = (
    <div className={styles.prose}>
      <div
        dangerouslySetInnerHTML={{
          __html: content.description.replace(/\n/g, '<br/>'),
        }}
      />
      {content.benefits && content.benefits.length > 0 && (
        <>
          <h4>Beneficios</h4>
          <ul>
            {content.benefits.map((b, i) => (
              <li key={i}>
                <strong>{b.title}</strong>: {b.description}
              </li>
            ))}
          </ul>
        </>
      )}
      {(content.author_name || content.author_bio) && (
        <>
          <h4>Autor</h4>
          {content.author_name && (
            <p>
              <strong>{content.author_name}</strong>
            </p>
          )}
          {content.author_bio && <p>{content.author_bio}</p>}
        </>
      )}
    </div>
  );

  const programTab = (
    <div>
      {(content.topics ?? []).map((topic, ti) => (
        <div key={ti} className={styles.module}>
          <h4>
            <span className={styles.moduleNum}>{ti + 1}</span>
            <span>{topic.title}</span>
          </h4>
          {(topic.lessons ?? []).map((lesson, li) => (
            <div key={li} className={styles.lesson}>
              {lesson.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.layout}>
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
                alt=""
                fill
                priority
                sizes="(max-width: 960px) 100vw, 65vw"
                style={{ objectFit: 'cover' }}
              />
            ) : null}
          </div>
          <div className={styles.heroBody}>
            {bestSeller && <span className={styles.badge}>Bestseller</span>}
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
            </div>
            <p className={styles.lead}>{content.short_description}</p>
          </div>
        </div>

        {content.benefits && content.benefits.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Por qué este curso</p>
            <ul className={styles.benefits}>
              {content.benefits.map((b, i) => (
                <li key={i}>
                  <span className={styles.bIcon}>{b.icon || '✓'}</span>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {content.highlight && (
          <div className={styles.highlight}>{content.highlight}</div>
        )}

        <div className={styles.tabsSection}>
          <p className={styles.sectionLabel}>Contenido</p>
          <CourseTabs info={infoTab} program={programTab} />
        </div>

        <section
          className={styles.reviews}
          id="opiniones"
          aria-labelledby="reviews-heading"
        >
          <p className={styles.sectionLabel}>Alumnos</p>
          <CourseReviewList reviews={reviews} average={avg} />
        </section>
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
          <div className={styles.buyDisabled}>
            <CartIcon className={styles.buyCart} />
            Enlace de compra pendiente
          </div>
        )}

        <p className={styles.trust}>
          <span className={styles.trustLock} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </span>
          Pago seguro con Hotmart, garantía de devolución
        </p>

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

        <div className={styles.tagsBlock}>
          <span className={styles.tagsTitle}>Tags</span>
          <div className={styles.tagsRow}>
            {tagParts.map((t, i) => (
              <span key={`${i}-${t}`} className={styles.tagChip}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.backLink}>
          <Link href="#opiniones">Ver todas las opiniones</Link>
          <span className={styles.backSep}>·</span>
          <Link href="/cursos">Catálogo</Link>
        </div>
      </aside>

      {hotmartUrl && (
        <div className={styles.mobileCta}>
          <div className={styles.mobileCtaInner}>
            <div className={styles.mobilePrice}>
              {showStrike && <span>{formatMoney(original)}</span>}
              <strong>{displayPrice}</strong>
            </div>
            <a className={styles.mobileBuy} href={hotmartUrl}>
              Comprar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
