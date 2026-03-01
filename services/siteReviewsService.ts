import type { GeneratedReview } from '@/types';
import { withRetry } from '@/utils/retry';

function getConfig() {
  const url = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  if (!url || !user || !appPassword)
    throw new Error('WordPress env vars required');
  return {
    url,
    authHeader: `Basic ${Buffer.from(`${user}:${appPassword}`).toString('base64')}`,
  };
}

export interface CreateReviewCategoryResponse {
  term_id: number;
  slug: string;
}

export async function createReviewCategory(
  courseTitle: string,
  slug?: string
): Promise<CreateReviewCategoryResponse> {
  const { url, authHeader } = getConfig();
  const categorySlug =
    slug ?? courseTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const result = await withRetry(
    async () => {
      const res = await fetch(`${url}/wp-json/recursalia/v1/review-category`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: courseTitle, slug: categorySlug }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Site Reviews category error ${res.status}: ${text}`);
      }

      return (await res.json()) as CreateReviewCategoryResponse;
    },
    { maxRetries: 2, delayMs: 1000 }
  );

  return result;
}

export async function createReviews(
  courseId: number,
  categorySlug: string,
  reviews: GeneratedReview[],
  categoryTermId?: number
): Promise<{ created: number }> {
  const { url, authHeader } = getConfig();

  const result = await withRetry(
    async () => {
      const body: Record<string, unknown> = {
        assigned_post_id: courseId,
        category_slug: categorySlug,
        reviews,
      };
      if (categoryTermId && categoryTermId > 0) {
        body.category_term_id = categoryTermId;
      }
      const res = await fetch(`${url}/wp-json/recursalia/v1/reviews`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Site Reviews create error ${res.status}: ${text}`);
      }

      return (await res.json()) as { created: number };
    },
    { maxRetries: 2, delayMs: 1500 }
  );

  return result;
}
