import type { GeneratedCourseStructure, GeneratedLesson, GeneratedTopic } from '@/types';

export function recalcTotalDurationMinutes(topics: GeneratedTopic[]): number {
  let sum = 0;
  for (const t of topics) {
    for (const L of t.lessons ?? []) {
      const m = L.duration_minutes;
      sum +=
        typeof m === 'number' && Number.isFinite(m)
          ? Math.max(0, Math.round(m))
          : 0;
    }
  }
  return sum;
}

export function defaultLesson(): GeneratedLesson {
  return {
    id: crypto.randomUUID(),
    slug: '',
    title: 'Nueva lección',
    content: '<p></p>',
    duration_minutes: 15,
  };
}

export function defaultTopic(): GeneratedTopic {
  return {
    id: crypto.randomUUID(),
    slug: '',
    title: 'Nuevo módulo',
    lessons: [defaultLesson()],
  };
}

export function withTopics(
  prev: GeneratedCourseStructure,
  topics: GeneratedTopic[]
): GeneratedCourseStructure {
  return {
    ...prev,
    topics,
    total_duration_minutes: recalcTotalDurationMinutes(topics),
  };
}
