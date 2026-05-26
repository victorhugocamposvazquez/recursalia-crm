import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import {
  buildHubLearnData,
  getCourseQuizzesByTopic,
  getFinalQuizForCourse,
  getLessonProgressMap,
  getQuizMap,
  userPassedQuiz,
} from '@/lib/learn/lmsServer';
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
  const progress = await getLessonProgressMap(user.id, course.id);
  const lessonCompleted = Boolean(progress.get(lessonId)?.completed_at);

  // Si es la última lección del módulo y existe quiz de ese módulo, el "siguiente
  // paso" es el quiz, no la primera lección del siguiente topic. Si el alumno
  // ya aprobó el quiz, saltamos directamente a la siguiente lección.
  const currentTopic = gc.topics?.[found.topicIdx];
  const isLastInTopic =
    !!currentTopic &&
    found.lessonIdx === (currentTopic.lessons?.length ?? 0) - 1;
  const quizzesByTopic = await getCourseQuizzesByTopic(course.id);
  const moduleQuiz =
    currentTopic && isLastInTopic ? quizzesByTopic.byTopic.get(currentTopic.id) : undefined;

  // Comprobamos si el alumno ya aprobó ese quiz para no volver a empujarle a él.
  const moduleQuizPassed = moduleQuiz
    ? await userPassedQuiz(user.id, moduleQuiz.id)
    : false;

  let nextHref: string | null = null;
  if (moduleQuiz && !moduleQuizPassed) {
    nextHref = `/aprender/cursos/${slug}/quiz/${moduleQuiz.id}`;
  } else if (next?.id) {
    nextHref = `/aprender/cursos/${slug}/lecciones/${next.id}`;
  } else if (quizzesByTopic.final) {
    // Última lección del curso → examen final
    nextHref = `/aprender/cursos/${slug}/examen`;
  }

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
      lessonCompleted={lessonCompleted}
      nextLessonUuid={next?.id ?? null}
      nextHref={nextHref}
      prevLessonUuid={prev?.id ?? null}
      stats={{ xp: stats.xp, streak_days: stats.streak_days, level: stats.level }}
    />
  );
}
