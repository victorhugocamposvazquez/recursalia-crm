import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { generateAndSaveCourse } from '@/services/courseOrchestrator';
import { jsonResponse, errorResponse } from '@/utils/api-response';
import type { CourseInputPayload } from '@/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
    const body = (await req.json()) as CourseInputPayload;

    if (!body.topic?.trim()) {
      return errorResponse('topic is required', 400);
    }

    const payload: CourseInputPayload = {
      topic: body.topic.trim(),
      level: body.level ?? 'intermediate',
      avatar: body.avatar ?? '',
      focus: body.focus ?? '',
      reviewsCount:
        typeof body.reviewsCount === 'number'
          ? Math.max(5, Math.min(200, body.reviewsCount))
          : undefined,
      bestSeller: body.bestSeller !== false,
      productType: body.productType === 'guide' ? 'guide' : 'course',
      topicsCount:
        typeof body.topicsCount === 'number'
          ? Math.max(2, Math.min(15, body.topicsCount))
          : 6,
      lessonsPerTopic:
        typeof body.lessonsPerTopic === 'number'
          ? Math.max(1, Math.min(10, body.lessonsPerTopic))
          : 4,
    };

    const course = await generateAndSaveCourse(payload);
    return jsonResponse(course, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse('Generate course failed', 500, msg);
  }
}
