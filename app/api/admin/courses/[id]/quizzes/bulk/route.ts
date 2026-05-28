import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/learn/adminAuth';
import type { GeneratedCourseStructure } from '@/types';
import {
  seedCourseQuizzesWithAI,
  summarizeQuizSeedingResult,
} from '@/services/courseQuizSeedingService';

type Body = {
  questionsPerModule?: number;
  questionsForFinal?: number;
  /** Si true (default), reemplaza preguntas de quizzes ya configurados. */
  force?: boolean;
};

/**
 * Genera de una sola pasada todos los quizzes del curso (módulos + examen
 * final) usando IA. Reutiliza el servicio idempotente compartido.
 *
 * Errores por módulo no abortan el bulk: se devuelven en `result.notes`.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.message }, { status: guard.status });
  }

  const { id: courseId } = await params;
  let body: Body = {};
  try {
    body = (await req.json().catch(() => ({}))) as Body;
  } catch {
    body = {};
  }

  const questionsPerModule = clampInt(body.questionsPerModule, 3, 15, 6);
  // Mínimo 8 preguntas en el examen final: con menos no es un boss-fight serio.
  // Máximo 30 para no disparar costes. Default 12 (≈2 por módulo en cursos
  // típicos de 6 módulos).
  const questionsForFinal = clampInt(body.questionsForFinal, 8, 30, 12);
  const force = body.force !== false;

  // Pre-check: sin OPENAI_API_KEY el servicio acumularía todos los módulos
  // como "fallidos" silenciosamente. Mejor avisar antes de gastar tiempo.
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Falta OPENAI_API_KEY en .env.local. Configúrala y reintenta.',
      },
      { status: 503 }
    );
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
  if (!gc || !gc.topics?.length) {
    return NextResponse.json(
      { error: 'El curso aún no tiene generated_content con topics' },
      { status: 400 }
    );
  }

  try {
    const result = await seedCourseQuizzesWithAI({
      courseId,
      content: gc,
      expanded:
        (course.expanded_content as Parameters<
          typeof seedCourseQuizzesWithAI
        >[0]['expanded']) ?? null,
      options: { force, questionsPerModule, questionsForFinal },
    });

    return NextResponse.json({
      ok: true,
      result,
      summary: summarizeQuizSeedingResult(result),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/OPENAI_API_KEY/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'Falta OPENAI_API_KEY en .env.local. Configúrala y reintenta.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: message || 'Error en la generación bulk' },
      { status: 500 }
    );
  }
}

function clampInt(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}
