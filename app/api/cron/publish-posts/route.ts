import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import { getDraftPosts, publishDraftPost } from '@/services/wordpressPostService';

const POSTS_PER_RUN = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const drafts = await getDraftPosts(POSTS_PER_RUN);

    if (drafts.length === 0) {
      console.log('[cron] No draft posts to publish');
      return jsonResponse({ published: 0, message: 'No drafts pending' });
    }

    console.log(`[cron] Publishing ${drafts.length} draft posts...`);

    const published: { id: number; slug: string }[] = [];
    const errors: string[] = [];

    for (const draft of drafts) {
      try {
        await publishDraftPost(draft.id);
        published.push({ id: draft.id, slug: draft.slug });
        console.log(`[cron] Published: ${draft.slug} (ID ${draft.id})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Post ${draft.id}: ${msg}`);
        console.error(`[cron] Failed to publish ${draft.id}:`, msg);
      }
    }

    return jsonResponse({
      published: published.length,
      posts: published,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron] Error:', msg);
    return errorResponse('Cron publish error', 500, msg);
  }
}
