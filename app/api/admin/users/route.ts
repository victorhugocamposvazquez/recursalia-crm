import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/learn/adminAuth';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  const admin = getSupabase();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  let body: { userId?: string; email?: string; role?: 'admin' | 'student' } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (body.role !== 'admin' && body.role !== 'student') {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const admin = getSupabase();
  let userId = body.userId ?? null;

  if (!userId && body.email) {
    const target = body.email.trim().toLowerCase();
    // Buscar primero en profiles; si no, listar en auth.users
    const { data: p } = await admin
      .from('profiles')
      .select('id')
      .eq('email', target)
      .maybeSingle();
    if (p?.id) {
      userId = p.id as string;
    } else {
      // Recorre auth.users (hasta 200) — para volúmenes mayores conviene una BD search dedicada
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list.users.find((u) => (u.email ?? '').toLowerCase() === target);
      if (found) {
        // Crea profile faltante por si nunca pasó el trigger
        await admin.from('profiles').upsert(
          {
            id: found.id,
            email: found.email ?? '',
            role: 'student',
          },
          { onConflict: 'id' }
        );
        userId = found.id;
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // No te puedes auto-bajar a student (evita quedarse sin admin sin querer)
  if (userId === guard.userId && body.role === 'student') {
    return NextResponse.json(
      { error: 'No puedes bajarte de admin a ti mismo.' },
      { status: 400 }
    );
  }

  const { data: updated, error } = await admin
    .from('profiles')
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, role')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, user: updated });
}
