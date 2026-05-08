import type { Metadata } from 'next';
import styles from '../marketing.module.css';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { siteCanonicalBase } from '@/lib/blog-seo';
import {
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
  type CatalogCategoryPublic,
} from '@/lib/catalogCategory';
import { singularEmbed } from '@/lib/blog-embed-normalize';
import {
  BlogIndexClient,
  type BlogIndexEntry,
} from '@/components/marketing/BlogIndexClient';

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

type RawPostRow = {
  slug: string;
  title: string;
  meta_description: string | null;
  published_at: string | null;
  courses: {
    public_slug: string | null;
    catalog_category: string | null;
    featured_image_url: string | null;
  } | Array<{
    public_slug: string | null;
    catalog_category: string | null;
    featured_image_url: string | null;
  }> | null;
};

function normalizeCatParam(
  raw: string | string[] | undefined,
  validSlugs: ReadonlySet<string>
): string | 'all' {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!v) return 'all';
  return validSlugs.has(v) ? v : 'all';
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = searchParams ?? {};
  const initialQuery =
    typeof sp.q === 'string' ? sp.q.trim() : '';

  let categories: CatalogCategoryPublic[] = PUBLIC_CATALOG_CATEGORIES_FALLBACK;
  let posts: BlogIndexEntry[] = [];

  try {
    const supabase = createPublicSupabaseClient();
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

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('blog_posts')
      .select(
        'slug, title, meta_description, published_at, courses(public_slug, catalog_category, featured_image_url)'
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const rows = (data ?? []) as RawPostRow[];
    posts = rows.map((p) => {
      const cr = singularEmbed(p.courses);
      const cat = cr?.catalog_category?.trim().toLowerCase() ?? null;
      return {
        slug: p.slug,
        title: p.title,
        description: p.meta_description ?? '',
        publishedAt: p.published_at,
        category: cat,
        coursePublicSlug: cr?.public_slug ?? null,
        imageUrl: cr?.featured_image_url ?? null,
      };
    });
  } catch {
    posts = [];
  }

  const validSlugs = new Set(categories.map((c) => c.slug));
  const initialCategory = normalizeCatParam(sp.cat, validSlugs);

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

        <BlogIndexClient
          posts={posts}
          categories={categories}
          initialCategory={initialCategory}
          initialQuery={initialQuery}
        />
      </div>
    </section>
  );
}
