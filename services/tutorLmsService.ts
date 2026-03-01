/**
 * Servicio para crear currículo (temarios) en Tutor LMS.
 * Usa la API REST de Tutor Pro (wp-json/tutor/v1/) cuando está disponible,
 * con fallback al endpoint del plugin Recursalia.
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

  // Intentar primero la API REST de Tutor Pro (tutor/v1)
  const tutorApiOk = await tryTutorProApi(url, authHeader, courseId, topics);
  if (tutorApiOk) return;

  // Fallback: endpoint del plugin Recursalia
  await useRecursaliaPlugin(url, authHeader, courseId, content);
}

async function tryTutorProApi(
  baseUrl: string,
  authHeader: string,
  courseId: number,
  topics: { title: string; lessons: { title: string; content: string }[] }[]
): Promise<boolean> {
  try {
    for (const topic of topics) {
      const topicSummary = topic.lessons[0]?.title ?? topic.title;
      const topicRes = await fetch(`${baseUrl}/wp-json/tutor/v1/topics`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic_course_id: courseId,
          topic_title: topic.title,
          topic_summary: topicSummary,
          topic_author: TUTOR_AUTHOR_ID,
        }),
      });

      if (!topicRes.ok) return false;

      const topicData = (await topicRes.json()) as { ID?: number; id?: number };
      const topicId = topicData.ID ?? topicData.id;
      if (!topicId) return false;

      for (const lesson of topic.lessons) {
        const lessonRes = await fetch(`${baseUrl}/wp-json/tutor/v1/lessons`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic_id: topicId,
            course_id: courseId,
            lesson_title: lesson.title,
            lesson_content: lesson.content ?? '',
            lesson_author: TUTOR_AUTHOR_ID,
          }),
        });
        if (!lessonRes.ok) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
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
}
