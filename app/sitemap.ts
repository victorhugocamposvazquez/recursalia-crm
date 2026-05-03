import type { MetadataRoute } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { siteCanonicalBase } from '@/lib/blog-seo';

/** URLs estáticas del segmento marketing; mantener alineadas con rutas públicas reales. */
const STATIC_PATHS = [
  '',
  'blog',
  'cursos',
  'editorial',
  'inspiracion',
  'referidos',
  'recursalia-ai',
  'clientes',
  'nosotros',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteCanonicalBase();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((pathSegment) => {
    const suffix = pathSegment ? `/${pathSegment}` : '/';
    return {
      url: `${base}${suffix}`,
      lastModified: now,
      changeFrequency: pathSegment === '' ? 'weekly' : 'weekly',
      priority: pathSegment === '' ? 1 : 0.72,
    };
  });

  try {
    const supabase = createPublicSupabaseClient();

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('status', 'published');

    const { data: courses } = await supabase
      .from('courses')
      .select('public_slug, published_at')
      .eq('status', 'published')
      .not('public_slug', 'is', null);

    const blogEntries: MetadataRoute.Sitemap = (posts ?? []).map((row) => ({
      url: `${base}/blog/${row.slug}`,
      lastModified: row.published_at ? new Date(row.published_at) : now,
      changeFrequency: 'monthly',
      priority: 0.64,
    }));

    const courseEntries: MetadataRoute.Sitemap = (courses ?? []).map(
      (row: { public_slug: string; published_at: string | null }) => ({
        url: `${base}/cursos/${row.public_slug}`,
        lastModified: row.published_at ? new Date(row.published_at) : now,
        changeFrequency: 'weekly',
        priority: 0.82,
      })
    );

    return [...staticEntries, ...courseEntries, ...blogEntries];
  } catch {
    return staticEntries;
  }
}
