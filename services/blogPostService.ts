import { getSupabase } from '@/lib/supabase';
import { sanitizeSlugForUrl } from '@/lib/blog-seo';
import type { GeneratedSeoPost, SeoPostRecord } from '@/types';

export type BlogPostRow = {
  id: string;
  course_id: string | null;
  title: string;
  slug: string;
  meta_description: string | null;
  content: string;
  post_type: string | null;
  status: 'draft' | 'published';
  tags: string[] | null;
  created_at: string;
  published_at: string | null;
  publish_priority?: number | null;
};

export async function insertBlogPostDraft(
  post: GeneratedSeoPost,
  courseId: string,
  opts?: { publishPriority?: number }
): Promise<SeoPostRecord> {
  const supabase = getSupabase();
  const priority = opts?.publishPriority ?? 0;
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
      publish_priority: priority,
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
    .order('publish_priority', { ascending: false })
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

export async function listBlogPosts(opts: {
  status?: 'draft' | 'published';
  courseId?: string;
  limit?: number;
}): Promise<BlogPostRow[]> {
  const supabase = getSupabase();
  const lim = Math.min(opts.limit ?? 200, 500);
  let q = supabase
    .from('blog_posts')
    .select(
      'id, course_id, title, slug, meta_description, content, post_type, status, tags, created_at, published_at, publish_priority'
    )
    .order('created_at', { ascending: false })
    .limit(lim);

  if (opts.status) q = q.eq('status', opts.status);
  if (opts.courseId) q = q.eq('course_id', opts.courseId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as BlogPostRow[];
}

export async function updateBlogPost(
  id: string,
  patch: {
    title?: string;
    slug?: string;
    meta_description?: string | null;
    content?: string;
    tags?: string[];
  }
): Promise<void> {
  const supabase = getSupabase();
  const updates: Record<string, unknown> = {};

  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.slug !== undefined) updates.slug = sanitizeSlugForUrl(patch.slug);
  if (patch.meta_description !== undefined)
    updates.meta_description = patch.meta_description?.trim() || null;
  if (patch.content !== undefined) updates.content = patch.content;
  if (patch.tags !== undefined) updates.tags = patch.tags;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('blog_posts').update(updates).eq('id', id);
  if (error) {
    if (/duplicate key|23505/i.test(error.message)) {
      throw new Error('SLUG_EXISTS');
    }
    throw new Error(error.message);
  }
}

/**
 * Publica borradores: por ids/slugs concretos, o los siguientes por prioridad+fifo (limit).
 */
export async function publishBlogDraftsSelective(opts: {
  ids?: string[];
  slugs?: string[];
  limit?: number;
}): Promise<{ id: string; slug: string }[]> {
  const supabase = getSupabase();

  let rows: { id: string; slug: string }[] = [];

  if (opts.ids?.length) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug')
      .eq('status', 'draft')
      .in('id', opts.ids);
    if (error) throw new Error(error.message);
    rows = data ?? [];
  } else if (opts.slugs?.length) {
    const normalized = opts.slugs.map((s) => sanitizeSlugForUrl(s));
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug')
      .eq('status', 'draft')
      .in('slug', normalized);
    if (error) throw new Error(error.message);
    rows = data ?? [];
  } else {
    const lim = Math.min(Math.max(opts.limit ?? 3, 1), 50);
    return publishDraftBlogPosts(lim);
  }

  const published: { id: string; slug: string }[] = [];
  const now = new Date().toISOString();

  for (const row of rows) {
    const { error: upErr } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: now,
      })
      .eq('id', row.id)
      .eq('status', 'draft');

    if (!upErr) {
      published.push({ id: row.id, slug: row.slug });
    }
  }

  return published;
}
