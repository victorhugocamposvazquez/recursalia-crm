import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { replaceCourseReviews } from '@/services/coursePublicService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedReview } from '@/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId: string;
      reviews: GeneratedReview[];
    };

    const courseId = body.courseId?.trim();
    if (!courseId) {
      return errorResponse('courseId is required', 400);
    }

    const reviews = body.reviews;
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return errorResponse('reviews array is required', 400);
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

    await replaceCourseReviews(courseId, reviews);

    return jsonResponse({
      saved: reviews.length,
      total: reviews.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Publish reviews failed', 500, msg);
  }
}
