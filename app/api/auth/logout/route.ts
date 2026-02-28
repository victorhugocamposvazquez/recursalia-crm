import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL('/login', req.nextUrl.origin);
  return NextResponse.redirect(url);
}
