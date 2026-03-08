import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import { generateSeoPosts } from '@/services/openaiSeoPostService';
import { createWpPost } from '@/services/wordpressPostService';
import type { GeneratedCourseStructure, SeoPostRecord } from '@/types';

async function getWpCoursePermalink(wpCourseId: string): Promise<string> {
  const wpUrl = process.env.WORDPRESS_URL;
  const user = process.env.WORDPRESS_USER;
  const pass = process.env.WORDPRESS_APP_PASSWORD;
  if (!wpUrl || !user || !pass) return `${wpUrl ?? 'https://recursalia.com'}/courses/`;

  const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

  try {
    const res = await fetch(
      `${wpUrl}/wp-json/wp/v2/courses/${wpCourseId}?_fields=link`,
      { headers: { Authorization: authHeader } },
    );
    if (!res.ok) return `${wpUrl}/courses/`;
    const data = (await res.json()) as { link?: string };
    return data.link ?? `${wpUrl}/courses/`;
  } catch {
    return `${wpUrl}/courses/`;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;

    const { data: course, error: fetchError } = await getSupabase()
      .from('courses')
      .select('topic, generated_content, wp_course_id')
      .eq('id', id)
      .single();

    if (fetchError || !course?.generated_content || !course.wp_course_id) {
      return errorResponse(
        'Curso no encontrado, sin contenido o sin wp_course_id',
        404,
      );
    }

    const content = course.generated_content as GeneratedCourseStructure;
    const wpCourseId = Number(course.wp_course_id);
    const courseUrl = await getWpCoursePermalink(String(wpCourseId));

    console.log(`[seo-posts] Generating 17 posts for course "${content.title}"`);

    const posts = await generateSeoPosts(
      course.topic,
      content.title,
      courseUrl,
      (current, total, title) => {
        console.log(`[seo-posts] ${current}/${total}: ${title}`);
      },
    );

    console.log(`[seo-posts] Generated ${posts.length} posts, publishing as drafts...`);

    const records: SeoPostRecord[] = [];
    const errors: string[] = [];

    for (const post of posts) {
      try {
        const record = await createWpPost(post, wpCourseId, 'draft');
        records.push(record);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`"${post.title}": ${msg}`);
        console.error(`[seo-posts] Failed to publish "${post.title}":`, msg);
      }
    }

    const { error: updateError } = await getSupabase()
      .from('courses')
      .update({
        seo_posts_count: records.length,
        seo_posts_generated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.warn('[seo-posts] Supabase update error:', updateError.message);
    }

    return jsonResponse({
      generated: posts.length,
      published_drafts: records.length,
      records,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[seo-posts] Error:', msg);
    return errorResponse('Error generating SEO posts', 500, msg);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const { id } = await params;

    const { data: course } = await getSupabase()
      .from('courses')
      .select('seo_posts_count, seo_posts_generated_at')
      .eq('id', id)
      .single();

    return jsonResponse({
      seo_posts_count: course?.seo_posts_count ?? 0,
      seo_posts_generated_at: course?.seo_posts_generated_at ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Error fetching SEO posts info', 500, msg);
  }
}
