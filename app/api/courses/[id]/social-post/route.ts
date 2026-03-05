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
  if (!wpUrl || !user || !pass) {
    console.warn('[social-post] WP credentials missing:', { wpUrl: !!wpUrl, user: !!user, pass: !!pass });
    return undefined;
  }

  try {
    const courseEndpoint = `${wpUrl}/wp-json/wp/v2/courses/${wpCourseId}?_fields=featured_media`;
    console.log('[social-post] Fetching featured_media from:', courseEndpoint);

    const res = await fetch(courseEndpoint, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      },
    });
    if (!res.ok) {
      console.warn('[social-post] WP course fetch failed:', res.status, await res.text());
      return undefined;
    }
    const data = (await res.json()) as { featured_media?: number };
    console.log('[social-post] featured_media:', data.featured_media);
    if (!data.featured_media) return undefined;

    const mediaEndpoint = `${wpUrl}/wp-json/wp/v2/media/${data.featured_media}?_fields=source_url`;
    const mediaRes = await fetch(mediaEndpoint, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      },
    });
    if (!mediaRes.ok) {
      console.warn('[social-post] WP media fetch failed:', mediaRes.status, await mediaRes.text());
      return undefined;
    }
    const mediaData = (await mediaRes.json()) as { source_url?: string };
    console.log('[social-post] source_url:', mediaData.source_url);
    return mediaData.source_url;
  } catch (err) {
    console.error('[social-post] getFeaturedImageUrl error:', err);
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
    console.log('[social-post] wp_course_id:', course.wp_course_id);
    if (course.wp_course_id) {
      imageUrl = await getFeaturedImageUrl(String(course.wp_course_id));
    }
    console.log('[social-post] imageUrl resolved:', imageUrl ?? '(none)');
    console.log('[social-post] courseUrl:', courseUrl ?? '(none)');

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
