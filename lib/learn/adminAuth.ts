import { createClient } from '@/lib/supabase/server';

export type AdminGuardResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string };

/**
 * Verifica que la petición provenga de un usuario autenticado con rol `admin`.
 * Centralizado para evitar copy/paste en cada endpoint.
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, message: 'No autenticado' };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return { ok: false, status: 403, message: 'Solo administradores' };
  }
  return { ok: true, userId: user.id };
}
