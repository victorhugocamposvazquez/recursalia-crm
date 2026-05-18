import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types';

export async function requireAuthApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}

function isUserRole(v: string): v is UserRole {
  return v === 'admin' || v === 'student';
}

/**
 * Sesión válida + perfil con `role === 'admin'`.
 * Los alumnos (`student`) reciben 403 sin acceder a rutas costosas del panel.
 */
export async function requireAdminApi(): Promise<
  | { user: User; profile: Profile; error: null }
  | { user: null; profile: null; error: NextResponse }
> {
  const { user, error: authError } = await requireAuthApi();
  if (authError) return { user: null, profile: null, error: authError };

  const supabase = await createClient();
  const { data: row, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (profileError || !row) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'Profile not found' }, { status: 403 }),
    };
  }

  if (!isUserRole(row.role) || row.role !== 'admin') {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  const profile: Profile = {
    id: row.id,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return { user, profile, error: null };
}
