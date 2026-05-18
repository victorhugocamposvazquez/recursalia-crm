import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';
import { normalizeGeneratedContentIdentity } from '@/lib/normalizeGeneratedContentIdentity';
import { writeAudit } from '@/services/auditLogService';
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      generated_content?: GeneratedCourseStructure;
      topic?: string;
      input_payload?: Record<string, unknown>;
      seo_publish_priority?: number;
      catalog_category?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (body.generated_content !== undefined) {
      const gc = {
        ...body.generated_content,
        topics: (body.generated_content.topics ?? []).map((t) => ({
          ...t,
          lessons: (t.lessons ?? []).map((l) => ({ ...l })),
        })),
      };
      normalizeGeneratedContentIdentity(gc);
      updates.generated_content = gc;
    }
    if (body.topic !== undefined) updates.topic = body.topic;
    if (body.input_payload !== undefined)
      updates.input_payload = body.input_payload;
    if (
      typeof body.seo_publish_priority === 'number' &&
      Number.isFinite(body.seo_publish_priority)
    ) {
      updates.seo_publish_priority = Math.round(
        Math.min(1e6, Math.max(-1000, body.seo_publish_priority))
      );
    }
    if (body.catalog_category !== undefined) {
      if (body.catalog_category === null) {
        updates.catalog_category = null;
      } else {
        const slug = String(body.catalog_category).trim().toLowerCase();
        if (!slug) {
          return errorResponse('catalog_category inválido', 400);
        }
        const supabase = getSupabase();
        const { data: catRow, error: catErr } = await supabase
          .from('catalog_categories')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle();
        if (catErr) throw new Error(catErr.message);
        if (!catRow) {
          return errorResponse(
            'Esa categoría no existe. Créala primero en «Categorías /cursos».',
            400,
            slug
          );
        }
        updates.catalog_category = slug;
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const { data, error } = await getSupabase()
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return jsonResponse(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Update course failed', 500, msg);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, user } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;

    if (user?.email) {
      await writeAudit({
        action: 'course_delete',
        entityId: id,
        actorEmail: user.email,
        meta: {},
      });
    }

    const { error } = await getSupabase()
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return jsonResponse({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Delete course failed', 500, msg);
  }
}
