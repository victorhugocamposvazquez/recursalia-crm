import { getSupabase } from '@/lib/supabase';
import { singularEmbed } from '@/lib/blog-embed-normalize';
import { sanitizeSlugForUrl } from '@/lib/blog-seo';
import type { GeneratedSeoPost, SeoPostRecord } from '@/types';

/** Curso relacionado según FK (Supabase nested select `courses (...)` ). */
export type BlogPostCourseJoin = {
  topic: string;
  published_title: string | null;
  public_slug: string | null;
  status: string;
};

export type BlogPostRow = {
  id: string;
  course_id: string;
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
  courses?: BlogPostCourseJoin | null;
};

function normalizeListedRow(row: BlogPostRow & { courses?: unknown }): BlogPostRow {
  return {
    ...row,
    courses: singularEmbed(row.courses as BlogPostCourseJoin | BlogPostCourseJoin[]),
  };
}

export function normalizeBlogPostApiRow(row: unknown): BlogPostRow {
  const r = row as BlogPostRow & { courses?: unknown };
  return normalizeListedRow(r);
}

export async function insertBlogPostDraft(
  post: GeneratedSeoPost,
  courseId: string,
  opts?: { publishPriority?: number }
): Promise<SeoPostRecord> {
  if (!courseId?.trim()) {
    throw new Error('courseId es obligatorio para crear un post SEO');
  }
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

export async function publishDraftBlogPosts(
  limit: number,
  filters?: { courseId?: string }
): Promise<{ id: string; slug: string }[]> {
  const supabase = getSupabase();
  const lim = Math.min(Math.max(limit, 1), 50);
  let q = supabase
    .from('blog_posts')
    .select('id, slug')
    .eq('status', 'draft')
    .order('publish_priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(lim);

  if (filters?.courseId?.trim()) {
    q = q.eq('course_id', filters.courseId.trim());
  }

  const { data: drafts, error: fetchErr } = await q;

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
      'id, course_id, title, slug, meta_description, content, post_type, status, tags, created_at, published_at, publish_priority, courses(topic, published_title, public_slug, status)'
    )
    .order('created_at', { ascending: false })
    .limit(lim);

  if (opts.status) q = q.eq('status', opts.status);
  if (opts.courseId) q = q.eq('course_id', opts.courseId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as (BlogPostRow & { courses?: unknown })[]).map(
    normalizeListedRow
  );
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
  /** Solo con `limit`: publica esa cola restringida a un curso. */
  courseId?: string;
}): Promise<{ id: string; slug: string }[]> {
  const supabase = getSupabase();

  let rows: { id: string; slug: string }[] = [];

  if (opts.ids?.length) {
    let q = supabase
      .from('blog_posts')
      .select('id, slug')
      .eq('status', 'draft')
      .in('id', opts.ids);
    if (opts.courseId?.trim()) q = q.eq('course_id', opts.courseId.trim());
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows = data ?? [];
  } else if (opts.slugs?.length) {
    const normalized = opts.slugs.map((s) => sanitizeSlugForUrl(s));
    let q = supabase
      .from('blog_posts')
      .select('id, slug')
      .eq('status', 'draft')
      .in('slug', normalized);
    if (opts.courseId?.trim()) q = q.eq('course_id', opts.courseId.trim());
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows = data ?? [];
  } else {
    const lim = Math.min(Math.max(opts.limit ?? 3, 1), 50);
    return publishDraftBlogPosts(
      lim,
      opts.courseId?.trim() ? { courseId: opts.courseId.trim() } : undefined
    );
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

/** Borrado masivo (panel). Opcionalmente restringido a un curso por seguridad. */
export async function deleteBlogPostsBulk(opts: {
  ids: string[];
  courseId?: string;
}): Promise<{ deleted: number; publishedSlugs: string[] }> {
  const supabase = getSupabase();
  const unique = Array.from(new Set(opts.ids.map((id) => id?.trim()).filter(Boolean)));
  if (!unique.length) return { deleted: 0, publishedSlugs: [] };

  let q = supabase.from('blog_posts').select('id, slug, status').in('id', unique);
  if (opts.courseId?.trim()) {
    q = q.eq('course_id', opts.courseId.trim());
  }

  const { data: rows, error: fetchErr } = await q;
  if (fetchErr) throw new Error(fetchErr.message);

  const toDrop = (rows ?? []).map((r) => r.id);
  if (!toDrop.length) return { deleted: 0, publishedSlugs: [] };

  const publishedSlugs = (rows ?? [])
    .filter((r) => r.status === 'published' && r.slug)
    .map((r) => r.slug as string);

  const { error: delErr } = await supabase.from('blog_posts').delete().in('id', toDrop);
  if (delErr) throw new Error(delErr.message);

  return { deleted: toDrop.length, publishedSlugs };
}
