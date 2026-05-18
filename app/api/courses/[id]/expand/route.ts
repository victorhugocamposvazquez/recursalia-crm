import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { expandCourseForEbook, type ExpandedCourseContent } from '@/services/openaiEbookService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';

export const maxDuration = 300;

function countExpandedLessons(content: ExpandedCourseContent): number {
  let n = 0;
  for (const t of content.topics ?? []) {
    n += t.lessons?.length ?? 0;
  }
  return n;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = getSupabase();

  const { data: course, error: fetchErr } = await supabase
    .from('courses')
    .select('id, generated_content')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    return errorResponse('Fetch failed', 500, fetchErr.message);
  }
  if (!course) {
    return errorResponse('Course not found', 404);
  }

  const gc = course.generated_content as GeneratedCourseStructure | null;
  if (!gc) {
    return jsonResponse(
      { error: 'Course has no generated_content yet' },
      400
    );
  }

  let result: ExpandedCourseContent;
  try {
    result = await expandCourseForEbook(gc, undefined, id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: msg, stage: 'expansion' }, 500);
  }

  const expanded_at = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from('courses')
    .update({
      expanded_content: result,
      expanded_at,
    })
    .eq('id', id);

  if (updateErr) {
    return jsonResponse({ error: updateErr.message, stage: 'persist' }, 500);
  }

  return jsonResponse({
    ok: true,
    expanded_at,
    lessons_count: countExpandedLessons(result),
  });
}
