import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { getFinalQuizForCourse } from '@/lib/learn/lmsServer';
import { AprenderExamClient } from '@/components/learn/AprenderExamClient';

type Props = { params: Promise<{ slug: string }> };

export default async function AprenderExamenPage({ params }: Props) {
  const { slug } = await params;
  const { course } = await requireCourseAccess(slug);
  const finalQuiz = await getFinalQuizForCourse(course.id);

  if (!finalQuiz) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Examen no configurado</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          Aún no hay un examen final para este curso. Un administrador puede generarlo con el script
          de quizzes piloto.
        </p>
      </div>
    );
  }

  return (
    <AprenderExamClient courseId={course.id} courseSlug={slug} quizId={finalQuiz.id} />
  );
}
