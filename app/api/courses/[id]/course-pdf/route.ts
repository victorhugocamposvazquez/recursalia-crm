import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { expandCourseForEbook } from '@/services/openaiEbookService';
import { generateCoursePdf } from '@/utils/generateCoursePdf';
import type { GeneratedCourseStructure } from '@/types';

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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuthApi();
  if (authError) return authError;

  try {
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
    console.error('PDF generation error:', msg);
    return new Response(`Error al generar PDF: ${msg}`, { status: 500 });
  }
}
