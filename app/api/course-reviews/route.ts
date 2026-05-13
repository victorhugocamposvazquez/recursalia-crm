import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { appendCourseReviews } from '@/services/coursePublicService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { CourseReviewStored, GeneratedReview } from '@/types';

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  const courseId = req.nextUrl.searchParams.get('courseId')?.trim();
  if (!courseId) {
    return errorResponse('courseId query param is required', 400);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('course_reviews')
    .select('id, course_id, title, content, rating, author_name, review_date, created_at')
    .eq('course_id', courseId)
    .order('review_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('Failed to load reviews', 500, error.message);
  }

  return jsonResponse({ reviews: (data ?? []) as CourseReviewStored[] });
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId?: string;
      title?: string;
      content?: string;
      rating?: number;
      author_name?: string;
      date?: string;
    };

    const courseId = body.courseId?.trim();
    if (!courseId) {
      return errorResponse('courseId is required', 400);
    }

    const title = body.title?.trim();
    const content = body.content?.trim();
    const author_name = body.author_name?.trim();
    if (!title || !content || !author_name) {
      return errorResponse('title, content and author_name are required', 400);
    }

    const review: GeneratedReview = {
      title,
      content,
      rating: typeof body.rating === 'number' ? body.rating : Number(body.rating),
      author_name,
      date: body.date?.trim() || todayYmd(),
    };

    if (!Number.isFinite(review.rating) || review.rating < 1 || review.rating > 5) {
      return errorResponse('rating must be between 1 and 5', 400);
    }

    const supabase = getSupabase();
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return errorResponse('Course not found', 404);
    }

    await appendCourseReviews(courseId, [review]);

    return jsonResponse({ ok: true }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Failed to save review', 500, msg);
  }
}
