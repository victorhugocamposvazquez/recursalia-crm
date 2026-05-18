import { randomUUID } from 'crypto';
import { slugifyTitle, ensureUniqueSlug } from '@/utils/slugify';
import type { GeneratedCourseStructure } from '@/types';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Asegura `id` (UUID v4) y `slug` por topic/lección según reglas por campo:
 * no sobrescribe `id` ni `slug` si ya están presentes (slug no vacío).
 * Unicidad: slugs de topics entre sí; slugs de lessons entre todas las lessons del curso.
 *
 * @returns `true` si hubo algún cambio.
 */
export function normalizeGeneratedContentIdentity(
  content: GeneratedCourseStructure
): boolean {
  let changed = false;
  const topicSlugs = new Set<string>();
  const lessonSlugs = new Set<string>();

  const topics = content.topics ?? [];

  for (const topic of topics) {
    if (isNonEmptyString(topic.slug)) topicSlugs.add(topic.slug);
    for (const lesson of topic.lessons ?? []) {
      if (isNonEmptyString(lesson.slug)) lessonSlugs.add(lesson.slug);
    }
  }

  for (const topic of topics) {
    if (!isNonEmptyString(topic.id)) {
      topic.id = randomUUID();
      changed = true;
    }
    if (!isNonEmptyString(topic.slug)) {
      const base = slugifyTitle(topic.title || 'modulo');
      const slug = ensureUniqueSlug(base, topicSlugs);
      topicSlugs.add(slug);
      topic.slug = slug;
      changed = true;
    }

    for (const lesson of topic.lessons ?? []) {
      if (!isNonEmptyString(lesson.id)) {
        lesson.id = randomUUID();
        changed = true;
      }
      if (!isNonEmptyString(lesson.slug)) {
        const base = slugifyTitle(lesson.title || 'leccion');
        const slug = ensureUniqueSlug(base, lessonSlugs);
        lessonSlugs.add(slug);
        lesson.slug = slug;
        changed = true;
      }
    }
  }

  return changed;
}
