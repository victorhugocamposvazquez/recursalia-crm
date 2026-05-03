import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { listBlogPosts } from '@/services/blogPostService';
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
