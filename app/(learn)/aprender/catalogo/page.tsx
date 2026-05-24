import { requireLearnUser } from '@/lib/learn/access';
import { getSupabase } from '@/lib/supabase';
import { getProfileRole } from '@/lib/learn/lmsServer';
import { LearnCatalog, type CatalogCourse } from '@/components/learn/LearnCatalog';
import type { CourseRecord } from '@/types';

export const dynamic = 'force-dynamic';

export default async function LearnCatalogPage() {
  const user = await requireLearnUser();
  const admin = getSupabase();

  const [{ data: courses }, { data: enrollments }, role] = await Promise.all([
    admin
      .from('courses')
      .select(
        'id, public_slug, published_title, meta_description, featured_image_url, catalog_category, generated_content, expanded_content, status, published_at'
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    admin
      .from('user_courses')
      .select('course_id, completed_at')
      .eq('user_id', user.id),
    getProfileRole(user.id),
  ]);
  const isAdmin = role === 'admin';

  const enrolledMap = new Map<string, { completed: boolean }>();
  for (const row of enrollments ?? []) {
    enrolledMap.set(row.course_id as string, { completed: !!row.completed_at });
  }

  const items: CatalogCourse[] = (courses ?? []).map((c) => {
    const gc = (c.generated_content as CourseRecord['generated_content']) ?? null;
    const title = c.published_title ?? gc?.title ?? 'Curso Recursalia';
    const description =
      (c.meta_description as string | null | undefined) ??
      (gc as unknown as { description?: string })?.description ??
      'Recurso formativo de Recursalia.';
    const lessons =
      gc?.topics?.reduce(
        (acc, t) => acc + (Array.isArray(t.lessons) ? t.lessons.length : 0),
        0
      ) ?? 0;
    const totalDurationMinutes =
      (gc as unknown as { total_duration_minutes?: number })?.total_duration_minutes ?? null;
    const category = (c.catalog_category as string | null) ?? null;
    const slug = (c.public_slug as string | null) ?? c.id;
    const enrollment = enrolledMap.get(c.id as string);

    return {
      id: c.id as string,
      slug,
      title,
      description,
      category,
      image: (c.featured_image_url as string | null) ?? null,
      lessons,
      totalDurationMinutes,
      hasLmsContent: Boolean(c.expanded_content),
      enrolled: Boolean(enrollment),
      completed: Boolean(enrollment?.completed),
    };
  });

  return <LearnCatalog courses={items} isAdmin={isAdmin} />;
}
