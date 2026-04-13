import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuthApi } from '@/lib/auth-api';
import { publishCourse } from '@/services/courseOrchestrator';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId?: string;
      reviewsCount?: number;
      reviewsAvgRating?: 'high' | 'mixed';
      reviewsPrompt?: string;
    };
    const courseId = body?.courseId;

    if (!courseId?.trim()) {
      return errorResponse('courseId is required', 400);
    }

    const course = await publishCourse(courseId.trim(), {
      reviewsCount: body.reviewsCount,
      reviewsAvgRating: body.reviewsAvgRating,
      reviewsPrompt: body.reviewsPrompt,
    });

    if (course.status === 'published' && course.public_slug) {
      revalidatePath('/');
      revalidatePath('/cursos');
      revalidatePath(`/cursos/${course.public_slug}`);
    }

    return jsonResponse(course);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Publish course failed', 500, msg);
  }
}
