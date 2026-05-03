import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import {
  postToBoth,
  buildFacebookMessage,
  buildInstagramCaption,
} from '@/services/metaSocialService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = (await req.json()) as { message?: string };

    const { data: course, error: fetchError } = await getSupabase()
      .from('courses')
      .select('generated_content, public_slug, featured_image_url')
      .eq('id', id)
      .single();

    if (fetchError || !course?.generated_content) {
      return errorResponse('Curso no encontrado o sin contenido', 404);
    }

    const content = course.generated_content as GeneratedCourseStructure;

    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

    let courseUrl: string | undefined;
    if (course.public_slug && siteBase) {
      courseUrl = `${siteBase}/cursos/${course.public_slug}`;
    }

    const imageUrl = course.featured_image_url?.trim() || undefined;

    const facebookMessage =
      body.message?.trim() ||
      buildFacebookMessage(content.title, content.short_description, courseUrl);

    const instagramCaption =
      body.message?.trim() ||
      buildInstagramCaption(
        content.title,
        content.short_description,
        siteBase || undefined
      );

    const result = await postToBoth({
      facebookMessage,
      instagramCaption,
      link: courseUrl,
      imageUrl,
    });

    const published: string[] = [];
    if (result.facebook) published.push('Facebook');
    if (result.instagram) published.push('Instagram');

    return jsonResponse({
      published,
      errors: result.errors,
      facebook: result.facebook,
      instagram: result.instagram,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Error publicando en redes sociales', 500, msg);
  }
}
