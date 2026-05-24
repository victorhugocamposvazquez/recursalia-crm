import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { getQuizById, getQuizQuestions } from '@/lib/learn/lmsServer';
import { AprenderQuizClient } from '@/components/learn/AprenderQuizClient';
import type { QuizQuestionRecord } from '@/types';

type Props = { params: Promise<{ slug: string; quizId: string }> };

export default async function AprenderQuizPage({ params }: Props) {
  const { slug, quizId } = await params;
  const { course } = await requireCourseAccess(slug);
  const quiz = await getQuizById(quizId);
  if (!quiz || quiz.course_id !== course.id) notFound();

  const questions = (await getQuizQuestions(quizId)) as QuizQuestionRecord[];

  return (
    <AprenderQuizClient
      courseId={course.id}
      courseSlug={slug}
      quizId={quizId}
      title={quiz.title}
      questions={questions}
    />
  );
}
