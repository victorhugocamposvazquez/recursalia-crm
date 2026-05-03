import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import {
  normalizeCatalogSlugForCreate,
  PUBLIC_CATALOG_CATEGORIES_FALLBACK,
} from '@/lib/catalogCategory';
import { jsonResponse, errorResponse } from '@/utils/api-response';

/** Listado para el panel (incluye inactivas). */
export async function GET() {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { data, error } = await getSupabase()
      .from('catalog_categories')
      .select('slug, label, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    let items = (data ?? []) as Array<{
      slug: string;
      label: string;
      sort_order: number;
      is_active: boolean;
    }>;
    if (items.length === 0) {
      items = PUBLIC_CATALOG_CATEGORIES_FALLBACK.map((c, i) => ({
        slug: c.slug,
        label: c.label,
        sort_order: (i + 1) * 10,
        is_active: true,
      }));
    }
    return jsonResponse({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('catalog categories list failed', 500, msg);
  }
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      slug?: string;
      label?: string;
      sort_order?: number;
    };
    const slug = normalizeCatalogSlugForCreate(body.slug ?? '');
    if (!slug) {
      return errorResponse(
        'slug inválido: usa minúsculas, números, guiones; debe empezar por letra',
        400
      );
    }
    const label = body.label?.trim();
    if (!label) return errorResponse('label es obligatorio', 400);

    const sortOrder =
      typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
        ? Math.round(body.sort_order)
        : 500;

    const { data, error } = await getSupabase()
      .from('catalog_categories')
      .insert({
        slug,
        label,
        sort_order: sortOrder,
        is_active: true,
      })
      .select('slug, label, sort_order, is_active')
      .single();

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return errorResponse('Ya existe una categoría con ese slug', 409, error.message);
      }
      throw new Error(error.message);
    }
    return jsonResponse(data, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('create catalog category failed', 500, msg);
  }
}
