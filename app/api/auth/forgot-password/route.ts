import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }

  const supabase = await createClient();
  const origin = req.nextUrl.origin;
  const redirectTo = `${origin}/auth/callback?next=/aprender/cuenta?reset=1`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // No leak: respondemos siempre OK para no exponer si el email existe o no.
  if (error) {
    console.warn('[forgot-password]', error.message);
  }
  return NextResponse.json({ ok: true });
}
