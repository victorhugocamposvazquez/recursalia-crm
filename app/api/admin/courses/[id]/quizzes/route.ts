import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/learn/adminAuth';
import type { CourseRecord, GeneratedCourseStructure } from '@/types';
import {
  generateFinalQuiz,
  generateModuleQuiz,
  questionsToRows,
  type GeneratedQuiz,
} from '@/services/openaiQuizService';

type Body = {
  scope: 'module' | 'final';
  topicId?: string;
  /** 'ai' o 'manual'. Si manual, requiere `title` y opcionalmente preguntas. */
  mode: 'ai' | 'manual';
  numQuestions?: number;
  title?: string;
  /** Si `replace` es true, se eliminan las preguntas previas del quiz. */
  replace?: boolean;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }
  const { id: courseId } = await params;
  const admin = getSupabase();
  const { data: quizzes } = await admin
    .from('quizzes')
    .select('id, course_id, topic_id, lesson_id, title, is_final, pass_threshold, module_position, created_at')
    .eq('course_id', courseId);

  const ids = (quizzes ?? []).map((q) => q.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: qs } = await admin
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', ids);
    for (const row of qs ?? []) {
      const id = row.quiz_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    quizzes: (quizzes ?? []).map((q) => ({ ...q, question_count: counts[q.id] ?? 0 })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  const { id: courseId } = await params;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (body.scope !== 'module' && body.scope !== 'final') {
    return NextResponse.json({ error: 'Scope inválido' }, { status: 400 });
  }
  if (body.scope === 'module' && !body.topicId) {
    return NextResponse.json({ error: 'topicId requerido' }, { status: 400 });
  }

  const admin = getSupabase();
  const { data: course } = await admin
    .from('courses')
    .select('id, generated_content, expanded_content')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }
  const gc = course.generated_content as GeneratedCourseStructure | null;
  if (!gc) {
    return NextResponse.json(
      { error: 'El curso aún no tiene generated_content' },
      { status: 400 }
    );
  }

  // Verificar que el topicId existe.
  if (body.scope === 'module') {
    const topicExists = (gc.topics ?? []).some((t) => t.id === body.topicId);
    if (!topicExists) {
      return NextResponse.json({ error: 'topicId no encontrado en el curso' }, { status: 400 });
    }
  }

  // 1) ¿Ya existe un quiz para este scope?
  const lookup =
    body.scope === 'final'
      ? admin.from('quizzes').select('id').eq('course_id', courseId).eq('is_final', true).maybeSingle()
      : admin
          .from('quizzes')
          .select('id')
          .eq('course_id', courseId)
          .eq('topic_id', body.topicId!)
          .maybeSingle();
  const { data: existing } = await lookup;

  // 2) Generar/Preparar el quiz.
  let generated: GeneratedQuiz | null = null;
  if (body.mode === 'ai') {
    try {
      if (body.scope === 'module') {
        generated = await generateModuleQuiz({
          courseId,
          course: gc,
          expanded: (course.expanded_content as Parameters<typeof generateModuleQuiz>[0]['expanded']) ?? null,
          topicId: body.topicId!,
          numQuestions: body.numQuestions ?? 6,
        });
      } else {
        generated = await generateFinalQuiz({
          courseId,
          course: gc,
          expanded: (course.expanded_content as Parameters<typeof generateFinalQuiz>[0]['expanded']) ?? null,
          numQuestions: body.numQuestions ?? 10,
        });
      }
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Error en la generación IA' },
        { status: 502 }
      );
    }
  }

  // 3) Upsert del quiz (un solo registro por scope).
  let quizId = existing?.id as string | undefined;
  const title =
    body.title?.trim() ||
    generated?.title ||
    (body.scope === 'final'
      ? 'Examen final'
      : `Quiz · ${gc.topics.find((t) => t.id === body.topicId)?.title ?? 'Módulo'}`);

  if (!quizId) {
    const moduleIdx =
      body.scope === 'module' ? gc.topics.findIndex((t) => t.id === body.topicId) : null;
    const { data: inserted, error: insertErr } = await admin
      .from('quizzes')
      .insert({
        course_id: courseId,
        topic_id: body.scope === 'module' ? body.topicId : null,
        lesson_id: null,
        is_final: body.scope === 'final',
        title,
        pass_threshold: 0.7,
        lives: 5,
        module_position: moduleIdx != null && moduleIdx >= 0 ? moduleIdx : null,
      })
      .select('id')
      .single();
    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: insertErr?.message ?? 'No se pudo crear el quiz' },
        { status: 500 }
      );
    }
    quizId = inserted.id as string;
  } else {
    // Actualizar título si llegó nuevo.
    await admin.from('quizzes').update({ title }).eq('id', quizId);

    if (body.replace !== false) {
      // por defecto, sustituimos las preguntas si re-generamos
      await admin.from('quiz_questions').delete().eq('quiz_id', quizId);
    }
  }

  // 4) Insertar preguntas (si modo IA generó algo, o si manual + se pasa título).
  if (generated && quizId) {
    const rows = questionsToRows(quizId, generated.questions);
    if (rows.length > 0) {
      const { error: qErr } = await admin.from('quiz_questions').insert(rows);
      if (qErr) {
        return NextResponse.json({ error: qErr.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    quizId,
    title,
    mode: body.mode,
    questions: generated?.questions?.length ?? null,
  });
}

/**
 * Elimina todos los quizzes de un curso (utilidad de admin).
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }
  const { id: courseId } = await params;
  const admin = getSupabase();
  const { error } = await admin.from('quizzes').delete().eq('course_id', courseId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
