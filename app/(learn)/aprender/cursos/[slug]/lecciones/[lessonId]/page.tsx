import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { buildHubLearnData, getFinalQuizForCourse, getQuizMap } from '@/lib/learn/lmsServer';
import {
  expandedLessonToHtml,
  findLessonByUuid,
  getAdjacentLessons,
  getExpandedLesson,
} from '@/lib/learn/courseAdapter';
import { AprenderLessonClient } from '@/components/learn/AprenderLessonClient';

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export default async function AprenderLessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const { user, course } = await requireCourseAccess(slug);
  const gc = course.generated_content;
  if (!gc) notFound();

  const found = findLessonByUuid(gc, lessonId);
  if (!found) notFound();

  if (!course.expanded_content) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Lección no disponible</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          Falta generar el contenido extendido del curso desde el panel de administración.
        </p>
      </div>
    );
  }

  const expanded = getExpandedLesson(
    course.expanded_content,
    found.topicIdx,
    found.lessonIdx
  );
  const fallback = found.lesson.content ?? '<p>Contenido de la lección.</p>';
  const lessonHtml = expandedLessonToHtml(expanded, fallback);

  const { learnCourse, modules, stats } = await buildHubLearnData(user.id, course);
  const { next, prev } = getAdjacentLessons(gc, lessonId);

  return (
    <AprenderLessonClient
      tweak={{}}
      course={learnCourse}
      modules={modules}
      enrolled={[]}
      completed={[]}
      courseSlug={slug}
      courseId={course.id}
      quizByLesson={await getQuizMap(course.id)}
      finalQuizId={(await getFinalQuizForCourse(course.id))?.id ?? null}
      lessonUuid={lessonId}
      lessonTitle={found.lesson.title}
      lessonHtml={lessonHtml}
      nextLessonUuid={next?.id ?? null}
      prevLessonUuid={prev?.id ?? null}
      stats={{ xp: stats.xp, streak_days: stats.streak_days, level: stats.level }}
    />
  );
}
