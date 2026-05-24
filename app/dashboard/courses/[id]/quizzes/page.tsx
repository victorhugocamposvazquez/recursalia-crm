import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/supabase';
import type { CourseRecord, GeneratedCourseStructure } from '@/types';
import { QuizzesAdminClient, type ModuleSummary, type QuizSummaryAdmin } from './QuizzesAdminClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function CourseQuizzesAdminPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/dashboard/courses/${id}/quizzes`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/aprender');

  const admin = getSupabase();
  const { data: course } = await admin
    .from('courses')
    .select('id, topic, published_title, generated_content, public_slug, expanded_content')
    .eq('id', id)
    .maybeSingle();

  if (!course) notFound();

  const gc = course.generated_content as GeneratedCourseStructure | null;
  const hasContent = Boolean(gc?.topics?.length);
  const hasExpanded = Boolean(course.expanded_content);

  const { data: quizzes } = await admin
    .from('quizzes')
    .select('id, topic_id, lesson_id, is_final, title, pass_threshold, module_position, created_at')
    .eq('course_id', id);

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const counts: Record<string, number> = {};
  if (quizIds.length > 0) {
    const { data: qs } = await admin
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds);
    for (const row of qs ?? []) {
      const qid = row.quiz_id as string;
      counts[qid] = (counts[qid] ?? 0) + 1;
    }
  }

  const adminQuizzes: QuizSummaryAdmin[] = (quizzes ?? []).map((q) => ({
    id: q.id as string,
    topic_id: (q.topic_id as string | null) ?? null,
    lesson_id: (q.lesson_id as string | null) ?? null,
    is_final: Boolean(q.is_final),
    title: q.title as string,
    pass_threshold: Number(q.pass_threshold) || 0.7,
    module_position: q.module_position as number | null,
    question_count: counts[q.id as string] ?? 0,
    created_at: q.created_at as string,
  }));

  const modules: ModuleSummary[] = hasContent
    ? gc!.topics.map((t, idx) => ({
        topicId: t.id,
        title: t.title,
        position: idx,
        lessonsCount: t.lessons?.length ?? 0,
      }))
    : [];

  const finalQuiz = adminQuizzes.find((q) => q.is_final) ?? null;

  return (
    <QuizzesAdminClient
      courseId={id}
      courseTitle={(course.published_title as string) ?? (course.topic as string) ?? 'Curso'}
      coursePublicSlug={(course.public_slug as string) ?? null}
      hasContent={hasContent}
      hasExpanded={hasExpanded}
      modules={modules}
      quizzes={adminQuizzes}
      finalQuiz={finalQuiz}
    />
  );
}
