import { requireCourseAccess } from '@/lib/learn/access';
import { AprenderResultsClient } from '@/components/learn/AprenderResultsClient';

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export default async function AprenderResultadosPage({ params }: Props) {
  const { slug } = await params;
  await requireCourseAccess(slug);
  return <AprenderResultsClient />;
}
