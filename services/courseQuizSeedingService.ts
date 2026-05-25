/**
 * Auto-seeding de quizzes para un curso con IA.
 *
 * Genera, de forma idempotente:
 *   - 1 quiz por cada módulo (topic) que no sea el último.
 *   - 1 examen final (`is_final: true`).
 *
 * Idempotencia: si ya existe un quiz con preguntas para ese topic_id o
 * is_final, no se sobreescribe (se conserva el contenido editado).
 * Si existe un quiz pero sin preguntas (creado por una corrida anterior
 * fallida), se reintenta poblarlo.
 *
 * Robustez: errores por módulo se capturan sin abortar el resto. El
 * llamador recibe un resumen con módulos creados/saltados/fallidos.
 */
import { getSupabase } from '@/lib/supabase';
import {
  generateFinalQuiz,
  generateModuleQuiz,
  questionsToRows,
} from '@/services/openaiQuizService';
import type {
  ExpandedCourseContent,
} from '@/services/openaiEbookService';
import type { GeneratedCourseStructure } from '@/types';

export interface QuizSeedingResult {
  modulesCreated: number;
  modulesSkipped: number;
  modulesFailed: number;
  finalCreated: boolean;
  finalSkipped: boolean;
  finalFailed: boolean;
  notes: string[];
}

interface SeedOptions {
  /** Nº de preguntas por quiz de módulo. */
  questionsPerModule?: number;
  /** Nº de preguntas del examen final. */
  questionsForFinal?: number;
  /** Si true, regenera incluso si ya hay quiz con preguntas. */
  force?: boolean;
}

async function quizHasQuestions(quizId: string): Promise<boolean> {
  const admin = getSupabase();
  const { count } = await admin
    .from('quiz_questions')
    .select('id', { head: true, count: 'exact' })
    .eq('quiz_id', quizId);
  return (count ?? 0) > 0;
}

async function upsertEmptyQuiz(params: {
  courseId: string;
  scope: 'module' | 'final';
  topicId?: string;
  title: string;
  modulePosition?: number;
}): Promise<string | null> {
  const admin = getSupabase();
  const { courseId, scope, topicId, title, modulePosition } = params;

  const lookup =
    scope === 'final'
      ? admin
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId)
          .eq('is_final', true)
          .maybeSingle()
      : admin
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId)
          .eq('topic_id', topicId!)
          .maybeSingle();
  const { data: existing } = await lookup;
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await admin
    .from('quizzes')
    .insert({
      course_id: courseId,
      topic_id: scope === 'module' ? topicId : null,
      lesson_id: null,
      is_final: scope === 'final',
      title,
      pass_threshold: 0.7,
      lives: 5,
      module_position: modulePosition ?? null,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    console.error(`[quiz-seed ${courseId}] Insert quiz failed:`, error?.message);
    return null;
  }
  return inserted.id as string;
}

/**
 * Genera quizzes IA para todos los módulos (excepto el último) + un examen
 * final. Es seguro llamarla varias veces sobre el mismo curso.
 */
export async function seedCourseQuizzesWithAI(params: {
  courseId: string;
  content: GeneratedCourseStructure;
  expanded?: ExpandedCourseContent | null;
  options?: SeedOptions;
}): Promise<QuizSeedingResult> {
  const { courseId, content, expanded = null, options = {} } = params;
  const {
    questionsPerModule = 6,
    questionsForFinal = 10,
    force = false,
  } = options;

  const result: QuizSeedingResult = {
    modulesCreated: 0,
    modulesSkipped: 0,
    modulesFailed: 0,
    finalCreated: false,
    finalSkipped: false,
    finalFailed: false,
    notes: [],
  };

  const topics = (content.topics ?? []).filter(
    (t) => typeof t.id === 'string' && (t.id as string).length > 0
  );
  if (topics.length === 0) {
    result.notes.push(
      'No hay topics con id. Ejecuta normalizeGeneratedContentIdentity antes.'
    );
    return result;
  }

  const admin = getSupabase();

  // Quizzes por módulo (todos menos el último, que sería el examen final).
  for (let i = 0; i < topics.length; i++) {
    if (i === topics.length - 1) continue;
    const topic = topics[i];

    const moduleNumber = i + 1;
    const title = `Quiz · ${topic.title ?? `Módulo ${moduleNumber}`}`;
    const quizId = await upsertEmptyQuiz({
      courseId,
      scope: 'module',
      topicId: topic.id,
      title,
      modulePosition: moduleNumber,
    });
    if (!quizId) {
      result.modulesFailed += 1;
      result.notes.push(`Módulo ${moduleNumber}: no se pudo crear el quiz`);
      continue;
    }

    if (!force && (await quizHasQuestions(quizId))) {
      result.modulesSkipped += 1;
      continue;
    }

    try {
      const generated = await generateModuleQuiz({
        courseId,
        course: content,
        expanded,
        topicId: topic.id,
        numQuestions: questionsPerModule,
      });

      // Si se está forzando regeneración, limpiar preguntas previas.
      if (force) {
        await admin.from('quiz_questions').delete().eq('quiz_id', quizId);
      }

      const rows = questionsToRows(quizId, generated.questions);
      if (rows.length > 0) {
        const { error: qErr } = await admin.from('quiz_questions').insert(rows);
        if (qErr) {
          result.modulesFailed += 1;
          result.notes.push(
            `Módulo ${moduleNumber}: error al guardar preguntas: ${qErr.message}`
          );
          continue;
        }
      }

      await admin
        .from('quizzes')
        .update({ title: generated.title || title })
        .eq('id', quizId);

      result.modulesCreated += 1;
    } catch (err) {
      result.modulesFailed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      result.notes.push(`Módulo ${moduleNumber} (IA): ${msg.slice(0, 200)}`);
    }
  }

  // Examen final.
  const finalQuizId = await upsertEmptyQuiz({
    courseId,
    scope: 'final',
    title: 'Examen final',
  });
  if (!finalQuizId) {
    result.finalFailed = true;
    result.notes.push('Examen final: no se pudo crear el quiz');
    return result;
  }

  if (!force && (await quizHasQuestions(finalQuizId))) {
    result.finalSkipped = true;
    return result;
  }

  try {
    const generated = await generateFinalQuiz({
      courseId,
      course: content,
      expanded,
      numQuestions: questionsForFinal,
    });

    if (force) {
      await admin.from('quiz_questions').delete().eq('quiz_id', finalQuizId);
    }

    const rows = questionsToRows(finalQuizId, generated.questions);
    if (rows.length > 0) {
      const { error: qErr } = await admin.from('quiz_questions').insert(rows);
      if (qErr) {
        result.finalFailed = true;
        result.notes.push(`Examen final: error al guardar preguntas: ${qErr.message}`);
        return result;
      }
    }

    await admin
      .from('quizzes')
      .update({ title: generated.title || 'Examen final' })
      .eq('id', finalQuizId);

    result.finalCreated = true;
  } catch (err) {
    result.finalFailed = true;
    const msg = err instanceof Error ? err.message : String(err);
    result.notes.push(`Examen final (IA): ${msg.slice(0, 200)}`);
  }

  return result;
}

export function summarizeQuizSeedingResult(r: QuizSeedingResult): string {
  const parts: string[] = [];
  parts.push(
    `quizzes módulo: +${r.modulesCreated} nuevos / ${r.modulesSkipped} existentes / ${r.modulesFailed} fallidos`
  );
  if (r.finalCreated) parts.push('examen final: creado');
  else if (r.finalSkipped) parts.push('examen final: ya existía');
  else if (r.finalFailed) parts.push('examen final: falló');
  return parts.join(' · ');
}
