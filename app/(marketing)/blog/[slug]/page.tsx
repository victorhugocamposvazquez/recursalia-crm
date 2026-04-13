import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../../marketing.module.css';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('blog_posts')
      .select('title, meta_description')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!data) return { title: 'Blog | Recursalia' };
    return {
      title: `${data.title} | Recursalia`,
      description: data.meta_description ?? undefined,
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

  try {
    const supabase = createPublicSupabaseClient();
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, content, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!post) {
      notFound();
    }

    return (
      <article className={styles.section}>
        <div className={styles.inner} style={{ maxWidth: '720px' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
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
          <h1
            style={{
              margin: '0 0 1.5rem',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              color: '#0b1f42',
              lineHeight: 1.2,
            }}
          >
            {post.title}
          </h1>
          <div
            className="blog-prose"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.75,
              color: '#334155',
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
