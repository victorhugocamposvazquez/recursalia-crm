import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/supabase';
import type { CourseRecord } from '@/types';
import {
  buildLearnCourseMeta,
  buildLearnModules,
  computeCompletionPct,
  findCurrentLessonFromModules,
  type LessonProgressMap,
} from '@/lib/learn/courseAdapter';
import type { EnrolledCourseCard } from '@/lib/learn/context';

export type UserStatsRow = {
  xp: number;
  streak_days: number;
  level: number;
  hearts: number;
  completed_first_quiz: boolean;
};

const DEFAULT_STATS: UserStatsRow = {
  xp: 0,
  streak_days: 0,
  level: 1,
  hearts: 5,
  completed_first_quiz: false,
};

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfileRole(userId: string): Promise<'admin' | 'student' | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (data?.role === 'admin' || data?.role === 'student') return data.role;
  return null;
}

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return Boolean(data);
}

export async function getUserStats(userId: string): Promise<UserStatsRow> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_stats')
    .select('xp, streak_days, level, hearts, completed_first_quiz')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return DEFAULT_STATS;
  return data as UserStatsRow;
}

export async function ensureUserStats(userId: string): Promise<void> {
  const admin = getSupabase();
  const { data } = await admin
    .from('user_stats')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) {
    await admin.from('user_stats').insert({ user_id: userId });
  }
}

export async function getLessonProgressMap(
  userId: string,
  courseId: string
): Promise<LessonProgressMap> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId);
  const map: LessonProgressMap = new Map();
  for (const row of data ?? []) {
    map.set(row.lesson_id, { completed_at: row.completed_at });
  }
  return map;
}

export async function getEnrolledCourses(userId: string): Promise<CourseRecord[]> {
  const admin = getSupabase();
  const { data: enrollments } = await admin
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId);
  if (!enrollments?.length) return [];
  const ids = enrollments.map((e) => e.course_id);
  const { data: courses } = await admin
    .from('courses')
    .select('*')
    .in('id', ids);
  return (courses ?? []) as CourseRecord[];
}

export async function getCourseByPublicSlug(slug: string): Promise<CourseRecord | null> {
  const admin = getSupabase();
  const { data } = await admin
    .from('courses')
    .select('*')
    .eq('public_slug', slug)
    .maybeSingle();
  return (data as CourseRecord) ?? null;
}

export async function getQuizLessonIds(courseId: string): Promise<Set<string>> {
  const admin = getSupabase();
  const { data } = await admin
    .from('quizzes')
    .select('lesson_id')
    .eq('course_id', courseId)
    .not('lesson_id', 'is', null);
  return new Set((data ?? []).map((r) => r.lesson_id as string));
}

export async function getQuizMap(courseId: string): Promise<Record<string, string>> {
  const admin = getSupabase();
  const { data } = await admin
    .from('quizzes')
    .select('id, lesson_id')
    .eq('course_id', courseId)
    .not('lesson_id', 'is', null);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.lesson_id) map[row.lesson_id as string] = row.id;
  }
  return map;
}

export type CourseQuizSummary = {
  id: string;
  course_id: string;
  topic_id: string | null;
  lesson_id: string | null;
  is_final: boolean;
  title: string;
  pass_threshold: number;
  module_position: number | null;
  question_count: number;
};

/**
 * Devuelve un mapa de quizzes del curso por topic_id, con `final` como clave separada
 * para el examen final. Si un mismo topic tiene quiz por módulo, gana sobre los lesson-quizzes.
 */
export async function getCourseQuizzesByTopic(
  courseId: string
): Promise<{
  byTopic: Map<string, CourseQuizSummary>;
  final: CourseQuizSummary | null;
  all: CourseQuizSummary[];
}> {
  const admin = getSupabase();
  const { data: quizzes } = await admin
    .from('quizzes')
    .select('id, course_id, topic_id, lesson_id, is_final, title, pass_threshold, module_position')
    .eq('course_id', courseId);

  const list = (quizzes ?? []) as Array<Omit<CourseQuizSummary, 'question_count'>>;
  if (list.length === 0) {
    return { byTopic: new Map(), final: null, all: [] };
  }

  const ids = list.map((q) => q.id);
  const { data: counts } = await admin
    .from('quiz_questions')
    .select('quiz_id')
    .in('quiz_id', ids);
  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.quiz_id as string, (countMap.get(row.quiz_id as string) ?? 0) + 1);
  }

  const summaries: CourseQuizSummary[] = list.map((q) => ({
    ...q,
    question_count: countMap.get(q.id) ?? 0,
  }));

  const byTopic = new Map<string, CourseQuizSummary>();
  let final: CourseQuizSummary | null = null;
  for (const q of summaries) {
    if (q.is_final) {
      final = q;
      continue;
    }
    if (q.topic_id) {
      byTopic.set(q.topic_id, q);
    }
  }
  return { byTopic, final, all: summaries };
}

