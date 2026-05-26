import type { ExpandedCourseContent, ExpandedLesson } from '@/services/openaiEbookService';
import type {
  CourseInputPayload,
  CourseRecord,
  GeneratedCourseStructure,
  GeneratedLesson,
  GeneratedTopic,
} from '@/types';
import type { Course, Lesson, LessonKind, LessonState, Module } from '@/components/learn/types';

export type LessonProgressMap = Map<string, { completed_at: string | null }>;

export function formatDurationMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

export function lessonCode(topicIndex: number, lessonIndex: number): string {
  return `${topicIndex + 1}.${lessonIndex + 1}`;
}

export function buildLearnCourseMeta(
  course: CourseRecord,
  completionPct: number,
  stats: { xp: number; streak_days: number }
): Course {
  const gc = course.generated_content;
  const input = (course.input_payload ?? {}) as CourseInputPayload;
  const lessonCount = (gc?.topics ?? []).reduce(
    (s, t) => s + (t.lessons?.length ?? 0),
    0
  );
  return {
    slug: course.public_slug ?? course.id,
    title: gc?.title ?? course.published_title ?? course.topic,
    tag: (course.catalog_category ?? input.courseVertical ?? 'CURSO').toUpperCase(),
    instructor: gc?.author_name ?? 'Recursalia',
    instructorRole: 'Instructor',
    duration: formatDurationMinutes(gc?.total_duration_minutes ?? 0),
    lessons: lessonCount,
    level: input.level ?? 'beginner',
    color: '#1b38c4',
    completion: completionPct,
    streak: stats.streak_days,
    xp: stats.xp,
  };
}

function resolveLessonKind(
  lesson: GeneratedLesson,
  quizLessonIds: Set<string>
): LessonKind {
  if (quizLessonIds.has(lesson.id)) return 'quiz';
  return 'text';
}

export function buildLearnModules(
  gc: GeneratedCourseStructure,
  progress: LessonProgressMap,
  quizLessonIds: Set<string> = new Set(),
  finalBossLessonId?: string | null
): Module[] {
  const flat: { topicIdx: number; lessonIdx: number; lesson: GeneratedLesson }[] = [];
  (gc.topics ?? []).forEach((topic, ti) => {
    (topic.lessons ?? []).forEach((lesson, li) => {
      flat.push({ topicIdx: ti, lessonIdx: li, lesson });
    });
  });

  let currentAssigned = false;
  const modules: Module[] = [];

  (gc.topics ?? []).forEach((topic: GeneratedTopic, ti) => {
    const lessons: Lesson[] = (topic.lessons ?? []).map((lesson, li) => {
      const prog = progress.get(lesson.id);
      const isDone = Boolean(prog?.completed_at);
      let state: LessonState = 'locked';
      if (isDone) {
        state = 'done';
      } else if (!currentAssigned) {
        const prevFlatIdx = flat.findIndex(
          (f) => f.topicIdx === ti && f.lessonIdx === li
        );
        const allPrevDone =
          prevFlatIdx <= 0 ||
          flat
            .slice(0, prevFlatIdx)
            .every((f) => Boolean(progress.get(f.lesson.id)?.completed_at));
        if (allPrevDone) {
          state = 'current';
          currentAssigned = true;
        } else {
          state = 'next';
        }
      } else {
        state = 'locked';
      }

      let kind = resolveLessonKind(lesson, quizLessonIds);
      if (finalBossLessonId === lesson.id) kind = 'boss';

      return {
        id: lesson.id,
        code: lessonCode(ti, li),
        kind,
        title: lesson.title,
        dur: `${lesson.duration_minutes ?? 15} min`,
        state,
      };
    });

    modules.push({
      n: ti + 1,
      topicId: topic.id,
      title: topic.title,
      summary: '',
      isFinal: ti === (gc.topics?.length ?? 1) - 1,
      lessons,
    });
  });

  return modules;
}

export function findLessonByUuid(
  gc: GeneratedCourseStructure,
  lessonUuid: string
): { topicIdx: number; lessonIdx: number; lesson: GeneratedLesson } | null {
  for (let ti = 0; ti < (gc.topics?.length ?? 0); ti++) {
    const topic = gc.topics[ti];
    for (let li = 0; li < (topic.lessons?.length ?? 0); li++) {
      if (topic.lessons[li].id === lessonUuid) {
        return { topicIdx: ti, lessonIdx: li, lesson: topic.lessons[li] };
      }
    }
  }
  return null;
}

export function getExpandedLesson(
  expanded: ExpandedCourseContent | null,
  topicIdx: number,
  lessonIdx: number
): ExpandedLesson | null {
  const topic = expanded?.topics?.[topicIdx];
  const lesson = topic?.lessons?.[lessonIdx];
  return lesson ?? null;
}

