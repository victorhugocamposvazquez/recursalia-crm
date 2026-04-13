import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import styles from '../../marketing.module.css';
import blogStyles from '../blog.module.css';

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
          <div
            className={blogStyles.prose}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    );
  } catch {
    notFound();
  }
}
