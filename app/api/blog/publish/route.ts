import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import {
  publishBlogDraftsSelective,
} from '@/services/blogPostService';
import { revalidatePublishedBlogPosts } from '@/lib/blog-revalidate';
import { jsonResponse, errorResponse } from '@/utils/api-response';

/** Publicación manual: elige borradores por id/slug o “siguientes N” como el cron (prioridad + antigüedad). */
export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      ids?: string[];
      slugs?: string[];
      limit?: number;
      /** Con `limit`, limita la cola a borradores de este curso. */
      courseId?: string;
    };

    const hasIds = Array.isArray(body.ids) && body.ids.length > 0;
    const hasSlugs = Array.isArray(body.slugs) && body.slugs.length > 0;

    if (hasIds && hasSlugs) {
      return errorResponse('Usa solo ids o solo slugs, no ambos', 400);
    }

    const published = await publishBlogDraftsSelective({
      ids: hasIds ? body.ids : undefined,
      slugs: hasSlugs ? body.slugs : undefined,
      limit: !hasIds && !hasSlugs ? body.limit ?? 10 : undefined,
      courseId: body.courseId?.trim() || undefined,
    });

    revalidatePublishedBlogPosts(published.map((p) => p.slug));

    return jsonResponse({
      published: published.length,
      posts: published,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Publish failed', 500, msg);
  }
}
