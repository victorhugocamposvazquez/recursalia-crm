import { requireLearnUser } from '@/lib/learn/access';
import { getProfileRole } from '@/lib/learn/lmsServer';
import { AccountSettings } from '@/components/learn/AccountSettings';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireLearnUser();
  const role = (await getProfileRole(user.id)) ?? 'student';
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  const memberSince = user.created_at ?? null;

  return (
    <AccountSettings
      email={user.email ?? ''}
      role={role === 'admin' ? 'admin' : 'student'}
      fullName={fullName}
      memberSince={memberSince}
    />
  );
}
