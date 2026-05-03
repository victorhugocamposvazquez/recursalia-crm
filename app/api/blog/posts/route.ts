import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { listBlogPosts, deleteBlogPostsBulk } from '@/services/blogPostService';
import { revalidatePublishedBlogPosts } from '@/lib/blog-revalidate';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'draft' | 'published' | null;
    const courseId = searchParams.get('courseId') ?? undefined;
    const lim = parseInt(searchParams.get('limit') ?? '120', 10);

    const validStatus =
      status === 'draft' || status === 'published' ? status : undefined;

    const posts = await listBlogPosts({
      status: validStatus,
      courseId: courseId || undefined,
      limit: Number.isFinite(lim) ? lim : 120,
    });

    return jsonResponse({ posts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Blog list failed', 500, msg);
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as { ids?: unknown; courseId?: string };
    const raw = body.ids;
    if (!Array.isArray(raw) || raw.length === 0) {
      return errorResponse('Indica al menos un id en `ids`', 400);
    }
    const ids = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    if (!ids.length) {
      return errorResponse('Los ids deben ser texto no vacío', 400);
    }

    const courseId = body.courseId?.trim();
    if (!courseId) {
      return errorResponse('courseId requerido para borrar desde el panel', 400);
    }

    const { deleted, publishedSlugs } = await deleteBlogPostsBulk({
      ids,
      courseId,
    });

    if (publishedSlugs.length) {
      revalidatePublishedBlogPosts(publishedSlugs);
    }

    return jsonResponse({ deleted, revalidated: publishedSlugs.length > 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Blog delete failed', 500, msg);
  }
}
