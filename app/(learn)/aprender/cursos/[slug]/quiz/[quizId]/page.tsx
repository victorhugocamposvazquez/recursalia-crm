import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { getQuizById } from '@/lib/learn/lmsServer';
import { AprenderQuizClient } from '@/components/learn/AprenderQuizClient';

type Props = { params: Promise<{ slug: string; quizId: string }> };

export default async function AprenderQuizPage({ params }: Props) {
  const { slug, quizId } = await params;
  const { course } = await requireCourseAccess(slug);
  const quiz = await getQuizById(quizId);
  if (!quiz || quiz.course_id !== course.id) notFound();

  return (
    <AprenderQuizClient courseId={course.id} courseSlug={slug} quizId={quizId} />
  );
}
