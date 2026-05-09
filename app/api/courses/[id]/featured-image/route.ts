import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { uploadCourseCoverImage } from '@/services/courseMediaService';
import { jsonResponse, errorResponse } from '@/utils/api-response';

const MAX_BYTES = 6 * 1024 * 1024;

const MIME_TO_UPLOAD: Record<string, 'image/png' | 'image/jpeg' | 'image/webp'> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id: courseId } = await params;
    const supabase = getSupabase();

    const { data: courseRow, error: fetchErr } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (fetchErr) throw new Error(fetchErr.message);
    if (!courseRow) {
      return errorResponse('Course not found', 404);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse('Archivo vacío o no enviado (campo "file")', 400);
    }

    if (file.size > MAX_BYTES) {
      return errorResponse('Imagen demasiado grande (máx. 6 MB)', 400);
    }

    const uploadType = MIME_TO_UPLOAD[file.type.toLowerCase().trim()];
    if (!uploadType) {
      return errorResponse('Formato no permitido. Usa JPEG, PNG o WebP.', 400);
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const publicUrl = await uploadCourseCoverImage(courseId, buf, uploadType);

    const { data: updated, error: updErr } = await supabase
      .from('courses')
      .update({ featured_image_url: publicUrl })
      .eq('id', courseId)
      .select()
      .single();

    if (updErr) throw new Error(updErr.message);
    return jsonResponse(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Upload featured image failed', 500, msg);
  }
}
