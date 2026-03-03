import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { requireAuthApi } from '@/lib/auth-api';
import { getSupabase } from '@/lib/supabase';
import { generateCoursePdf } from '@/utils/generateCoursePdf';

function loadLogos() {
  const logosDir = path.join(process.cwd(), 'public', 'logos');
  let recursalia: Uint8Array | undefined;
  let hotmart: Uint8Array | undefined;
  let recursaliaIsPng = true;
  let hotmartIsPng = true;
  try {
    if (existsSync(path.join(logosDir, 'recursalia.png'))) {
      recursalia = new Uint8Array(readFileSync(path.join(logosDir, 'recursalia.png')));
    } else if (existsSync(path.join(logosDir, 'recursalia.jpg'))) {
      recursalia = new Uint8Array(readFileSync(path.join(logosDir, 'recursalia.jpg')));
      recursaliaIsPng = false;
    }
  } catch {
    // ignorar
  }
  try {
    if (existsSync(path.join(logosDir, 'hotmart.png'))) {
      hotmart = new Uint8Array(readFileSync(path.join(logosDir, 'hotmart.png')));
    } else if (existsSync(path.join(logosDir, 'hotmart.jpg'))) {
      hotmart = new Uint8Array(readFileSync(path.join(logosDir, 'hotmart.jpg')));
      hotmartIsPng = false;
    }
  } catch {
    // ignorar
  }
  if (!recursalia && !hotmart) return undefined;
  return { recursalia, hotmart, recursaliaIsPng, hotmartIsPng };
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

    const logos = loadLogos();
    const pdfBytes = await generateCoursePdf(course.generated_content, logos);
    const title = (course.generated_content as { title?: string }).title ?? 'curso';
    const safeName = title.replace(/[^a-z0-9áéíóúñ\s-]/gi, '').replace(/\s+/g, '-').slice(0, 60) || 'curso';

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
