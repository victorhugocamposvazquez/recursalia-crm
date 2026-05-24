import { notFound } from 'next/navigation';
import { requireCourseAccess } from '@/lib/learn/access';
import { getQuizAttempt } from '@/lib/learn/lmsServer';
import { getSupabase } from '@/lib/supabase';
import { AprenderResultsClient } from '@/components/learn/AprenderResultsClient';

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export default async function AprenderResultadosPage({ params }: Props) {
  const { slug, attemptId } = await params;
  const { user } = await requireCourseAccess(slug);

  const attempt = await getQuizAttempt(attemptId, user.id);
  if (!attempt) notFound();

  const quizMeta = attempt.quizzes as { is_final?: boolean; title?: string } | null;
  const isFinal = Boolean(quizMeta?.is_final);

  let certNumber: string | null = null;
  if (attempt.passed && isFinal) {
    const admin = getSupabase();
    const { data: diploma } = await admin
      .from('diplomas')
      .select('cert_number')
      .eq('user_id', user.id)
      .eq('course_id', attempt.course_id)
      .maybeSingle();
    certNumber = diploma?.cert_number ?? null;
  }

  return (
    <AprenderResultsClient
      courseSlug={slug}
      passed={Boolean(attempt.passed)}
      scorePct={Math.round((attempt.score ?? 0) * 100)}
      xpEarned={attempt.xp_earned ?? 0}
      isFinal={isFinal}
      certNumber={certNumber}
    />
  );
}
