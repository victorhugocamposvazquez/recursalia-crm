import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuthApi } from '@/lib/auth-api';
import { publishCourse, republishPublicSnapshot } from '@/services/courseOrchestrator';
import { writeAudit } from '@/services/auditLogService';
import { jsonResponse, errorResponse } from '@/utils/api-response';

export async function POST(req: NextRequest) {
  const { error: authError, user } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      courseId?: string;
      /** Sincroniza SEO/slug/portada opcional desde generated_content */
      republish?: boolean;
      regenerateFeaturedImage?: boolean;
      regenerateReviews?: boolean;
      reviewsCount?: number;
      reviewsAvgRating?: string;
      reviewsPrompt?: string;
    };
    const courseId = body?.courseId;

    if (!courseId?.trim()) {
      return errorResponse('courseId is required', 400);
    }

    const course = body.republish
      ? await republishPublicSnapshot(courseId.trim(), {
          regenerateFeaturedImage: Boolean(body.regenerateFeaturedImage),
          regenerateReviews: Boolean(body.regenerateReviews),
          reviewsCount: body.reviewsCount,
          reviewsAvgRating: body.reviewsAvgRating,
          reviewsPrompt: body.reviewsPrompt,
        })
      : await publishCourse(courseId.trim(), {
          reviewsCount: body.reviewsCount,
          reviewsAvgRating: body.reviewsAvgRating,
          reviewsPrompt: body.reviewsPrompt,
        });

    if (course.status === 'published' && course.public_slug) {
      revalidatePath('/');
      revalidatePath('/cursos');
      revalidatePath(`/cursos/${course.public_slug}`);
    }

    if (user?.email) {
      await writeAudit({
        action: body.republish ? 'course_republish_web' : 'course_publish',
        entityId: courseId.trim(),
        actorEmail: user.email,
        meta: {
          public_slug: course.public_slug,
          status: course.status,
          republish: Boolean(body.republish),
        },
      });
    }

    return jsonResponse(course);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Publish course failed', 500, msg);
  }
}
