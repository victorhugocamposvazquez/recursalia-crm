import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/supabase';
import { requireStudentApiEnrolled } from '@/lib/auth-student';
import { scoreQuizAttempt, xpForScore, type AnswerInput } from '@/lib/learn/quizScore';
import type { QuizQuestionRecord } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params;
  let body: { courseId?: string; answers?: AnswerInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.courseId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'courseId and answers required' }, { status: 400 });
  }

  const auth = await requireStudentApiEnrolled(body.courseId);
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();
  if (quizErr || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });

  const qRows = (questions ?? []) as QuizQuestionRecord[];
  const { score, passed, graded } = scoreQuizAttempt(qRows, body.answers);
  const xpEarned = passed ? xpForScore(score, quiz.is_final) : Math.round(score * 10);

  const admin = getSupabase();
  const { data: attempt, error: attemptErr } = await admin
    .from('quiz_attempts')
    .insert({
      user_id: auth.user.id,
      quiz_id: quizId,
      course_id: body.courseId,
      finished_at: new Date().toISOString(),
      score,
      xp_earned: xpEarned,
      answers: graded,
      passed,
    })
    .select('id')
    .single();

  if (attemptErr || !attempt) {
    return NextResponse.json({ error: attemptErr?.message ?? 'Failed to save attempt' }, { status: 500 });
  }

  if (passed && quiz.lesson_id) {
    await admin.from('user_lesson_progress').upsert(
      {
        user_id: auth.user.id,
        course_id: body.courseId,
        lesson_id: quiz.lesson_id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id,lesson_id' }
    );
  }

  const { data: statsRow } = await admin
    .from('user_stats')
    .select('xp, level, streak_days, last_active, hearts, completed_first_quiz')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const lastActive = statsRow?.last_active ?? null;
  let streak = statsRow?.streak_days ?? 0;
  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = lastActive === yesterday.toISOString().slice(0, 10) ? streak + 1 : 1;
  }

  const newXp = (statsRow?.xp ?? 0) + xpEarned;
  await admin.from('user_stats').upsert({
    user_id: auth.user.id,
    xp: newXp,
    level: Math.max(1, Math.floor(newXp / 400) + 1),
    streak_days: streak,
    last_active: today,
    hearts: statsRow?.hearts ?? 5,
    completed_first_quiz: true,
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    passed,
    xpEarned,
  });
}
