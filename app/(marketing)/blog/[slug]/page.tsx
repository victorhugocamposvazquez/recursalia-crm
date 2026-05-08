import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { singularEmbed } from '@/lib/blog-embed-normalize';
import { siteCanonicalBase } from '@/lib/blog-seo';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  categoryLabel,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import styles from '../../marketing.module.css';
import blogStyles from '../blog.module.css';

export const revalidate = 120;

async function ogImageForPost(courseId: string): Promise<string | undefined> {
  if (!courseId) return undefined;
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select('featured_image_url')
      .eq('id', courseId)
      .eq('status', 'published')
      .maybeSingle();
    const u = data?.featured_image_url?.trim();
    return u || undefined;
  } catch {
    return undefined;
  }
}

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
      .from('blog_posts')
      .select('title, meta_description, published_at, course_id')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) return { title: 'Blog | Recursalia' };

    const canonical = `${base}/blog/${encodeURIComponent(slug)}`;
    const description =
      data.meta_description?.slice(0, 320)?.trim() || undefined;

    let ogImages: Array<{ url: string }> = [];
    const imgUrl = await ogImageForPost(String(data.course_id));
    if (imgUrl) ogImages = [{ url: imgUrl }];

    return {
      title: `${data.title} | Recursalia`,
      description,
      alternates: { canonical },
      openGraph: {
        title: data.title,
        description,
        url: canonical,
        type: 'article',
        publishedTime: data.published_at ?? undefined,
        locale: 'es_ES',
        ...(ogImages.length ? { images: ogImages } : {}),
      },
      twitter: {
        card: ogImages.length ? 'summary_large_image' : 'summary',
        title: data.title,
        description,
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: 'Blog | Recursalia' };
  }
}

/** Estima minutos de lectura a 220 palabras/min, mínimo 1 minuto. */
function estimateReadMinutes(html: string): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 1;
  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = siteCanonicalBase();

  try {
    const supabase = createPublicSupabaseClient();
    const { data: post } = await supabase
      .from('blog_posts')
      .select(
        'title, content, published_at, course_id, courses(public_slug, published_title, topic, catalog_category)'
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!post) {
      notFound();
    }

    const crRaw = post.courses as unknown;
    type CourseBrief = {
      public_slug: string | null;
      published_title: string | null;
      topic: string | null;
      catalog_category: string | null;
    };
    const cr = singularEmbed(crRaw as CourseBrief | CourseBrief[] | null | undefined);

    const url = `${base}/blog/${encodeURIComponent(slug)}`;
    const courseUrl =
      cr?.public_slug && base ? `${base}/cursos/${cr.public_slug}` : null;
    const courseTitle =
      (cr?.published_title && cr.published_title.trim()) ||
      (cr?.topic && cr.topic.trim()) ||
      '';

    let categories: CatalogCategoryPublic[] = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
    try {
      const { data: catData } = await supabase
        .from('catalog_categories')
        .select('slug, label')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (catData && catData.length > 0) {
        categories = catData as CatalogCategoryPublic[];
      }
    } catch {
      categories = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
    }

    const catSlug = cr?.catalog_category?.trim().toLowerCase() ?? null;
    const catLabel = catSlug ? categoryLabel(catSlug, categories) : null;

    const readMin = estimateReadMinutes(post.content);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      datePublished: post.published_at,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Recursalia',
      },
      ...(courseUrl && courseTitle
        ? {
            about: {
              '@type': 'Course',
              name: courseTitle,
              url: courseUrl,
            },
          }
        : {}),
    };

    const dateLabel = post.published_at
      ? new Date(post.published_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className={`${styles.section} ${styles.sectionBlogCompact}`}>
          <div className={styles.inner} style={{ maxWidth: '720px' }}>
            <p className={blogStyles.breadcrumb}>
              <Link href="/blog">← Blog</Link>
              {catLabel && catSlug ? (
                <>
                  <span aria-hidden>·</span>
                  <Link href={`/blog?cat=${encodeURIComponent(catSlug)}`}>
                    {catLabel}
                  </Link>
                </>
              ) : null}
            </p>

            <div className={blogStyles.articleMeta}>
              {dateLabel ? <span>{dateLabel}</span> : null}
              {dateLabel ? <span aria-hidden>·</span> : null}
              <span>{readMin} min de lectura</span>
            </div>

            <h1 className={blogStyles.title}>{post.title}</h1>

            {courseUrl && courseTitle && cr?.public_slug && (
              <p className={blogStyles.courseLink}>
                <span className={blogStyles.courseLinkLabel}>
                  Formación relacionada:{' '}
                </span>
                <Link href={`/cursos/${encodeURIComponent(cr.public_slug)}`}>
                  {courseTitle}
                </Link>
              </p>
            )}
            <div
              className={blogStyles.prose}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className={blogStyles.articleFooter}>
              <Link href="/blog" className={blogStyles.linkBtn}>
                ← Todos los artículos
              </Link>
              {catLabel && catSlug ? (
                <Link
                  href={`/blog?cat=${encodeURIComponent(catSlug)}`}
                  className={blogStyles.linkBtn}
                >
                  Más en {catLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      </>
    );
  } catch {
    notFound();
  }
}
