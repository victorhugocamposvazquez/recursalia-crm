import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/supabase';
import { UsuariosClient, type ProfileRow } from './UsuariosClient';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  const admin = getSupabase();
  const { data } = await admin
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const users: ProfileRow[] = (data ?? []).map((row) => ({
    id: row.id as string,
    email: (row.email as string) ?? '',
    role: (row.role as 'admin' | 'student') ?? 'student',
    created_at: row.created_at as string,
  }));

  return <UsuariosClient currentUserId={user.id} users={users} />;
}
