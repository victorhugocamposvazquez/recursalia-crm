import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { buildHubLearnData, getFinalQuizForCourse, getQuizMap } from '@/lib/learn/lmsServer';
import { AprenderHubClient } from '@/components/learn/AprenderHubClient';

type Props = { params: Promise<{ slug: string }> };

export default async function AprenderHubPage({ params }: Props) {
  const { slug } = await params;
  const { user, course } = await requireCourseAccess(slug);
  if (!course.generated_content) notFound();

  const { learnCourse, modules, stats } = await buildHubLearnData(user.id, course);
  const quizByLesson = await getQuizMap(course.id);
  const finalQuiz = await getFinalQuizForCourse(course.id);

  if (!course.expanded_content) {
    return (
      <div style={{ padding: 48, maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Contenido en preparación</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          El curso aún no tiene el contenido extendido de lecciones. Un administrador debe
          generarlo desde el panel en «Contenido del curso» antes de que puedas estudiar.
        </p>
      </div>
    );
  }

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
      finalQuizId={finalQuiz?.id ?? null}
    />
  );
}
