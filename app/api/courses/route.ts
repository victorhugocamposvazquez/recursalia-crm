import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    const supabase = getSupabase();
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return jsonResponse({ courses: data ?? [], total: count ?? 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Fetch courses failed', 500, msg);
  }
}
