import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { expandCourseForEbook, countLessons } from '@/services/openaiEbookService';
import { generateCoursePdf } from '@/utils/generateCoursePdf';
import type { GeneratedCourseStructure } from '@/types';

const CHUNK_SIZE = 256 * 1024; // 256 KB de base64 por evento

function loadLogos() {
  const dir = path.join(process.cwd(), 'public', 'logos');
  let recursalia: Uint8Array | undefined;
  let hotmart: Uint8Array | undefined;

  for (const name of ['recursalia.png', 'recursalia.jpg', 'recursalia.jpeg']) {
    const p = path.join(dir, name);
    if (existsSync(p)) { recursalia = new Uint8Array(readFileSync(p)); break; }
  }
  for (const name of ['hotmart.png', 'hotmart.jpg', 'hotmart.jpeg']) {
    const p = path.join(dir, name);
    if (existsSync(p)) { hotmart = new Uint8Array(readFileSync(p)); break; }
  }

  if (!recursalia && !hotmart) return undefined;
  return { recursalia, hotmart };
}

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
    .select('generated_content')
    .eq('id', id)
    .single();

  if (error || !course?.generated_content) {
    return new Response('Curso no encontrado o sin contenido', { status: 404 });
  }

  const raw = course.generated_content as GeneratedCourseStructure;

  if (!stream) {
    try {
      const expanded = await expandCourseForEbook(raw);
      const logos = loadLogos();
      const pdfBytes = await generateCoursePdf(expanded, logos);
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
        send({ type: 'start', total });

        const expanded = await expandCourseForEbook(raw, (current, tot, title) => {
          send({ type: 'progress', current, total: tot, lesson: title });
        });

        send({ type: 'progress', current: total, total, lesson: 'Generando PDF...' });

        const logos = loadLogos();
        const pdfBytes = await generateCoursePdf(expanded, logos);

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
