import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Devuelve la sesión actual + rol del perfil para que la UI pública pueda
 * mostrar el botón correcto (Acceder / Mi área / Panel admin) sin tener que
 * convertir SiteHeader en server component.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role: 'admin' | 'student' =
    profile?.role === 'admin' ? 'admin' : 'student';

  return NextResponse.json(
    {
      authenticated: true,
      email: user.email ?? '',
      role,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
