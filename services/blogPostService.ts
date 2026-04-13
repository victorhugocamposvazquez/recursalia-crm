import { getSupabase } from '@/lib/supabase';
import type { GeneratedSeoPost, SeoPostRecord } from '@/types';

export async function insertBlogPostDraft(
  post: GeneratedSeoPost,
  courseId: string
): Promise<SeoPostRecord> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      course_id: courseId,
      title: post.title,
      slug: post.slug,
      meta_description: post.meta_description,
      content: post.content,
      post_type: post.post_type,
      status: 'draft',
      tags: post.tags,
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    title: post.title,
    slug: data.slug,
    post_type: post.post_type,
    status: 'draft',
  };
}

export async function publishDraftBlogPosts(limit: number): Promise<
  { id: string; slug: string }[]
> {
  const supabase = getSupabase();
  const { data: drafts, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, slug')
    .eq('status', 'draft')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (fetchErr) throw new Error(fetchErr.message);

  const published: { id: string; slug: string }[] = [];
  for (const row of drafts ?? []) {
    const { error: upErr } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (!upErr) {
      published.push({ id: row.id, slug: row.slug });
    }
  }
  return published;
}
