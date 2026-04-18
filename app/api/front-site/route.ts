import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { loadFrontSiteAdmin } from '@/lib/front-site-data';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { FrontCategoryInput, FrontSearchCopy } from '@/types';

export async function GET() {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  const data = await loadFrontSiteAdmin();
  if (!data) {
    return errorResponse(
      'No se pudieron cargar los datos del front. ¿Está aplicada la migración 003?',
      503
    );
  }
  return jsonResponse(data);
}

type PutBody = {
  categories?: FrontCategoryInput[];
  searchCopy?: FrontSearchCopy;
};

export async function PUT(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return errorResponse('JSON inválido', 400);
  }

  const supabase = getSupabase();

  if (body.searchCopy) {
    const { hero, header, drawer } = body.searchCopy;
    const rows = [
      { key: 'search_hero', value: hero.trim() },
      { key: 'search_header', value: header.trim() },
      { key: 'search_drawer', value: drawer.trim() },
    ];
    for (const r of rows) {
      if (!r.value) {
        return errorResponse(`El texto "${r.key}" no puede estar vacío`, 400);
      }
    }
    const { error: upErr } = await supabase.from('front_site_copy').upsert(
      rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
      { onConflict: 'key' }
    );
    if (upErr) return errorResponse('Error guardando textos', 500, upErr.message);
  }

  if (body.categories) {
    const list = body.categories;
    if (list.length === 0) {
      return errorResponse('Debe existir al menos una categoría.', 400);
    }
    for (const c of list) {
      if (!c.label?.trim() || !c.query_q?.trim()) {
        return errorResponse('Cada categoría necesita etiqueta y término de búsqueda', 400);
      }
    }

    const normalized = list.map((c) => ({
      ...c,
      id: c.id?.trim() || randomUUID(),
    }));

    const incomingIds = normalized.map((c) => c.id);

    const { data: existingRows, error: exErr } = await supabase
      .from('front_course_categories')
      .select('id');
    if (exErr) return errorResponse('Error leyendo categorías', 500, exErr.message);

    const existingIds = new Set((existingRows ?? []).map((r) => r.id));
    const incomingSet = new Set(incomingIds);
    const toRemove = Array.from(existingIds).filter((id) => !incomingSet.has(id));
    if (toRemove.length > 0) {
      const { error: delErr } = await supabase.from('front_course_categories').delete().in('id', toRemove);
      if (delErr) return errorResponse('Error eliminando categorías', 500, delErr.message);
    }

    const upsertPayload = normalized.map((c) => ({
      id: c.id,
      label: c.label.trim(),
      query_q: c.query_q.trim(),
      sort_order: c.sort_order,
      is_active: c.is_active,
    }));

    const { error: upCat } = await supabase.from('front_course_categories').upsert(upsertPayload, {
      onConflict: 'id',
    });
    if (upCat) return errorResponse('Error guardando categorías', 500, upCat.message);
  }

  revalidatePath('/', 'layout');
  revalidatePath('/cursos');

  const fresh = await loadFrontSiteAdmin();
  return jsonResponse(fresh ?? { categories: [], searchCopy: body.searchCopy });
}
