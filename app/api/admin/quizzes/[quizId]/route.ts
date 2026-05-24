import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/learn/adminAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }
  const { quizId } = await params;
  const admin = getSupabase();
  const { data: quiz } = await admin.from('quizzes').select('*').eq('id', quizId).maybeSingle();
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
  }
  const { data: questions } = await admin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position');
  return NextResponse.json({ quiz, questions: questions ?? [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }
  const { quizId } = await params;
  let body: { title?: string; pass_threshold?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string' && body.title.trim().length > 0) {
    patch.title = body.title.trim();
  }
  if (typeof body.pass_threshold === 'number' && body.pass_threshold >= 0 && body.pass_threshold <= 1) {
    patch.pass_threshold = body.pass_threshold;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }
  const admin = getSupabase();
  const { error } = await admin.from('quizzes').update(patch).eq('id', quizId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }
  const { quizId } = await params;
  const admin = getSupabase();
  const { error } = await admin.from('quizzes').delete().eq('id', quizId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
