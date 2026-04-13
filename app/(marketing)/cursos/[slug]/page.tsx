import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { CourseTabs } from '@/components/marketing/CourseTabs';
import { CourseReviewList, type ReviewRow } from '@/components/marketing/CourseReviewList';
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
        'id, public_slug, hotmart_product_id, input_payload, generated_content, published_title, featured_image_url'
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
          {content.author_name && <p><strong>{content.author_name}</strong></p>}
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
            Módulo {ti + 1}. {topic.title}
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
      <div>
        <div className={styles.heroImg}>
          {course.featured_image_url ? (
            <Image
              src={course.featured_image_url}
              alt=""
              fill
              priority
              sizes="(max-width: 900px) 100vw, 70vw"
              style={{ objectFit: 'cover' }}
            />
          ) : null}
        </div>

        {bestSeller && <span className={styles.badge}>Bestseller</span>}
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.rating}>
          {avg != null ? (
            <>
              <strong>{avg.toFixed(1)}</strong> ({reviews.length} opiniones)
            </>
          ) : (
            <>Sin valoraciones</>
          )}
        </div>

        <div className={styles.priceRow}>
          {showStrike && (
            <span className={styles.original}>{formatMoney(original)}</span>
          )}
          <span className={styles.sale}>{formatMoney(sale ?? original)}</span>
        </div>

        <p className={styles.lead}>{content.short_description}</p>

        {content.benefits && content.benefits.length > 0 && (
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
        )}

        {content.highlight && (
          <div className={styles.highlight}>{content.highlight}</div>
        )}

        <CourseTabs info={infoTab} program={programTab} />

        <section className={styles.reviews} id="opiniones">
          <h2>Opiniones</h2>
          <CourseReviewList reviews={reviews} />
        </section>
      </div>

      <aside className={styles.sidebar}>
        <h3>{title}</h3>
        <div className={styles.priceRow}>
          {showStrike && (
            <span className={styles.original}>{formatMoney(original)}</span>
          )}
          <span className={styles.sale}>{formatMoney(sale ?? original)}</span>
        </div>
        {hotmartUrl ? (
          <a
            className={styles.buy}
            href={hotmartUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Comprar ahora
          </a>
        ) : (
          <p className={styles.trust}>Enlace Hotmart pendiente en el panel.</p>
        )}
        <p className={styles.trust}>
          Pago seguro con Hotmart · Garantía de devolución
        </p>
        <ul className={styles.metaList}>
          <li>
            <span>Nivel</span>
            <span>{content.access_level ?? input.level}</span>
          </li>
          <li>
            <span>Diploma</span>
            <span>{content.certificate ? 'Sí' : 'No'}</span>
          </li>
          <li>
            <span>Bolsa de trabajo</span>
            <span>{content.job_bank ? 'Sí' : 'No'}</span>
          </li>
          <li>
            <span>Idioma</span>
            <span>{content.language ?? 'Español'}</span>
          </li>
        </ul>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          <Link href="/cursos">← Volver al catálogo</Link>
        </p>
      </aside>
    </div>
  );
}
