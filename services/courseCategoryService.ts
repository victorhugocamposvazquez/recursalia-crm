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

export interface CourseCategoryResponse {
  term_id: number;
  slug: string;
}

export async function createCourseCategory(
  name: string,
  slug?: string
): Promise<CourseCategoryResponse> {
  const { url, authHeader } = getConfig();
  const categorySlug =
    slug ?? name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const result = await withRetry(
    async () => {
      const res = await fetch(`${url}/wp-json/recursalia/v1/course-category`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug: categorySlug }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Course category error ${res.status}: ${text}`);
      }

      return (await res.json()) as CourseCategoryResponse;
    },
    { maxRetries: 2, delayMs: 1000 }
  );

  return result;
}

export async function assignCourseCategory(
  courseId: number,
  termId: number
): Promise<void> {
  const { url, authHeader } = getConfig();

  const res = await fetch(`${url}/wp-json/recursalia/v1/course-assign-category`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ course_id: courseId, term_id: termId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Assign course category error ${res.status}: ${text}`);
  }
}
