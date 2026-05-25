/**
 * Regenera todos los quizzes de un curso (módulos + final) usando IA real.
 *
 * Reemplaza las preguntas placeholder por preguntas generadas con OpenAI.
 *
 * Uso:
 *   npx tsx scripts/regenerate-course-quizzes-ai.ts <courseId|public_slug>
 *
 * Mantiene los IDs de quiz (para no romper enlaces), pero borra las preguntas
 * previas y las sustituye por las generadas con IA.
 */
import './loadEnv';
import { getSupabase } from '../lib/supabase';
import {
  seedCourseQuizzesWithAI,
  summarizeQuizSeedingResult,
} from '../services/courseQuizSeedingService';
import type {
  GeneratedCourseStructure,
} from '../types';

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

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error(
      'Uso: npx tsx scripts/regenerate-course-quizzes-ai.ts <courseId|public_slug>'
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
    .select('id, generated_content, expanded_content, published_title')
    .eq('id', courseId)
    .single();

  const content = course?.generated_content as GeneratedCourseStructure | null;
  if (!content) {
    console.error('El curso no tiene generated_content.');
    process.exit(1);
  }

  console.log(`Regenerando quizzes con IA para: ${course?.published_title ?? courseId}`);
  console.log(`Topics: ${content.topics?.length ?? 0}`);
  console.log('Esto puede tardar entre 1 y 3 minutos. Llamando a OpenAI...\n');

  const result = await seedCourseQuizzesWithAI({
    courseId,
    content,
    expanded: (course?.expanded_content as Parameters<typeof seedCourseQuizzesWithAI>[0]['expanded']) ?? null,
    options: { force: true, questionsPerModule: 6, questionsForFinal: 10 },
  });

  console.log('\n--- Resultado ---');
  console.log(summarizeQuizSeedingResult(result));
  if (result.notes.length > 0) {
    console.log('\nNotas:');
    for (const n of result.notes) console.log('  · ' + n);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
