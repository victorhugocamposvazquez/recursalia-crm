/**
 * Genera contenido extenso para cada lección del curso (solo para el PDF/ebook).
 * Paraleliza las llamadas a OpenAI con concurrencia limitada.
 */

import OpenAI from 'openai';
import type { GeneratedCourseStructure } from '@/types';

const CONCURRENCY = 6;

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY required');
  return new OpenAI({ apiKey: key });
}

export interface ExpandedLesson {
  title: string;
  content: string;
}

export interface ExpandedTopic {
  title: string;
  lessons: ExpandedLesson[];
}

export interface ExpandedCourseContent {
  title: string;
  short_description: string;
  description: string;
  author_name?: string;
  topics: ExpandedTopic[];
}

async function expandLesson(
  openai: OpenAI,
  courseTitle: string,
  topicTitle: string,
  lessonTitle: string,
  lessonBrief: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Eres un escritor experto en contenido educativo. Escribes en castellano, de forma clara, profesional y detallada. No uses emojis. No uses markdown; devuelve texto plano con lineas en blanco para separar parrafos.',
      },
      {
        role: 'user',
        content: `Escribe el contenido completo de la leccion "${lessonTitle}" del modulo "${topicTitle}" del curso "${courseTitle}".

Contexto breve de la leccion:
${lessonBrief}

INSTRUCCIONES:
- Escribe entre 800 y 1200 palabras.
- Estructura: introduccion breve, desarrollo con ejemplos, y "Puntos clave" al final (4-5 ideas numeradas).
- Tono profesional pero accesible.
- Sin emojis, sin markdown. Solo texto plano con parrafos separados por lineas en blanco.
- Incluye algun ejemplo practico o caso real.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export type ProgressCallback = (current: number, total: number, lessonTitle: string) => void;

export function countLessons(content: GeneratedCourseStructure): number {
  return (content.topics ?? []).reduce((sum, t) => sum + t.lessons.length, 0);
}

interface LessonJob {
  topicIdx: number;
  lessonIdx: number;
  topicTitle: string;
  lessonTitle: string;
  brief: string;
}

export async function expandCourseForEbook(
  content: GeneratedCourseStructure,
  onProgress?: ProgressCallback
): Promise<ExpandedCourseContent> {
  const openai = getOpenAI();
  const total = countLessons(content);

  const jobs: LessonJob[] = [];
  for (let ti = 0; ti < (content.topics ?? []).length; ti++) {
    const topic = content.topics![ti];
    for (let li = 0; li < topic.lessons.length; li++) {
      const lesson = topic.lessons[li];
      jobs.push({
        topicIdx: ti,
        lessonIdx: li,
        topicTitle: topic.title,
        lessonTitle: lesson.title,
        brief: lesson.content
          ? lesson.content.replace(/<[^>]*>/g, '').slice(0, 500)
          : lesson.title,
      });
    }
  }

  const results: Map<string, string> = new Map();
  let completed = 0;

  async function runJob(job: LessonJob) {
    const text = await expandLesson(
      openai,
      content.title,
      job.topicTitle,
      job.lessonTitle,
      job.brief
    );
    results.set(`${job.topicIdx}-${job.lessonIdx}`, text);
    completed++;
    onProgress?.(completed, total, job.lessonTitle);
  }

  // Pool de concurrencia
  const pending = [...jobs];
  const active: Promise<void>[] = [];

  while (pending.length > 0 || active.length > 0) {
    while (active.length < CONCURRENCY && pending.length > 0) {
      const job = pending.shift()!;
      const p = runJob(job).then(() => {
        active.splice(active.indexOf(p), 1);
      });
      active.push(p);
    }
    if (active.length > 0) {
      await Promise.race(active);
    }
  }

  const expandedTopics: ExpandedTopic[] = (content.topics ?? []).map((topic, ti) => ({
    title: topic.title,
    lessons: topic.lessons.map((lesson, li) => ({
      title: lesson.title,
      content: results.get(`${ti}-${li}`) ?? '',
    })),
  }));

  return {
    title: content.title,
    short_description: content.short_description,
    description: content.description,
    author_name: content.author_name,
    topics: expandedTopics,
  };
}
