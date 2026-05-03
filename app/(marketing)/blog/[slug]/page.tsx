import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { singularEmbed } from '@/lib/blog-embed-normalize';
import { siteCanonicalBase } from '@/lib/blog-seo';
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
        'title, content, published_at, course_id, courses(public_slug, published_title, topic)'
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
    };
    const cr = singularEmbed(crRaw as CourseBrief | CourseBrief[] | null | undefined);

    const url = `${base}/blog/${encodeURIComponent(slug)}`;
    const courseUrl =
      cr?.public_slug && base ? `${base}/cursos/${cr.public_slug}` : null;
    const courseTitle =
      (cr?.published_title && cr.published_title.trim()) ||
      (cr?.topic && cr.topic.trim()) ||
      '';

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
              {post.published_at && (
                <>
                  {' · '}
                  {new Date(post.published_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </>
              )}
            </p>
            <h1 className={blogStyles.title}>{post.title}</h1>
            {courseUrl && courseTitle && cr?.public_slug && (
              <p className={blogStyles.courseLink}>
                <span className={blogStyles.courseLinkLabel}>Formación relacionada: </span>
                <Link href={`/cursos/${encodeURIComponent(cr.public_slug)}`}>{courseTitle}</Link>
              </p>
            )}
            <div
              className={blogStyles.prose}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </>
    );
  } catch {
    notFound();
  }
}
