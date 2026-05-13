import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { errorResponse, jsonResponse } from '@/utils/api-response';

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  const { reviewId } = await context.params;
  const id = reviewId?.trim();
  if (!id) {
    return errorResponse('reviewId is required', 400);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('course_reviews')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    return errorResponse('Failed to delete review', 500, error.message);
  }

  if (!data?.length) {
    return errorResponse('Review not found', 404);
  }

  return jsonResponse({ ok: true });
}
