import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireStudentApiEnrolled } from '@/lib/auth-student';

export async function POST(request: Request) {
  let body: { courseId?: string; lessonId?: string; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { courseId, lessonId, completed = true } = body;
  if (!courseId || !lessonId) {
    return NextResponse.json({ error: 'courseId and lessonId required' }, { status: 400 });
  }

  const auth = await requireStudentApiEnrolled(courseId);
  if (auth.error) return auth.error;

  const admin = getSupabase();

  if (!completed) {
    await admin
      .from('user_lesson_progress')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId);
    return NextResponse.json({ ok: true, completed: false });
  }

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const { data: existing } = await admin
    .from('user_lesson_progress')
    .select('completed_at')
    .eq('user_id', auth.user.id)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  const wasAlreadyCompleted = Boolean(existing?.completed_at);

  await admin.from('user_lesson_progress').upsert(
    {
      user_id: auth.user.id,
      course_id: courseId,
      lesson_id: lessonId,
      completed_at: now,
    },
    { onConflict: 'user_id,course_id,lesson_id' }
  );

  if (wasAlreadyCompleted) {
    return NextResponse.json({ ok: true, completed: true, xpEarned: 0 });
  }

  const { data: statsRow } = await admin
    .from('user_stats')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const xpGain = 25;
  const lastActive = statsRow?.last_active ?? null;
  let streak = statsRow?.streak_days ?? 0;
  if (lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    streak = lastActive === yStr ? streak + 1 : 1;
  }

  const newXp = (statsRow?.xp ?? 0) + xpGain;
  const level = Math.max(1, Math.floor(newXp / 400) + 1);

  await admin.from('user_stats').upsert({
    user_id: auth.user.id,
    xp: newXp,
    level,
    streak_days: streak,
    last_active: today,
    hearts: statsRow?.hearts ?? 5,
    completed_first_quiz: statsRow?.completed_first_quiz ?? false,
  });

  return NextResponse.json({ ok: true, completed: true, xpEarned: xpGain, xp: newXp, streak, level });
}
