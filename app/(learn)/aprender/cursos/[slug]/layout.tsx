import { redirect } from 'next/navigation';
import {
  getCourseByPublicSlug,
  getSessionUser,
  getProfileRole,
  isEnrolled,
  buildHubLearnData,
  getCourseQuizzesByTopic,
} from '@/lib/learn/lmsServer';
import { CourseTopbar, type CourseQuizEntry } from '@/components/learn/CourseTopbar';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export default async function CourseShellLayout({ params, children }: Props) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const course = await getCourseByPublicSlug(slug);
  // Si el curso no existe, dejamos que la página child gestione el notFound:
  // así evitamos duplicar el render del fallback.
  if (!course) {
    return <>{children}</>;
  }

  const role = await getProfileRole(user.id);
  if (role !== 'admin') {
    const enrolled = await isEnrolled(user.id, course.id);
    if (!enrolled) redirect('/aprender');
  }

  // Si no hay contenido generado todavía, mostramos sólo el header con título
  // y delegamos en la página hija (que renderiza el estado pendiente).
  let courseTitle =
    course.generated_content?.title ?? course.published_title ?? course.topic ?? slug;
  let completion = 0;
  let modules: Awaited<ReturnType<typeof buildHubLearnData>>['modules'] = [];
  let quizzes: CourseQuizEntry[] = [];

  if (course.generated_content && course.expanded_content) {
    const [{ learnCourse, modules: mods }, courseQuizzes] = await Promise.all([
      buildHubLearnData(user.id, course),
      getCourseQuizzesByTopic(course.id),
    ]);
    courseTitle = learnCourse.title;
    completion = learnCourse.completion ?? 0;
    modules = mods;
    quizzes = courseQuizzes.all.map((q) => ({
      id: q.id,
      title: q.title,
      topic_id: q.topic_id,
      is_final: q.is_final,
    }));
  }

  return (
    <>
      <CourseTopbar
        courseSlug={slug}
        courseTitle={courseTitle}
        courseCompletion={completion}
        modules={modules}
        quizzes={quizzes}
      />
      {children}
    </>
  );
}