/**
 * `true` si el usuario tiene al menos un intento aprobado para el quiz dado.
 * Util para decidir si saltarse un quiz de módulo al avanzar tras completar
 * la última lección del topic.
 */
export async function userPassedQuiz(
  userId: string,
  quizId: string
): Promise<boolean> {
  const admin = getSupabase();
  const { data } = await admin
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .eq('passed', true)
    .limit(1);
  return !!(data && data.length);
}

export async function buildEnrolledCards(
  userId: string,
  courses: CourseRecord[],
  _stats: UserStatsRow
): Promise<EnrolledCourseCard[]> {
  void _stats;
  const withContent = courses.filter((c) => Boolean(c.generated_content));

  const fetched = await Promise.all(
    withContent.map(async (c) => {
      const [progress, quizIds] = await Promise.all([
        getLessonProgressMap(userId, c.id),
        getQuizLessonIds(c.id),
      ]);
      return { course: c, progress, quizIds };
    })
  );

  const cards: EnrolledCourseCard[] = [];
  for (const { course: c, progress, quizIds } of fetched) {
    const gc = c.generated_content!;
    const modules = buildLearnModules(gc, progress, quizIds);
    const current = findCurrentLessonFromModules(modules);
    const pct = computeCompletionPct(gc, progress);
    const slug = c.public_slug ?? c.id;
    const nextLabel = current
      ? `${current.code ? `${current.code} ` : ''}${current.title}`.trim()
      : pct >= 1
        ? 'Curso completado'
        : 'Empezar curso';
    cards.push({
      slug,
      title: gc.title,
      instructor: gc.author_name ?? 'Recursalia',
      pct,
      nextLesson: nextLabel,
      time: `${Math.round((1 - pct) * (gc.total_duration_minutes ?? 60))} min restantes`,
      tag: (c.catalog_category ?? 'CURSO').toUpperCase(),
      current: cards.length === 0,
    });
  }
  return cards;
}

export async function buildHubLearnData(
  userId: string,
  course: CourseRecord
) {
  const gc = course.generated_content;
  if (!gc) throw new Error('Course has no content');
  const stats = await getUserStats(userId);
  const progress = await getLessonProgressMap(userId, course.id);
  const quizIds = await getQuizLessonIds(course.id);
  const pct = computeCompletionPct(gc, progress);
  const learnCourse = buildLearnCourseMeta(course, pct, stats);
  const modules = buildLearnModules(gc, progress, quizIds);
  return { learnCourse, modules, stats, progress, gc };
}

export async function getUserDiplomas(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('diplomas')
    .select('cert_number, course_id, score, issued_at, courses(published_title, generated_content, public_slug)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });
  return data ?? [];
}

export async function getDiplomaByShareToken(shareToken: string) {
  const admin = getSupabase();
  const { data } = await admin
    .from('diplomas')
    .select('*, courses(published_title, generated_content, public_slug)')
    .eq('share_token', shareToken)
    .maybeSingle();
  return data;
}

export async function getQuizById(quizId: string) {
  // service role: la página ya valida acceso al curso (admin o matriculado)
  // antes de llamar; así un admin no matriculado también puede previsualizar.
  const admin = getSupabase();
  const { data } = await admin.from('quizzes').select('*').eq('id', quizId).maybeSingle();
  return data;
}

export async function getQuizQuestions(quizId: string) {
  // service role: ver nota en getQuizById.
  const admin = getSupabase();
  const { data } = await admin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });
  return data ?? [];
}

export async function getFinalQuizForCourse(courseId: string) {
  const admin = getSupabase();
  const { data } = await admin
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_final', true)
    .maybeSingle();
  return data;
}

export async function getQuizAttempt(attemptId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quiz_attempts')
    .select('*, quizzes(title, is_final)')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function getDiplomaByCertNumber(certNumber: string, userId: string) {
  const admin = getSupabase();
  const { data } = await admin
    .from('diplomas')
    .select('*, courses(published_title, generated_content, public_slug)')
    .eq('cert_number', certNumber)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}
