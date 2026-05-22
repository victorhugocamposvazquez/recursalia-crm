import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireStudentApiEnrolled } from '@/lib/auth-student';

function certNumberFromDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `RX-${y}-${seq}`;
}

export async function POST(request: Request) {
  let body: { courseId?: string; attemptId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.courseId || !body.attemptId) {
    return NextResponse.json({ error: 'courseId and attemptId required' }, { status: 400 });
  }

  const auth = await requireStudentApiEnrolled(body.courseId);
  if (auth.error) return auth.error;

  const admin = getSupabase();
  const { data: attempt } = await admin
    .from('quiz_attempts')
    .select('*, quizzes(is_final, pass_threshold)')
    .eq('id', body.attemptId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!attempt?.passed) {
    return NextResponse.json({ error: 'Attempt not passed' }, { status: 400 });
  }

  const quizMeta = attempt.quizzes as { is_final?: boolean } | null;
  if (!quizMeta?.is_final) {
    return NextResponse.json({ error: 'Diploma only for final exam' }, { status: 400 });
  }

  const { data: existing } = await admin
    .from('diplomas')
    .select('cert_number, share_token')
    .eq('user_id', auth.user.id)
    .eq('course_id', body.courseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      certNumber: existing.cert_number,
      shareToken: existing.share_token,
    });
  }

  const certNumber = certNumberFromDate();
  const { data: diploma, error } = await admin
    .from('diplomas')
    .insert({
      cert_number: certNumber,
      user_id: auth.user.id,
      course_id: body.courseId,
      attempt_id: body.attemptId,
      score: attempt.score,
    })
    .select('cert_number, share_token')
    .single();

  if (error || !diploma) {
    return NextResponse.json({ error: error?.message ?? 'Failed to issue diploma' }, { status: 500 });
  }

  await admin
    .from('user_courses')
    .update({ completed_at: new Date().toISOString() })
    .eq('user_id', auth.user.id)
    .eq('course_id', body.courseId);

  return NextResponse.json({
    certNumber: diploma.cert_number,
    shareToken: diploma.share_token,
  });
}
