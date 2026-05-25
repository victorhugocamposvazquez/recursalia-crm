/**
 * Crea quizzes placeholder para cada módulo del curso + el examen final.
 *
 * Uso:
 *   npx tsx scripts/seed-course-quizzes.ts <courseId|public_slug>
 *
 * Crea, para cada topic del `generated_content`:
 *   - 1 quiz (kind módulo) con `topic_id` y 2 preguntas tipo verdadero/falso.
 * Y un único quiz `is_final` para todo el curso si aún no existe.
 *
 * Es idempotente: si ya existe quiz para un topic o el final, lo deja como está.
 */
import './loadEnv';
import { getSupabase } from '../lib/supabase';

type Topic = {
  id?: string | null;
  title?: string | null;
  lessons?: unknown[];
};

async function resolveCourseId(ref: string): Promise<string | null> {
  const admin = getSupabase();
  const byId = await admin
    .from('courses')
    .select('id')
    .eq('id', ref)
    .maybeSingle();
  if (byId.data?.id) return byId.data.id;
  const bySlug = await admin
    .from('courses')
    .select('id')
    .eq('public_slug', ref)
    .maybeSingle();
  return bySlug.data?.id ?? null;
}

function placeholderModuleQuestions(quizId: string, moduleTitle: string) {
  return [
    {
      quiz_id: quizId,
      position: 0,
      kind: 'tf',
      text: `¿Has revisado todas las lecciones del módulo «${moduleTitle}»?`,
      payload: { correct: true },
    },
    {
      quiz_id: quizId,
      position: 1,
      kind: 'tf',
      text: 'Aplicarías al menos una idea de este módulo en tu día a día.',
      payload: { correct: true },
    },
    {
      quiz_id: quizId,
      position: 2,
      kind: 'tf',
      text: 'Has tomado al menos una nota mientras estudiabas el módulo.',
      payload: { correct: true },
    },
  ];
}

function placeholderFinalQuestions(quizId: string) {
  return [
    {
      quiz_id: quizId,
      position: 0,
      kind: 'tf',
      text: 'Has completado todos los módulos del curso.',
      payload: { correct: true },
    },
    {
      quiz_id: quizId,
      position: 1,
      kind: 'tf',
      text: 'Te sientes capaz de aplicar lo aprendido en un caso real.',
      payload: { correct: true },
    },
    {
      quiz_id: quizId,
      position: 2,
      kind: 'tf',
      text: 'Recomendarías el curso a alguien que esté empezando en el tema.',
      payload: { correct: true },
    },
  ];
}

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error(
      'Uso: npx tsx scripts/seed-course-quizzes.ts <courseId|public_slug>'
    );
    process.exit(1);
  }

  const courseId = await resolveCourseId(ref);
  if (!courseId) {
    console.error('Curso no encontrado:', ref);
    process.exit(1);
  }

  const admin = getSupabase();
  const { data: course } = await admin
    .from('courses')
    .select('generated_content')
    .eq('id', courseId)
    .single();

  const gc = course?.generated_content as { topics?: Topic[] } | null;
  const topics = (gc?.topics ?? []).filter(
    (t): t is { id: string; title: string; lessons?: unknown[] } =>
      typeof t.id === 'string' && t.id.length > 0
  );
  if (topics.length === 0) {
    console.error('El curso no tiene topics con id. Ejecuta antes:');
    console.error('  npx tsx scripts/backfill-lesson-ids.ts');
    process.exit(1);
  }

  let createdModuleQuizzes = 0;
  let skippedModuleQuizzes = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const isFinalModule = i === topics.length - 1;
    if (isFinalModule) continue;

    const { data: existing } = await admin
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)
      .eq('topic_id', topic.id)
      .eq('is_final', false)
      .maybeSingle();
    if (existing?.id) {
      skippedModuleQuizzes += 1;
      console.log(`  · quiz módulo ${i + 1} ya existía: ${existing.id}`);
      continue;
    }

    const { data: inserted, error } = await admin
      .from('quizzes')
      .insert({
        course_id: courseId,
        topic_id: topic.id,
        title: `Quiz · ${topic.title ?? `Módulo ${i + 1}`}`,
        is_final: false,
        pass_threshold: 0.7,
        module_position: i + 1,
      })
      .select('id')
      .single();
    if (error) {
      console.error(`  ✗ error creando quiz módulo ${i + 1}:`, error.message);
      continue;
    }
    await admin
      .from('quiz_questions')
      .insert(placeholderModuleQuestions(inserted.id, topic.title ?? `Módulo ${i + 1}`));
    createdModuleQuizzes += 1;
    console.log(`  ✓ quiz módulo ${i + 1} creado: ${inserted.id}`);
  }

  const { data: existingFinal } = await admin
    .from('quizzes')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_final', true)
    .maybeSingle();

  let finalQuizId = existingFinal?.id;
  if (!finalQuizId) {
    const { data: inserted, error } = await admin
      .from('quizzes')
      .insert({
        course_id: courseId,
        title: 'Examen final',
        is_final: true,
        pass_threshold: 0.7,
        lives: 5,
      })
      .select('id')
      .single();
    if (error) {
      console.error('✗ error creando examen final:', error.message);
    } else {
      finalQuizId = inserted.id;
      await admin
        .from('quiz_questions')
        .insert(placeholderFinalQuestions(finalQuizId));
      console.log(`✓ examen final creado: ${finalQuizId}`);
    }
  } else {
    console.log(`· examen final ya existía: ${finalQuizId}`);
  }

  console.log('\n--- Resumen ---');
  console.log(`Curso: ${courseId}`);
  console.log(`Módulos con quiz: ${createdModuleQuizzes + skippedModuleQuizzes}/${topics.length - 1}`);
  console.log(`Quizzes nuevos: ${createdModuleQuizzes}`);
  console.log(`Quizzes ya existentes: ${skippedModuleQuizzes}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
