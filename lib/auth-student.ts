import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function requireEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return Boolean(data);
}

export async function canAccessCourse(
  userId: string,
  courseId: string,
  role: 'admin' | 'student' | null
): Promise<boolean> {
  if (role === 'admin') return true;
  return requireEnrolled(userId, courseId);
}

async function getProfileForUser(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, role, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (!data || (data.role !== 'admin' && data.role !== 'student')) return null;
  return data as Profile;
}

/** Sesión válida (admin o student). */
export async function requireStudentApi(): Promise<
  | { user: User; profile: Profile; error: null }
  | { user: null; profile: null; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'Profile not found' }, { status: 403 }),
    };
  }
  return { user, profile, error: null };
}

/** Sesión + matriculado en el curso (admin bypass). */
export async function requireStudentApiEnrolled(courseId: string): Promise<
  | { user: User; profile: Profile; error: null }
  | { user: null; profile: null; error: NextResponse }
> {
  const auth = await requireStudentApi();
  if (auth.error) return auth;
  const ok = await canAccessCourse(auth.user.id, courseId, auth.profile.role);
  if (!ok) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json({ error: 'Not enrolled' }, { status: 403 }),
    };
  }
  return auth;
}

/** Matricula un usuario por email (service role). Devuelve error legible o null. */
export async function enrollUserByEmail(
  courseId: string,
  email: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string; status: number }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: 'Email requerido', status: 400 };
  }

  const admin = getSupabase();
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();

  if (!profile?.id) {
    return {
      ok: false,
      error: 'No hay cuenta con ese email. El alumno debe registrarse primero en /login.',
      status: 404,
    };
  }

  const { error } = await admin.from('user_courses').upsert(
    { user_id: profile.id, course_id: courseId },
    { onConflict: 'user_id,course_id', ignoreDuplicates: false }
  );
  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const { data: stats } = await admin
    .from('user_stats')
    .select('user_id')
    .eq('user_id', profile.id)
    .maybeSingle();
  if (!stats) {
    await admin.from('user_stats').insert({ user_id: profile.id });
  }

  return { ok: true, userId: profile.id };
}
