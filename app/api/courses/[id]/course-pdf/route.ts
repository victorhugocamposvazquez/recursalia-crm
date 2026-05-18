import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { countLessons } from '@/services/openaiEbookService';
import { generateCoursePdf } from '@/utils/generateCoursePdf';
import type { GeneratedCourseStructure } from '@/types';
import type { ExpandedCourseContent } from '@/services/openaiEbookService';

const CHUNK_SIZE = 256 * 1024; // 256 KB de base64 por evento

const CONFLICT_BODY = {
  error: 'Course not expanded',
  message:
    'Genera primero el contenido del curso desde el panel de administración.',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  const stream = req.nextUrl.searchParams.get('stream') === '1';
  const { id } = await params;

  const { data: course, error } = await getSupabase()
    .from('courses')
    .select('generated_content, expanded_content')
    .eq('id', id)
    .single();

  if (error || !course?.generated_content) {
    return new Response('Curso no encontrado o sin contenido', { status: 404 });
  }

  const raw = course.generated_content as GeneratedCourseStructure;
  const expandedRow = course.expanded_content as ExpandedCourseContent | null;

  if (!stream) {
    if (!expandedRow) {
      return Response.json(CONFLICT_BODY, { status: 409 });
    }
    try {
      const pdfBytes = await generateCoursePdf(expandedRow);
      const safeName = (raw.title ?? 'curso')
        .replace(/[^a-z0-9áéíóúñ\s-]/gi, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) || 'curso';
      return new Response(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(`Error al generar PDF: ${msg}`, { status: 500 });
    }
  }

  const total = countLessons(raw);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        if (!expandedRow) {
          send({
            type: 'error',
            message: CONFLICT_BODY.message,
            error: CONFLICT_BODY.error,
          });
          return;
        }

        send({ type: 'start', total });

        send({ type: 'progress', current: total, total, lesson: 'Generando PDF...' });

        const pdfBytes = await generateCoursePdf(expandedRow);

        const safeName = (raw.title ?? 'curso')
          .replace(/[^a-z0-9áéíóúñ\s-]/gi, '')
          .replace(/\s+/g, '-')
          .slice(0, 60) || 'curso';

        const base64 = Buffer.from(pdfBytes).toString('base64');
        const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          send({ type: 'pdf_chunk', index: i, data: chunk });
        }

        send({ type: 'done', filename: `${safeName}.pdf`, chunks: totalChunks });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
