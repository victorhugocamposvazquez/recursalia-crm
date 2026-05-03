import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);

    const body = (await req.json()) as {
      label?: string;
      sort_order?: number;
      is_active?: boolean;
    };

    const updates: Record<string, unknown> = {};
    if (typeof body.label === 'string' && body.label.trim()) {
      updates.label = body.label.trim();
    }
    if (typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)) {
      updates.sort_order = Math.round(body.sort_order);
    }
    if (typeof body.is_active === 'boolean') {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('Nada que actualizar', 400);
    }

    const { data, error } = await getSupabase()
      .from('catalog_categories')
      .update(updates)
      .eq('slug', slug)
      .select('slug, label, sort_order, is_active')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return errorResponse('Categoría no encontrada', 404);
    return jsonResponse(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('update catalog category failed', 500, msg);
  }
}
