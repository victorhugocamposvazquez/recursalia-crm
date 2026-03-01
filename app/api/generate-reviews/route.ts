import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { generateReviews } from '@/services/openaiReviewsService';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId?: string;
      prompt?: string;
      count?: number;
    };

    const courseId = body.courseId?.trim();
    if (!courseId) {
      return errorResponse('courseId is required', 400);
    }

    const supabase = getSupabase();
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, generated_content')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return errorResponse('Course not found', 404);
    }

    const courseTitle =
      (course.generated_content as { title?: string })?.title ?? courseId;
    const count = Math.min(Math.max(1, body.count ?? 50), 200);

    const reviews = await generateReviews(
      courseTitle,
      count,
      body.prompt?.trim() || undefined
    );

    return jsonResponse({ reviews, count: reviews.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Generate reviews failed', 500, msg);
  }
}
