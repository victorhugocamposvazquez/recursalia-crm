import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import {
  createReviewCategory,
  createReviews as createSiteReviews,
} from '@/services/siteReviewsService';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { GeneratedReview } from '@/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId: string;
      wpCourseId?: number;
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
      .select('id, wp_course_id, generated_content')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return errorResponse('Course not found', 404);
    }

    const wpId = body.wpCourseId ?? Number(course.wp_course_id);
    if (!wpId || isNaN(wpId)) {
      return errorResponse(
        'Course must be published in WordPress first (wp_course_id required)',
        400
      );
    }

    const courseTitle =
      (course.generated_content as { title?: string })?.title ?? courseId;
    const category = await createReviewCategory(courseTitle);
    const { created } = await createSiteReviews(
      wpId,
      category.slug,
      reviews,
      category.term_id
    );

    return jsonResponse({ created, total: reviews.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Publish reviews failed', 500, msg);
  }
}
