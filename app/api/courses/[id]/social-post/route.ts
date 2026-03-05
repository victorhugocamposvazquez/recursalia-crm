import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { postToBoth, buildCoursePostMessage } from '@/services/metaSocialService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedCourseStructure } from '@/types';

async function getWpCourseData(wpCourseId: string): Promise<{ imageUrl?: string; permalink?: string }> {
  const wpUrl = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const pass = process.env.WORDPRESS_APP_PASSWORD;
  if (!wpUrl || !user || !pass) {
    console.warn('[social-post] WP credentials missing:', { wpUrl: !!wpUrl, user: !!user, pass: !!pass });
    return {};
  }

  const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  const result: { imageUrl?: string; permalink?: string } = {};

  try {
    const courseEndpoint = `${wpUrl}/wp-json/wp/v2/courses/${wpCourseId}?_fields=featured_media,link`;
    console.log('[social-post] Fetching WP course:', courseEndpoint);

    const res = await fetch(courseEndpoint, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) {
      console.warn('[social-post] WP course fetch failed:', res.status, await res.text());
      return {};
    }
    const data = (await res.json()) as { featured_media?: number; link?: string };
    console.log('[social-post] WP course data:', { featured_media: data.featured_media, link: data.link });

    if (data.link) {
      result.permalink = data.link;
    }

    if (data.featured_media) {
      const mediaEndpoint = `${wpUrl}/wp-json/wp/v2/media/${data.featured_media}?_fields=source_url`;
      const mediaRes = await fetch(mediaEndpoint, {
        headers: { Authorization: authHeader },
      });
      if (!mediaRes.ok) {
        console.warn('[social-post] WP media fetch failed:', mediaRes.status, await mediaRes.text());
      } else {
        const mediaData = (await mediaRes.json()) as { source_url?: string };
        console.log('[social-post] source_url:', mediaData.source_url);
        result.imageUrl = mediaData.source_url;
      }
    }
  } catch (err) {
    console.error('[social-post] getWpCourseData error:', err);
  }

  return result;
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

    let courseUrl: string | undefined;
    let imageUrl: string | undefined;

    console.log('[social-post] wp_course_id:', course.wp_course_id);
    if (course.wp_course_id) {
      const wpData = await getWpCourseData(String(course.wp_course_id));
      courseUrl = wpData.permalink;
      imageUrl = wpData.imageUrl;
    }
    console.log('[social-post] courseUrl:', courseUrl ?? '(none)');
    console.log('[social-post] imageUrl:', imageUrl ?? '(none)');

    const message =
      body.message?.trim() ||
      buildCoursePostMessage(content.title, content.short_description, courseUrl);

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
