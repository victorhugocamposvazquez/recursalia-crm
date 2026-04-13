import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import { generateSeoPosts } from '@/services/openaiSeoPostService';
import { insertBlogPostDraft } from '@/services/blogPostService';
import type { GeneratedCourseStructure, SeoPostRecord } from '@/types';

function publicCourseUrl(publicSlug: string | null | undefined): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (base && publicSlug) {
    return `${base}/cursos/${publicSlug}`;
  }
  return `https://recursalia.com/cursos/${publicSlug ?? ''}`;
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
      .select('topic, generated_content, public_slug, status')
      .eq('id', id)
      .single();

    if (fetchError || !course?.generated_content) {
      return errorResponse('Curso no encontrado o sin contenido', 404);
    }

    if (!course.public_slug || course.status !== 'published') {
      return errorResponse(
        'Publica el curso en el sitio (slug público) antes de generar artículos SEO',
        400,
      );
    }

    const content = course.generated_content as GeneratedCourseStructure;
    const courseUrl = publicCourseUrl(course.public_slug);

    console.log(`[seo-posts] Generating 17 posts for course "${content.title}"`);

    const posts = await generateSeoPosts(
      course.topic,
      content.title,
      courseUrl,
      (current, total, title) => {
        console.log(`[seo-posts] ${current}/${total}: ${title}`);
      },
    );

    console.log(`[seo-posts] Generated ${posts.length} posts, saving drafts to Supabase...`);

    const records: SeoPostRecord[] = [];
    const errors: string[] = [];

    for (const post of posts) {
      try {
        const record = await insertBlogPostDraft(post, id);
        records.push(record);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`"${post.title}": ${msg}`);
        console.error(`[seo-posts] Failed to save "${post.title}":`, msg);
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
      saved_drafts: records.length,
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
