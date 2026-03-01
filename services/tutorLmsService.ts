/**
 * Servicio para crear currículo (temarios) en Tutor LMS.
 * Usa el endpoint del plugin Recursalia que crea topics y lessons con wp_insert_post.
 */

import type { GeneratedCourseStructure } from '@/types';

const TUTOR_AUTHOR_ID = parseInt(process.env.WORDPRESS_AUTHOR_ID ?? '1', 10);

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

export async function createCurriculum(
  courseId: number,
  content: GeneratedCourseStructure
): Promise<void> {
  const { url, authHeader } = getConfig();
  const topics = content.topics ?? [];
  if (!topics.length) return;

  await useRecursaliaPlugin(url, authHeader, courseId, content);
}

async function useRecursaliaPlugin(
  baseUrl: string,
  authHeader: string,
  courseId: number,
  content: GeneratedCourseStructure
): Promise<void> {
  const topics = content.topics.map((t) => ({
    title: t.title,
    lessons: t.lessons.map((l) => ({
      title: l.title,
      content: l.content,
    })),
  }));

  const res = await fetch(`${baseUrl}/wp-json/recursalia/v1/course-curriculum`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      course_id: courseId,
      topics,
      author_id: TUTOR_AUTHOR_ID,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Course curriculum error ${res.status}: ${text}`);
  }

  const result = (await res.json()) as { created_topics?: number; created_lessons?: number };
  if (topics.length > 0 && (result.created_topics ?? 0) === 0) {
    throw new Error(
      `Curriculum: no se crearon temas (se enviaron ${topics.length}). Verifica que Tutor LMS esté activo y los post types "topics"/"lesson" existan.`
    );
  }
}
