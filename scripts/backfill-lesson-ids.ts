/**
 * Rellena `id` (UUID v4) y `slug` faltantes en `generated_content` de todos los cursos.
 *
 *   npx tsx scripts/backfill-lesson-ids.ts
 *
 * Requiere en el entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeGeneratedContentIdentity } from '@/lib/normalizeGeneratedContentIdentity';
import type { GeneratedCourseStructure } from '@/types';

function isNonEmptyId(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function countLessonIds(
  content: GeneratedCourseStructure
): { lessons: number; withId: number } {
  let lessons = 0;
  let withId = 0;
  for (const t of content.topics ?? []) {
    for (const l of t.lessons ?? []) {
      lessons += 1;
      if (isNonEmptyId(l.id)) withId += 1;
    }
  }
  return { lessons, withId };
}

function countTopicIds(
  content: GeneratedCourseStructure
): { topics: number; withId: number } {
  let topics = 0;
  let withId = 0;
  for (const t of content.topics ?? []) {
    topics += 1;
    if (isNonEmptyId(t.id)) withId += 1;
  }
  return { topics, withId };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.'
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  let coursesProcessed = 0;
  let coursesSkippedNull = 0;
  let coursesUpdated = 0;
  let coursesErrored = 0;
  let idsAssignedTotal = 0;
  let lessonsWithIdBefore = 0;
  const errors: { courseId: string; message: string }[] = [];

  const { data: rows, error: fetchError } = await supabase
    .from('courses')
    .select('id, generated_content');

  if (fetchError) {
    console.error('Error leyendo cursos:', fetchError.message);
    process.exit(1);
  }

  for (const row of rows ?? []) {
    coursesProcessed += 1;
    const courseId = row.id as string;
    const raw = row.generated_content;

    if (raw == null) {
      coursesSkippedNull += 1;
      continue;
    }

    const original = raw as GeneratedCourseStructure;
    const beforeLessons = countLessonIds(original);
    lessonsWithIdBefore += beforeLessons.withId;
    const beforeTopics = countTopicIds(original);

    try {
      const clone: GeneratedCourseStructure = {
        ...original,
        topics: (original.topics ?? []).map((t) => ({
          ...t,
          lessons: (t.lessons ?? []).map((l) => ({ ...l })),
        })),
      };

      const changed = normalizeGeneratedContentIdentity(clone);

      const afterLessons = countLessonIds(clone);
      const afterTopics = countTopicIds(clone);
      const newLessonIds = afterLessons.withId - beforeLessons.withId;
      const newTopicIds = afterTopics.withId - beforeTopics.withId;
      idsAssignedTotal += newLessonIds + newTopicIds;

      if (changed) {
        const { error: updateError } = await supabase
          .from('courses')
          .update({ generated_content: clone })
          .eq('id', courseId);

        if (updateError) throw new Error(updateError.message);
        coursesUpdated += 1;
      }
    } catch (err) {
      coursesErrored += 1;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ courseId, message });
      console.error(`[error] curso ${courseId}: ${message}`);
    }
  }

  console.log('\n--- Resumen backfill generated_content ---');
  console.log(`Cursos procesados (filas): ${coursesProcessed}`);
  console.log(`Sin generated_content (omitidos): ${coursesSkippedNull}`);
  console.log(`Cursos actualizados en BD: ${coursesUpdated}`);
  console.log(`IDs nuevos asignados (topics + lessons): ${idsAssignedTotal}`);
  console.log(
    `Lecciones que ya tenían id (conteo acumulado antes): ${lessonsWithIdBefore}`
  );
  console.log(`Cursos con error: ${coursesErrored}`);
  if (errors.length > 0) {
    console.log('Detalle errores:');
    for (const e of errors) {
      console.log(`  - ${e.courseId}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
