import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { updateBlogPost, normalizeBlogPostApiRow } from '@/services/blogPostService';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      title?: string;
      slug?: string;
      meta_description?: string | null;
      content?: string;
      tags?: string[];
    };

    const supabase = getSupabase();
    const { data: row, error: fetchErr } = await supabase
      .from('blog_posts')
      .select('id, status, slug')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !row) return errorResponse('Post not found', 404);

    if (
      row.status === 'published' &&
      body.slug !== undefined &&
      body.slug !== row.slug
    ) {
      return errorResponse(
        'Slug bloqueado en artículos publicados (usa 301 o borra y republica)',
        400,
        'PUBLISHED_SLUG_LOCKED'
      );
    }

    await updateBlogPost(id, body);
    const { data: fresh, error: freshErr } = await supabase
      .from('blog_posts')
      .select(
        'id, course_id, title, slug, meta_description, content, post_type, status, tags, created_at, published_at, publish_priority, courses(topic, published_title, public_slug, status)'
      )
      .eq('id', id)
      .single();

    if (freshErr || !fresh) {
      return errorResponse('Post not found after update', 404);
    }

    return jsonResponse({ post: normalizeBlogPostApiRow(fresh) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'SLUG_EXISTS') {
      return errorResponse('Ya existe otro artículo con ese slug', 409, msg);
    }
    return errorResponse('Blog update failed', 500, msg);
  }
}
