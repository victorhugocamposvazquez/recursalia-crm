import { notFound } from 'next/navigation';
import { requireLearnUser } from '@/lib/learn/access';
import { getSupabase } from '@/lib/supabase';
import { AprenderDiplomaClient } from '@/components/learn/AprenderDiplomaClient';

type Props = { params: Promise<{ certNumber: string }> };

export default async function AprenderDiplomaPage({ params }: Props) {
  const user = await requireLearnUser();
  const { certNumber } = await params;
  const admin = getSupabase();
  const { data } = await admin
    .from('diplomas')
    .select('cert_number')
    .eq('cert_number', certNumber)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) notFound();
  return <AprenderDiplomaClient />;
}
