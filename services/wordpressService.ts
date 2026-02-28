import type { WpCreateCoursePayload, WpCourseResponse } from '@/types/wordpress';
import type { GeneratedCourseStructure } from '@/types';
import { withRetry } from '@/utils/retry';

const WP_URL = process.env.WORDPRESS_URL!;
const WP_USER = process.env.WORDPRESS_USER!;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD!;

const authHeader = `Basic ${Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64')}`;

function buildCourseHtmlContent(content: GeneratedCourseStructure): string {
  const parts: string[] = [content.description];

  for (const topic of content.topics) {
    parts.push(`<h2>${topic.title}</h2>`);
    for (const lesson of topic.lessons) {
      parts.push(`<h3>${lesson.title}</h3>`, lesson.content);
    }
  }

  return parts.join('\n');
}

export async function createCourse(
  content: GeneratedCourseStructure
): Promise<number> {
  const htmlContent = buildCourseHtmlContent(content);

  const payload: WpCreateCoursePayload = {
    title: content.title,
    content: htmlContent,
    status: 'publish',
    meta: {
      _tutor_course_settings: JSON.stringify({
        course_title: content.title,
        course_description: content.short_description,
      }),
    },
  };

  const result = await withRetry(
    async () => {
      const res = await fetch(`${WP_URL}/wp-json/wp/v2/courses`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WordPress API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as WpCourseResponse;
      return data.id;
    },
    { maxRetries: 3, delayMs: 1500 }
  );

  return result;
}
