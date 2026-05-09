import type { CourseInputPayload, CourseVertical } from '@/types';
import { COURSE_VERTICAL_VALUES } from '@/lib/courseVerticalOptions';

/**
 * Normaliza el cuerpo JSON común a `/api/generate-course` y `/api/create-course-manual`.
 */
export function courseInputPayloadFromBody(
  body: Partial<CourseInputPayload> & Record<string, unknown>
): CourseInputPayload {
  if (!body.topic?.trim()) {
    throw new Error('topic is required');
  }

  return {
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
    price:
      typeof body.price === 'number' ? Math.max(1, Math.round(body.price)) : 120,
    discountPercent:
      typeof body.discountPercent === 'number'
        ? Math.max(0, Math.min(80, body.discountPercent))
        : 0,
    courseVertical: COURSE_VERTICAL_VALUES.includes(body.courseVertical as CourseVertical)
      ? (body.courseVertical as CourseVertical)
      : undefined,
  };
}
