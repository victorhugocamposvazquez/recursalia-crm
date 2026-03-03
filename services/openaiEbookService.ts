/**
 * Genera contenido extenso para cada lección del curso (solo para el PDF/ebook).
 * Hace una llamada a OpenAI por cada lección pidiendo ~1500 palabras.
 */

import OpenAI from 'openai';
import type { GeneratedCourseStructure } from '@/types';

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
- Escribe entre 1200 y 1800 palabras.
- Estructura: introduccion, desarrollo con subtemas, ejemplos practicos, y un resumen con puntos clave al final.
- Tono profesional pero accesible.
- Sin emojis, sin markdown (ni #, ni **, ni -, ni *). Solo texto plano con parrafos separados por lineas en blanco.
- Incluye ejemplos reales o casos practicos donde corresponda.
- Al final del capitulo, anade un apartado "Puntos clave" con 4-6 ideas principales en forma de lista numerada (1. 2. 3...).`,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export type ProgressCallback = (current: number, total: number, lessonTitle: string) => void;

export function countLessons(content: GeneratedCourseStructure): number {
  return (content.topics ?? []).reduce((sum, t) => sum + t.lessons.length, 0);
}

export async function expandCourseForEbook(
  content: GeneratedCourseStructure,
  onProgress?: ProgressCallback
): Promise<ExpandedCourseContent> {
  const openai = getOpenAI();
  const expandedTopics: ExpandedTopic[] = [];
  const total = countLessons(content);
  let current = 0;

  for (const topic of content.topics ?? []) {
    const expandedLessons: ExpandedLesson[] = [];
    for (const lesson of topic.lessons) {
      current++;
      onProgress?.(current, total, lesson.title);
      const brief = lesson.content
        ? lesson.content.replace(/<[^>]*>/g, '').slice(0, 500)
        : lesson.title;
      const fullContent = await expandLesson(
        openai,
        content.title,
        topic.title,
        lesson.title,
        brief
      );
      expandedLessons.push({ title: lesson.title, content: fullContent });
    }
    expandedTopics.push({ title: topic.title, lessons: expandedLessons });
  }

  return {
    title: content.title,
    short_description: content.short_description,
    description: content.description,
    author_name: content.author_name,
    topics: expandedTopics,
  };
}
