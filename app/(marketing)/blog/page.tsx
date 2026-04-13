import Link from 'next/link';
import styles from '../marketing.module.css';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';

export const revalidate = 120;

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
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Blog</h2>
        {posts.length === 0 ? (
          <p className={styles.empty}>
            No hay artículos publicados. Genera borradores desde un curso en el panel y el cron
            los publicará.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {posts.map((p) => (
              <li
                key={p.slug}
                style={{
                  marginBottom: '1.25rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <Link
                  href={`/blog/${p.slug}`}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#0b1f42',
                    textDecoration: 'none',
                  }}
                >
                  {p.title}
                </Link>
                {p.meta_description && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                    {p.meta_description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