export function expandedLessonToHtml(
  expanded: ExpandedLesson | null,
  fallbackHtml: string
): string {
  if (!expanded) return fallbackHtml;
  const parts: string[] = [];

  // Intro = "lead" (entradilla grande, no body)
  if (expanded.intro?.trim()) {
    parts.push(`<p class="lesson-lead">${escapeInline(expanded.intro)}</p>`);
  }

  // Body: párrafos. Detectamos pull-quotes (frases entre «...» en su propio párrafo).
  // El primer párrafo lleva drop-cap automático (clase `has-dropcap`).
  if (expanded.body?.trim()) {
    const paragraphs = expanded.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    paragraphs.forEach((p, i) => {
      const isQuote = /^[«"]/.test(p) && /[»"]$/.test(p) && p.length < 240;
      if (isQuote) {
        parts.push(
          `<blockquote class="lesson-pullquote">${escapeInline(p)}</blockquote>`
        );
        return;
      }
      const classes = ['lesson-p'];
      if (i === 0) classes.push('has-dropcap');
      parts.push(`<p class="${classes.join(' ')}">${escapeInline(p)}</p>`);
    });
  }

  // Ejemplo = callout azul
  if (expanded.example?.trim()) {
    parts.push(
      `<aside class="lesson-callout lesson-callout--example" role="note">` +
        `<div class="lesson-callout__kicker"><span class="lesson-callout__icon" aria-hidden="true">💡</span>Ejemplo</div>` +
        `<div class="lesson-callout__body">${escapeInline(expanded.example)}</div>` +
        `</aside>`
    );
  }

  // Ejercicio = callout dorado
  if (expanded.exercise?.trim()) {
    parts.push(
      `<aside class="lesson-callout lesson-callout--exercise" role="note">` +
        `<div class="lesson-callout__kicker"><span class="lesson-callout__icon" aria-hidden="true">🎯</span>Ejercicio rápido</div>` +
        `<div class="lesson-callout__body">${escapeInline(expanded.exercise)}</div>` +
        `</aside>`
    );
  }

  // Key points = tarjeta destacada con checks
  if (expanded.keyPoints?.length) {
    const items = expanded.keyPoints
      .map(
        (k) =>
          `<li><span class="lesson-keypoints__bullet" aria-hidden="true">✓</span><span>${escapeInline(
            k
          )}</span></li>`
      )
      .join('');
    parts.push(
      `<section class="lesson-keypoints" aria-label="Puntos clave">` +
        `<div class="lesson-keypoints__title">Lo que te llevas de esta lección</div>` +
        `<ul>${items}</ul>` +
        `</section>`
    );
  }

  if (parts.length === 0 && expanded.content?.trim()) return expanded.content;
  if (parts.length === 0) return fallbackHtml;
  return parts.join('\n');
}

// Escapa HTML pero conserva la posibilidad de **negrita** y *cursiva* sencillas en markdown inline.
function escapeInline(s: string): string {
  let out = escapeHtml(s);
  // Negrita **texto**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Cursiva *texto* (cuidado: no aplicar dentro de strong; orden importa)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

export function getAdjacentLessons(
  gc: GeneratedCourseStructure,
  lessonUuid: string
): {
  prev: GeneratedLesson | null;
  next: GeneratedLesson | null;
  index: number;
  total: number;
} {
  const flat = (gc.topics ?? []).flatMap((t) => t.lessons ?? []);
  const idx = flat.findIndex((l) => l.id === lessonUuid);
  if (idx < 0) {
    return { prev: null, next: null, index: 0, total: flat.length };
  }
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
    index: idx + 1,
    total: flat.length,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function computeCompletionPct(
  gc: GeneratedCourseStructure,
  progress: LessonProgressMap
): number {
  const lessons = (gc.topics ?? []).flatMap((t) => t.lessons ?? []);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => progress.get(l.id)?.completed_at).length;
  return done / lessons.length;
}

export function findCurrentLessonFromModules(modules: Module[]): Lesson | null {
  for (const m of modules) {
    const current = m.lessons.find((l) => l.state === 'current');
    if (current) return current;
  }
  for (const m of modules) {
    const pending = m.lessons.find(
      (l) => l.state === 'next' || (l.state !== 'done' && l.state !== 'locked')
    );
    if (pending) return pending;
  }
  return null;
}

export function countLessonStats(modules: Module[]): { total: number; done: number } {
  const all = modules.flatMap((m) => m.lessons);
  return {
    total: all.length,
    done: all.filter((l) => l.state === 'done').length,
  };
}

export function isReadyForFinalExam(modules: Module[]): boolean {
  const regular = modules.flatMap((m) => m.lessons).filter((l) => l.kind !== 'boss');
  return regular.length > 0 && regular.every((l) => l.state === 'done');
}
