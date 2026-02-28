import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await getSupabase()
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse('Course not found', 404);
    }

    return jsonResponse(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Fetch course failed', 500, msg);
  }
}
