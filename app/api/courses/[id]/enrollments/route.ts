import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdminApi } from '@/lib/auth-api';
import { enrollUserByEmail } from '@/lib/auth-student';
import type { EnrollmentListItem } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const admin = getSupabase();
  const { data, error } = await admin
    .from('user_courses')
    .select('user_id, enrolled_at, completed_at')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (data ?? []).map((r) => r.user_id);
  let emailByUser: Record<string, string> = {};
  if (userIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);
    emailByUser = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]));
  }

  const enrollments: EnrollmentListItem[] = (data ?? []).map((row) => ({
    user_id: row.user_id,
    email: emailByUser[row.user_id] ?? '',
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at,
  }));

  return NextResponse.json({ enrollments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await enrollUserByEmail(courseId, body.email ?? '');
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, userId: result.userId });
}
