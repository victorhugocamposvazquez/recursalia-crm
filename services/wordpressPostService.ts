import type { GeneratedSeoPost, SeoPostRecord } from '@/types';
import { withRetry } from '@/utils/retry';

interface WpPostResponse {
  id: number;
  slug: string;
  status: string;
  link: string;
}

function getConfig() {
  const url = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  if (!url || !user || !appPassword) throw new Error('WordPress env vars required');
  return {
    url,
    authHeader: `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`,
  };
}

export async function createWpPost(
  post: GeneratedSeoPost,
  courseWpId: number,
  publishStatus: 'draft' | 'publish' = 'draft',
): Promise<SeoPostRecord> {
  const { url, authHeader } = getConfig();

  const payload = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.meta_description,
    status: publishStatus,
    categories: [] as number[],
    tags: [] as number[],
    meta: {
      _yoast_wpseo_metadesc: post.meta_description,
    },
  };

  const tagIds = await ensureTags(post.tags);
  payload.tags = tagIds;

  const wpPost = await withRetry(
    async () => {
      const res = await fetch(`${url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WordPress post create error ${res.status}: ${text}`);
      }

      return (await res.json()) as WpPostResponse;
    },
    { maxRetries: 2, delayMs: 1000 },
  );

  return {
    wp_post_id: wpPost.id,
    title: post.title,
    slug: wpPost.slug,
    post_type: post.post_type,
    status: publishStatus,
    course_wp_id: courseWpId,
  };
}

export async function publishDraftPost(wpPostId: number): Promise<void> {
  const { url, authHeader } = getConfig();

  const res = await fetch(`${url}/wp-json/wp/v2/posts/${wpPostId}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'publish' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress post publish error ${res.status}: ${text}`);
  }
}

export async function getDraftPosts(limit = 3): Promise<WpPostResponse[]> {
  const { url, authHeader } = getConfig();

  const res = await fetch(
    `${url}/wp-json/wp/v2/posts?status=draft&per_page=${limit}&orderby=date&order=asc`,
    {
      headers: { Authorization: authHeader },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress draft posts fetch error ${res.status}: ${text}`);
  }

  return (await res.json()) as WpPostResponse[];
}

async function ensureTags(tagNames: string[]): Promise<number[]> {
  const { url, authHeader } = getConfig();
  const ids: number[] = [];

  for (const name of tagNames.slice(0, 5)) {
    try {
      const searchRes = await fetch(
        `${url}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}&per_page=1`,
        { headers: { Authorization: authHeader } },
      );
      const existing = (await searchRes.json()) as { id: number; name: string }[];

      if (existing.length > 0) {
        ids.push(existing[0].id);
        continue;
      }

      const createRes = await fetch(`${url}/wp-json/wp/v2/tags`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (createRes.ok) {
        const tag = (await createRes.json()) as { id: number };
        ids.push(tag.id);
      }
    } catch {
      // skip tag on error
    }
  }

  return ids;
}
