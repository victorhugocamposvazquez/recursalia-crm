/**
 * Crea quizzes mínimos (módulo + examen final) para un curso piloto.
 *
 * Uso: npm run seed-quizzes -- <courseId|public_slug>
 * Carga automáticamente .env.local.
 */
import './loadEnv';
import { getSupabase } from '../lib/supabase';

async function resolveCourseId(ref: string): Promise<string | null> {
  const admin = getSupabase();
  const byId = await admin.from('courses').select('id').eq('id', ref).maybeSingle();
  if (byId.data?.id) return byId.data.id;
  const bySlug = await admin
    .from('courses')
    .select('id')
    .eq('public_slug', ref)
    .maybeSingle();
  return bySlug.data?.id ?? null;
}

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Uso: npx tsx scripts/seed-course-quizzes.ts <courseId|public_slug>');
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

  const gc = course?.generated_content as {
    topics?: { lessons?: { id: string; title: string }[] }[];
  } | null;
  const firstLessonId = gc?.topics?.[0]?.lessons?.[0]?.id ?? null;

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
    if (error) throw error;
    finalQuizId = inserted.id;
    await admin.from('quiz_questions').insert([
      {
        quiz_id: finalQuizId,
        position: 0,
        kind: 'tf',
        text: 'Has completado el recorrido del curso.',
        payload: { correct: true },
      },
      {
        quiz_id: finalQuizId,
        position: 1,
        kind: 'tf',
        text: 'Aplicarás lo aprendido en tu día a día.',
        payload: { correct: true },
      },
    ]);
    console.log('Examen final creado:', finalQuizId);
  } else {
    console.log('Examen final ya existía:', finalQuizId);
  }

  if (firstLessonId) {
    const { data: modQuiz } = await admin
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_id', firstLessonId)
      .maybeSingle();

    if (!modQuiz) {
      const { data: mq, error } = await admin
        .from('quizzes')
        .insert({
          course_id: courseId,
          lesson_id: firstLessonId,
          title: 'Quiz del módulo 1',
          is_final: false,
          pass_threshold: 0.7,
        })
        .select('id')
        .single();
      if (error) throw error;
      await admin.from('quiz_questions').insert({
        quiz_id: mq.id,
        position: 0,
        kind: 'tf',
        text: '¿Listo para seguir con la siguiente lección?',
        payload: { correct: true },
      });
      console.log('Quiz de módulo creado:', mq.id);
    } else {
      console.log('Quiz de módulo ya existía:', modQuiz.id);
    }
  }

  console.log('Listo para curso', courseId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
