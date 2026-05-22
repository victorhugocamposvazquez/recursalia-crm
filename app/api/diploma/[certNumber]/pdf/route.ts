import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = getSupabase();
  const { data: diploma } = await admin
    .from('diplomas')
    .select('cert_number, user_id, pdf_url')
    .eq('cert_number', certNumber)
    .maybeSingle();

  if (!diploma) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (diploma.pdf_url) {
    return NextResponse.redirect(diploma.pdf_url);
  }

  if (!user || user.id !== diploma.user_id) {
    return NextResponse.json(
      { error: 'PDF generado en cliente; inicia sesión como titular del diploma.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Descarga el PDF desde la pantalla de diploma en /aprender/diplomas/' + certNumber,
  });
}
