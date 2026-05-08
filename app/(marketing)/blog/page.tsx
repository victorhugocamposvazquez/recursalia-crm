import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../marketing.module.css';
import blogStyles from './blog.module.css';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { siteCanonicalBase } from '@/lib/blog-seo';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const base = siteCanonicalBase();
  const desc =
    'Artículos y guías prácticas: formación profesional, productividad y habilidades para equipos.';
  return {
    title: 'Blog | Recursalia',
    description: desc,
    alternates: { canonical: `${base}/blog` },
    openGraph: {
      title: 'Blog | Recursalia',
      description: desc,
      url: `${base}/blog`,
      type: 'website',
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog | Recursalia',
      description: desc,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogIndexPage() {
  let posts: { slug: string; title: string; meta_description: string | null; published_at: string | null }[] =
    [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, meta_description, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    posts = (data ?? []) as typeof posts;
  } catch {
    posts = [];
  }

  return (
    <section className={`${styles.section} ${styles.sectionBlogCompact}`}>
      <div className={styles.inner}>
        <header className={styles.pageHeader}>
          <span className={styles.eyebrow}>Blog Recursalia</span>
          <h1 className={styles.pageTitle}>
            Ideas, guías y <span className={styles.accent}>buenas prácticas</span>.
          </h1>
          <p className={styles.pageLead}>
            Artículos breves para aplicar en tu día a día: formación, productividad,
            habilidades digitales y aprendizajes que conectan con nuestros cursos.
          </p>
        </header>
        {posts.length === 0 ? (
          <p className={styles.empty}>
            No hay artículos publicados. Genera borradores desde un curso en el panel y el cron
            los publicará.
          </p>
        ) : (
          <ul className={blogStyles.list}>
            {posts.map((p) => {
              const dateLabel = p.published_at
                ? new Date(p.published_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : null;
              return (
                <li key={p.slug} className={blogStyles.item}>
                  {dateLabel ? (
                    <p className={blogStyles.itemMeta}>{dateLabel}</p>
                  ) : null}
                  <Link href={`/blog/${p.slug}`} className={blogStyles.link}>
                    {p.title}
                  </Link>
                  {p.meta_description && (
                    <p className={blogStyles.desc}>{p.meta_description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
