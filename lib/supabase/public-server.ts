import { createClient } from '@supabase/supabase-js';

/** Cliente anónimo para lecturas públicas (respeta RLS). */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridos');
  }
  return createClient(url, key);
}
