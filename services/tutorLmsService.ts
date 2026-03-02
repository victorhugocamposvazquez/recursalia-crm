/**
 * Servicio para crear currículo (temarios) en Tutor LMS.
 * Usa el plugin Recursalia primero (que establece post_parent correctamente),
 * con fallback a la API REST de Tutor Pro.
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

  const pluginOk = await useRecursaliaPlugin(url, authHeader, courseId, content);
  if (pluginOk) return;

  const tutorOk = await tryTutorProApi(url, authHeader, courseId, topics);
  if (tutorOk) return;

  throw new Error(
    'Curriculum: ni el plugin Recursalia ni la API de Tutor Pro pudieron crear el temario.'
  );
}

async function useRecursaliaPlugin(
  baseUrl: string,
  authHeader: string,
  courseId: number,
  content: GeneratedCourseStructure
): Promise<boolean> {
  try {
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
      console.error(`Recursalia plugin curriculum error ${res.status}: ${text}`);
      return false;
    }

    const result = (await res.json()) as {
      created_topics?: number;
      created_lessons?: number;
      topic_ids?: number[];
    };

    if ((result.created_topics ?? 0) === 0 && topics.length > 0) {
      console.error('Recursalia plugin: 0 topics creados');
      return false;
    }

    return true;
  } catch (err) {
    console.error('Recursalia plugin curriculum exception:', err);
    return false;
  }
}

async function tryTutorProApi(
  baseUrl: string,
  authHeader: string,
  courseId: number,
  topics: { title: string; lessons: { title: string; content?: string }[] }[]
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

      const topicData = (await topicRes.json()) as Record<string, unknown>;
      const topicId = (topicData.ID ?? topicData.id) as number | undefined;
      if (!topicId || typeof topicId !== 'number') return false;

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
