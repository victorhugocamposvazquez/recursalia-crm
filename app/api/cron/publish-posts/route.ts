import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import { publishDraftBlogPosts } from '@/services/blogPostService';

const POSTS_PER_RUN = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const published = await publishDraftBlogPosts(POSTS_PER_RUN);

    if (published.length === 0) {
      console.log('[cron] No draft blog posts to publish');
      return jsonResponse({ published: 0, message: 'No drafts pending' });
    }

    console.log(`[cron] Publishing ${published.length} blog posts...`);

    revalidatePath('/blog');
    for (const p of published) {
      revalidatePath(`/blog/${p.slug}`);
    }

    return jsonResponse({
      published: published.length,
      posts: published,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron] Error:', msg);
    return errorResponse('Cron publish error', 500, msg);
  }
}
