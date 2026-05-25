import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import {
  buildHubLearnData,
  getCourseQuizzesByTopic,
  getProfileRole,
  getQuizMap,
} from '@/lib/learn/lmsServer';
import { getSupabase } from '@/lib/supabase';
import { AprenderHubClient } from '@/components/learn/AprenderHubClient';
import { CoursePendingContent } from '@/components/learn/CoursePendingContent';

type Props = { params: Promise<{ slug: string }> };

export default async function AprenderHubPage({ params }: Props) {
  const { slug } = await params;
  const { user, course } = await requireCourseAccess(slug);
  if (!course.generated_content) notFound();

  // Si el contenido extendido aún no existe, salimos pronto y mostramos el
  // estado pendiente (con CTA admin para generarlo desde aquí).
  if (!course.expanded_content) {
    const role = await getProfileRole(user.id);
    return (
      <CoursePendingContent
        courseId={course.id}
        courseSlug={slug}
        courseTitle={course.generated_content.title ?? course.published_title ?? course.topic}
        isAdmin={role === 'admin'}
      />
    );
  }

  const [{ learnCourse, modules, stats }, quizByLesson, courseQuizzes] = await Promise.all([
    buildHubLearnData(user.id, course),
    getQuizMap(course.id),
    getCourseQuizzesByTopic(course.id),
  ]);

  // Mejores resultados del usuario por quiz (para mostrar score en cada módulo).
  const allQuizIds = courseQuizzes.all.map((q) => q.id);
  let bestScores: Record<string, number> = {};
  if (allQuizIds.length > 0) {
    const admin = getSupabase();
    const { data: attempts } = await admin
      .from('quiz_attempts')
      .select('quiz_id, score')
      .eq('user_id', user.id)
      .in('quiz_id', allQuizIds)
      .not('score', 'is', null);
    for (const a of attempts ?? []) {
      const id = a.quiz_id as string;
      const score = Number(a.score);
      if (!Number.isFinite(score)) continue;
      if (bestScores[id] === undefined || score > bestScores[id]) {
        bestScores[id] = score;
      }
    }
  }

  const quizByTopic: Record<
    string,
    {
      id: string;
      title: string;
      question_count: number;
      pass_threshold: number;
      bestScore: number | null;
    }
  > = {};
  courseQuizzes.byTopic.forEach((q, topicId) => {
    quizByTopic[topicId] = {
      id: q.id,
      title: q.title,
      question_count: q.question_count,
      pass_threshold: Number(q.pass_threshold),
      bestScore: bestScores[q.id] ?? null,
    };
  });

  const finalQuiz = courseQuizzes.final;
  const finalQuizMeta = finalQuiz
    ? {
        id: finalQuiz.id,
        title: finalQuiz.title,
        question_count: finalQuiz.question_count,
      }
    : null;

  return (
    <AprenderHubClient
      tweak={{}}
      course={learnCourse}
      modules={modules}
      enrolled={[]}
      completed={[]}
      courseSlug={slug}
      courseId={course.id}
      stats={{ xp: stats.xp, streak_days: stats.streak_days, level: stats.level }}
      quizByLesson={quizByLesson}
      quizByTopic={quizByTopic}
      finalQuizId={finalQuiz?.id ?? null}
      finalQuizMeta={finalQuizMeta}
    />
  );
}
