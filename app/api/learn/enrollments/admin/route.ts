import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/supabase';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, status: 401, message: 'No autenticado' };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Solo administradores' };
  }
  return { ok: true as const, userId: user.id };
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  let body: { courseId?: string; slug?: string } = {};
  try {
    body = (await req.json()) as { courseId?: string; slug?: string };
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const admin = getSupabase();
  let courseId = body.courseId ?? null;

  if (!courseId && body.slug) {
    const { data } = await admin
      .from('courses')
      .select('id')
      .eq('public_slug', body.slug)
      .maybeSingle();
    courseId = (data?.id as string | undefined) ?? null;
  }

  if (!courseId) {
    return NextResponse.json({ error: 'Falta courseId o slug' }, { status: 400 });
  }

  // Verifica que el curso existe
  const { data: course } = await admin
    .from('courses')
    .select('id, status')
    .eq('id', courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  // Idempotente: si ya existe, no falla
  const { error } = await admin
    .from('user_courses')
    .upsert(
      { user_id: guard.userId, course_id: courseId },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enrolled: true });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  const url = new URL(req.url);
  let courseId = url.searchParams.get('courseId');
  const slug = url.searchParams.get('slug');

  if (!courseId && slug) {
    const admin = getSupabase();
    const { data } = await admin
      .from('courses')
      .select('id')
      .eq('public_slug', slug)
      .maybeSingle();
    courseId = (data?.id as string | undefined) ?? null;
  }

  if (!courseId) {
    return NextResponse.json({ error: 'Falta courseId o slug' }, { status: 400 });
  }

  const admin = getSupabase();
  const { error } = await admin
    .from('user_courses')
    .delete()
    .eq('user_id', guard.userId)
    .eq('course_id', courseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enrolled: false });
}
