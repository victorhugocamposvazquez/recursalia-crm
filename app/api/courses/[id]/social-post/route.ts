import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { postToBoth, buildCoursePostMessage } from '@/services/metaSocialService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';

async function getFeaturedImageUrl(wpCourseId: string): Promise<string | undefined> {
  const wpUrl = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const pass = process.env.WORDPRESS_APP_PASSWORD;
  if (!wpUrl || !user || !pass) return undefined;

  try {
    const res = await fetch(
      `${wpUrl}/wp-json/wp/v2/courses/${wpCourseId}?_fields=featured_media`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        },
      }
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { featured_media?: number };
    if (!data.featured_media) return undefined;

    const mediaRes = await fetch(
      `${wpUrl}/wp-json/wp/v2/media/${data.featured_media}?_fields=source_url`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        },
      }
    );
    if (!mediaRes.ok) return undefined;
    const mediaData = (await mediaRes.json()) as { source_url?: string };
    return mediaData.source_url;
  } catch {
    return undefined;
  }
}

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
      .select('generated_content, wp_course_id')
      .eq('id', id)
      .single();

    if (fetchError || !course?.generated_content) {
      return errorResponse('Curso no encontrado o sin contenido', 404);
    }

    const content = course.generated_content as GeneratedCourseStructure;
    const wpUrl = process.env.WORDPRESS_URL;
    const slug = content.title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ\s-]/gi, '')
      .replace(/\s+/g, '-')
      .slice(0, 80);
    const courseUrl = wpUrl ? `${wpUrl}/recourses/${slug}/` : undefined;

    const message =
      body.message?.trim() ||
      buildCoursePostMessage(content.title, content.short_description, courseUrl);

    let imageUrl: string | undefined;
    if (course.wp_course_id) {
      imageUrl = await getFeaturedImageUrl(String(course.wp_course_id));
    }

    const result = await postToBoth({ message, link: courseUrl, imageUrl });

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
