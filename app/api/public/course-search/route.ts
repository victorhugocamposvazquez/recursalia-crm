import { NextRequest } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { jsonResponse, errorResponse } from '@/utils/api-response';

const SELECT =
  'id, public_slug, published_title, topic, featured_image_url, generated_content';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return jsonResponse({ results: [] });
  }

  try {
    const supabase = createPublicSupabaseClient();
    const base = () =>
      supabase
        .from('courses')
        .select(SELECT)
        .eq('status', 'published')
        .not('public_slug', 'is', null);

    const [{ data: byTitle, error: e1 }, { data: byTopic, error: e2 }] =
      await Promise.all([
        base().ilike('published_title', `%${q}%`).limit(12),
        base().ilike('topic', `%${q}%`).limit(12),
      ]);

    if (e1 || e2) {
      return errorResponse('Search failed', 500, e1?.message ?? e2?.message);
    }

    const map = new Map<string, (typeof byTitle)[number]>();
    for (const row of [...(byTitle ?? []), ...(byTopic ?? [])]) {
      map.set(row.id, row);
    }
    const merged = Array.from(map.values()).slice(0, 12);

    const results = merged.map((row) => {
      const gc = row.generated_content as {
        title?: string;
        short_description?: string;
      } | null;
      return {
        id: row.id,
        slug: row.public_slug as string,
        title: row.published_title || gc?.title || row.topic,
        subtitle: gc?.short_description ?? '',
        image: row.featured_image_url,
      };
    });

    return jsonResponse({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Search unavailable', 500, msg);
  }
}
