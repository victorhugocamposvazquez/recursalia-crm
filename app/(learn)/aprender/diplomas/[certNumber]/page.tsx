import { notFound } from 'next/navigation';
import { requireLearnUser } from '@/lib/learn/access';
import { getDiplomaByCertNumber } from '@/lib/learn/lmsServer';
import { AprenderDiplomaClient } from '@/components/learn/AprenderDiplomaClient';

type Props = { params: Promise<{ certNumber: string }> };

export default async function AprenderDiplomaPage({ params }: Props) {
  const user = await requireLearnUser();
  const { certNumber } = await params;

  const diploma = await getDiplomaByCertNumber(certNumber, user.id);
  if (!diploma) notFound();

  const course = diploma.courses as {
    published_title?: string;
    generated_content?: {
      title?: string;
      author_name?: string;
      total_duration_minutes?: number;
      topics?: Array<{ lessons?: unknown[] }>;
    };
    public_slug?: string;
  } | null;

  const courseTitle =
    course?.published_title ??
    course?.generated_content?.title ??
    'Curso Recursalia';
  const instructorName = course?.generated_content?.author_name ?? 'Equipo Recursalia';
  const totalLessons =
    course?.generated_content?.topics?.reduce(
      (acc, t) => acc + (Array.isArray(t.lessons) ? t.lessons.length : 0),
      0
    ) ?? 0;

  const studentName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Alumno';

  return (
    <AprenderDiplomaClient
      studentName={studentName}
      courseTitle={courseTitle}
      instructorName={instructorName}
      certNumber={diploma.cert_number as string}
      shareToken={(diploma.share_token as string | null) ?? null}
      scorePct={Math.round(((diploma.score as number) ?? 0) * 100)}
      totalLessons={totalLessons}
      totalDurationMinutes={course?.generated_content?.total_duration_minutes}
      issuedAt={diploma.issued_at as string}
    />
  );
}
