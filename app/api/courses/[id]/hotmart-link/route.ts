import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = (await req.json()) as { url?: string };
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!url) {
      return errorResponse('url is required', 400);
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return errorResponse('url must be a valid link', 400);
    }

    const { data: course, error: fetchError } = await getSupabase()
      .from('courses')
      .select('public_slug')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      return errorResponse('Course not found', 404);
    }

    if (!course.public_slug) {
      return errorResponse(
        'Publica el curso primero (landing con slug público) para asociar el enlace Hotmart',
        400
      );
    }

    const { data: updated, error: updateError } = await getSupabase()
      .from('courses')
      .update({ hotmart_product_id: url })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return jsonResponse(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Failed to save Hotmart link', 500, msg);
  }
}
