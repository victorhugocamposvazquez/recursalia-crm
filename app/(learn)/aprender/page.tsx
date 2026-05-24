import { requireLearnUser } from '@/lib/learn/access';
import {
  buildEnrolledCards,
  ensureUserStats,
  getEnrolledCourses,
  getUserStats,
  getUserDiplomas,
  getLessonProgressMap,
} from '@/lib/learn/lmsServer';
import { buildLearnCourseMeta, computeCompletionPct } from '@/lib/learn/courseAdapter';
import { AprenderDashboardClient } from '@/components/learn/AprenderDashboardClient';
import type { Course } from '@/components/learn/types';

export default async function AprenderPage() {
  const user = await requireLearnUser();
  await ensureUserStats(user.id);

  const [courses, stats, diplomas] = await Promise.all([
    getEnrolledCourses(user.id),
    getUserStats(user.id),
    getUserDiplomas(user.id),
  ]);
  const primary = courses[0];

  const [enrolled, primaryProgress] = await Promise.all([
    buildEnrolledCards(user.id, courses, stats),
    primary?.generated_content
      ? getLessonProgressMap(user.id, primary.id)
      : Promise.resolve(null),
  ]);

  let learnCourse: Course = {
    slug: 'demo',
    title: 'Mis cursos',
    tag: 'CURSO',
    instructor: 'Recursalia',
    instructorRole: 'Instructor',
    duration: '0 min',
    lessons: 0,
    level: 'beginner',
    color: '#1b38c4',
    completion: 0,
    streak: stats.streak_days,
    xp: stats.xp,
  };

  if (primary?.generated_content && primaryProgress) {
    const pct = computeCompletionPct(primary.generated_content, primaryProgress);
    learnCourse = buildLearnCourseMeta(primary, pct, stats);
  }

  const completed = diplomas.map((d) => {
    const courseRow = d.courses as {
      published_title?: string;
      generated_content?: { title?: string; author_name?: string };
    } | null;
    const title =
      courseRow?.published_title ??
      courseRow?.generated_content?.title ??
      'Curso completado';
    return {
      title,
      instructor: courseRow?.generated_content?.author_name ?? 'Recursalia',
      date: new Date(d.issued_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      }),
      score: Math.round((d.score ?? 0) * 100),
      certNumber: d.cert_number,
    };
  });

  const userName =
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    'Alumno';

  return (
    <AprenderDashboardClient
      tweak={{}}
      course={learnCourse}
      modules={[]}
      enrolled={enrolled}
      completed={completed}
      courseSlug={primary?.public_slug ?? ''}
      courseId={primary?.id ?? ''}
      userName={userName}
      stats={{ xp: stats.xp, streak_days: stats.streak_days, level: stats.level }}
    />
  );
}
